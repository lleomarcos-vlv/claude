'use strict';

const express = require('express');
const router = express.Router();

const db = require('../database/db');
const config = require('../config/config');
const backupService = require('../services/backupService');
const { exigirAutenticacao } = require('../middleware/auth');
const { ok, erro } = require('../utils/response');

// --- Rotas públicas (não exigem login) ------------------------------------
router.use('/auth', require('./auth'));

// Info básica do app (para tela de login).
router.get('/info', (req, res) => {
  return ok(res, {
    nome: config.app.nome,
    descricao: config.app.descricao,
    versao: require('../package.json').version,
    modoDemonstracao: config.pesquisa.modoDemonstracao,
    autenticado: !!req.usuario,
  });
});

// --- A partir daqui, tudo exige autenticação ------------------------------
router.use(exigirAutenticacao);

router.use('/clientes', require('./clientes'));
router.use('/prospeccao', require('./prospeccao'));
router.use('/pesquisa', require('./pesquisa'));
router.use('/nichos', require('./nichos'));
router.use('/historico', require('./historico'));

// GET /api/stats — indicadores do dashboard
router.get('/stats', (req, res) => {
  const cx = db.get();
  const num = (sql, ...p) => cx.prepare(sql).get(...p).n;
  const stats = {
    clientes: num('SELECT COUNT(*) AS n FROM clientes'),
    prospeccao: num('SELECT COUNT(*) AS n FROM prospeccao'),
    prospeccaoFechado: num("SELECT COUNT(*) AS n FROM prospeccao WHERE status='Fechado'"),
    prospeccaoNegociando: num("SELECT COUNT(*) AS n FROM prospeccao WHERE status IN ('Negociando','Proposta','Contatado')"),
    pesquisas: num('SELECT COUNT(*) AS n FROM pesquisas'),
    resultadosPendentes: num("SELECT COUNT(*) AS n FROM pesquisa_resultados WHERE status='novo'"),
    nichos: num('SELECT COUNT(*) AS n FROM nichos'),
  };
  // Distribuição por status (para gráfico simples)
  const porStatus = cx
    .prepare('SELECT status, COUNT(*) AS n FROM prospeccao GROUP BY status ORDER BY n DESC')
    .all();
  const ultimasPesquisas = cx
    .prepare('SELECT id, cidade, estado, nicho, total_novo, criado_em FROM pesquisas ORDER BY id DESC LIMIT 5')
    .all();
  return ok(res, { stats, porStatus, ultimasPesquisas });
});

// POST /api/backup — gera backup manual
router.post('/backup', async (req, res, next) => {
  try {
    const arquivo = await backupService.criarBackup();
    return ok(res, { arquivo });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
