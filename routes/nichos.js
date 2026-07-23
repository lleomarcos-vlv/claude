'use strict';

const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { ok } = require('../utils/response');
const v = require('../utils/validate');

// GET /api/nichos?search=&categoria=
router.get('/', (req, res) => {
  const cx = db.get();
  const search = v.texto(req.query.search, 80).toLowerCase();
  const categoria = v.texto(req.query.categoria, 80);
  const where = [];
  const params = [];
  if (search) {
    where.push('(lower(nome) LIKE ? OR lower(categoria) LIKE ? OR lower(termos) LIKE ?)');
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (categoria) {
    where.push('categoria = ?');
    params.push(categoria);
  }
  const clausula = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const itens = cx
    .prepare(`SELECT id, nome, categoria FROM nichos ${clausula} ORDER BY categoria, nome`)
    .all(...params);
  const categorias = cx
    .prepare('SELECT DISTINCT categoria FROM nichos ORDER BY categoria')
    .all()
    .map((r) => r.categoria);
  return ok(res, { itens, categorias, total: itens.length });
});

module.exports = router;
