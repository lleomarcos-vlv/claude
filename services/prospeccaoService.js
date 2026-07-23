'use strict';

/**
 * Serviço de Prospecção (empresas em negociação): CRUD + filtros + dedupe +
 * conversão para Clientes Fixos.
 */

const db = require('../database/db');
const dedupe = require('./dedupeService');
const historico = require('./historyService');
const v = require('../utils/validate');

const STATUS_VALIDOS = ['Novo', 'Contatado', 'Negociando', 'Proposta', 'Fechado', 'Perdido'];
const COLUNAS_ORDENACAO = ['empresa', 'cidade', 'estado', 'nicho', 'status', 'probabilidade', 'data', 'ultimo_contato'];

function sanitizar(dados) {
  let status = v.texto(dados.status, 30) || 'Novo';
  if (!STATUS_VALIDOS.includes(status)) status = 'Novo';
  return {
    empresa: v.texto(dados.empresa, 200),
    cidade: v.texto(dados.cidade, 120),
    estado: v.texto(dados.estado, 40),
    nicho: v.texto(dados.nicho, 120),
    telefone: v.texto(dados.telefone, 40),
    whatsapp: v.texto(dados.whatsapp, 40),
    instagram: v.texto(dados.instagram, 200),
    site: v.texto(dados.site, 300),
    email: v.texto(dados.email, 254),
    responsavel: v.texto(dados.responsavel, 120),
    status,
    origem: v.texto(dados.origem, 120),
    data: v.dataOuVazio(dados.data) || undefined,
    ultimo_contato: v.dataOuVazio(dados.ultimo_contato) || null,
    probabilidade: v.inteiro(dados.probabilidade, 0, 0, 100),
    observacoes: v.texto(dados.observacoes, 5000),
  };
}

