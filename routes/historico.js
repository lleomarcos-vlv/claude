'use strict';

const express = require('express');
const router = express.Router();
const historico = require('../services/historyService');
const { ok } = require('../utils/response');
const v = require('../utils/validate');

// GET /api/historico?tipo=&page=
router.get('/', (req, res) => {
  const dados = historico.listar({
    tipo: v.texto(req.query.tipo, 40),
    page: v.inteiro(req.query.page, 1, 1),
    pageSize: v.inteiro(req.query.pageSize, 50, 1, 200),
  });
  return ok(res, { ...dados, tipos: historico.tipos() });
});

module.exports = router;
