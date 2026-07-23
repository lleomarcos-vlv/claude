'use strict';

/**
 * Executado automaticamente após `npm install` (e manualmente via `npm run
 * setup`). Cria as pastas necessárias, inicializa o banco de dados, aplica o
 * schema e semeia nichos + usuário administrador padrão.
 *
 * Nunca derruba a instalação: em caso de erro, informa e sai com código 0
 * para que o `npm install` conclua; o instalador reexecuta este passo para
 * exibir mensagens claras.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PASTAS = [
  'database', 'database/backups', 'uploads', 'temp', 'logs', 'config',
];

function criarPastas() {
  for (const p of PASTAS) {
    const dir = path.join(ROOT, p);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('  • pasta criada:', p);
    }
  }
}

async function main() {
  console.log('==============================================');
  console.log(' Configurando a Estação de Trabalho...');
  console.log('==============================================');
  try {
    criarPastas();
    const db = require('../database/db');
    await db.inicializar();
    const { semear } = require('../database/seed');
    const r = await semear();
    console.log(`  • Banco de dados pronto.`);
    console.log(`  • Nichos disponíveis: ${r.totalNichos}`);
    console.log(`  • Usuário admin padrão: ${r.adminCriado ? 'criado (admin / admin123)' : 'já existente'}`);
    db.fechar();
    console.log('\n Configuração concluída com sucesso!\n');
  } catch (err) {
    console.error('\n [aviso] Não foi possível concluir a configuração automática:');
    console.error('   ' + err.message);
    console.error('\n Verifique se as dependências foram instaladas corretamente');
    console.error(' e rode novamente: npm run setup\n');
  }
  process.exit(0);
}

main();