function listar({ search = '', cidade = '', estado = '', nicho = '', status = '', probMin = '', sort = 'empresa', order = 'ASC', page = 1, pageSize = 50 } = {}) {
  const cx = db.get();
  const col = v.colunaPermitida(sort, COLUNAS_ORDENACAO, 'empresa');
  const dir = v.direcaoOrdem(order);
  const where = [];
  const params = [];
  if (search) {
    where.push('(lower(empresa) LIKE ? OR lower(cidade) LIKE ? OR telefone LIKE ? OR lower(email) LIKE ? OR lower(responsavel) LIKE ?)');
    const s = `%${String(search).toLowerCase()}%`;
    params.push(s, s, `%${search}%`, s, s);
  }
  if (cidade) { where.push('lower(cidade) = lower(?)'); params.push(cidade); }
  if (estado) { where.push('lower(estado) = lower(?)'); params.push(estado); }
  if (nicho) { where.push('lower(nicho) LIKE lower(?)'); params.push(`%${nicho}%`); }
  if (status) { where.push('status = ?'); params.push(status); }
  if (probMin !== '' && probMin !== undefined) { where.push('probabilidade >= ?'); params.push(v.inteiro(probMin, 0, 0, 100)); }

  const clausula = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = cx.prepare(`SELECT COUNT(*) AS n FROM prospeccao ${clausula}`).get(...params).n;
  const offset = (page - 1) * pageSize;
  const itens = cx
    .prepare(`SELECT * FROM prospeccao ${clausula} ORDER BY ${col} ${dir} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset);
  return { total, page, pageSize, itens };
}

function obter(id) {
  return db.get().prepare('SELECT * FROM prospeccao WHERE id = ?').get(id);
}

function criar(dados, usuarioId, { forcar = false } = {}) {
  const d = sanitizar(dados);
  if (!d.empresa) return { ok: false, erro: 'O nome da empresa é obrigatório.' };
  if (!v.emailValido(d.email)) return { ok: false, erro: 'E-mail inválido.' };

  if (!forcar) {
    const dup = dedupe.verificarDuplicado({ ...d, nome: d.empresa });
    if (dup.duplicado) {
      return { ok: false, erro: `Registro duplicado (${dup.motivo}).`, duplicado: dup };
    }
  }
  const hash = dedupe.gerarHash({ ...d, nome: d.empresa });
  const info = db
    .get()
    .prepare(
      `INSERT INTO prospeccao
        (empresa, cidade, estado, nicho, telefone, whatsapp, instagram, site, email, responsavel,
         status, origem, data, ultimo_contato, probabilidade, observacoes, hash_dedupe)
       VALUES
        (@empresa, @cidade, @estado, @nicho, @telefone, @whatsapp, @instagram, @site, @email, @responsavel,
         @status, @origem, COALESCE(@data, date('now','localtime')), @ultimo_contato, @probabilidade, @observacoes, @hash)`
    )
    .run({ ...d, data: d.data || null, hash });
  historico.registrar('alteracao', `Prospecção criada: ${d.empresa}`, { id: info.lastInsertRowid }, usuarioId);
  return { ok: true, id: info.lastInsertRowid };
}

function atualizar(id, dados, usuarioId) {
  const atual = obter(id);
  if (!atual) return { ok: false, erro: 'Registro não encontrado.' };
  const d = sanitizar(dados);
  if (!d.empresa) return { ok: false, erro: 'O nome da empresa é obrigatório.' };
  if (!v.emailValido(d.email)) return { ok: false, erro: 'E-mail inválido.' };
  const hash = dedupe.gerarHash({ ...d, nome: d.empresa });
  db.get()
    .prepare(
      `UPDATE prospeccao SET empresa=@empresa, cidade=@cidade, estado=@estado, nicho=@nicho,
              telefone=@telefone, whatsapp=@whatsapp, instagram=@instagram, site=@site, email=@email,
              responsavel=@responsavel, status=@status, origem=@origem, ultimo_contato=@ultimo_contato,
              probabilidade=@probabilidade, observacoes=@observacoes, hash_dedupe=@hash
        WHERE id=@id`
    )
    .run({ ...d, id, hash });
  historico.registrar('alteracao', `Prospecção atualizada: ${d.empresa}`, { id }, usuarioId);
  return { ok: true };
}

function excluir(id, usuarioId) {
  const atual = obter(id);
  if (!atual) return { ok: false, erro: 'Registro não encontrado.' };
  db.get().prepare('DELETE FROM prospeccao WHERE id = ?').run(id);
  historico.registrar('exclusao', `Prospecção excluída: ${atual.empresa}`, { id }, usuarioId);
  return { ok: true };
}

/** Move um registro de prospecção para Clientes Fixos. */
function moverParaClientes(id, usuarioId) {
  const cx = db.get();
  const r = obter(id);
  if (!r) return { ok: false, erro: 'Registro não encontrado.' };

  const candidato = {
    nome: r.empresa, cidade: r.cidade, telefone: r.telefone, whatsapp: r.whatsapp,
    site: r.site, instagram: r.instagram, email: r.email,
  };
  const dup = dedupe.verificarDuplicado(candidato, { tabelas: ['clientes'] });
  if (dup.duplicado) {
    return { ok: false, erro: `Já existe em Clientes Fixos (${dup.motivo}).` };
  }

  const hash = dedupe.gerarHash(candidato);
  const tx = cx.transaction(() => {
    cx.prepare(
      `INSERT INTO clientes (nome, telefone, whatsapp, cidade, instagram, site, email, observacoes, ultimo_contato, hash_dedupe)
       VALUES (@nome, @telefone, @whatsapp, @cidade, @instagram, @site, @email, @observacoes, @ultimo_contato, @hash)`
    ).run({
      nome: r.empresa,
      telefone: r.telefone || '',
      whatsapp: r.whatsapp || '',
      cidade: r.cidade || '',
      instagram: r.instagram || '',
      site: r.site || '',
      email: r.email || '',
      observacoes: [r.observacoes, r.nicho ? `Nicho: ${r.nicho}` : '', r.origem ? `Origem: ${r.origem}` : '']
        .filter(Boolean)
        .join(' | '),
      ultimo_contato: r.ultimo_contato || null,
      hash,
    });
    cx.prepare('DELETE FROM prospeccao WHERE id = ?').run(id);
  });
  tx();
  historico.registrar('movimentacao', `Prospecção movida para Clientes: ${r.empresa}`, { id }, usuarioId);
  return { ok: true };
}

function todos() {
  return db.get().prepare('SELECT * FROM prospeccao ORDER BY empresa').all();
}

module.exports = { listar, obter, criar, atualizar, excluir, moverParaClientes, todos, STATUS_VALIDOS, COLUNAS_ORDENACAO };
