'use strict';

/**
 * Backup automático do banco SQLite. Usa a API online-backup do better-sqlite3
 * (consistente mesmo com o banco em uso). Mantém apenas os N backups mais
 * recentes conforme configuração.
 */

const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const config = require('../config/config');
const logger = require('../utils/logger');

function carimbo() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/** Cria um backup e retorna o caminho do arquivo gerado. */
async function criarBackup() {
  const cx = db.get();
  const destino = path.join(config.paths.backups, `estacao-${carimbo()}.db`);
  await cx.backup(destino);
  logger.info(`[backup] Backup criado: ${destino}`);
  limparAntigos();
  return destino;
}

/** Mantém apenas os `manterUltimos` backups mais recentes. */
function limparAntigos() {
  const dir = config.paths.backups;
  const manter = config.backup.manterUltimos || 10;
  try {
    const arquivos = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith('estacao-') && f.endsWith('.db'))
      .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.t - a.t);
    for (const item of arquivos.slice(manter)) {
      fs.unlinkSync(path.join(dir, item.f));
    }
  } catch (err) {
    logger.aviso('[backup] Falha ao limpar backups antigos:', err.message);
  }
}

let timer = null;
/** Agenda backups automáticos no intervalo configurado. */
function agendarAutomatico() {
  if (!config.backup.automatico) return;
  const intervaloMs = (config.backup.intervaloHoras || 24) * 3600000;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    criarBackup().catch((e) => logger.erro('[backup] automático falhou:', e.message));
  }, intervaloMs);
  if (timer.unref) timer.unref();
  logger.info(`[backup] Backup automático a cada ${config.backup.intervaloHoras}h.`);
}

module.exports = { criarBackup, limparAntigos, agendarAutomatico };
