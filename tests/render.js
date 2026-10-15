// Gera PDFs de teste no Chromium headless usando exatamente os mesmos arquivos do sistema.
const path = require('path'), fs = require('fs');
const pw = require(process.env.PW_PATH || 'playwright-core');
const root = path.resolve(__dirname, '..');
(async () => {
  const out = process.argv[2]; const which = process.argv[3] || '12545';
  const fx = require('./fixture-12545.js');
  let q = fx.quote;
  if (which === 'long') { q = JSON.parse(JSON.stringify(fx.quote)); for (let i = 0; i < 9; i++) q.items.push(Object.assign({}, fx.quote.items[i % 3], { descricao: 'ITEM EXTRA ' + i + ' ' + fx.quote.items[i % 3].descricao, obs: i % 2 ? 'Observação longa do item para testar quebra de linha e altura variável do cartão neste ponto do documento, com texto suficiente para duas linhas.' : '' })); q.descontoTipo = '%'; q.descontoValor = 5; q.frete = 35000; q.instalacao = 120000; q.validade = '2026-10-29'; q.obs = 'Observações gerais do orçamento. '.repeat(12); }
  const b = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined });
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('file://' + root + '/tests/harness.html');
  const b64 = await p.evaluate(async ({ q, s }) => { const d = JPPdf.buildPdf(q, s); return d.output('datauristring').split(',')[1]; }, { q, s: fx.settings });
  fs.writeFileSync(out, Buffer.from(b64, 'base64')); await b.close();
  if (errs.length) { console.error('ERROS JS:', errs); process.exit(1); }
  console.log('ok', out, fs.statSync(out).size, 'bytes');
})();
