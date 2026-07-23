'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();

const clienteService = require('../services/clienteService');
const importService = require('../services/importService');
const exportService = require('../services/exportService');
const { ok, erro } = require('../utils/response');
const v = require('../utils/validate');
const config = require('../config/config');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
});

// GET /api/clientes
router.get('/', (req, res) => {
  const pageSize = v.inteiro(req.query.pageSize, config.paginacao.pageSizePadrao, 1, config.paginacao.pageSizeMax);
  const dados = clienteService.listar({
    search: v.texto(req.query.search, 120),
    sort: req.query.sort,
    order: req.query.order,
    page: v.inteiro(req.query.page, 1, 1),
    pageSize,
  });
  return ok(res, dados);
});

// GET /api/clientes/export?format=csv|xlsx|pdf
router.get('/export', async (req, res, next) => {
  try {
    const formato = v.texto(req.query.format, 10) || 'xlsx';
    const linhas = clienteService.todos();
    const arq = await exportService.exportar(
      linhas,
      exportService.COLUNAS_CLIENTES,
      formato,
      'clientes',
      'Clientes Fixos'
    );
    res.setHeader('Content-Type', arq.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${arq.filename}"`);
    return res.send(arq.buffer);
  } catch (err) {
    next(err);
  }
});

// GET /api/clientes/:id
router.get('/:id', (req, res) => {
  const c = clienteService.obter(v.inteiro(req.params.id));
  if (!c) return erro(res, 404, 'Cliente não encontrado.');
  return ok(res, c);
});

// POST /api/clientes
router.post('/', (req, res) => {
  const r = clienteService.criar(req.body, req.usuario.id, { forcar: !!req.body.forcar });
  if (!r.ok) return erro(res, 409, r.erro, { duplicado: r.duplicado });
  return ok(res, { id: r.id });
});

// PUT /api/clientes/:id
router.put('/:id', (req, res) => {
  const r = clienteService.atualizar(v.inteiro(req.params.id), req.body, req.usuario.id);
  if (!r.ok) return erro(res, 400, r.erro);
  return ok(res, { atualizado: true });
});

// DELETE /api/clientes/:id
router.delete('/:id', (req, res) => {
  const r = clienteService.excluir(v.inteiro(req.params.id), req.usuario.id);
  if (!r.ok) return erro(res, 404, r.erro);
  return ok(res, { excluido: true });
});

// POST /api/clientes/import  (multipart: arquivo)
router.post('/import', upload.single('arquivo'), (req, res) => {
  if (!req.file) return erro(res, 400, 'Envie um arquivo CSV/XLS/XLSX.');
  const r = importService.importar(req.file.buffer, 'clientes', req.usuario.id);
  if (!r.ok) return erro(res, 400, r.erro, { cabecalhos: r.cabecalhos });
  return ok(res, r);
});

// POST /api/clientes/import/preview  (analisa colunas sem importar)
router.post('/import/preview', upload.single('arquivo'), (req, res) => {
  if (!req.file) return erro(res, 400, 'Envie um arquivo CSV/XLS/XLSX.');
  const info = importService.analisar(req.file.buffer);
  return ok(res, { cabecalhos: info.cabecalhos, mapa: info.mapa, totalLinhas: info.totalLinhas });
});

module.exports = router;
