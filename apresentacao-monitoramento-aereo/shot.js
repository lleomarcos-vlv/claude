const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:840,height:1188}, deviceScaleFactor:1 });
  await p.goto('file:///home/user/claude/apresentacao-monitoramento-aereo/apresentacao.html', { waitUntil:'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const pages = await p.$$('.page');
  for (let i=0;i<pages.length;i++) await pages[i].screenshot({ path:`pg-${i+1}.png` });
  await b.close();
})();
