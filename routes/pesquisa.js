'use strict';

const express = require('express');
const router = express.Router();

const pesquisaService = require('../services/pesquisaService');
const { ok, erro } = require('../utils/response');
const v = require('../utils/validate');
const config = require('../config/config');

// POST /api/pesquisa  — executa uma pesquisa automática
router.post('/', async (req, res, next) => {
  try {
    const cidade = v.texto(req.body.cidade, 120);
    const estado = v.texto(req.body.estado, 40);
    const nicho = v.texto(req.body.nicho, 120);
    const max = v.inteiro(req.body.max, config.pesquisa.maxPadrao, 1, config.pesquisa.maxAbsoluto);
    if (!cidade) return erro(res, 400, 'Informe a cidade.');
    if (!nicho) return erro(res, 400, 'Informe o nicho.');

    const r = await pesquisaService.executarPesquisa({ cidade, estado, nicho, max }, req.usuario.id);
    return ok(res, r);
  } catch (err) {
    next(err);
  }
});

// GET /api/pesquisa  — lista pesquisas (Revisão)
router.get('/', (req, res) => {
  const dados = pesquisaService.listarPesquisas({
    page: v.inteiro(req.query.page, 1, 1),
    pageSize: v.inteiro(req.query.pageSize, 50, 1, 200),
  });
  return ok(res, dados);
});

// GET /api/pesquisa/:id/resultados
router.get('/:id/resultados', (req, res) => {
  const itens = pesquisaService.listarResultados(v.inteiro(req.params.id), {
    status: v.texto(req.query.status, 20),
    search: v.texto(req.query.search, 120),
    sort: req.query.sort,
    order: req.query.order,
  });
  return ok(res, { itens });
});

// POST /api/pesquisa/mover  — move resultados p/ prospecção (lote)
router.post('/mover', (req, res) => {
  const ids = (req.body.ids || []).map((x) => v.inteiro(x)).filter(Boolean);
  if (!ids.length) return erro(res, 400, 'Selecione ao menos um resultado.');
  const r = pesquisaService.moverParaProspeccao(ids, req.usuario.id);
  return ok(res, r);
});

// POST /api/pesquisa/descartar
router.post('/descartar', (req, res) => {
  const ids = (req.body.ids || []).map((x) => v.inteiro(x)).filter(Boolean);
  if (!ids.length) return erro(res, 400, 'Selecione ao menos um resultado.');
  const n = pesquisaService.descartar(ids, req.usuario.id);
  return ok(res, { descartados: n });
});

// POST /api/pesquisa/excluir
router.post('/excluir', (req, res) => {
  const ids = (req.body.ids || []).map((x) => v.inteiro(x)).filter(Boolean);
  if (!ids.length) return erro(res, 400, 'Selecione ao menos um resultado.');
  const n = pesquisaService.excluirResultados(ids, req.usuario.id);
  return ok(res, { excluidos: n });
});

// PUT /api/pesquisa/resultado/:id
router.put('/resultado/:id', (req, res) => {
  const okAtt = pesquisaService.atualizarResultado(v.inteiro(req.params.id), req.body);
  if (!okAtt) return erro(res, 400, 'Nada para atualizar.');
  return ok(res, { atualizado: true });
});

module.exports = router;
