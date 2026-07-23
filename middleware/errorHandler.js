'use strict';

const logger = require('../utils/logger');
const historico = require('../services/historyService');
const { erro } = require('../utils/response');

/** Handler 404 para rotas de API desconhecidas. */
function naoEncontrado(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return erro(res, 404, 'Recurso não encontrado.');
  }
  next();
}

/** Handler central de erros. Registra e responde de forma padronizada. */
function tratarErro(err, req, res, next) {
  logger.erro('[erro]', err.stack || err.message);
  try {
    historico.registrar('erro', `Erro em ${req.method} ${req.path}`, { erro: err.message });
  } catch (_) {
    /* noop */
  }
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  return erro(res, status, err.expose ? err.message : 'Erro interno no servidor.');
}

module.exports = { naoEncontrado, tratarErro };
