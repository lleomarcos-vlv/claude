'use strict';

/**
 * Carregador de configuração central.
 *
 * Ordem de precedência (maior primeiro):
 *   1. Variáveis de ambiente (ex.: PORT, ET_MODO_DEMO)
 *   2. config/local.json  (opcional, não versionado — sobrescreve o padrão)
 *   3. config/default.json
 *
 * Assim o usuário pode ajustar qualquer parâmetro sem editar o código-fonte.
 */

const fs = require('fs');
const path = require('path');

const CONFIG_DIR = __dirname;
const ROOT_DIR = path.resolve(__dirname, '..');

function lerJson(arquivo) {
  try {
    if (!fs.existsSync(arquivo)) return {};
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch (err) {
    console.error(`[config] Falha ao ler ${arquivo}: ${err.message}`);
    return {};
  }
}

/** Mescla profunda de dois objetos simples. */
function mesclar(base, extra) {
  const saida = Array.isArray(base) ? base.slice() : { ...base };
  for (const chave of Object.keys(extra || {})) {
    const valor = extra[chave];
    if (
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      base &&
      typeof base[chave] === 'object' &&
      !Array.isArray(base[chave])
    ) {
      saida[chave] = mesclar(base[chave], valor);
    } else {
      saida[chave] = valor;
    }
  }
  return saida;
}

const padrao = lerJson(path.join(CONFIG_DIR, 'default.json'));
const local = lerJson(path.join(CONFIG_DIR, 'local.json'));
const config = mesclar(padrao, local);

// --- Sobrescritas por variável de ambiente -------------------------------
if (process.env.PORT) config.server.port = Number(process.env.PORT);
if (process.env.HOST) config.server.host = process.env.HOST;
if (process.env.ET_MODO_DEMO) {
  config.pesquisa.modoDemonstracao = ['1', 'true', 'sim', 'on'].includes(
    String(process.env.ET_MODO_DEMO).toLowerCase()
  );
}

// --- Caminhos absolutos úteis em todo o app ------------------------------
// ET_DB_FILE permite apontar para um banco alternativo (usado nos testes).
const dbFile = process.env.ET_DB_FILE
  ? path.resolve(process.env.ET_DB_FILE)
  : path.join(ROOT_DIR, 'database', 'estacao.db');

config.paths = {
  root: ROOT_DIR,
  database: path.join(ROOT_DIR, 'database'),
  dbFile,
  backups: path.join(ROOT_DIR, 'database', 'backups'),
  uploads: path.join(ROOT_DIR, 'uploads'),
  temp: path.join(ROOT_DIR, 'temp'),
  logs: path.join(ROOT_DIR, 'logs'),
  public: path.join(ROOT_DIR, 'public'),
};

module.exports = config;
