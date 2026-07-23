'use strict';

/**
 * Medidas de similaridade textual para o motor de deduplicação.
 * Implementações próprias (sem dependências) e eficientes o suficiente para
 * comparar milhares de registros.
 */

const { normalizarTexto } = require('./normalize');

/** Distância de Levenshtein (edição) entre duas strings. */
function levenshtein(a, b) {
  a = a || '';
  b = b || '';
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let linhaAnterior = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) linhaAnterior[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let linhaAtual = [i];
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      linhaAtual[j] = Math.min(
        linhaAtual[j - 1] + 1,
        linhaAnterior[j] + 1,
        linhaAnterior[j - 1] + custo
      );
    }
    linhaAnterior = linhaAtual;
  }
  return linhaAnterior[b.length];
}

/** Similaridade normalizada 0..1 baseada em Levenshtein. */
function similaridadeLevenshtein(a, b) {
  a = normalizarTexto(a);
  b = normalizarTexto(b);
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/** Conjunto de tokens de uma string. */
function tokens(texto) {
  return new Set(normalizarTexto(texto).split(' ').filter(Boolean));
}

/** Índice de Jaccard entre os conjuntos de palavras de duas strings. */
function similaridadeJaccard(a, b) {
  const sa = tokens(a);
  const sb = tokens(b);
  if (sa.size === 0 && sb.size === 0) return 1;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter++;
  const uniao = sa.size + sb.size - inter;
  return uniao === 0 ? 0 : inter / uniao;
}

/**
 * Similaridade combinada de nomes de empresa: leva em conta tanto a distância
 * de edição quanto a sobreposição de palavras (mais robusto para nomes com
 * ordem de palavras diferente).
 */
function similaridadeNome(a, b) {
  const lev = similaridadeLevenshtein(a, b);
  const jac = similaridadeJaccard(a, b);
  return Math.max(lev, jac * 0.6 + lev * 0.4);
}

module.exports = {
  levenshtein,
  similaridadeLevenshtein,
  similaridadeJaccard,
  similaridadeNome,
};
