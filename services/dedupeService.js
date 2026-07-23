'use strict';

/**
 * Motor de deduplicação.
 *
 * Objetivo: NUNCA permitir empresas repetidas. Compara candidatos por vários
 * identificadores fortes (telefone, site, instagram, e-mail) e, na ausência
 * deles, por similaridade de nome + cidade. Verifica simultaneamente em:
 *   - clientes (Clientes Fixos)
 *   - prospeccao (Prospectando)
 *   - pesquisa_resultados (Pesquisas / Revisão)
 *
 * Estratégia:
 *   1. Gera um "hash de dedupe" a partir dos identificadores normalizados.
 *   2. Match forte: qualquer identificador forte igual => duplicado.
 *   3. Match fraco: nome muito similar na mesma cidade => duplicado.
 */

const crypto = require('crypto');
const db = require('../database/db');
const norm = require('../utils/normalize');
const { similaridadeNome } = require('../utils/similarity');

const LIMIAR_NOME = 0.9; // similaridade mínima para considerar mesmo nome

/** Extrai identificadores normalizados de um registro heterogêneo. */
function extrairIdentificadores(reg) {
  const nome = reg.nome || reg.empresa || '';
  const telefone = norm.normalizarTelefone(reg.telefone || reg.whatsapp || '');
  const whatsapp = norm.normalizarTelefone(reg.whatsapp || '');
  const site = norm.normalizarSite(reg.site || '');
  const instagram = norm.normalizarInstagram(reg.instagram || '');
  const email = norm.normalizarEmail(reg.email || '');
  const cidade = norm.normalizarTexto(reg.cidade || '');
  const endereco = norm.normalizarEndereco(reg.endereco || '');
  return {
    nomeNorm: norm.normalizarNome(nome),
    telefone,
    whatsapp,
    site,
    instagram,
    email,
    cidade,
    endereco,
  };
}

/** Indica se o registro possui algum identificador forte que o distingue. */
function temIdentificadorForte(id) {
  return !!(id.telefone || id.site || id.instagram || id.email);
}

/** Gera um hash estável (SHA-1) a partir do melhor identificador disponível. */
function gerarHash(reg) {
  const id = extrairIdentificadores(reg);
  // Prioriza identificadores fortes; cai para nome+cidade quando ausentes.
  const chave =
    id.telefone ||
    id.site ||
    id.instagram ||
    id.email ||
    `${id.nomeNorm}|${id.cidade}`;
  return crypto.createHash('sha1').update(chave).digest('hex');
}

/**
 * Verifica se um candidato já existe em alguma das tabelas monitoradas.
 * @param {object} candidato registro a testar
 * @param {object} [opts]
 * @param {string[]} [opts.tabelas] quais tabelas checar (padrão: todas)
 * @returns {{duplicado:boolean, motivo?:string, tabela?:string, id?:number}}
 */
function verificarDuplicado(candidato, opts = {}) {
  const tabelas = opts.tabelas || ['clientes', 'prospeccao', 'pesquisa_resultados'];
  const id = extrairIdentificadores(candidato);
  const cx = db.get();

  // Coluna de nome varia por tabela.
  const colunaNome = { clientes: 'nome', prospeccao: 'empresa', pesquisa_resultados: 'nome' };

  for (const tabela of tabelas) {
    const cNome = colunaNome[tabela];

    // 1) Match forte por identificadores fortes.
    const condicoes = [];
    const params = [];
    if (id.telefone) {
      condicoes.push(
        `replace(replace(replace(replace(replace(ifnull(telefone,''),'(',''),')',''),'-',''),' ',''),'.','') LIKE ?`
      );
      params.push('%' + id.telefone + '%');
    }
    if (id.site) {
      condicoes.push("lower(ifnull(site,'')) LIKE ?");
      params.push('%' + id.site + '%');
    }
    if (id.instagram) {
      condicoes.push("lower(ifnull(instagram,'')) LIKE ?");
      params.push('%' + id.instagram + '%');
    }
    if (id.email) {
      condicoes.push("lower(ifnull(email,'')) = ?");
      params.push(id.email);
    }

    if (condicoes.length) {
      const row = cx
        .prepare(
          `SELECT id FROM ${tabela} WHERE ${condicoes.join(' OR ')} LIMIT 1`
        )
        .get(...params);
      if (row) {
        return {
          duplicado: true,
          motivo: 'identificador forte (telefone/site/instagram/email)',
          tabela,
          id: row.id,
        };
      }
    }

    // 2) Match fraco por nome + cidade (similaridade).
    // Só se aplica quando o candidato NÃO possui identificador forte — assim
    // filiais/unidades distintas (mesmo nome, telefones diferentes) não são
    // fundidas indevidamente. Registros "crus" (só nome+cidade) ainda dedupam.
    if (id.nomeNorm && !temIdentificadorForte(id)) {
      const candidatos = cx
        .prepare(
          `SELECT id, ${cNome} AS nome, ifnull(cidade,'') AS cidade
             FROM ${tabela}
            WHERE lower(ifnull(cidade,'')) = ? OR ? = ''
            LIMIT 5000`
        )
        .all(id.cidade, id.cidade);
      for (const c of candidatos) {
        const sim = similaridadeNome(candidato.nome || candidato.empresa || '', c.nome);
        if (sim >= LIMIAR_NOME) {
          return {
            duplicado: true,
            motivo: `nome similar (${(sim * 100).toFixed(0)}%) na mesma cidade`,
            tabela,
            id: c.id,
          };
        }
      }
    }
  }

  return { duplicado: false };
}

/**
 * Deduplica uma lista de candidatos entre si (útil na coleta da pesquisa antes
 * de persistir). Mantém o primeiro de cada grupo.
 */
function deduplicarLista(lista) {
  const vistos = new Map(); // hash -> índice
  const unicos = [];
  for (const item of lista) {
    const h = gerarHash(item);
    if (vistos.has(h)) continue;
    const idItem = extrairIdentificadores(item);
    // Comparação extra por nome+cidade apenas para registros SEM identificador
    // forte (evita fundir filiais/unidades com telefones diferentes).
    let dup = false;
    if (!temIdentificadorForte(idItem)) {
      for (const u of unicos) {
        if (temIdentificadorForte(extrairIdentificadores(u))) continue;
        if (
          norm.normalizarTexto(u.cidade || '') === norm.normalizarTexto(item.cidade || '') &&
          similaridadeNome(u.nome || u.empresa || '', item.nome || item.empresa || '') >= LIMIAR_NOME
        ) {
          dup = true;
          break;
        }
      }
    }
    if (dup) continue;
    vistos.set(h, unicos.length);
    unicos.push(item);
  }
  return unicos;
}

module.exports = {
  gerarHash,
  extrairIdentificadores,
  verificarDuplicado,
  deduplicarLista,
};
