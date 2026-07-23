'use strict';

/**
 * Semeia o banco com:
 *  - a base completa de nichos (idempotente — não duplica);
 *  - o usuário administrador padrão (apenas se não houver usuários).
 *
 * Pode ser executado isoladamente: `npm run seed`.
 */

const db = require('./db');
const NICHOS = require('./seeds/nichos');
const logger = require('../utils/logger');

function semearNichos() {
  const cx = db.get();
  const insert = cx.prepare(
    `INSERT INTO nichos (nome, categoria, termos, osm)
     VALUES (@nome, @categoria, @termos, @osm)
     ON CONFLICT(nome) DO UPDATE SET
        categoria = excluded.categoria,
        termos    = excluded.termos,
        osm       = excluded.osm`
  );
  const tx = cx.transaction((lista) => {
    for (const n of lista) {
      insert.run({
        nome: n.nome,
        categoria: n.categoria || 'Geral',
        termos: JSON.stringify(n.termos || []),
        osm: JSON.stringify(n.osm || []),
      });
    }
  });
  tx(NICHOS);
  const total = cx.prepare('SELECT COUNT(*) AS n FROM nichos').get().n;
  logger.info(`[seed] Nichos disponíveis: ${total}`);
  return total;
}

function semear() {
  db.inicializar();
  const totalNichos = semearNichos();
  // Cria admin padrão se necessário (import tardio evita ciclo de require).
  const auth = require('../services/authService');
  const criou = auth.garantirAdminPadrao();
  return { totalNichos, adminCriado: criou };
}

// Execução direta
if (require.main === module) {
  const r = semear();
  logger.info(`[seed] Concluído. Nichos=${r.totalNichos} adminCriado=${r.adminCriado}`);
  db.fechar();
}

module.exports = { semear, semearNichos };
