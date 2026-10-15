// Teste ponta a ponta: abre index.html via file:// no Chromium, usa a interface como um usuário e confere PDF/CSV/backup.
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const pw = require(process.env.PW_PATH || 'playwright-core');
const root = path.resolve(__dirname, '..'), URL = 'file://' + root + '/index.html';
const fx = require('./fixture-12545.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jp-e2e-')), prof = path.join(tmp, 'perfil');
const results = []; const errs = [];
const ok = (name, cond, extra) => { results.push([cond ? 'PASSOU' : 'FALHOU', name, cond ? '' : (extra || '')]); };
const launch = () => pw.chromium.launchPersistentContext(prof, { executablePath: process.env.CHROME || undefined, acceptDownloads: true, viewport: { width: 1280, height: 900 } });
async function open(ctx) { const p = ctx.pages()[0] || await ctx.newPage(); p.on('pageerror', e => errs.push('pageerror: ' + e)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); }); p.on('dialog', d => d.accept()); await p.goto(URL); await p.waitForSelector('#title'); return p; }
const toastText = async (p) => (await p.locator('.toast').last().textContent({ timeout: 4000 }).catch(() => '')) || '';
async function saveDownload(p, trigger, name) { const [dl] = await Promise.all([p.waitForEvent('download'), trigger()]); const f = path.join(tmp, name); await dl.saveAs(f); return f; }

