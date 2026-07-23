'use strict';

/**
 * Helpers para padronizar as respostas JSON da API.
 * Formato: { ok: boolean, dados?: any, erro?: string, ...extra }
 */

function ok(res, dados = null, extra = {}) {
  return res.json({ ok: true, dados, ...extra });
}

function erro(res, status, mensagem, extra = {}) {
  return res.status(status).json({ ok: false, erro: mensagem, ...extra });
}

module.exports = { ok, erro };
