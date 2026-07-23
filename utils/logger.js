'use strict';

/**
 * Logger simples com saída no console e persistência em arquivo diário
 * (logs/AAAA-MM-DD.log). Sem dependências externas.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const LOG_DIR = config.paths.logs;

function garantirDir() {
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (_) {
    /* ignora — logging nunca deve derrubar a aplicação */
  }
}

function carimbo() {
  return new Date().toISOString();
}

function arquivoDoDia() {
  const dia = new Date().toISOString().slice(0, 10);
  return path.join(LOG_DIR, `${dia}.log`);
}

function escrever(nivel, args) {
  const mensagem = args
    .map((a) => (typeof a === 'string' ? a : safeStringify(a)))
    .join(' ');
  const linha = `[${carimbo()}] [${nivel}] ${mensagem}`;

  const saidaConsole =
    nivel === 'ERRO' ? console.error : nivel === 'AVISO' ? console.warn : console.log;
  saidaConsole(linha);

  try {
    garantirDir();
    fs.appendFileSync(arquivoDoDia(), linha + '\n');
  } catch (_) {
    /* ignora falhas de escrita em disco */
  }
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch (_) {
    return String(obj);
  }
}

module.exports = {
  info: (...a) => escrever('INFO', a),
  aviso: (...a) => escrever('AVISO', a),
  erro: (...a) => escrever('ERRO', a),
  debug: (...a) => {
    if (process.env.ET_DEBUG) escrever('DEBUG', a);
  },
};
