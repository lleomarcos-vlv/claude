'use strict';

/**
 * Serviço de Clientes Fixos (CRUD + busca/ordenção/paginação + dedupe).
 */

const db = require('../database/db');
const dedupe = require('./dedupeService');
const historico = require('./historyService');
const v = require('../utils/validate');

const COLUNAS_ORDENACAO = [
  'nome', 'cidade', 'telefone', 'email', 'data_cadastro', 'ultimo_contato', 'criado_em',
];

function sanitizar(dados) {
  return {
    nome: v.texto(dados.nome, 200),
    telefone: v.texto(dados.telefone, 40),
    whatsapp: v.texto(dados.whatsapp, 40),
    cidade: v.texto(dados.cidade, 120),
    instagram: v.texto(dados.instagram, 200),
    site: v.texto(dados.site, 300),
    email: v.texto(dados.email, 254),
    observacoes: v.texto(dados.observacoes, 5000),
    data_cadastro: v.dataOuVazio(dados.data_cadastro) || undefined,
    ultimo_contato: v.dataOuVazio(dados.ultimo_contato) || null,
  };
}

/** Lista com busca, ordenação e paginação. */
function listar({ search = '', sort = 'nome', order = 'ASC', page = 1, pageSize = 50 } = {}) {
  const cx = db.get();
  const col = v.colunaPermitida(sort, COLUNAS_ORDENACAO, 'nome');
  const dir = v.direcaoOrdem(order);
  const where = [];
  const params = [];
  if (search) {
    where.push('(lower(nome) LIKE ? OR lower(cidade) LIKE ? OR telefone LIKE ? OR lower(email) LIKE ? OR lower(instagram) LIKE ?)');
    const s = `%${String(search).toLowerCase()}%`;
    params.push(s, s, `%${search}%`, s, s);
  }
  const clausula = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = cx.prepare(`SELECT COUNT(*) AS n FROM clientes ${clausula}`).get(...params).n;
  const offset = (page - 1) * pageSize;
  const itens = cx
    .prepare(`SELECT * FROM clientes ${clausula} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);
  return { total, page, pageSize, itens };
}

function obter(id) {
  return db.get().prepare('SELECT * FROM clientes WHERE id = ?').get(id);
}

/**
 * Cria um cliente. Verifica duplicidade global (a menos que forçado).
 * @returns {{ok:boolean, id?:number, erro?:string, duplicado?:object}}
 */
function criar(dados, usuarioId, { forcar = false } = {}) {
  const d = sanitizar(dados);
  if (!d.nome) return { ok: false, erro: 'O nome é obrigatório.' };
  if (!v.emailValido(d.email)) return { ok: false, erro: 'E-mail inválido.' };

  if (!forcar) {
    const dup = dedupe.verificarDuplicado(d);
    if (dup.duplicado) {
      return { ok: false, erro: `Registro duplicado (${dup.motivo}).`, duplicado: dup };
    }
  }

  const hash = dedupe.gerarHash(d);
  const info = db
    .get()
    .prepare(
      `INSERT INTO clientes (nome, telefone, whatsapp, cidade, instagram, site, email, observacoes, data_cadastro, ultimo_contato, hash_dedupe)
       VALUES (@nome, @telefone, @whatsapp, @cidade, @instagram, @site, @email, @observacoes,
               COALESCE(@data_cadastro, date('now','localtime')), @ultimo_contato, @hash)`
    )
    .run({ ...d, data_cadastro: d.data_cadastro || null, hash });

  historico.registrar('alteracao', `Cliente criado: ${d.nome}`, { id: info.lastInsertRowid }, usuarioId);
  return { ok: true, id: info.lastInsertRowid };
}

function atualizar(id, dados, usuarioId) {
  const atual = obter(id);
  if (!atual) return { ok: false, erro: 'Cliente não encontrado.' };
  const d = sanitizar(dados);
  if (!d.nome) return { ok: false, erro: 'O nome é obrigatório.' };
  if (!v.emailValido(d.email)) return { ok: false, erro: 'E-mail inválido.' };

  const hash = dedupe.gerarHash(d);
  db.get()
    .prepare(
      `UPDATE clientes SET nome=@nome, telefone=@telefone, whatsapp=@whatsapp, cidade=@cidade,
              instagram=@instagram, site=@site, email=@email, observacoes=@observacoes,
              ultimo_contato=@ultimo_contato, hash_dedupe=@hash
        WHERE id=@id`
    )
    .run({ ...d, id, hash });
  historico.registrar('alteracao', `Cliente atualizado: ${d.nome}`, { id }, usuarioId);
  return { ok: true };
}

function excluir(id, usuarioId) {
  const atual = obter(id);
  if (!atual) return { ok: false, erro: 'Cliente não encontrado.' };
  db.get().prepare('DELETE FROM clientes WHERE id = ?').run(id);
  historico.registrar('exclusao', `Cliente excluído: ${atual.nome}`, { id }, usuarioId);
  return { ok: true };
}

/** Todos os registros (para exportação). */
function todos() {
  return db.get().prepare('SELECT * FROM clientes ORDER BY nome').all();
}

module.exports = { listar, obter, criar, atualizar, excluir, todos, sanitizar, COLUNAS_ORDENACAO };
