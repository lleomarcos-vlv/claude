'use strict';

/**
 * Validação e sanitização de entradas. Centraliza as regras para reuso nas
 * rotas e serviços. Sempre sanitize antes de persistir.
 */

/** Converte para string, remove espaços das pontas e limita o tamanho. */
function texto(valor, maxLen = 2000) {
  if (valor === undefined || valor === null) return '';
  let s = String(valor);
  // Remove caracteres de controle perigosos, mantém tab/quebras de linha.
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  s = s.trim();
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

function inteiro(valor, padrao = 0, min = -Infinity, max = Infinity) {
  const n = parseInt(valor, 10);
  if (Number.isNaN(n)) return padrao;
  return Math.min(max, Math.max(min, n));
}

function numero(valor, padrao = 0, min = -Infinity, max = Infinity) {
  const n = Number(valor);
  if (Number.isNaN(n)) return padrao;
  return Math.min(max, Math.max(min, n));
}

function emailValido(email) {
  const e = texto(email, 254);
  if (!e) return true; // e-mail é opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/** Data em ISO (AAAA-MM-DD) ou vazio. */
function dataOuVazio(valor) {
  const s = texto(valor, 30);
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Garante que um campo de ordenação está numa lista permitida (evita SQL
 * injection em cláusulas ORDER BY, que não aceitam parâmetros vinculados).
 */
function colunaPermitida(valor, permitidas, padrao) {
  return permitidas.includes(valor) ? valor : padrao;
}

function direcaoOrdem(valor) {
  return String(valor).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
}

module.exports = {
  texto,
  inteiro,
  numero,
  emailValido,
  dataOuVazio,
  colunaPermitida,
  direcaoOrdem,
};
