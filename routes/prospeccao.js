'use strict';

const express = require('express');
const multer = require('multer');
const router = express.Router();

const prospeccaoService = require('../services/prospeccaoService');
const importService = require('../services/importService');
const exportService = require('../services/exportService');
const { ok, erro } = require('../utils/response');
const v = require('../utils/validate');
const config = require('../config/config');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

// GET /api/prospeccao
router.get('/', (req, res) => {
  const pageSize = v.inteiro(req.query.pageSize, config.paginacao.pageSizePadrao, 1, config.paginacao.pageSizeMax);
  const dados = prospeccaoService.listar({
    search: v.texto(req.query.search, 120),
    cidade: v.texto(req.query.cidade, 120),
    estado: v.texto(req.query.estado, 40),
    nicho: v.texto(req.query.nicho, 120),
    status: v.texto(req.query.status, 30),
    probMin: req.query.probMin,
    sort: req.query.sort,
    order: req.query.order,
    page: v.inteiro(req.query.page, 1, 1),
    pageSize,
  });
  return ok(res, { ...dados, statusValidos: prospeccaoService.STATUS_VALIDOS });
});

// GET /api/prospeccao/export
router.get('/export', async (req, res, next) => {
  try {
    const formato = v.texto(req.query.format, 10) || 'xlsx';
    const linhas = prospeccaoService.todos();
    const arq = await exportService.exportar(
      linhas,
      exportService.COLUNAS_PROSPECCAO,
      formato,
      'prospeccao',
      'Prospecção'
    );
    res.setHeader('Content-Type', arq.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${arq.filename}"`);
    return res.send(arq.buffer);
  } catch (err) {
    next(err);
  }
});

// GET /api/prospeccao/:id
router.get('/:id', (req, res) => {
  const c = prospeccaoService.obter(v.inteiro(req.params.id));
  if (!c) return erro(res, 404, 'Registro não encontrado.');
  return ok(res, c);
});

// POST /api/prospeccao
router.post('/', (req, res) => {
  const r = prospeccaoService.criar(req.body, req.usuario.id, { forcar: !!req.body.forcar });
  if (!r.ok) return erro(res, 409, r.erro, { duplicado: r.duplicado });
  return ok(res, { id: r.id });
});

// PUT /api/prospeccao/:id
router.put('/:id', (req, res) => {
  const r = prospeccaoService.atualizar(v.inteiro(req.params.id), req.body, req.usuario.id);
  if (!r.ok) return erro(res, 400, r.erro);
  return ok(res, { atualizado: true });
});

// DELETE /api/prospeccao/:id
router.delete('/:id', (req, res) => {
  const r = prospeccaoService.excluir(v.inteiro(req.params.id), req.usuario.id);
  if (!r.ok) return erro(res, 404, r.erro);
  return ok(res, { excluido: true });
});

// POST /api/prospeccao/:id/mover-clientes
router.post('/:id/mover-clientes', (req, res) => {
  const r = prospeccaoService.moverParaClientes(v.inteiro(req.params.id), req.usuario.id);
  if (!r.ok) return erro(res, 409, r.erro);
  return ok(res, { movido: true });
});

// POST /api/prospeccao/import
router.post('/import', upload.single('arquivo'), (req, res) => {
  if (!req.file) return erro(res, 400, 'Envie um arquivo CSV/XLS/XLSX.');
  const r = importService.importar(req.file.buffer, 'prospeccao', req.usuario.id);
  if (!r.ok) return erro(res, 400, r.erro, { cabecalhos: r.cabecalhos });
  return ok(res, r);
});

module.exports = router;
