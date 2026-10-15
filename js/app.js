/* Interface do sistema: orçamentos, clientes, configurações e backup. */
(function () {
  'use strict';
  const C = window.JP, DB = window.JPDB, PDF = window.JPPdf;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const nowISO = () => new Date().toISOString();
  const fmtTs = (iso) => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
  const STATUS = { rascunho: 'Rascunho', enviado: 'Enviado', aprovado: 'Aprovado', perdido: 'Perdido' };
  const TIPOS_CLIENTE = ['Pessoa física', 'Construtora', 'Arquiteto', 'Engenheiro', 'Vidraçaria', 'Instalador', 'Revendedor', 'Imobiliária', 'Outros'];

  let settings, clients = [], quotes = [], cur = null, dirty = false, route = {};

  const DEFAULTS = () => ({
    key: 'config', proxNumero: 1, validadeDias: 0, vendedor: 'FELIPE NASCIMENTO', contatoVendedor: '(16) 99101-9797', logo: null,
    empresa: { nome: 'JP ESQUADRIAS DE ALUMINIO E VIDROS', cnpj: '47.693.611/0001-26', ie: '797951711117', endereco: 'AV. EDUARDO ANDRÉA MATARAZZO, 703, CENT. PARK',
      cidade: 'RIBEIRAO PRETO | SP', cep: '14060-431', tel: '(16)99464-0640', whats: '(16)99464-0640', email: 'comercial.jpaluminios@gmail.com', instagram: '@jp.aluminios001' }
  });

  // ---------- utilidades de UI ----------
  function toast(msg, isErr) {
    const el = document.createElement('div'); el.className = 'toast' + (isErr ? ' err' : ''); el.textContent = msg; $('#toast').appendChild(el);
    setTimeout(() => el.remove(), isErr ? 6500 : 3200);
  }
  function modal(title, html) { $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html; $('#modal').hidden = false; }
  function closeModal() { const f = $('#modalBody iframe'); if (f && f.dataset.url) URL.revokeObjectURL(f.dataset.url); $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }
  $('#modalClose').onclick = closeModal;
  $('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  const money = (c) => 'R$ ' + C.formatBRL(c);
  const download = (name, blob) => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40);

  function resizeImage(file, maxSide, cb) {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) return toast('Formato de imagem não suportado (use PNG, JPG ou WebP).', true);
    if (file.size > 8 * 1024 * 1024) return toast('Imagem maior que 8 MB.', true);
    const fr = new FileReader();
    fr.onerror = () => toast('Não foi possível ler a imagem.', true);
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => toast('Arquivo de imagem inválido.', true);
      img.onload = () => {
        const r = Math.min(1, maxSide / Math.max(img.width, img.height)), cv = document.createElement('canvas');
        cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r);
        const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); g.drawImage(img, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL('image/jpeg', 0.88));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }

  // ---------- carga ----------
  async function loadAll() {
    const st = await DB.get('settings', 'config');
    settings = Object.assign(DEFAULTS(), st || {}); settings.empresa = Object.assign(DEFAULTS().empresa, (st && st.empresa) || {});
    if (!st) await DB.put('settings', settings);
    clients = (await DB.all('clients')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    quotes = (await DB.all('quotes')).sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    $('#brandLogo').src = settings.logo || window.JP_LOGO;
  }
  const pdfSettings = () => ({ empresa: settings.empresa, logo: settings.logo });

  // ---------- roteamento ----------
  const TITLES = { orcamentos: 'Orçamentos', orcamento: 'Orçamento', clientes: 'Clientes', config: 'Configurações e backup' };
  function go() {
    const h = (location.hash || '#orcamentos').slice(1).split('/');
    route = { v: h[0], id: h[1] };
    if (!TITLES[route.v]) route = { v: 'orcamentos' };
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('on', a.dataset.v === route.v));
    $('#title').textContent = TITLES[route.v]; $('#topActions').innerHTML = '';
    const vw = $('#view'); vw.oninput = vw.onchange = vw.onclick = null;
    ({ orcamentos: viewList, orcamento: viewEditor, clientes: viewClients, config: viewConfig })[route.v]();
  }
  window.addEventListener('hashchange', () => {
    if (dirty && !confirm('Há alterações não salvas neste orçamento. Sair mesmo assim?')) { history.back(); return; }
    dirty = false; go();
  });

  // ============ LISTA DE ORÇAMENTOS ============
  function viewList() {
    const sum = (arr) => arr.reduce((a, q) => a + C.calcTotals(q).total, 0);
    const by = (s) => quotes.filter(q => q.status === s);
    const emitidos = quotes.filter(q => ['enviado', 'aprovado', 'perdido'].includes(q.status));
    const taxa = emitidos.length ? Math.round(by('aprovado').length / emitidos.length * 100) + '%' : '—';
    $('#topActions').innerHTML = '<button class="btn sec" id="csvBtn">Exportar CSV</button> <a class="btn" href="#orcamento/novo">+ Novo orçamento</a>';
    $('#view').innerHTML = `
      <div class="kpis">
        <div class="kpi"><small>Orçado em aberto</small><b>${money(sum(by('rascunho').concat(by('enviado'))))}</b><span>${by('rascunho').length} rascunho(s) · ${by('enviado').length} enviado(s)</span></div>
        <div class="kpi"><small>Aprovado (valor orçado)</small><b>${money(sum(by('aprovado')))}</b><span>${by('aprovado').length} orçamento(s). Não é valor recebido.</span></div>
        <div class="kpi"><small>Taxa de aprovação</small><b>${taxa}</b><span>aprovados ÷ (enviados + aprovados + perdidos)</span></div>
        <div class="kpi"><small>Clientes cadastrados</small><b>${clients.length}</b><span>${quotes.length} orçamento(s) no total</span></div>
      </div>
      <div class="card">
        <div class="row" style="margin-bottom:10px"><input id="q" placeholder="Buscar por número, cliente ou item…" style="max-width:340px">
          <select id="st" style="max-width:180px"><option value="">Todos os status</option>${Object.entries(STATUS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div id="tbl"></div>
      </div>`;
    const draw = () => {
      const t = $('#q').value.trim().toLowerCase(), s = $('#st').value;
      const rows = quotes.filter(q => (!s || q.status === s) && (!t || (q.numero + ' ' + q.cliente.nome + ' ' + q.items.map(i => i.descricao + ' ' + i.amb).join(' ')).toLowerCase().includes(t)));
      if (!quotes.length) { $('#tbl').innerHTML = '<div class="empty"><p><b>Nenhum orçamento ainda.</b></p><p>Cadastre um cliente e crie o primeiro orçamento para ver os números aqui.</p><a class="btn" href="#orcamento/novo">Criar orçamento</a></div>'; return; }
      if (!rows.length) { $('#tbl').innerHTML = '<div class="empty">Nenhum orçamento corresponde ao filtro.</div>'; return; }
      $('#tbl').innerHTML = `<div style="overflow:auto"><table><thead><tr><th>Nº</th><th>Emissão</th><th>Cliente</th><th>Status</th><th class="num">Total</th><th></th></tr></thead><tbody>` +
        rows.map(q => `<tr><td><b>${esc(q.numero)}</b></td><td>${C.fmtDate(q.emissao)}</td><td>${esc(q.cliente.nome)}</td><td><span class="pill ${q.status}">${STATUS[q.status]}</span></td><td class="num">${money(C.calcTotals(q).total)}</td>
        <td class="row" style="justify-content:flex-end"><a class="btn sm sec" href="#orcamento/${q.id}">Abrir</a><button class="btn sm sec" data-a="pdf" data-id="${q.id}">PDF</button><button class="btn sm sec" data-a="dup" data-id="${q.id}">Duplicar</button><button class="btn sm danger" data-a="del" data-id="${q.id}">Excluir</button></td></tr>`).join('') + '</tbody></table></div>';
    };
    draw(); $('#q').oninput = draw; $('#st').onchange = draw;
    $('#tbl').onclick = async (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return; const q = quotes.find(x => x.id === b.dataset.id); if (!q) return;
      if (b.dataset.a === 'pdf') return savePdf(q);
      if (b.dataset.a === 'dup') return duplicateQuote(q);
      if (b.dataset.a === 'del') {
        if (!confirm(`Excluir o orçamento Nº ${q.numero} de ${q.cliente.nome}? Esta ação não pode ser desfeita (faça backup antes se tiver dúvida).`)) return;
        await DB.del('quotes', q.id); quotes = quotes.filter(x => x.id !== q.id); toast('Orçamento excluído.'); viewList();
      }
    };
    $('#csvBtn').onclick = () => {
      if (!quotes.length) return toast('Não há orçamentos para exportar.', true);
      const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const lines = [['Numero', 'Emissao', 'Validade', 'Cliente', 'Status', 'Itens', 'Subtotal', 'Desconto', 'Frete', 'Instalacao', 'Outros', 'Total'].join(';')];
      quotes.slice().reverse().forEach(q => { const t = C.calcTotals(q); lines.push([q.numero, C.fmtDate(q.emissao), C.fmtDate(q.validade), q.cliente.nome, STATUS[q.status], t.qtdItens, ...[t.subtotal, t.desconto, t.frete, t.instalacao, t.outros, t.total].map(C.formatBRL)].map(cell).join(';')); });
      download('orcamentos_' + C.todayISO() + '.csv', new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    };
  }

  async function nextNumberAndBump(q) { // reserva número livre
    let n = Math.max(1, parseInt(settings.proxNumero, 10) || 1);
    while (quotes.some(x => x.numero === String(n))) n++;
    return String(n);
  }
  async function duplicateQuote(q) {
    const n = await nextNumberAndBump();
    const copy = JSON.parse(JSON.stringify(q)); copy.id = DB.uid(); copy.numero = n; copy.status = 'rascunho'; copy.motivoPerda = '';
    copy.emissao = C.todayISO(); copy.validade = settings.validadeDias ? C.addDaysISO(copy.emissao, settings.validadeDias) : ''; copy.criadoEm = nowISO();
    copy.historico = [{ ts: nowISO(), texto: 'Criado por duplicação do orçamento Nº ' + q.numero }];
    settings.proxNumero = Math.max(settings.proxNumero, parseInt(n, 10) + 1);
    await DB.putMany([['quotes', copy], ['settings', settings]]); quotes.unshift(copy); toast('Orçamento duplicado como Nº ' + n + '.'); location.hash = '#orcamento/' + copy.id;
  }

  // ============ EDITOR DE ORÇAMENTO ============
  function blankItem() { return { amb: '', descricao: '', tipo: '', linha: '', corPerfil: '', corAcessorio: '', vidro: '', largura: '', altura: '', qtd: '1', unitS: '', obs: '', imagem: null }; }
  function toEdit(q) {
    const e = JSON.parse(JSON.stringify(q));
    e.items = e.items.map(i => Object.assign(i, { qtd: String(i.qtd).replace('.', ','), unitS: C.formatUnit(i.unit), largura: i.largura || '', altura: i.altura || '' }));
    e.descontoS = q.descontoTipo === '%' ? String(q.descontoValor || '').replace('.', ',') : (q.descontoValor ? C.formatBRL(q.descontoValor) : '');
    e.freteS = q.frete ? C.formatBRL(q.frete) : ''; e.instalacaoS = q.instalacao ? C.formatBRL(q.instalacao) : ''; e.outrosS = q.outros ? C.formatBRL(q.outros) : '';
    return e;
  }
  /** Converte o estado de edição em orçamento persistível; devolve erros de validação. */
  function normalize(e) {
    const errors = [], q = JSON.parse(JSON.stringify(e));
    if (!String(q.numero || '').trim()) errors.push(['numero', 'Informe o número do orçamento.']);
    if (!q.cliente || !q.cliente.nome) errors.push(['cliente', 'Selecione ou cadastre o cliente.']);
    if (!q.items.length) errors.push(['items', 'Adicione pelo menos um item.']);
    q.items = q.items.map((i, n) => {
      const qtd = C.parseNum(i.qtd), unit = C.parseUnit(i.unitS), L = i.largura === '' ? 0 : C.parseNum(i.largura), A = i.altura === '' ? 0 : C.parseNum(i.altura);
      if (!String(i.descricao).trim()) errors.push(['i' + n + 'descricao', `Item ${n + 1}: informe a descrição.`]);
      if (!(qtd > 0)) errors.push(['i' + n + 'qtd', `Item ${n + 1}: quantidade deve ser maior que zero.`]);
      if (Number.isNaN(unit) || unit < 0) errors.push(['i' + n + 'unitS', `Item ${n + 1}: preço unitário inválido.`]);
      if (Number.isNaN(L) || L < 0 || Number.isNaN(A) || A < 0) errors.push(['i' + n + 'largura', `Item ${n + 1}: largura/altura inválidas.`]);
      const o = Object.assign({}, i, { qtd, unit: Number.isNaN(unit) ? 0 : unit, largura: i.largura, altura: i.altura }); delete o.unitS; return o;
    });
    const money0 = (s, key, label) => { const v = C.parseBRL(s); if (Number.isNaN(v) || v < 0) { errors.push([key, label + ' inválido.']); return 0; } return v; };
    q.frete = money0(e.freteS, 'freteS', 'Frete'); q.instalacao = money0(e.instalacaoS, 'instalacaoS', 'Instalação'); q.outros = money0(e.outrosS, 'outrosS', 'Outros serviços');
    if (q.descontoTipo === '%') { const v = C.parseNum(e.descontoS); if (Number.isNaN(v) || v < 0) errors.push(['descontoS', 'Desconto inválido.']); q.descontoValor = Number.isNaN(v) ? 0 : v; }
    else q.descontoValor = money0(e.descontoS, 'descontoS', 'Desconto');
    ['descontoS', 'freteS', 'instalacaoS', 'outrosS'].forEach(k => delete q[k]);
    C.calcTotals(q).errors.forEach(m => errors.push(['descontoS', m]));
    if (q.status === 'perdido' && !String(q.motivoPerda || '').trim()) errors.push(['motivoPerda', 'Informe o motivo da perda.']);
    return { q, errors };
  }

  function viewEditor() {
    const isNew = !route.id || route.id === 'novo';
    if (isNew) {
      const em = C.todayISO(); let n = Math.max(1, parseInt(settings.proxNumero, 10) || 1); while (quotes.some(x => x.numero === String(n))) n++;
      cur = { id: DB.uid(), numero: String(n), emissao: em, validade: settings.validadeDias ? C.addDaysISO(em, settings.validadeDias) : '', vendedor: settings.vendedor, contatoVendedor: settings.contatoVendedor,
        clienteId: '', cliente: null, items: [blankItem()], descontoTipo: 'R$', descontoS: '', freteS: '', instalacaoS: '', outrosS: '', outrosRotulo: '', pagamento: '', prazoEntrega: '', obs: '',
        status: 'rascunho', motivoPerda: '', criadoEm: nowISO(), historico: [{ ts: nowISO(), texto: 'Orçamento criado' }], _new: true };
    } else {
      const q = quotes.find(x => x.id === route.id); if (!q) { $('#view').innerHTML = '<div class="card empty">Orçamento não encontrado. <a href="#orcamentos">Voltar</a></div>'; return; }
      cur = toEdit(q);
    }
    dirty = false; $('#title').textContent = isNew ? 'Novo orçamento' : 'Orçamento Nº ' + cur.numero;
    renderEditor();
  }

  function renderEditor() {
    const q = cur;
    $('#view').innerHTML = `
      <div class="card"><h2>Dados gerais</h2><div class="grid g4">
        <div><label>Número</label><input data-f="numero" value="${esc(q.numero)}"></div>
        <div><label>Emissão</label><input type="date" data-f="emissao" value="${esc(q.emissao)}"></div>
        <div><label>Validade da proposta (opcional)</label><input type="date" data-f="validade" value="${esc(q.validade)}"></div>
        <div><label>Status</label><select data-f="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${q.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label>Vendedor</label><input data-f="vendedor" value="${esc(q.vendedor)}"></div>
        <div><label>Contato do vendedor</label><input data-f="contatoVendedor" data-mask="phone" value="${esc(q.contatoVendedor)}"></div>
        <div id="perdaBox" style="grid-column:span 2;${q.status === 'perdido' ? '' : 'display:none'}"><label>Motivo da perda</label><input data-f="motivoPerda" value="${esc(q.motivoPerda)}"></div>
      </div></div>
      <div class="card"><h2>Cliente</h2><div class="row">
        <select id="cliSel" data-err="cliente" style="max-width:420px"><option value="">Selecione o cliente…</option>${clients.map(c => `<option value="${c.id}" ${q.clienteId === c.id ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}</select>
        <button class="btn sec" id="newCli">+ Novo cliente</button><button class="btn ghost" id="syncCli" ${q.clienteId ? '' : 'hidden'}>Atualizar dados do cadastro</button></div>
        <div class="note" id="cliInfo" style="margin-top:8px">${cliInfo(q.cliente)}</div></div>
      <div class="card"><h2>Itens</h2><div id="items"></div><button class="btn sec" id="addItem">+ Adicionar item</button>
        <div class="note" style="margin-top:8px">Preços não são preenchidos automaticamente: informe o valor unitário de cada item. O total do item é quantidade × valor unitário (aceita até 4 casas decimais, como no sistema anterior).</div></div>
      <div class="card"><h2>Valores e condições</h2><div class="grid g4">
        <div><label>Desconto</label><div class="row" style="flex-wrap:nowrap"><select data-f="descontoTipo" style="max-width:76px"><option value="R$" ${q.descontoTipo === 'R$' ? 'selected' : ''}>R$</option><option value="%" ${q.descontoTipo === '%' ? 'selected' : ''}>%</option></select><input data-f="descontoS" data-money="1" inputmode="decimal" value="${esc(q.descontoS)}" placeholder="0,00"></div></div>
        <div><label>Frete (R$)</label><input data-f="freteS" data-money="1" inputmode="decimal" value="${esc(q.freteS)}" placeholder="0,00"></div>
        <div><label>Instalação (R$)</label><input data-f="instalacaoS" data-money="1" inputmode="decimal" value="${esc(q.instalacaoS)}" placeholder="0,00"></div>
        <div><label>Outros serviços (R$)</label><input data-f="outrosS" data-money="1" inputmode="decimal" value="${esc(q.outrosS)}" placeholder="0,00"></div>
        <div><label>Descrição de “outros serviços”</label><input data-f="outrosRotulo" value="${esc(q.outrosRotulo)}" placeholder="Ex.: Retirada de esquadria"></div>
        <div style="grid-column:span 3"><label>Condição de pagamento</label><input data-f="pagamento" value="${esc(q.pagamento)}" placeholder="Ex.: 50% na aprovação e 50% na entrega"></div>
        <div style="grid-column:span 4"><label>Prazo de entrega</label><input data-f="prazoEntrega" value="${esc(q.prazoEntrega)}" placeholder="Ex.: 60 dias corridos após a medição definitiva"></div>
        <div style="grid-column:span 4"><label>Observações comerciais</label><textarea data-f="obs">${esc(q.obs)}</textarea></div></div></div>
      <div class="card"><div class="totals" id="totals"></div></div>
      <div class="card row"><button class="btn" id="save">Salvar orçamento</button><button class="btn sec" id="prev">Pré-visualizar PDF</button><button class="btn sec" id="dl">Baixar PDF</button>
        <button class="btn sec" id="print">Abrir PDF para imprimir</button><button class="btn sec" id="wa">WhatsApp</button><span class="sp"></span><a class="btn ghost" href="#orcamentos">Voltar à lista</a></div>
      <div class="card"><h2>Histórico</h2><div class="note">${(q.historico || []).slice().reverse().map(h => `${fmtTs(h.ts)} · ${esc(h.texto)}`).join('<br>')}</div></div>`;
    drawItems(); drawTotals(); bindEditor();
  }
  const cliInfo = (c) => c ? [c.doc, c.cel || c.tel, c.email, [c.endereco, c.cidade].filter(Boolean).join(' - ')].filter(Boolean).map(esc).join(' · ') || 'Sem dados adicionais.' : 'Nenhum cliente selecionado.';

  function drawItems() {
    const q = cur;
    $('#items').innerHTML = q.items.map((it, n) => `<div class="item" data-n="${n}"><div class="item-head"><b>Item ${n + 1}</b><span class="sp"></span>
      <button class="btn sm ghost" data-act="up" ${n === 0 ? 'disabled' : ''}>↑</button><button class="btn sm ghost" data-act="down" ${n === q.items.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="btn sm sec" data-act="clone">Duplicar</button><button class="btn sm danger" data-act="rm">Remover</button></div>
      <div class="grid" style="grid-template-columns:96px 1fr"><div><div class="thumb">${it.imagem ? `<img src="${it.imagem}" alt="">` : 'Ícone automático'}</div>
        <label class="btn sm sec" style="display:block;text-align:center;margin-top:6px;cursor:pointer">Foto<input type="file" accept="image/*" data-img style="display:none"></label>${it.imagem ? '<button class="btn sm ghost" data-act="noimg" style="width:100%;margin-top:4px">Tirar foto</button>' : ''}</div>
      <div class="grid g3">
        <div style="grid-column:span 2"><label>Descrição</label><input data-i="descricao" list="descs" value="${esc(it.descricao)}"></div>
        <div><label>Tipo (desenho do PDF)</label><select data-i="tipo">${PDF.TIPOS.map(([k, v]) => `<option value="${k}" ${it.tipo === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div><label>Local / ambiente</label><input data-i="amb" value="${esc(it.amb)}"></div>
        <div><label>Linha</label><input data-i="linha" value="${esc(it.linha)}"></div>
        <div><label>Vidro (cor e espessura)</label><input data-i="vidro" value="${esc(it.vidro)}"></div>
        <div><label>Cor do perfil</label><input data-i="corPerfil" value="${esc(it.corPerfil)}"></div>
        <div><label>Cor do acessório</label><input data-i="corAcessorio" value="${esc(it.corAcessorio)}"></div>
        <div></div>
        <div><label>Largura (mm)</label><input data-i="largura" inputmode="decimal" value="${esc(it.largura)}"></div>
        <div><label>Altura (mm)</label><input data-i="altura" inputmode="decimal" value="${esc(it.altura)}"></div>
        <div><label>Quantidade</label><input data-i="qtd" inputmode="decimal" value="${esc(it.qtd)}"></div>
        <div><label>Valor unitário (R$)</label><input data-i="unitS" data-money="1" inputmode="decimal" value="${esc(it.unitS)}" placeholder="0,00"></div>
        <div><label>Total do item</label><div style="padding:9px 0;font-weight:700" data-itot>R$ 0,00</div></div><div></div>
        <div style="grid-column:span 3"><label>Observações deste item</label><input data-i="obs" value="${esc(it.obs)}"></div></div></div></div>`).join('') +
      '<datalist id="descs">' + ['PORTA DE CORRER 02 FOLHAS', 'JANELA DE CORRER 02 FOLHAS', 'JANELA DE CORRER INTEGRADA 02 FOLHAS', 'MAXIM-AR', 'PORTA DE GIRO', 'VENEZIANA', 'VIDRO FIXO'].map(v => `<option value="${v}">`).join('') + '</datalist>';
    updateItemTotals();
  }
  function updateItemTotals() {
    document.querySelectorAll('#items .item').forEach(el => { const it = cur.items[+el.dataset.n]; const u = C.parseUnit(it.unitS), qn = C.parseNum(it.qtd); el.querySelector('[data-itot]').textContent = (Number.isNaN(u) || Number.isNaN(qn)) ? '—' : money(C.itemTotal({ qtd: qn, unit: u })); });
  }
  function drawTotals() {
    const { q, errors } = normalize(cur); const t = C.calcTotals(q);
    const l = [['Subtotal (' + t.qtdItens + (t.qtdItens === 1 ? ' item' : ' itens') + ')', money(t.subtotal)]];
    if (t.desconto) l.push(['Desconto', '- ' + money(t.desconto)]); if (t.frete) l.push(['Frete', money(t.frete)]); if (t.instalacao) l.push(['Instalação', money(t.instalacao)]); if (t.outros) l.push([q.outrosRotulo || 'Outros serviços', money(t.outros)]);
    $('#totals').innerHTML = l.map(r => `<div><span>${esc(r[0])}</span><span>${r[1]}</span></div>`).join('') + `<div class="big"><span>Total geral</span><span>${money(t.total)}</span></div>` +
      (t.errors.length ? `<div class="err">${esc(t.errors[0])}</div>` : '');
  }

  function bindEditor() {
    const root = $('#view');
    const markDirty = () => { dirty = true; };
    root.oninput = (e) => {
      const el = e.target; markDirty();
      if (el.dataset.mask === 'phone') el.value = C.maskPhone(el.value);
      if (el.dataset.f) { cur[el.dataset.f] = el.value; if (el.dataset.f === 'status') $('#perdaBox').style.display = el.value === 'perdido' ? '' : 'none'; }
      if (el.dataset.i) { const n = +el.closest('.item').dataset.n; cur.items[n][el.dataset.i] = el.value; if (el.dataset.i === 'tipo' && !cur.items[n].descricao) { cur.items[n].descricao = (PDF.TIPOS.find(t => t[0] === el.value) || [])[1] ? PDF.TIPOS.find(t => t[0] === el.value)[1].toUpperCase() : ''; if (el.value) drawItems(); } }
      if (el.dataset.money) el.classList.toggle('bad', el.value.trim() !== '' && Number.isNaN(C.parseUnit(el.value)));
      updateItemTotals(); drawTotals();
    };
    root.onchange = (e) => {
      const el = e.target;
      if (el.id === 'cliSel') { markDirty(); setClient(el.value); }
      if (el.dataset.f === 'descontoTipo') { cur.descontoS = ''; renderEditorKeep(); }
      if (el.dataset.img !== undefined && el.files[0]) { const n = +el.closest('.item').dataset.n; resizeImage(el.files[0], 640, (d) => { cur.items[n].imagem = d; markDirty(); drawItems(); }); }
    };
    root.onclick = (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return; const n = +b.closest('.item').dataset.n; markDirty();
      if (b.dataset.act === 'rm') { if (cur.items.length === 1) { cur.items[0] = blankItem(); } else if (confirm('Remover o item ' + (n + 1) + '?')) cur.items.splice(n, 1); }
      if (b.dataset.act === 'clone') cur.items.splice(n + 1, 0, JSON.parse(JSON.stringify(cur.items[n])));
      if (b.dataset.act === 'up' && n > 0) [cur.items[n - 1], cur.items[n]] = [cur.items[n], cur.items[n - 1]];
      if (b.dataset.act === 'down' && n < cur.items.length - 1) [cur.items[n + 1], cur.items[n]] = [cur.items[n], cur.items[n + 1]];
      if (b.dataset.act === 'noimg') cur.items[n].imagem = null;
      drawItems(); drawTotals();
    };
    $('#addItem').onclick = () => { cur.items.push(blankItem()); dirty = true; drawItems(); drawTotals(); const last = document.querySelector('#items .item:last-child input'); if (last) last.focus(); };
    $('#newCli').onclick = () => clientForm(null, (c) => { setClient(c.id); $('#cliSel').innerHTML = '<option value="">Selecione o cliente…</option>' + clients.map(x => `<option value="${x.id}" ${x.id === c.id ? 'selected' : ''}>${esc(x.nome)}</option>`).join(''); });
    $('#syncCli').onclick = () => { setClient(cur.clienteId); toast('Dados do cliente atualizados a partir do cadastro.'); };
    $('#save').onclick = saveQuote; $('#prev').onclick = () => withValid(previewPdf); $('#dl').onclick = () => withValid(q => savePdf(q)); $('#print').onclick = () => withValid(openPdfTab); $('#wa').onclick = () => withValid(whatsapp);
  }
  function renderEditorKeep() { const s = window.scrollY; renderEditor(); window.scrollTo(0, s); }
  function setClient(id) {
    const c = clients.find(x => x.id === id); cur.clienteId = c ? c.id : ''; cur.cliente = c ? { nome: c.nome, doc: c.doc, ie: c.ie, tel: c.tel, cel: c.cel, email: c.email, endereco: c.endereco, cep: c.cep, cidade: c.cidade } : null;
    $('#cliInfo').innerHTML = cliInfo(cur.cliente); $('#syncCli').hidden = !c; $('#cliSel').classList.remove('bad');
  }
  function flagErrors(errors) {
    document.querySelectorAll('.bad').forEach(x => x.classList.remove('bad'));
    errors.forEach(([k]) => { let el = null; const m = /^i(\d+)(.+)$/.exec(k); if (m) { const it = document.querySelectorAll('#items .item')[+m[1]]; el = it && it.querySelector(`[data-i="${m[2]}"]`); } else if (k === 'cliente') el = $('#cliSel'); else el = document.querySelector(`[data-f="${k}"]`); if (el) el.classList.add('bad'); });
    const first = document.querySelector('.bad'); if (first) first.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
  function withValid(fn) { const { q, errors } = normalize(cur); if (errors.length) { flagErrors(errors); return toast(errors[0][1], true); } if (quotes.some(x => x.numero === q.numero && x.id !== q.id)) { return toast('Já existe outro orçamento com o número ' + q.numero + '.', true); } fn(q); }

  async function saveQuote() {
    const { q, errors } = normalize(cur); if (errors.length) { flagErrors(errors); return toast(errors[0][1], true); }
    if (quotes.some(x => x.numero === q.numero && x.id !== q.id)) { flagErrors([['numero']]); return toast('Já existe outro orçamento com o número ' + q.numero + '.', true); }
    const prev = quotes.find(x => x.id === q.id); const isNew = !prev; delete q._new;
    q.historico = (q.historico || []).slice();
    if (prev && prev.status !== q.status) q.historico.push({ ts: nowISO(), texto: `Status alterado de ${STATUS[prev.status]} para ${STATUS[q.status]}` + (q.status === 'perdido' ? ' (' + q.motivoPerda + ')' : '') });
    else if (prev) q.historico.push({ ts: nowISO(), texto: 'Orçamento editado' });
    q.atualizadoEm = nowISO();
    const ops = [['quotes', q]], n = parseInt(q.numero, 10);
    if (isNew && n >= (parseInt(settings.proxNumero, 10) || 1)) { settings.proxNumero = n + 1; ops.push(['settings', settings]); }
    try { await DB.putMany(ops); } catch (err) { return toast('Falha ao salvar no banco local: ' + err.message, true); }
    quotes = quotes.filter(x => x.id !== q.id); quotes.unshift(q); quotes.sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));
    dirty = false; toast('Orçamento Nº ' + q.numero + ' salvo.');
    if (isNew) location.hash = '#orcamento/' + q.id; else { cur = toEdit(q); renderEditor(); }
  }

  // ---------- PDF ----------
  const fileName = (q) => `Orcamento_${q.numero}_${slug(q.cliente.nome)}.pdf`;
  function makePdf(q) {
    const t = C.calcTotals(q); const zero = q.items.some(i => !i.unit);
    if (zero && !confirm('Há item com valor unitário zerado. Gerar o PDF mesmo assim?')) return null;
    if (t.total <= 0 && !confirm('O total geral é R$ 0,00. Gerar o PDF mesmo assim?')) return null;
    return PDF.buildPdf(q, pdfSettings());
  }
  function savePdf(q) { const d = makePdf(q); if (d) { d.save(fileName(q)); toast('PDF gerado: ' + fileName(q)); } }
  function previewPdf(q) {
    const d = makePdf(q); if (!d) return; const url = URL.createObjectURL(d.output('blob'));
    modal('Pré-visualização · Orçamento Nº ' + q.numero, `<iframe data-url="${url}" src="${url}" title="PDF"></iframe><p class="note">Se a pré-visualização não aparecer neste navegador, use “Baixar PDF”.</p>`);
  }
  function openPdfTab(q) { const d = makePdf(q); if (!d) return; const w = window.open(d.output('bloburl'), '_blank'); if (!w) toast('O navegador bloqueou a nova aba. Permita pop-ups ou use “Baixar PDF”.', true); else toast('PDF aberto em nova aba: use Ctrl+P para imprimir.'); }
  function whatsapp(q) {
    let ph = String((q.cliente.cel || q.cliente.tel || '')).replace(/\D/g, ''); if (ph && !ph.startsWith('55')) ph = '55' + ph;
    if (ph.length < 12) return toast('O cliente não tem celular/WhatsApp válido cadastrado.', true);
    const msg = `Olá, ${q.cliente.nome}! Segue o orçamento Nº ${q.numero} da ${settings.empresa.nome}, no valor de ${money(C.calcTotals(q).total)}. Qualquer dúvida, estou à disposição.`;
    window.open('https://wa.me/' + ph + '?text=' + encodeURIComponent(msg), '_blank');
    toast('WhatsApp aberto com a mensagem pronta. O sistema NÃO envia nada sozinho: baixe o PDF e anexe à conversa.');
  }

  // ============ CLIENTES ============
  function viewClients() {
    $('#topActions').innerHTML = '<button class="btn" id="addCli">+ Novo cliente</button>';
    $('#view').innerHTML = '<div class="card"><input id="q" placeholder="Buscar por nome, documento, telefone, cidade…" style="max-width:380px;margin-bottom:10px"><div id="tbl"></div></div>';
    const draw = () => {
      const t = $('#q').value.trim().toLowerCase(), digits = t.replace(/\D/g, '');
      const rows = clients.filter(c => !t || [c.nome, c.cidade, c.email, c.tipo].join(' ').toLowerCase().includes(t) || (digits && [c.doc, c.tel, c.cel].join(' ').replace(/\D/g, '').includes(digits)));
      if (!clients.length) { $('#tbl').innerHTML = '<div class="empty"><b>Nenhum cliente cadastrado.</b><p>Clique em “Novo cliente” para começar.</p></div>'; return; }
      if (!rows.length) { $('#tbl').innerHTML = '<div class="empty">Nenhum cliente encontrado.</div>'; return; }
      $('#tbl').innerHTML = '<div style="overflow:auto"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Contato</th><th>Cidade</th><th class="num">Orçamentos</th><th></th></tr></thead><tbody>' + rows.map(c => { const n = quotes.filter(q => q.clienteId === c.id).length;
        return `<tr><td><b>${esc(c.nome)}</b></td><td>${esc(c.tipo)}</td><td>${esc(c.cel || c.tel)}</td><td>${esc(c.cidade)}</td><td class="num">${n}</td><td class="row" style="justify-content:flex-end"><button class="btn sm sec" data-a="ed" data-id="${c.id}">Editar</button><button class="btn sm danger" data-a="del" data-id="${c.id}">Excluir</button></td></tr>`; }).join('') + '</tbody></table></div>';
    };
    draw(); $('#q').oninput = draw; $('#addCli').onclick = () => clientForm(null, () => viewClients());
    $('#tbl').onclick = async (e) => {
      const b = e.target.closest('button[data-a]'); if (!b) return; const c = clients.find(x => x.id === b.dataset.id);
      if (b.dataset.a === 'ed') clientForm(c, () => viewClients());
      if (b.dataset.a === 'del') {
        const n = quotes.filter(q => q.clienteId === c.id).length;
        if (!confirm(`Excluir o cliente ${c.nome}?` + (n ? `\n\nEle tem ${n} orçamento(s). Os orçamentos serão mantidos com os dados copiados no momento em que foram feitos.` : ''))) return;
        await DB.del('clients', c.id); clients = clients.filter(x => x.id !== c.id); toast('Cliente excluído.'); viewClients();
      }
    };
  }
  function clientForm(c, after) {
    const x = c || { id: DB.uid(), tipo: 'Pessoa física', criadoEm: nowISO(), contatos: [] };
    modal(c ? 'Editar cliente' : 'Novo cliente', `<form id="cf" novalidate><div class="grid g3">
      <div style="grid-column:span 2"><label>Nome ou razão social *</label><input name="nome" value="${esc(x.nome)}" required></div>
      <div><label>Tipo</label><select name="tipo">${TIPOS_CLIENTE.map(t => `<option ${x.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div><label>CPF / CNPJ</label><input name="doc" data-mask="doc" value="${esc(x.doc)}"></div><div><label>IE / RG</label><input name="ie" value="${esc(x.ie)}"></div><div><label>Origem do contato</label><input name="origem" value="${esc(x.origem)}" placeholder="Indicação, Instagram…"></div>
      <div><label>Celular / WhatsApp</label><input name="cel" data-mask="phone" value="${esc(x.cel)}"></div><div><label>Telefone fixo</label><input name="tel" data-mask="phone" value="${esc(x.tel)}"></div><div><label>E-mail</label><input name="email" value="${esc(x.email)}"></div>
      <div style="grid-column:span 2"><label>Endereço</label><input name="endereco" value="${esc(x.endereco)}"></div><div><label>CEP</label><input name="cep" data-mask="cep" value="${esc(x.cep)}"></div>
      <div><label>Cidade</label><input name="cidade" value="${esc(x.cidade)}"></div><div><label>Próxima ação</label><input name="proxAcao" value="${esc(x.proxAcao)}"></div><div><label>Data da próxima ação</label><input type="date" name="proxAcaoData" value="${esc(x.proxAcaoData)}"></div>
      <div style="grid-column:span 3"><label>Observações</label><textarea name="obs">${esc(x.obs)}</textarea></div></div>
      ${c ? `<div class="card" style="margin-top:12px"><h2>Histórico de contatos</h2><div class="row"><input id="ctNew" placeholder="Registrar contato (ligação, visita, retorno…)" style="flex:1"><button type="button" class="btn sec" id="ctAdd">Registrar</button></div><div class="note" id="ctList" style="margin-top:8px"></div>
        <h2 style="margin-top:14px">Orçamentos deste cliente</h2><div class="note">${quotes.filter(q => q.clienteId === c.id).map(q => `<a href="#orcamento/${q.id}" style="color:var(--or2)">Nº ${esc(q.numero)}</a> · ${C.fmtDate(q.emissao)} · ${STATUS[q.status]} · ${money(C.calcTotals(q).total)}`).join('<br>') || 'Nenhum orçamento.'}</div></div>` : ''}
      <div class="row" style="margin-top:12px"><button class="btn" type="submit">Salvar cliente</button><button type="button" class="btn ghost" id="cfCancel">Cancelar</button><span class="err" id="cfErr"></span></div></form>`);
    const f = $('#cf'); const drawCt = () => { const l = $('#ctList'); if (l) l.innerHTML = (x.contatos || []).slice().reverse().map(h => `${fmtTs(h.ts)} · ${esc(h.texto)}`).join('<br>') || 'Nenhum contato registrado.'; }; drawCt();
    f.addEventListener('input', e => { const m = e.target.dataset.mask; if (m === 'phone') e.target.value = C.maskPhone(e.target.value); if (m === 'cep') e.target.value = C.maskCEP(e.target.value); if (m === 'doc') e.target.value = C.maskDoc(e.target.value); e.target.classList.remove('bad'); });
    $('#cfCancel').onclick = closeModal;
    const add = $('#ctAdd'); if (add) add.onclick = () => { const v = $('#ctNew').value.trim(); if (!v) return; x.contatos = (x.contatos || []).concat({ ts: nowISO(), texto: v }); $('#ctNew').value = ''; drawCt(); toast('Contato registrado (salve o cliente para gravar).'); };
    f.onsubmit = async (e) => {
      e.preventDefault(); const fd = Object.fromEntries(new FormData(f)); const errs = [];
      if (!fd.nome.trim()) errs.push(['nome', 'Informe o nome.']);
      if (!C.validDoc(fd.doc)) errs.push(['doc', 'CPF/CNPJ inválido.']);
      if (fd.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email)) errs.push(['email', 'E-mail inválido.']);
      if (fd.cel && fd.cel.replace(/\D/g, '').length < 10) errs.push(['cel', 'Celular incompleto.']);
      if (fd.tel && fd.tel.replace(/\D/g, '').length < 10) errs.push(['tel', 'Telefone incompleto.']);
      const dup = clients.find(o => o.id !== x.id && ((fd.doc && o.doc === fd.doc) || o.nome.trim().toLowerCase() === fd.nome.trim().toLowerCase()));
      if (dup && !errs.length && !confirm('Já existe um cliente parecido: ' + dup.nome + '. Salvar mesmo assim?')) return;
      if (errs.length) { f.querySelectorAll('.bad').forEach(i => i.classList.remove('bad')); errs.forEach(([k]) => f.elements[k].classList.add('bad')); $('#cfErr').textContent = errs[0][1]; f.elements[errs[0][0]].focus(); return; }
      Object.keys(fd).forEach(k => { x[k] = fd[k].trim(); }); x.atualizadoEm = nowISO();
      try { await DB.put('clients', x); } catch (err) { return toast('Falha ao salvar: ' + err.message, true); }
      clients = clients.filter(o => o.id !== x.id).concat(x).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); closeModal(); toast('Cliente salvo.'); after(x);
    };
  }

  // ============ CONFIGURAÇÕES E BACKUP ============
  function viewConfig() {
    const e = settings.empresa; const f = (k, l, extra) => `<div><label>${l}</label><input name="${k}" value="${esc(e[k])}" ${extra || ''}></div>`;
    $('#view').innerHTML = `<form id="cfg" class="card" novalidate><h2>Dados da empresa (aparecem no PDF)</h2><div class="grid g3">
      <div style="grid-column:span 2"><label>Nome / razão social</label><input name="nome" value="${esc(e.nome)}"></div>${f('cnpj', 'CNPJ', 'data-mask="doc"')}${f('ie', 'Inscrição estadual')}
      <div style="grid-column:span 2"><label>Endereço</label><input name="endereco" value="${esc(e.endereco)}"></div>${f('cep', 'CEP', 'data-mask="cep"')}${f('cidade', 'Cidade | UF')}${f('tel', 'Telefone')}${f('whats', 'WhatsApp')}${f('email', 'E-mail')}${f('instagram', 'Instagram')}</div>
      <h2 style="margin-top:18px">Padrões do orçamento</h2><div class="grid g4">
      <div><label>Vendedor padrão</label><input name="_vendedor" value="${esc(settings.vendedor)}"></div><div><label>Contato do vendedor</label><input name="_contatoVendedor" data-mask="phone" value="${esc(settings.contatoVendedor)}"></div>
      <div><label>Próximo nº de orçamento</label><input name="_proxNumero" inputmode="numeric" value="${esc(settings.proxNumero)}"></div><div><label>Validade padrão (dias; 0 = sem validade)</label><input name="_validadeDias" inputmode="numeric" value="${esc(settings.validadeDias)}"></div></div>
      <h2 style="margin-top:18px">Logotipo</h2><div class="row"><div class="thumb" style="width:120px;height:90px"><img src="${settings.logo || window.JP_LOGO}" alt=""></div>
        <label class="btn sec" style="cursor:pointer">Trocar logotipo<input type="file" id="logoIn" accept="image/*" style="display:none"></label><button type="button" class="btn ghost" id="logoReset">Usar logotipo original</button></div>
      <div class="row" style="margin-top:16px"><button class="btn" type="submit">Salvar configurações</button><span class="err" id="cfgErr"></span></div></form>
      <div class="card"><h2>Backup e restauração</h2>
        <p class="note">Onde ficam os dados: no banco local (IndexedDB) do navegador deste computador, no perfil do usuário do Windows. <b>Limpar os dados de navegação, trocar de navegador/usuário ou formatar o computador apaga tudo.</b> Gere um backup JSON com frequência e guarde fora deste computador (pendrive, e-mail, nuvem). O backup inclui clientes, orçamentos (com fotos) e configurações.</p>
        <div class="row"><button class="btn" id="bkExp">Exportar backup (JSON)</button><label class="btn sec" style="cursor:pointer">Restaurar backup…<input type="file" id="bkImp" accept=".json,application/json" style="display:none"></label></div>
        <p class="note" style="margin-top:10px">A restauração valida o arquivo (formato, estrutura e verificação de integridade), baixa automaticamente um backup do estado atual e só então substitui os dados.</p></div>
      <div class="card"><h2>Limitações desta versão</h2><p class="note">Sem login: qualquer pessoa com acesso ao computador e ao navegador vê os dados. Funciona sem internet (o sistema não carrega nada externo); o botão WhatsApp só abre o WhatsApp Web/aplicativo, que exige internet, e não envia nada automaticamente. O PDF é gerado no próprio computador.</p></div>`;
    const form = $('#cfg');
    form.addEventListener('input', ev => { const m = ev.target.dataset.mask; if (m === 'phone') ev.target.value = C.maskPhone(ev.target.value); if (m === 'cep') ev.target.value = C.maskCEP(ev.target.value); if (m === 'doc') ev.target.value = C.maskDoc(ev.target.value); });
    form.onsubmit = async (ev) => {
      ev.preventDefault(); const fd = Object.fromEntries(new FormData(form)); const prox = parseInt(fd._proxNumero, 10), val = parseInt(fd._validadeDias, 10);
      if (!(prox >= 1)) return $('#cfgErr').textContent = 'Próximo número deve ser um inteiro maior ou igual a 1.';
      if (!(val >= 0)) return $('#cfgErr').textContent = 'Validade em dias deve ser 0 ou mais.';
      if (!fd.nome.trim()) return $('#cfgErr').textContent = 'Informe o nome da empresa.';
      if (fd.cnpj && !C.validDoc(fd.cnpj)) return $('#cfgErr').textContent = 'CNPJ inválido.';
      const maxUsado = Math.max(0, ...quotes.map(q => parseInt(q.numero, 10) || 0)); if (prox <= maxUsado && !confirm('O próximo número (' + prox + ') é menor ou igual a um já utilizado. O sistema pulará números em uso. Continuar?')) return;
      Object.keys(settings.empresa).forEach(k => { settings.empresa[k] = (fd[k] || '').trim(); });
      Object.assign(settings, { vendedor: fd._vendedor.trim(), contatoVendedor: fd._contatoVendedor.trim(), proxNumero: prox, validadeDias: val });
      await DB.put('settings', settings); toast('Configurações salvas.'); $('#cfgErr').textContent = '';
    };
    $('#logoIn').onchange = (ev) => { if (ev.target.files[0]) resizeImage(ev.target.files[0], 500, async (d) => { settings.logo = d; await DB.put('settings', settings); $('#brandLogo').src = d; toast('Logotipo atualizado.'); viewConfig(); }); };
    $('#logoReset').onclick = async () => { settings.logo = null; await DB.put('settings', settings); $('#brandLogo').src = window.JP_LOGO; toast('Logotipo original restaurado.'); viewConfig(); };
    $('#bkExp').onclick = exportBackup; $('#bkImp').onchange = (ev) => { if (ev.target.files[0]) importBackup(ev.target.files[0]); ev.target.value = ''; };
  }
  async function makeBackup() {
    const data = await DB.dump(); const body = JSON.stringify(data);
    return { app: 'jp-sistema-comercial', versao: 1, geradoEm: nowISO(), contagem: { clientes: data.clients.length, orcamentos: data.quotes.length }, integridade: C.hash(body), data };
  }
  async function exportBackup() {
    try { const b = await makeBackup(); download('backup_JP_' + C.todayISO() + '.json', new Blob([JSON.stringify(b)], { type: 'application/json' })); toast(`Backup gerado: ${b.contagem.clientes} cliente(s), ${b.contagem.orcamentos} orçamento(s).`); }
    catch (err) { toast('Falha ao gerar o backup: ' + err.message, true); }
  }
  function validateBackup(b) {
    if (!b || typeof b !== 'object' || b.app !== 'jp-sistema-comercial') throw new Error('Este arquivo não é um backup do sistema JP.');
    if (b.versao !== 1) throw new Error('Versão de backup não suportada: ' + b.versao);
    const d = b.data; if (!d || !Array.isArray(d.clients) || !Array.isArray(d.quotes) || !Array.isArray(d.settings)) throw new Error('Estrutura do backup incompleta.');
    if (C.hash(JSON.stringify(d)) !== b.integridade) throw new Error('Verificação de integridade falhou: o arquivo foi alterado ou está corrompido.');
    const ids = new Set();
    d.clients.forEach((c, i) => { if (!c || !c.id || typeof c.nome !== 'string') throw new Error('Cliente inválido no registro ' + (i + 1) + '.'); });
    d.quotes.forEach((q, i) => { if (!q || !q.id || !q.numero || !Array.isArray(q.items) || !q.cliente || typeof q.cliente.nome !== 'string') throw new Error('Orçamento inválido no registro ' + (i + 1) + '.'); if (ids.has(q.id)) throw new Error('Orçamento duplicado no backup.'); ids.add(q.id); });
    if (!d.settings.every(s => s && typeof s.key === 'string')) throw new Error('Configurações inválidas no backup.');
    return d;
  }
  async function importBackup(file) {
    try {
      const b = JSON.parse(await file.text()); const d = validateBackup(b);
      if (!confirm(`Restaurar backup de ${fmtTs(b.geradoEm)}?\n\n${d.clients.length} cliente(s) e ${d.quotes.length} orçamento(s) SUBSTITUIRÃO os dados atuais.\nUm backup do estado atual será baixado automaticamente antes.`)) return;
      const atual = await makeBackup(); download('backup_ANTES_da_restauracao_' + C.todayISO() + '.json', new Blob([JSON.stringify(atual)], { type: 'application/json' }));
      await DB.replaceAll(d); await loadAll(); dirty = false; toast('Backup restaurado com sucesso.'); go();
    } catch (err) { toast('Restauração cancelada: ' + err.message, true); }
  }

  // ---------- início ----------
  (async function init() {
    try { await DB.open(); await loadAll(); go(); }
    catch (err) { $('#view').innerHTML = `<div class="card"><h2>Não foi possível iniciar o banco local</h2><p>${esc(err.message)}</p><p class="note">Abra o sistema pelo INICIAR.bat (Chrome ou Edge). Em janela anônima/privada, o armazenamento é apagado ao fechar.</p></div>`; }
  })();
  window.JPApp = { _debug: () => ({ settings, clients, quotes }) };
})();
