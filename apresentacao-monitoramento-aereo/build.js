const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox','--allow-file-access-from-files'] });
  const p = await b.newPage();
  await p.goto('file:///home/user/claude/apresentacao-monitoramento-aereo/apresentacao.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: 'Monitoramento-Aereo-Industrial.pdf', format: 'A4', printBackground: true,
                margin: { top:0,right:0,bottom:0,left:0 }, preferCSSPageSize: true });
  await b.close();
})();
