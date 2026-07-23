'use strict';

/**
 * Serviço da Pesquisa Automática e da Revisão.
 *
 * Fluxo:
 *   1. Resolve a definição do nicho (base local + fallback por texto livre).
 *   2. Coleta em fontes abertas (searchProviders).
 *   3. Deduplica a lista coletada e remove o que já existe no sistema.
 *   4. Persiste a pesquisa e seus resultados (aba Revisão).
 *   5. Registra tudo no Histórico.
 */

const db = require('../database/db');
const providers = require('./searchProviders');
const dedupe = require('./dedupeService');
const historico = require('./historyService');
const logger = require('../utils/logger');
const norm = require('../utils/normalize');

/** Resolve o nicho informado para uma definição com termos/osm. */
function resolverNicho(nichoTexto) {
  const cx = db.get();
  // Busca exata (case-insensitive) e depois aproximada.
  let row =
    cx.prepare('SELECT * FROM nichos WHERE lower(nome) = lower(?)').get(nichoTexto) ||
    cx.prepare('SELECT * FROM nichos WHERE nome LIKE ? LIMIT 1').get(`%${nichoTexto}%`);
  if (row) {
    return {
      nome: row.nome,
      categoria: row.categoria,
      termos: safeParse(row.termos, [nichoTexto]),
      osm: safeParse(row.osm, []),
    };
  }
  // Texto livre: usa o próprio termo para busca por nome no Overpass.
  return { nome: nichoTexto, termos: [nichoTexto], osm: [] };
}

function safeParse(s, padrao) {
  try {
    const v = JSON.parse(s);
    return v == null ? padrao : v;
  } catch (_) {
    return padrao;
  }
}

/**
 * Executa uma pesquisa completa e persiste os resultados.
 * @returns {Promise<{pesquisaId:number, total:number, novos:number, duplicados:number, fonte:string, mensagem:string}>}
 */
