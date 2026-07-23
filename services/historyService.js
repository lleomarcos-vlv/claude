'use strict';

/**
 * Serviço de Histórico/Auditoria. Registra todas as operações relevantes:
 * logins, pesquisas, importações, exclusões, alterações, movimentações e erros.
 */

const db = require('../database/db');
const logger = require('../utils/logger');

/**
 * Registra um evento no histórico.
 * @param {string} tipo       categoria (login, pesquisa, importacao, ...)
 * @param {string} descricao  texto legível
 * @param {object} [detalhes] objeto serializável com detalhes extras
 * @param {number} [usuarioId]
 */
function registrar(tipo, descricao, detalhes = null, usuarioId = null) {
  try {
    db.get()
      .prepare(
        `INSERT INTO historico (tipo, descricao, detalhes, usuario_id)
         VALUES (?, ?, ?, ?)`
      )
      .run(tipo, descricao || '', detalhes ? JSON.stringify(detalhes) : null, usuarioId);
  } catch (err) {
    // Nunca deixar o registro de histórico quebrar a operação principal.
    logger.erro('[historico] Falha ao registrar:', err.message);
  }
}

/** Lista o histórico com filtro por tipo e paginação. */
function listar({ tipo = '', page = 1, pageSize = 50 } = {}) {
  const cx = db.get();
  const where = [];
  const params = [];
  if (tipo) {
    where.push('tipo = ?');
    params.push(tipo);
  }
  const clausula = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = cx
    .prepare(`SELECT COUNT(*) AS n FROM historico ${clausula}`)
    .get(...params).n;

  const offset = (page - 1) * pageSize;
  const linhas = cx
    .prepare(
      `SELECT h.*, u.login AS usuario_login
         FROM historico h
         LEFT JOIN usuarios u ON u.id = h.usuario_id
         ${clausula}
        ORDER BY h.id DESC
        LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, offset)
    .map((r) => ({ ...r, detalhes: r.detalhes ? safeParse(r.detalhes) : null }));

  return { total, page, pageSize, itens: linhas };
}

/** Retorna a lista de tipos distintos existentes (para filtros na UI). */
function tipos() {
  return db
    .get()
    .prepare('SELECT DISTINCT tipo FROM historico ORDER BY tipo')
    .all()
    .map((r) => r.tipo);
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch (_) {
    return null;
  }
}

module.exports = { registrar, listar, tipos };
