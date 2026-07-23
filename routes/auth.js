'use strict';

const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const { cookieSessao, cookieLimpar, exigirAutenticacao } = require('../middleware/auth');
const { ok, erro } = require('../utils/response');
const v = require('../utils/validate');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const login = v.texto(req.body.login, 60);
  const senha = String(req.body.senha || '');
  if (!login || !senha) return erro(res, 400, 'Informe login e senha.');

  const r = authService.autenticar(login, senha, req.headers['user-agent']);
  if (!r.ok) return erro(res, 401, r.erro);

  res.setHeader('Set-Cookie', cookieSessao(r.token));
  return ok(res, { usuario: r.usuario, expira_em: r.expira_em });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  if (req.sessaoToken) authService.encerrarSessao(req.sessaoToken);
  res.setHeader('Set-Cookie', cookieLimpar());
  return ok(res, { encerrada: true });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.usuario) return erro(res, 401, 'Não autenticado.');
  return ok(res, { usuario: req.usuario });
});

// POST /api/auth/change-password
router.post('/change-password', exigirAutenticacao, (req, res) => {
  const atual = String(req.body.senhaAtual || '');
  const nova = String(req.body.senhaNova || '');
  const r = authService.trocarSenha(req.usuario.id, atual, nova);
  if (!r.ok) return erro(res, 400, r.erro);
  return ok(res, { alterada: true });
});

module.exports = router;
