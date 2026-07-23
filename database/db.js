'use strict';

/**
 * Camada de acesso ao banco (SQLite via sql.js — SQLite compilado para
 * WebAssembly).
 *
 * Por que sql.js e não um módulo nativo (better-sqlite3)?
 *   - sql.js é 100% JavaScript/WASM: NÃO precisa de compilador C++ nem do
 *     "Visual Studio Build Tools" para instalar. O `npm install` funciona em
 *     qualquer computador com Node.js, sem depender de binários pré-compilados
 *     para a versão exata do Node — foi exatamente essa dependência que fazia
 *     o `instalar.bat` falhar (o erro aparecia disfarçado de "falha de
 *     internet").
 *   - Como é WASM, o mesmo módulo roda tanto no Node quanto dentro do Electron,
 *     sem recompilação e sem conflito de ABI.
 *
 * O arquivo do banco continua sendo um SQLite padrão em disco
 * (`database/estacao.db`), compatível com qualquer ferramenta SQLite.
 *
 * Este módulo expõe uma pequena camada de compatibilidade com a API do
 * better-sqlite3 (prepare/run/get/all/exec/pragma/transaction/backup/close),
 * de modo que todo o restante do código permanece inalterado.
 */

const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const config = require('../config/config');
const logger = require('../utils/logger');

let db = null; // instância compartilhada (singleton) do wrapper
let initPromise = null; // evita inicializações concorrentes