async function executarPesquisa({ cidade, estado, nicho, max }, usuarioId) {
  const nichoDef = resolverNicho(nicho);
  logger.info(`[pesquisa] Iniciando: ${nicho} em ${cidade}/${estado} (máx ${max})`);

  let coleta;
  try {
    coleta = await providers.coletar({ cidade, estado, nicho, max }, nichoDef);
  } catch (err) {
    // Registra a pesquisa como falha para aparecer na Revisão com o motivo.
    const info = db
      .get()
      .prepare(
        `INSERT INTO pesquisas (cidade, estado, nicho, max_qtd, total_encontrado, total_novo, fonte, status, mensagem)
         VALUES (?, ?, ?, ?, 0, 0, ?, 'falha', ?)`
      )
      .run(cidade, estado, nicho, max, 'erro', err.message);
    historico.registrar('erro', `Falha na pesquisa: ${nicho} em ${cidade}`, { erro: err.message }, usuarioId);
    return {
      pesquisaId: info.lastInsertRowid,
      total: 0,
      novos: 0,
      duplicados: 0,
      fonte: 'erro',
      mensagem: err.message,
      erro: true,
    };
  }

  // Deduplicação interna da coleta.
  const unicos = dedupe.deduplicarLista(coleta.resultados);

  // Remove os que já existem no sistema (clientes, prospecção, pesquisas).
  const novos = [];
  let duplicados = 0;
  for (const item of unicos) {
    const check = dedupe.verificarDuplicado(item);
    if (check.duplicado) {
      duplicados++;
      continue;
    }
    novos.push(item);
    if (novos.length >= (max || novos.length)) break;
  }

  // Persiste a pesquisa + resultados numa transação.
  const cx = db.get();
  const inserirPesquisa = cx.prepare(
    `INSERT INTO pesquisas (cidade, estado, nicho, max_qtd, total_encontrado, total_novo, fonte, status, mensagem)
     VALUES (@cidade, @estado, @nicho, @max, @total, @novo, @fonte, 'concluida', @mensagem)`
  );
  const inserirResultado = cx.prepare(
    `INSERT INTO pesquisa_resultados
      (pesquisa_id, nome, telefone, whatsapp, instagram, site, email, cidade, estado, endereco,
       latitude, longitude, categoria, horario, avaliacao, qtd_avaliacoes, origem, url_origem, hash_dedupe, status)
     VALUES
      (@pesquisa_id, @nome, @telefone, @whatsapp, @instagram, @site, @email, @cidade, @estado, @endereco,
       @latitude, @longitude, @categoria, @horario, @avaliacao, @qtd_avaliacoes, @origem, @url_origem, @hash, 'novo')`
  );

  const tx = cx.transaction(() => {
    const p = inserirPesquisa.run({
      cidade,
      estado,
      nicho,
      max,
      total: coleta.resultados.length,
      novo: novos.length,
      fonte: coleta.fonte,
      mensagem: coleta.mensagem,
    });
    const pesquisaId = p.lastInsertRowid;
    for (const r of novos) {
      inserirResultado.run({
        pesquisa_id: pesquisaId,
        nome: r.nome,
        telefone: r.telefone || '',
        whatsapp: r.whatsapp || '',
        instagram: r.instagram || '',
        site: r.site || '',
        email: r.email || '',
        cidade: r.cidade || cidade || '',
        estado: r.estado || estado || '',
        endereco: r.endereco || '',
        latitude: r.latitude,
        longitude: r.longitude,
        categoria: r.categoria || '',
        horario: r.horario || '',
        avaliacao: r.avaliacao,
        qtd_avaliacoes: r.qtd_avaliacoes,
        origem: r.origem || coleta.fonte,
        url_origem: r.url_origem || '',
        hash: dedupe.gerarHash(r),
      });
    }
    return pesquisaId;
  });

  const pesquisaId = tx();

  historico.registrar(
    'pesquisa',
    `Pesquisa: ${nicho} em ${cidade}/${estado} — ${novos.length} novos, ${duplicados} duplicados`,
    { cidade, estado, nicho, max, fonte: coleta.fonte },
    usuarioId
  );

  return {
    pesquisaId,
    total: coleta.resultados.length,
    novos: novos.length,
    duplicados,
    fonte: coleta.fonte,
    mensagem: coleta.mensagem,
  };
}

// --- Revisão: listagem de pesquisas e resultados ---------------------------
function listarPesquisas({ page = 1, pageSize = 50 } = {}) {
  const cx = db.get();
  const total = cx.prepare('SELECT COUNT(*) AS n FROM pesquisas').get().n;
  const offset = (page - 1) * pageSize;
  const itens = cx
    .prepare(
      `SELECT p.*,
              (SELECT COUNT(*) FROM pesquisa_resultados r WHERE r.pesquisa_id = p.id AND r.status='novo') AS pendentes
         FROM pesquisas p
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?`
    )
    .all(pageSize, offset);
  return { total, page, pageSize, itens };
}

function listarResultados(pesquisaId, { status = '', search = '', sort = 'id', order = 'ASC' } = {}) {
  const cx = db.get();
  const where = ['pesquisa_id = ?'];
  const params = [pesquisaId];
  if (status) {
    where.push('status = ?');
    params.push(status);
  }
  if (search) {
    where.push('(lower(nome) LIKE ? OR lower(cidade) LIKE ? OR lower(categoria) LIKE ?)');
    const s = `%${search.toLowerCase()}%`;
    params.push(s, s, s);
  }
  const colunas = ['id', 'nome', 'cidade', 'categoria', 'status'];
  const col = colunas.includes(sort) ? sort : 'id';
  const dir = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return cx
    .prepare(`SELECT * FROM pesquisa_resultados WHERE ${where.join(' AND ')} ORDER BY ${col} ${dir}`)
    .all(...params);
}

/** Descarta resultados (em lote). */
function descartar(ids, usuarioId) {
  const cx = db.get();
  const stmt = cx.prepare(`UPDATE pesquisa_resultados SET status='descartado' WHERE id = ?`);
  const tx = cx.transaction((lista) => lista.forEach((id) => stmt.run(id)));
  tx(ids);
  historico.registrar('movimentacao', `Descartados ${ids.length} resultados`, { ids }, usuarioId);
  return ids.length;
}

