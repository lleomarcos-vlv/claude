'use strict';

/**
 * Camada de acesso ao banco (SQLite via better-sqlite3).
 *
 * - Cria o arquivo do banco e aplica o schema automaticamente na 1ª execução.
 * - Expõe uma única instância compartilhada (singleton).
 * - Usa sempre prepared statements (proteção contra SQL Injection).
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('../config/config');
const logger = require('../utils/logger');

let db = null;

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

/** Abre (ou cria) o banco e aplica o schema. */
function inicializar() {
  if (db) return db;
  garantirDiretorios();

  db = new Database(config.paths.dbFile);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  logger.info(`[db] Banco pronto em ${config.paths.dbFile}`);
  return db;
}

/** Retorna a instância (inicializando se necessário). */
function get() {
  if (!db) inicializar();
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
  }
}

module.exports = { inicializar, get, fechar };