/** Garante que os diretórios necessários existem. */
function garantirDiretorios() {
  for (const dir of [
    config.paths.database,
    config.paths.backups,
    config.paths.uploads,
    config.paths.temp,
    config.paths.logs,
  ]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

// --- Helpers de binding ----------------------------------------------------

function ehObjetoDeParametros(x) {
  return (
    x !== null &&
    typeof x === 'object' &&
    !Array.isArray(x) &&
    !Buffer.isBuffer(x) &&
    !(x instanceof Uint8Array)
  );
}

/** Converte valores para tipos que o sql.js aceita ligar. */
function coagirValor(v) {
  if (v === undefined) return null;
  if (v === true) return 1;
  if (v === false) return 0;
  return v;
}

/**
 * O código usa objetos com chaves "puras" (ex.: { nome, cidade }) enquanto o
 * SQL usa parâmetros nomeados com sigilo (@nome, :nome, $nome). O sql.js exige
 * a chave COM o sigilo e ignora chaves desconhecidas. Então geramos todas as
 * variações para cada chave — o sql.js liga a que existir na consulta.
 */
function expandirNomeados(obj) {
  const saida = {};
  for (const chave of Object.keys(obj)) {
    const valor = coagirValor(obj[chave]);
    if (chave[0] === '@' || chave[0] === ':' || chave[0] === '$') {
      saida[chave] = valor;
    } else {
      saida['@' + chave] = valor;
      saida[':' + chave] = valor;
      saida['$' + chave] = valor;
    }
  }
  return saida;
}

// --- Statement (compatível com better-sqlite3) -----------------------------

/**
 * IMPORTANTE: o sql.js `Database.export()` (usado para gravar o banco em disco)
 * LIBERA todos os statements abertos e reabre a conexão. Por isso NÃO mantemos
 * statements do sql.js vivos entre chamadas: cada operação prepara, usa e
 * libera o seu próprio statement. O wrapper guarda apenas o texto SQL — assim
 * `const stmt = db.prepare(sql)` reutilizado em laços continua funcionando.
 */
class Statement {
  constructor(dbWrapper, sql) {
    this._db = dbWrapper;
    this.sql = sql;
  }

  /** Prepara um statement do sql.js, liga os parâmetros e executa `acao`. */
  _executar(args, acao) {
    const s = this._db._sql.prepare(this.sql);
    try {
      if (args.length === 1 && ehObjetoDeParametros(args[0])) {
        s.bind(expandirNomeados(args[0]));
      } else if (args.length > 0) {
        s.bind(args.map(coagirValor));
      }
      return acao(s);
    } finally {
      s.free();
    }
  }

  /** INSERT/UPDATE/DELETE — retorna { changes, lastInsertRowid }. */
  run(...args) {
    this._executar(args, (s) => {
      s.step();
    });
    // Lidos na conexão (não no statement, que já foi liberado).
    const info = {
      changes: this._db._sql.getRowsModified(),
      lastInsertRowid: this._db._ultimoRowid(),
    };
    this._db._aposMutacao();
    return info;
  }

  /** SELECT — retorna a primeira linha (objeto) ou undefined. */
  get(...args) {
    return this._executar(args, (s) => (s.step() ? s.getAsObject() : undefined));
  }

  /** SELECT — retorna todas as linhas (array de objetos). */
  all(...args) {
    return this._executar(args, (s) => {
      const linhas = [];
      while (s.step()) linhas.push(s.getAsObject());
      return linhas;
    });
  }
}

// --- Banco (compatível com better-sqlite3) ---------------------------------

class Db {
  constructor(sqlDb, arquivo) {
    this._sql = sqlDb;
    this._arquivo = arquivo;
    this._cacheStmt = new Map(); // sql -> Statement (wrapper leve, sem recurso nativo)
    this._txDepth = 0;
  }

  /** Retorna um Statement. O wrapper é leve (guarda só o SQL), então cachear é seguro. */
  prepare(sql) {
    let stmt = this._cacheStmt.get(sql);
    if (!stmt) {
      stmt = new Statement(this, sql);
      this._cacheStmt.set(sql, stmt);
    }
    return stmt;
  }

  /** Executa um script SQL com múltiplas instruções (ex.: schema). */
  exec(sql) {
    this._sql.run(sql);
    this._aposMutacao();
    return this;
  }

  /** Aplica um PRAGMA. Ignora silenciosamente os não suportados (ex.: WAL). */
  pragma(texto) {
    try {
      this._sql.run('PRAGMA ' + texto + ';');
    } catch (_) {
      /* alguns PRAGMAs (como WAL) não se aplicam ao backend em memória */
    }
  }

  /**
   * Retorna uma função que executa `fn` dentro de uma transação. Aceita
   * argumentos e devolve o valor retornado por `fn`. Suporta aninhamento via
   * SAVEPOINT (mesmo comportamento do better-sqlite3).
   */
  transaction(fn) {
    const self = this;
    return function (...args) {
      self._iniciarTx();
      try {
        const resultado = fn.apply(this, args);
        self._confirmarTx();
        return resultado;
      } catch (err) {
        self._reverterTx();
        throw err;
      }
    };
  }

  /** Backup: grava o banco atual em outro arquivo .db (SQLite padrão). */
  backup(destino) {
    return new Promise((resolve, reject) => {
      try {
        const dados = this._sql.export(); // reabre a conexão (reseta PRAGMAs)
        this._reaplicarPragmas();
        fs.writeFileSync(destino, Buffer.from(dados));
        resolve({ totalPages: 0, remainingPages: 0 });
      } catch (err) {
        reject(err);
      }
    });
  }

  /** Persiste o banco em disco e fecha. */
  close() {
    this._persistir();
    this._cacheStmt.clear();
    try {
      this._sql.close();
    } catch (_) {
      /* noop */
    }
  }

  // --- Internos ------------------------------------------------------------

  _ultimoRowid() {
    const r = this._sql.exec('SELECT last_insert_rowid() AS id');
    if (r.length && r[0].values.length) return r[0].values[0][0];
    return 0;
  }

  _iniciarTx() {
    if (this._txDepth === 0) this._sql.run('BEGIN');
    else this._sql.run('SAVEPOINT sp' + this._txDepth);
    this._txDepth++;
  }

  _confirmarTx() {
    this._txDepth--;
    if (this._txDepth === 0) {
      this._sql.run('COMMIT');
      this._persistir();
    } else {
      this._sql.run('RELEASE sp' + this._txDepth);
    }
  }

  _reverterTx() {
    this._txDepth--;
    if (this._txDepth === 0) {
      this._sql.run('ROLLBACK');
    } else {
      this._sql.run('ROLLBACK TO sp' + this._txDepth);
      this._sql.run('RELEASE sp' + this._txDepth);
    }
  }

  /** Chamado após cada escrita: persiste no disco quando fora de transação. */
  _aposMutacao() {
    if (this._txDepth === 0) this._persistir();
  }

  /**
   * Reaplica os PRAGMAs de conexão. Necessário porque `export()` fecha e
   * reabre a conexão SQLite, o que reseta PRAGMAs como foreign_keys.
   */
  _reaplicarPragmas() {
    try {
      this._sql.run('PRAGMA foreign_keys = ON;');
    } catch (_) {
      /* noop */
    }
  }

  /** Grava o conteúdo atual do banco no arquivo (escrita atômica). */
  _persistir() {
    if (!this._arquivo) return;
    try {
      const dados = Buffer.from(this._sql.export()); // reabre a conexão
      this._reaplicarPragmas();
      const tmp = this._arquivo + '.tmp';
      fs.writeFileSync(tmp, dados);
      fs.renameSync(tmp, this._arquivo);
    } catch (err) {
      logger.erro('[db] Falha ao gravar o banco em disco:', err.message);
    }
  }
}

// --- Ciclo de vida do singleton -------------------------------------------

/**
 * Abre (ou cria) o banco e aplica o schema. Assíncrono porque o carregamento
 * do WebAssembly do sql.js é assíncrono; após resolver, `get()` funciona de
 * forma síncrona em todo o restante do código.
 */
async function inicializar() {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    garantirDiretorios();

    const SQL = await initSqlJs({
      locateFile: () => require.resolve('sql.js/dist/sql-wasm.wasm'),
    });

    const arquivo = config.paths.dbFile;
    let sqlDb;
    if (fs.existsSync(arquivo)) {
      sqlDb = new SQL.Database(fs.readFileSync(arquivo));
    } else {
      sqlDb = new SQL.Database();
    }

    const wrapper = new Db(sqlDb, arquivo);
    wrapper.pragma('foreign_keys = ON');

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    wrapper.exec(schema);

    db = wrapper;
    logger.info(`[db] Banco pronto em ${arquivo}`);
    return db;
  })();

  return initPromise;
}

/** Retorna a instância. Requer que `inicializar()` já tenha sido aguardado. */
function get() {
  if (!db) {
    throw new Error(
      'Banco não inicializado. Aguarde db.inicializar() antes de usar db.get().'
    );
  }
  return db;
}

function fechar() {
  if (db) {
    try {
      db.close();
    } catch (_) {
      /* noop */
    }
    db = null;
    initPromise = null;
  }
}

module.exports = { inicializar, get, fechar };
