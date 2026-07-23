'use strict';

/**
 * Middleware de sessão e autenticação.
 *
 * - carregarSessao: lê o cookie de sessão e anexa req.usuario quando válido.
 * - exigirAutenticacao: bloqueia rotas protegidas (401) quando não logado.
 */

const auth = require('../services/authService');
const config = require('../config/config');
const { erro } = require('../utils/response');

const COOKIE = config.session.cookieName;

/** Parser simples do cabeçalho Cookie (evita dependência externa). */
function lerCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const parte of header.split(';')) {
    const idx = parte.indexOf('=');
    if (idx === -1) continue;
    const nome = parte.slice(0, idx).trim();
    const valor = decodeURIComponent(parte.slice(idx + 1).trim());
    out[nome] = valor;
  }
  return out;
}

function carregarSessao(req, res, next) {
  const cookies = lerCookies(req);
  req.cookies = cookies;
  const token = cookies[COOKIE];
  req.usuario = token ? auth.usuarioDaSessao(token) : null;
  req.sessaoToken = token || null;
  next();
}

function exigirAutenticacao(req, res, next) {
  if (!req.usuario) {
    return erro(res, 401, 'Não autenticado. Faça login novamente.');
  }
  next();
}

/** Monta o cabeçalho Set-Cookie da sessão. */
function cookieSessao(token) {
  const maxAge = config.session.duracaoDias * 86400;
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function cookieLimpar() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

module.exports = { carregarSessao, exigirAutenticacao, cookieSessao, cookieLimpar, lerCookies };