/** Exclui resultados definitivamente (em lote). */
function excluirResultados(ids, usuarioId) {
  const cx = db.get();
  const stmt = cx.prepare(`DELETE FROM pesquisa_resultados WHERE id = ?`);
  const tx = cx.transaction((lista) => lista.forEach((id) => stmt.run(id)));
  tx(ids);
  historico.registrar('exclusao', `Excluídos ${ids.length} resultados de pesquisa`, { ids }, usuarioId);
  return ids.length;
}

/**
 * Move resultados selecionados para a Prospecção (com verificação de
 * duplicidade global). Retorna quantos foram movidos e quantos ignorados.
 */
function moverParaProspeccao(ids, usuarioId) {
  const cx = db.get();
  const buscar = cx.prepare('SELECT * FROM pesquisa_resultados WHERE id = ?');
  const inserir = cx.prepare(
    `INSERT INTO prospeccao
      (empresa, cidade, estado, nicho, telefone, whatsapp, instagram, site, email,
       status, origem, observacoes, hash_dedupe)
     VALUES
      (@empresa, @cidade, @estado, @nicho, @telefone, @whatsapp, @instagram, @site, @email,
       'Novo', @origem, @observacoes, @hash)`
  );
  const marcar = cx.prepare(`UPDATE pesquisa_resultados SET status='movido' WHERE id = ?`);

  let movidos = 0;
  let ignorados = 0;
  const tx = cx.transaction((lista) => {
    for (const id of lista) {
      const r = buscar.get(id);
      if (!r || r.status === 'movido') {
        ignorados++;
        continue;
      }
      const candidato = {
        empresa: r.nome,
        nome: r.nome,
        cidade: r.cidade,
        telefone: r.telefone,
        whatsapp: r.whatsapp,
        site: r.site,
        instagram: r.instagram,
        email: r.email,
        endereco: r.endereco,
      };
      // Não duplicar em Clientes/Prospecção.
      const dup = dedupe.verificarDuplicado(candidato, { tabelas: ['clientes', 'prospeccao'] });
      if (dup.duplicado) {
        marcar.run(id);
        ignorados++;
        continue;
      }
      const obs = [r.endereco, r.horario, r.url_origem ? `Fonte: ${r.url_origem}` : '']
        .filter(Boolean)
        .join(' | ');
      inserir.run({
        empresa: r.nome,
        cidade: r.cidade || '',
        estado: r.estado || '',
        nicho: r.categoria || '',
        telefone: r.telefone || '',
        whatsapp: r.whatsapp || '',
        instagram: r.instagram || '',
        site: r.site || '',
        email: r.email || '',
        origem: r.origem || 'Pesquisa',
        observacoes: obs,
        hash: r.hash_dedupe || dedupe.gerarHash(candidato),
      });
      marcar.run(id);
      movidos++;
    }
  });
  tx(ids);

  historico.registrar(
    'movimentacao',
    `Movidos ${movidos} resultados para Prospecção (${ignorados} ignorados por duplicidade)`,
    { ids },
    usuarioId
  );
  return { movidos, ignorados };
}

/** Atualiza um resultado (edição na Revisão). */
function atualizarResultado(id, dados) {
  const cx = db.get();
  const campos = ['nome', 'telefone', 'whatsapp', 'instagram', 'site', 'email', 'cidade', 'estado', 'endereco', 'categoria'];
  const sets = [];
  const params = [];
  for (const c of campos) {
    if (dados[c] !== undefined) {
      sets.push(`${c} = ?`);
      params.push(dados[c]);
    }
  }
  if (!sets.length) return false;
  params.push(id);
  cx.prepare(`UPDATE pesquisa_resultados SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  return true;
}

module.exports = {
  resolverNicho,
  executarPesquisa,
  listarPesquisas,
  listarResultados,
  descartar,
  excluirResultados,
  moverParaProspeccao,
  atualizarResultado,
};
