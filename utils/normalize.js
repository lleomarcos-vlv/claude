'use strict';

/**
 * Funções de normalização textual usadas pelo motor de deduplicação e pela
 * pesquisa. O objetivo é reduzir variações irrelevantes (acentos, caixa,
 * pontuação, prefixos comuns) para permitir comparação confiável.
 */

/** Remove acentos e diacríticos. */
function semAcentos(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Normaliza um texto genérico: minúsculas, sem acento, sem pontuação, espaços colapsados. */
function normalizarTexto(texto) {
  return semAcentos(texto)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normaliza um nome de empresa removendo sufixos/termos societários e
 * palavras muito comuns que não ajudam a distinguir empresas.
 */
const RUIDO_NOME = new Set([
  'ltda', 'me', 'epp', 'eireli', 'sa', 's', 'a', 'cia', 'comercio', 'comercial',
  'e', 'de', 'da', 'do', 'das', 'dos', 'the', 'and',
]);

function normalizarNome(nome) {
  const base = normalizarTexto(nome);
  const palavras = base.split(' ').filter((p) => p && !RUIDO_NOME.has(p));
  return palavras.join(' ');
}

/** Mantém apenas os dígitos de um telefone. */
function normalizarTelefone(telefone) {
  let d = String(telefone || '').replace(/\D/g, '');
  // Remove código do país Brasil (55) quando o número tem tamanho de DDD+numero.
  if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
  return d;
}

/**
 * Gera o formato E.164 aproximado para links do WhatsApp (assume Brasil quando
 * não houver código de país). Retorna somente dígitos, prontos para wa.me.
 */
function telefoneParaWhatsapp(telefone) {
  let d = String(telefone || '').replace(/\D/g, '');
  if (!d) return '';
  // Já veio com DDI
  if (d.length >= 12 && d.startsWith('55')) return d;
  if (d.length >= 12 && !d.startsWith('55')) return d; // outro país já com DDI
  // 10 (fixo) ou 11 (celular) dígitos => adiciona DDI Brasil
  if (d.length === 10 || d.length === 11) return '55' + d;
  return d;
}

/** Normaliza um domínio/site: sem protocolo, sem www, sem barra final, minúsculo. */
function normalizarSite(site) {
  let s = normalizarUrlBase(site);
  s = s.replace(/^www\./, '');
  return s;
}

function normalizarUrlBase(url) {
  let s = String(url || '').trim().toLowerCase();
  if (!s) return '';
  s = s.replace(/^https?:\/\//, '');
  s = s.replace(/\/+$/, '');
  s = s.split(/[?#]/)[0];
  return s;
}

/** Normaliza um @ de Instagram para apenas o handle em minúsculas. */
function normalizarInstagram(insta) {
  let s = String(insta || '').trim().toLowerCase();
  if (!s) return '';
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  s = s.replace(/^instagram\.com\//, '');
  s = s.replace(/^@/, '');
  s = s.replace(/[/?#].*$/, '');
  return s;
}

/** Normaliza e-mail. */
function normalizarEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Normaliza um endereço para comparação. */
function normalizarEndereco(endereco) {
  return normalizarTexto(endereco)
    .replace(/\b(rua|r|avenida|av|travessa|tv|alameda|al|rodovia|rod|estrada|est|praca|pca)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = {
  semAcentos,
  normalizarTexto,
  normalizarNome,
  normalizarTelefone,
  telefoneParaWhatsapp,
  normalizarSite,
  normalizarUrlBase,
  normalizarInstagram,
  normalizarEmail,
  normalizarEndereco,
};