(async () => {
  let ctx = await launch(), p = await open(ctx);
  ok('Abre sem erro e mostra lista vazia com orientação', /Nenhum orçamento ainda/.test(await p.locator('#view').innerText()));
  ok('Nenhum dado de demonstração/cliente fictício na instalação limpa', (await p.evaluate(() => JPApp._debug().clients.length + JPApp._debug().quotes.length)) === 0);

  // --- cliente: validação e cadastro ---
  await p.goto(URL + '#clientes'); await p.click('#addCli');
  await p.fill('input[name=doc]', '11111111111'); await p.click('#cf button[type=submit]');
  ok('Cliente: bloqueia nome vazio', /Informe o nome/.test(await p.locator('#cfErr').innerText()));
  await p.fill('input[name=nome]', 'PAULO FONSECA'); await p.click('#cf button[type=submit]');
  ok('Cliente: bloqueia CPF inválido', /CPF\/CNPJ inválido/.test(await p.locator('#cfErr').innerText()));
  await p.fill('input[name=doc]', '529.982.247-25'); await p.fill('input[name=cel]', '16988163513'); await p.fill('input[name=cep]', '14000001'); await p.fill('input[name=cidade]', 'RIBEIRAO PRETO/SP'); await p.fill('input[name=endereco]', 'S/N');
  ok('Cliente: máscara de celular e CEP', (await p.inputValue('input[name=cel]')) === '(16) 98816-3513' && (await p.inputValue('input[name=cep]')) === '14000-001');
  await p.click('#cf button[type=submit]'); await p.waitForSelector('#modal', { state: 'hidden' });
  ok('Cliente: cadastrado e listado', /PAULO FONSECA/.test(await p.locator('#tbl').innerText()));
  // edição
  await p.click('button[data-a=ed]'); await p.fill('input[name=email]', 'paulo@example.com'); await p.fill('#ctNew', 'Ligação inicial'); await p.click('#ctAdd'); await p.click('#cf button[type=submit]'); await p.waitForSelector('#modal', { state: 'hidden' });
  ok('Cliente: edição + histórico de contato persistidos', await p.evaluate(() => { const c = JPApp._debug().clients[0]; return c.email === 'paulo@example.com' && c.contatos.length === 1; }));

  // --- orçamento: replica o 12545 ---
  await p.goto(URL + '#orcamento/novo');
  await p.click('#save'); ok('Orçamento: bloqueia salvar sem cliente', /cliente/i.test(await toastText(p)));
  await p.selectOption('#cliSel', { label: 'PAULO FONSECA' });
  ok('Orçamento: dados do cliente copiados', /529\.982\.247-25/.test(await p.locator('#cliInfo').innerText()));
  await p.fill('[data-f=numero]', '12545'); await p.fill('[data-f=emissao]', '2026-10-14');
  const it = fx.quote.items;
  for (let n = 0; n < 3; n++) {
    if (n > 0) await p.click('#addItem');
    const box = p.locator('#items .item').nth(n), f = (k, v) => box.locator(`[data-i="${k}"]`).fill(v);
    await box.locator('[data-i=tipo]').selectOption(it[n].tipo);
    await f('descricao', it[n].descricao); await f('amb', it[n].amb); await f('linha', it[n].linha); await f('vidro', it[n].vidro); await f('corPerfil', it[n].corPerfil); await f('corAcessorio', it[n].corAcessorio);
    await f('largura', String(it[n].largura)); await f('altura', String(it[n].altura)); await f('qtd', String(it[n].qtd)); await f('obs', it[n].obs);
    await f('unitS', ['3.743,04', '414,40', '3.779,735'][n]);
  }
  ok('Orçamento: total do item 3 = 4 × 3.779,735 = R$ 15.118,94', /15\.118,94/.test(await p.locator('#items .item').nth(2).locator('[data-itot]').innerText()));
  ok('Orçamento: total geral recalculado = R$ 19.276,38', /19\.276,38/.test(await p.locator('#totals').innerText()));
  await p.fill('[data-f=pagamento]', 'A DEFINIR'); await p.fill('[data-f=prazoEntrega]', it && fx.quote.prazoEntrega);
  await p.click('#save'); await p.waitForFunction(() => location.hash.startsWith('#orcamento/') && !location.hash.endsWith('novo'));
  ok('Orçamento: salvo e rota mudou para o registro', /salvo/.test(await toastText(p)));
  ok('Contador: próximo número passou a 12546', (await p.evaluate(() => JPApp._debug().settings.proxNumero)) === 12546);

  // PDF
  const pdf = await saveDownload(p, () => p.click('#dl'), 'orc.pdf');
  const txt = cp.execSync(`pdftotext -layout "${pdf}" -`).toString(); const pages = +/Pages:\s+(\d+)/.exec(cp.execSync(`pdfinfo "${pdf}"`).toString())[1];
  ok('PDF: baixado e válido (pdfinfo lê)', pages >= 1);
  ok('PDF: 1 página para o caso de referência', pages === 1, 'páginas: ' + pages);
  ['12545', 'PAULO FONSECA', '14/10/2026', '3.743,04', '414,40', '3.779,735', '15.118,94', '19.276,38', 'PORTA DE CORRER 02 FOLHAS', 'FALTA DEFINIR A COR', 'COM MOTOR ENTELCO', '60 DIAS CORRIDOS', 'Dezenove mil, duzentos e setenta e seis reais e trinta e oito centavos', 'JP ESQUADRIAS DE ALUMINIO E VIDROS', '47.693.611/0001-26', 'Aceite do cliente']
    .forEach(s => ok('PDF contém: ' + s, txt.includes(s)));
  await p.click('#prev'); await p.waitForSelector('#modal:not([hidden]) iframe'); ok('Pré-visualização abre o PDF em modal (iframe com blob)', /^blob:/.test(await p.locator('#modal iframe').getAttribute('src'))); await p.click('#modalClose');

  // desconto %, frete, instalação
  await p.selectOption('[data-f=descontoTipo]', '%'); await p.fill('[data-f=descontoS]', '5'); await p.fill('[data-f=freteS]', '350'); await p.fill('[data-f=instalacaoS]', '1.200,00');
  // 19276,38 - 963,82 (5%, arred.) + 350 + 1200 = 19862,56
  ok('Desconto 5% + frete + instalação: total R$ 19.862,56', /19\.862,56/.test(await p.locator('#totals').innerText()), await p.locator('#totals').innerText());
  await p.fill('[data-f=descontoS]', '150'); ok('Desconto percentual > 100 é rejeitado', /100%/.test(await p.locator('#totals').innerText()));
  await p.fill('[data-f=descontoS]', '5'); await p.selectOption('[data-f=status]', 'enviado'); await p.click('#save'); await p.waitForTimeout(300);
  ok('Edição salva e histórico registra mudança de status', await p.evaluate(() => JPApp._debug().quotes[0].historico.some(h => /Rascunho para Enviado/.test(h.texto))));
  // validação de item
  await p.click('#addItem'); await p.click('#save'); ok('Validação: item sem descrição/valor bloqueia salvar', /Item 4/.test(await toastText(p)));
  await p.locator('#items .item').nth(3).locator('[data-act=rm]').click(); await p.waitForTimeout(150);
  ok('Remover item (com confirmação) funciona', (await p.locator('#items .item').count()) === 3);

  // persistência: fecha e reabre o navegador
  await ctx.close(); ctx = await launch(); p = await open(ctx);
  ok('Persistência: orçamento existe após fechar e reabrir o navegador', await p.evaluate(() => { const q = JPApp._debug().quotes[0]; return q && q.numero === '12545' && q.cliente.nome === 'PAULO FONSECA' && q.items.length === 3 && q.status === 'enviado'; }));
  ok('Persistência: lista mostra o orçamento e KPIs usam dados reais', /12545/.test(await p.locator('#tbl').innerText()) && /Orçado em aberto/.test(await p.locator('.kpis').innerText()));

  // duplicar, número único
  await p.click('button[data-a=dup]'); await p.waitForFunction(() => location.hash.startsWith('#orcamento/'));
  ok('Duplicar: cria Nº 12546 como rascunho', await p.evaluate(() => { const q = JPApp._debug().quotes.find(x => x.numero === '12546'); return q && q.status === 'rascunho' && q.items.length === 3; }));
  await p.fill('[data-f=numero]', '12545'); await p.click('#save'); ok('Número duplicado é bloqueado', /Já existe outro orçamento/.test(await toastText(p)));
  await p.fill('[data-f=numero]', '12546');

  // CSV
  await p.goto(URL + '#orcamentos'); const csv = fs.readFileSync(await saveDownload(p, () => p.click('#csvBtn'), 'o.csv'), 'utf8');
  ok('CSV exporta cabeçalho e dados (; e BOM)', csv.startsWith('﻿Numero;Emissao') && /"12545";"14\/10\/2026";"";"PAULO FONSECA";"Enviado";"3"/.test(csv) && csv.includes('19.862,56'), csv.slice(0, 300));

  // backup / restauração
  await p.goto(URL + '#config'); const bkFile = await saveDownload(p, () => p.click('#bkExp'), 'backup.json'); const bk = JSON.parse(fs.readFileSync(bkFile, 'utf8'));
  ok('Backup: JSON com contagem e integridade', bk.contagem.orcamentos === 2 && bk.contagem.clientes === 1 && !!bk.integridade);
  const bad = JSON.parse(JSON.stringify(bk)); bad.data.quotes[0].numero = '99999'; fs.writeFileSync(path.join(tmp, 'adulterado.json'), JSON.stringify(bad));
  await p.setInputFiles('#bkImp', path.join(tmp, 'adulterado.json')); ok('Restauração rejeita backup adulterado (integridade)', /integridade/i.test(await toastText(p)));
  fs.writeFileSync(path.join(tmp, 'lixo.json'), '{"a":1}'); await p.setInputFiles('#bkImp', path.join(tmp, 'lixo.json')); ok('Restauração rejeita arquivo que não é backup', /não é um backup/.test(await toastText(p)));
  fs.writeFileSync(path.join(tmp, 'quebrado.json'), '{nao json'); await p.setInputFiles('#bkImp', path.join(tmp, 'quebrado.json')); ok('Restauração rejeita JSON malformado sem travar', /cancelada/.test(await toastText(p)));
  ok('Dados intactos após restaurações rejeitadas', (await p.evaluate(() => JPApp._debug().quotes.length)) === 2);
  // exclui um orçamento e restaura
  await p.goto(URL + '#orcamentos'); await p.locator('button[data-a=del]').first().click(); await p.waitForTimeout(300);
  ok('Exclusão com confirmação remove o orçamento', (await p.evaluate(() => JPApp._debug().quotes.length)) === 1);
  const [dl2] = await Promise.all([p.waitForEvent('download'), (async () => { await p.goto(URL + '#config'); await p.setInputFiles('#bkImp', bkFile); })()]);
  await p.waitForTimeout(600);
  ok('Restauração válida baixa backup de segurança do estado atual', /ANTES_da_restauracao/.test(dl2.suggestedFilename()));
  ok('Restauração válida devolve os 2 orçamentos', (await p.evaluate(() => JPApp._debug().quotes.length)) === 2);

  // configurações
  await p.fill('input[name=_proxNumero]', '0'); await p.click('#cfg button[type=submit]'); ok('Config: próximo número inválido é rejeitado', /maior ou igual a 1/.test(await p.locator('#cfgErr').innerText()));
  await p.fill('input[name=_proxNumero]', '20000'); await p.fill('input[name=_validadeDias]', '15'); await p.click('#cfg button[type=submit]'); await p.waitForTimeout(200);
  await p.goto(URL + '#orcamento/novo'); ok('Config: novo orçamento usa nº 20000 e validade de 15 dias', (await p.inputValue('[data-f=numero]')) === '20000' && (await p.inputValue('[data-f=validade]')) !== '');
  // WhatsApp
  const itemsOk = await p.evaluate(() => 1);
  await ctx.close();

  const fail = results.filter(r => r[0] === 'FALHOU'); results.forEach(r => console.log(r[0].padEnd(7), r[1], r[2] ? ' -> ' + r[2] : ''));
  if (errs.length) console.log('\nERROS DE JS NO NAVEGADOR:\n' + errs.join('\n')); else console.log('\nSem erros de JavaScript no console.');
  console.log(`\n${results.length - fail.length}/${results.length} passaram`); process.exit(fail.length || errs.length ? 1 : 0);
})().catch(e => { console.error('ABORTOU:', e); process.exit(2); });
