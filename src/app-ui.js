'use strict';
/* ============================================================================
 * Interface (UI), telas (Views), controlador (App), login e inicialização.
 * O código das telas é praticamente idêntico ao original — apenas a camada de
 * dados (API) mudou para funcionar offline.
 * ========================================================================== */

/* --------------------------------------------------------------------- UI */
const UI = (() => {
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function soDigitos(s) { return String(s || '').replace(/\D/g, ''); }
  function waLink(telefone) {
    let d = soDigitos(telefone);
    if (!d) return '';
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return `https://wa.me/${d}`;
  }
  function fmtData(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).length <= 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString('pt-BR');
  }
  function fmtDataHora(iso) {
    if (!iso) return '—';
    const d = new Date(String(iso).replace(' ', 'T'));
    if (isNaN(d)) return esc(iso);
    return d.toLocaleString('pt-BR');
  }
  function iniciais(nome) { return !nome ? '?' : nome.trim().slice(0, 1).toUpperCase(); }
  function debounce(fn, ms = 350) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

  function toast(mensagem, tipo = 'info', titulo = '') {
    const cont = document.getElementById('toasts');
    if (!cont) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<div class="msg">${titulo ? `<div class="t-title">${esc(titulo)}</div>` : ''}${esc(mensagem)}</div>`;
    cont.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(30px)'; setTimeout(() => el.remove(), 220); }, 4200);
  }
  function loading(mostrar, texto = 'Carregando...') {
    const ov = document.getElementById('loadingOverlay');
    if (!ov) return;
    document.getElementById('loadingText').textContent = texto;
    ov.classList.toggle('show', !!mostrar);
    if (!mostrar) progress(null);
  }
  function progress(pct) {
    const p = document.getElementById('loadingProgress');
    if (!p) return;
    if (pct === null || pct === undefined) { p.classList.add('hidden'); p.querySelector('span').style.width = '0'; }
    else { p.classList.remove('hidden'); p.querySelector('span').style.width = Math.max(0, Math.min(100, pct)) + '%'; }
  }
  function abrirModal({ titulo, corpo, tamanho = '', rodape = '' }) {
    const root = document.getElementById('modalRoot');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal ${tamanho}"><div class="modal-head"><h3>${esc(titulo)}</h3><button class="close" aria-label="Fechar">&times;</button></div><div class="modal-body">${corpo}</div>${rodape ? `<div class="modal-foot">${rodape}</div>` : ''}</div>`;
    root.appendChild(overlay);
    const fechar = () => overlay.remove();
    overlay.querySelector('.close').addEventListener('click', fechar);
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) fechar(); });
    document.addEventListener('keydown', function onEsc(e) { if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', onEsc); } });
    return { overlay, fechar };
  }
  function confirmar(mensagem, { titulo = 'Confirmar', perigo = false, okLabel = 'Confirmar' } = {}) {
    return new Promise((resolve) => {
      const rodape = `<button class="btn" data-acao="cancelar">Cancelar</button><button class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" data-acao="ok">${esc(okLabel)}</button>`;
      const { overlay, fechar } = abrirModal({ titulo, corpo: `<p style="margin:0;white-space:pre-line">${esc(mensagem)}</p>`, rodape });
      overlay.querySelector('[data-acao="cancelar"]').addEventListener('click', () => { fechar(); resolve(false); });
      overlay.querySelector('[data-acao="ok"]').addEventListener('click', () => { fechar(); resolve(true); });
    });
  }
  function campoHTML(f, valor) {
    const v = valor === null || valor === undefined ? '' : valor;
    const req = f.required ? 'required' : '';
    let ctrl;
    if (f.type === 'textarea') ctrl = `<textarea name="${f.name}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || '')}" ${req}>${esc(v)}</textarea>`;
    else if (f.type === 'select') {
      const opts = (f.options || []).map((o) => { const val = typeof o === 'object' ? o.value : o; const lab = typeof o === 'object' ? o.label : o; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('');
      ctrl = `<select name="${f.name}" ${req}>${opts}</select>`;
    } else if (f.type === 'range') {
      ctrl = `<input type="range" name="${f.name}" min="0" max="100" step="5" value="${esc(v || 0)}" oninput="this.nextElementSibling.textContent=this.value+'%'" /><span class="small muted">${esc(v || 0)}%</span>`;
    } else ctrl = `<input type="${f.type || 'text'}" name="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${req} />`;
    return `<div class="field ${f.full ? 'full' : ''}" ${f.full ? 'style="grid-column:1/-1"' : ''}><label>${esc(f.label)}${f.required ? ' *' : ''}</label>${ctrl}</div>`;
  }
  function formModal(cfg) {
    return new Promise((resolve) => {
      const valores = cfg.valores || {};
      const corpo = `<form id="uiForm"><div class="grid-2">${cfg.campos.map((f) => campoHTML(f, valores[f.name])).join('')}</div></form>`;
      const rodape = `<button class="btn" data-acao="cancelar">Cancelar</button><button class="btn btn-primary" data-acao="salvar">${esc(cfg.okLabel || 'Salvar')}</button>`;
      const { overlay, fechar } = abrirModal({ titulo: cfg.titulo, corpo, tamanho: cfg.tamanho || 'lg', rodape });
      const form = overlay.querySelector('#uiForm');
      const submit = () => {
        if (!form.reportValidity()) return;
        const dados = {};
        cfg.campos.forEach((f) => { const el = form.elements[f.name]; if (el) dados[f.name] = el.value; });
        fechar(); resolve(dados);
      };
      overlay.querySelector('[data-acao="salvar"]').addEventListener('click', submit);
      overlay.querySelector('[data-acao="cancelar"]').addEventListener('click', () => { fechar(); resolve(null); });
      form.addEventListener('submit', (e) => { e.preventDefault(); submit(); });
      const primeiro = form.querySelector('input, select, textarea');
      if (primeiro) setTimeout(() => primeiro.focus(), 50);
    });
  }
  return { esc, soDigitos, waLink, fmtData, fmtDataHora, iniciais, debounce, toast, loading, progress, abrirModal, confirmar, formModal };
})();

window.Views = window.Views || {};

/* -------------------------------------------------------------- Dashboard */
window.Views.dashboard = {
  async render(el) {
    el.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    let data;
    try { data = await API.get('/stats'); } catch (err) { el.innerHTML = `<div class="alert alert-warn">Não foi possível carregar os indicadores: ${UI.esc(err.message)}</div>`; return; }
    const s = data.stats;
    const card = (val, label, cor, icon) => `<div class="card stat-card"><div class="stat-ico" style="background:${cor}22;color:${cor}">${icon}</div><div><div class="stat-val">${val}</div><div class="stat-label">${label}</div></div></div>`;
    const ICON = {
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
      trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
      inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
      tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>',
    };
    const totalStatus = data.porStatus.reduce((a, b) => a + b.n, 0) || 1;
    const barras = data.porStatus.map((r) => {
      const pct = ((r.n / totalStatus) * 100).toFixed(0);
      return `<div style="margin-bottom:10px"><div class="flex" style="justify-content:space-between;margin-bottom:4px"><span class="badge ${r.status.toLowerCase()}">${UI.esc(r.status)}</span><span class="small muted">${r.n} (${pct}%)</span></div><div class="prob-bar" style="width:100%"><span style="width:${pct}%"></span></div></div>`;
    }).join('') || '<div class="empty small">Sem dados de prospecção ainda.</div>';
    const ultimas = data.ultimasPesquisas.map((p) => `<tr><td>${UI.esc(p.nicho)}</td><td>${UI.esc(p.cidade)}${p.estado ? '/' + UI.esc(p.estado) : ''}</td><td>${p.total_novo}</td><td class="muted small">${UI.fmtDataHora(p.criado_em)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty small">Nenhuma pesquisa realizada ainda.</td></tr>';
    el.innerHTML = `<div class="cards">
        ${card(s.clientes, 'Clientes Fixos', '#2dd4a7', ICON.users)}
        ${card(s.prospeccao, 'Em Prospecção', '#4895ef', ICON.trend)}
        ${card(s.prospeccaoNegociando, 'Em Negociação', '#f7b955', ICON.trend)}
        ${card(s.prospeccaoFechado, 'Negócios Fechados', '#2dd4a7', ICON.check)}
        ${card(s.pesquisas, 'Pesquisas Feitas', '#56b4ff', ICON.search)}
        ${card(s.resultadosPendentes, 'Aguardando Revisão', '#4361ee', ICON.inbox)}
        ${card(s.nichos, 'Nichos Disponíveis', '#a78bfa', ICON.tag)}
      </div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h3>Prospecção por Status</h3></div><div class="panel-body">${barras}</div></div>
        <div class="panel"><div class="panel-head"><h3>Últimas Pesquisas</h3></div><div class="table-wrap"><table class="data"><thead><tr><th>Nicho</th><th>Local</th><th>Novos</th><th>Quando</th></tr></thead><tbody>${ultimas}</tbody></table></div></div>
      </div>
      <div class="panel"><div class="panel-head"><h3>Atalhos</h3></div><div class="panel-body flex gap" style="flex-wrap:wrap">
        <button class="btn btn-primary" onclick="App.irPara('pesquisa')">Nova Pesquisa Automática</button>
        <button class="btn" onclick="App.irPara('clientes')">Ver Clientes</button>
        <button class="btn" onclick="App.irPara('prospeccao')">Ver Prospecção</button>
        <button class="btn" onclick="App.irPara('revisao')">Ir para Revisão</button>
      </div></div>`;
  },
};

/* --------------------------------------------------------------- Clientes */
window.Views.clientes = (() => {
  const estado = { search: '', sort: 'nome', order: 'ASC', page: 1, pageSize: 50 };
  let container = null;
  const CAMPOS = [
    { name: 'nome', label: 'Nome', type: 'text', required: true }, { name: 'telefone', label: 'Telefone', type: 'text' },
    { name: 'whatsapp', label: 'WhatsApp', type: 'text' }, { name: 'cidade', label: 'Cidade', type: 'text' },
    { name: 'instagram', label: 'Instagram', type: 'text' }, { name: 'site', label: 'Site', type: 'text' },
    { name: 'email', label: 'E-mail', type: 'email' }, { name: 'ultimo_contato', label: 'Último contato', type: 'date' },
    { name: 'observacoes', label: 'Observações', type: 'textarea', full: true, rows: 3 },
  ];
  async function render(el) {
    container = el;
    el.innerHTML = `<div class="panel"><div class="panel-head"><div class="toolbar" style="flex:1">
        <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="cliSearch" placeholder="Pesquisar por nome, cidade, telefone, e-mail..." /></div>
        <button class="btn btn-primary" id="cliNovo">+ Novo Cliente</button>
        <button class="btn" id="cliImportar">Importar Meus Clientes</button>
        <div class="flex gap"><button class="btn btn-sm" data-exp="xlsx">Excel</button><button class="btn btn-sm" data-exp="csv">CSV</button><button class="btn btn-sm" data-exp="pdf">PDF</button></div>
      </div></div><div class="table-wrap" id="cliTabela"></div><div id="cliPager"></div></div>
      <input type="file" id="cliFile" accept=".csv,.xls,.xlsx" class="hidden" />`;
    el.querySelector('#cliSearch').addEventListener('input', UI.debounce((e) => { estado.search = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#cliNovo').addEventListener('click', () => editar(null));
    el.querySelector('#cliImportar').addEventListener('click', () => el.querySelector('#cliFile').click());
    el.querySelector('#cliFile').addEventListener('change', importar);
    el.querySelectorAll('[data-exp]').forEach((b) => b.addEventListener('click', () => API.download(`/clientes/export?format=${b.dataset.exp}`)));
    await carregar();
  }
  async function carregar() {
    const tabela = container.querySelector('#cliTabela');
    if (!tabela) return;
    tabela.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({ search: estado.search, sort: estado.sort, order: estado.order, page: estado.page, pageSize: estado.pageSize });
    const r = await API.get('/clientes?' + q.toString());
    render_tabela(r); render_pager(r);
  }
  function th(campo, label) { const ativo = estado.sort === campo; const seta = ativo ? (estado.order === 'ASC' ? ' ▲' : ' ▼') : ''; return `<th class="sortable" data-sort="${campo}">${label}${seta}</th>`; }
  function render_tabela(r) {
    const tabela = container.querySelector('#cliTabela');
    if (!tabela) return;
    if (!r.itens.length) { tabela.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><div>Nenhum cliente encontrado.</div><button class="btn btn-primary mt" onclick="Views.clientes.novo()">Cadastrar primeiro cliente</button></div>`; return; }
    const linhas = r.itens.map((c) => {
      const wa = UI.waLink(c.whatsapp || c.telefone);
      return `<tr><td>${UI.esc(c.nome)}</td><td>${UI.esc(c.telefone) || '—'}</td><td>${UI.esc(c.cidade) || '—'}</td>
        <td>${c.instagram ? `<a href="https://instagram.com/${UI.esc(c.instagram.replace(/^@/, ''))}" target="_blank">@${UI.esc(c.instagram.replace(/^@/, ''))}</a>` : '—'}</td>
        <td>${c.site ? `<a href="${/^https?:/.test(c.site) ? UI.esc(c.site) : 'https://' + UI.esc(c.site)}" target="_blank">site</a>` : '—'}</td>
        <td class="muted small">${UI.fmtData(c.ultimo_contato)}</td>
        <td class="actions"><div class="row-actions">${wa ? `<a class="btn btn-sm btn-whatsapp" href="${wa}" target="_blank" title="Abrir WhatsApp">WhatsApp</a>` : ''}<button class="btn btn-sm" data-edit="${c.id}">Editar</button><button class="btn btn-sm btn-danger" data-del="${c.id}">Excluir</button></div></td></tr>`;
    }).join('');
    tabela.innerHTML = `<table class="data"><thead><tr>${th('nome', 'Nome')}${th('telefone', 'Telefone')}${th('cidade', 'Cidade')}<th>Instagram</th><th>Site</th>${th('ultimo_contato', 'Último Contato')}<th>Ações</th></tr></thead><tbody>${linhas}</tbody></table>`;
    tabela.querySelectorAll('th.sortable').forEach((t) => t.addEventListener('click', () => { const campo = t.dataset.sort; if (estado.sort === campo) estado.order = estado.order === 'ASC' ? 'DESC' : 'ASC'; else { estado.sort = campo; estado.order = 'ASC'; } carregar(); }));
    tabela.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editar(Number(b.dataset.edit))));
    tabela.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => excluir(Number(b.dataset.del))));
  }
  function render_pager(r) {
    const pager = container.querySelector('#cliPager');
    if (!pager) return;
    const totalPag = Math.max(1, Math.ceil(r.total / r.pageSize));
    pager.innerHTML = `<div class="pager"><span class="info">${r.total} cliente(s) — página ${r.page} de ${totalPag}</span><div class="spacer"></div><button class="btn btn-sm" ${r.page <= 1 ? 'disabled' : ''} id="pgPrev">‹ Anterior</button><button class="btn btn-sm" ${r.page >= totalPag ? 'disabled' : ''} id="pgNext">Próxima ›</button></div>`;
    const prev = pager.querySelector('#pgPrev'), next = pager.querySelector('#pgNext');
    if (prev) prev.addEventListener('click', () => { estado.page--; carregar(); });
    if (next) next.addEventListener('click', () => { estado.page++; carregar(); });
  }
  async function editar(id) {
    let valores = {};
    if (id) { try { valores = await API.get('/clientes/' + id); } catch (e) { UI.toast(e.message, 'error'); return; } }
    const dados = await UI.formModal({ titulo: id ? 'Editar Cliente' : 'Novo Cliente', campos: CAMPOS, valores, okLabel: id ? 'Salvar alterações' : 'Cadastrar' });
    if (!dados) return;
    try {
      if (id) await API.put('/clientes/' + id, dados); else await API.post('/clientes', dados);
      UI.toast(id ? 'Cliente atualizado.' : 'Cliente cadastrado.', 'success');
      await carregar(); App.atualizarContadores();
    } catch (err) {
      if (err.status === 409) {
        const forcar = await UI.confirmar(`${err.message}\n\nDeseja cadastrar mesmo assim?`, { titulo: 'Possível duplicado', okLabel: 'Cadastrar assim mesmo' });
        if (forcar) { try { await API.post('/clientes', { ...dados, forcar: true }); UI.toast('Cliente cadastrado.', 'success'); await carregar(); App.atualizarContadores(); } catch (e2) { UI.toast(e2.message, 'error'); } }
      } else UI.toast(err.message, 'error');
    }
  }
  async function excluir(id) {
    if (!(await UI.confirmar('Excluir este cliente? Esta ação não pode ser desfeita.', { titulo: 'Excluir', perigo: true, okLabel: 'Excluir' }))) return;
    try { await API.del('/clientes/' + id); UI.toast('Cliente excluído.', 'success'); await carregar(); App.atualizarContadores(); } catch (err) { UI.toast(err.message, 'error'); }
  }
  async function importar(e) {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    UI.loading(true, 'Importando planilha...'); UI.progress(15);
    try {
      const r = await API.upload('/clientes/import', file);
      UI.progress(100);
      if (!r.ok) { UI.toast(r.erro, 'error', 'Importar'); return; }
      UI.toast(`Importação concluída: ${r.inseridos} inseridos, ${r.duplicados} duplicados, ${r.invalidos} inválidos (de ${r.total}).`, 'success', 'Importar');
      if (r.erros && r.erros.length) mostrarErros(r);
      await carregar(); App.atualizarContadores();
    } catch (err) { UI.toast(err.message, 'error', 'Importar'); } finally { UI.loading(false); }
  }
  function mostrarErros(r) {
    const linhas = r.erros.map((e) => `<tr><td>${e.linha}</td><td>${UI.esc(e.motivo)}</td></tr>`).join('');
    UI.abrirModal({ titulo: `Detalhes da importação (${r.inseridos}/${r.total})`, corpo: `<p class="small muted">Algumas linhas não foram importadas:</p><div class="table-wrap"><table class="data"><thead><tr><th>Linha</th><th>Motivo</th></tr></thead><tbody>${linhas}</tbody></table></div>` });
  }
  return { render, novo: () => editar(null) };
})();

/* ------------------------------------------------------------- Prospecção */
window.Views.prospeccao = (() => {
  const estado = { search: '', cidade: '', estado: '', nicho: '', status: '', probMin: '', sort: 'empresa', order: 'ASC', page: 1, pageSize: 50 };
  let container = null;
  let statusValidos = ['Novo', 'Contatado', 'Negociando', 'Proposta', 'Fechado', 'Perdido'];
  function campos() {
    return [
      { name: 'empresa', label: 'Empresa', type: 'text', required: true }, { name: 'cidade', label: 'Cidade', type: 'text' },
      { name: 'estado', label: 'Estado (UF)', type: 'text' }, { name: 'nicho', label: 'Nicho', type: 'text' },
      { name: 'telefone', label: 'Telefone', type: 'text' }, { name: 'whatsapp', label: 'WhatsApp', type: 'text' },
      { name: 'instagram', label: 'Instagram', type: 'text' }, { name: 'site', label: 'Site', type: 'text' },
      { name: 'email', label: 'E-mail', type: 'email' }, { name: 'responsavel', label: 'Responsável', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: statusValidos }, { name: 'origem', label: 'Origem', type: 'text' },
      { name: 'probabilidade', label: 'Probabilidade de fechamento', type: 'range' }, { name: 'ultimo_contato', label: 'Último contato', type: 'date' },
      { name: 'observacoes', label: 'Observações', type: 'textarea', full: true, rows: 3 },
    ];
  }
  async function render(el) {
    container = el;
    el.innerHTML = `<div class="panel"><div class="panel-head" style="flex-direction:column;align-items:stretch;gap:10px">
        <div class="toolbar"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="pSearch" placeholder="Pesquisar empresa, telefone, responsável..." /></div>
          <button class="btn btn-primary" id="pNovo">+ Nova Empresa</button><button class="btn" id="pImportar">Importar</button>
          <div class="flex gap"><button class="btn btn-sm" data-exp="xlsx">Excel</button><button class="btn btn-sm" data-exp="csv">CSV</button><button class="btn btn-sm" data-exp="pdf">PDF</button></div></div>
        <div class="toolbar"><input type="text" id="fCidade" placeholder="Cidade" /><input type="text" id="fEstado" placeholder="UF" style="max-width:80px" /><input type="text" id="fNicho" placeholder="Nicho" />
          <select id="fStatus"><option value="">Todos os status</option>${statusValidos.map((s) => `<option>${s}</option>`).join('')}</select>
          <select id="fProb"><option value="">Qualquer probabilidade</option><option value="25">≥ 25%</option><option value="50">≥ 50%</option><option value="75">≥ 75%</option><option value="90">≥ 90%</option></select>
          <button class="btn btn-sm btn-ghost" id="fLimpar">Limpar filtros</button></div>
      </div><div class="table-wrap" id="pTabela"></div><div id="pPager"></div></div>
      <input type="file" id="pFile" accept=".csv,.xls,.xlsx" class="hidden" />`;
    el.querySelector('#pSearch').addEventListener('input', UI.debounce((e) => { estado.search = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#fCidade').addEventListener('input', UI.debounce((e) => { estado.cidade = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#fEstado').addEventListener('input', UI.debounce((e) => { estado.estado = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#fNicho').addEventListener('input', UI.debounce((e) => { estado.nicho = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#fStatus').addEventListener('change', (e) => { estado.status = e.target.value; estado.page = 1; carregar(); });
    el.querySelector('#fProb').addEventListener('change', (e) => { estado.probMin = e.target.value; estado.page = 1; carregar(); });
    el.querySelector('#fLimpar').addEventListener('click', () => { Object.assign(estado, { search: '', cidade: '', estado: '', nicho: '', status: '', probMin: '', page: 1 }); el.querySelector('#pSearch').value = ''; el.querySelector('#fCidade').value = ''; el.querySelector('#fEstado').value = ''; el.querySelector('#fNicho').value = ''; el.querySelector('#fStatus').value = ''; el.querySelector('#fProb').value = ''; carregar(); });
    el.querySelector('#pNovo').addEventListener('click', () => editar(null));
    el.querySelector('#pImportar').addEventListener('click', () => el.querySelector('#pFile').click());
    el.querySelector('#pFile').addEventListener('change', importar);
    el.querySelectorAll('[data-exp]').forEach((b) => b.addEventListener('click', () => API.download(`/prospeccao/export?format=${b.dataset.exp}`)));
    await carregar();
  }
  async function carregar() {
    const tabela = container.querySelector('#pTabela');
    if (!tabela) return;
    tabela.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({ search: estado.search, cidade: estado.cidade, estado: estado.estado, nicho: estado.nicho, status: estado.status, probMin: estado.probMin, sort: estado.sort, order: estado.order, page: estado.page, pageSize: estado.pageSize });
    const r = await API.get('/prospeccao?' + q.toString());
    if (r.statusValidos) statusValidos = r.statusValidos;
    render_tabela(r); render_pager(r);
  }
  function th(campo, label) { const ativo = estado.sort === campo; const seta = ativo ? (estado.order === 'ASC' ? ' ▲' : ' ▼') : ''; return `<th class="sortable" data-sort="${campo}">${label}${seta}</th>`; }
  function render_tabela(r) {
    const tabela = container.querySelector('#pTabela');
    if (!tabela) return;
    if (!r.itens.length) { tabela.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><div>Nenhuma empresa em prospecção.</div><button class="btn btn-primary mt" onclick="Views.prospeccao.novo()">Adicionar empresa</button></div>`; return; }
    const linhas = r.itens.map((p) => {
      const wa = UI.waLink(p.whatsapp || p.telefone);
      const st = (p.status || 'Novo').toLowerCase();
      return `<tr><td>${UI.esc(p.empresa)}</td><td>${UI.esc(p.cidade) || '—'}${p.estado ? '/' + UI.esc(p.estado) : ''}</td><td>${UI.esc(p.nicho) || '—'}</td><td>${UI.esc(p.telefone) || '—'}</td>
        <td><span class="badge ${st}">${UI.esc(p.status)}</span></td>
        <td><div class="prob-bar"><span style="width:${p.probabilidade || 0}%"></span></div> <span class="small muted">${p.probabilidade || 0}%</span></td>
        <td class="actions"><div class="row-actions">${wa ? `<a class="btn btn-sm btn-whatsapp" href="${wa}" target="_blank" title="WhatsApp">Whats</a>` : ''}<button class="btn btn-sm btn-success" data-mover="${p.id}" title="Mover para Clientes Fixos">→ Cliente</button><button class="btn btn-sm" data-edit="${p.id}">Editar</button><button class="btn btn-sm btn-danger" data-del="${p.id}">Excluir</button></div></td></tr>`;
    }).join('');
    tabela.innerHTML = `<table class="data"><thead><tr>${th('empresa', 'Empresa')}${th('cidade', 'Cidade')}${th('nicho', 'Nicho')}<th>Telefone</th>${th('status', 'Status')}${th('probabilidade', 'Probabilidade')}<th>Ações</th></tr></thead><tbody>${linhas}</tbody></table>`;
    tabela.querySelectorAll('th.sortable').forEach((t) => t.addEventListener('click', () => { const campo = t.dataset.sort; if (estado.sort === campo) estado.order = estado.order === 'ASC' ? 'DESC' : 'ASC'; else { estado.sort = campo; estado.order = 'ASC'; } carregar(); }));
    tabela.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editar(Number(b.dataset.edit))));
    tabela.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => excluir(Number(b.dataset.del))));
    tabela.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => mover(Number(b.dataset.mover))));
  }
  function render_pager(r) {
    const pager = container.querySelector('#pPager');
    if (!pager) return;
    const totalPag = Math.max(1, Math.ceil(r.total / r.pageSize));
    pager.innerHTML = `<div class="pager"><span class="info">${r.total} empresa(s) — página ${r.page} de ${totalPag}</span><div class="spacer"></div><button class="btn btn-sm" ${r.page <= 1 ? 'disabled' : ''} id="pgPrev">‹ Anterior</button><button class="btn btn-sm" ${r.page >= totalPag ? 'disabled' : ''} id="pgNext">Próxima ›</button></div>`;
    const prev = pager.querySelector('#pgPrev'), next = pager.querySelector('#pgNext');
    if (prev) prev.addEventListener('click', () => { estado.page--; carregar(); });
    if (next) next.addEventListener('click', () => { estado.page++; carregar(); });
  }
  async function editar(id) {
    let valores = { status: 'Novo', probabilidade: 0 };
    if (id) { try { valores = await API.get('/prospeccao/' + id); } catch (e) { UI.toast(e.message, 'error'); return; } }
    const dados = await UI.formModal({ titulo: id ? 'Editar Empresa' : 'Nova Empresa', campos: campos(), valores, okLabel: id ? 'Salvar alterações' : 'Cadastrar' });
    if (!dados) return;
    try {
      if (id) await API.put('/prospeccao/' + id, dados); else await API.post('/prospeccao', dados);
      UI.toast(id ? 'Empresa atualizada.' : 'Empresa cadastrada.', 'success');
      await carregar(); App.atualizarContadores();
    } catch (err) {
      if (err.status === 409) {
        const forcar = await UI.confirmar(`${err.message}\n\nCadastrar mesmo assim?`, { titulo: 'Possível duplicado', okLabel: 'Cadastrar assim mesmo' });
        if (forcar) { try { await API.post('/prospeccao', { ...dados, forcar: true }); UI.toast('Empresa cadastrada.', 'success'); await carregar(); App.atualizarContadores(); } catch (e2) { UI.toast(e2.message, 'error'); } }
      } else UI.toast(err.message, 'error');
    }
  }
  async function excluir(id) {
    if (!(await UI.confirmar('Excluir esta empresa da prospecção?', { titulo: 'Excluir', perigo: true, okLabel: 'Excluir' }))) return;
    try { await API.del('/prospeccao/' + id); UI.toast('Empresa excluída.', 'success'); await carregar(); App.atualizarContadores(); } catch (err) { UI.toast(err.message, 'error'); }
  }
  async function mover(id) {
    if (!(await UI.confirmar('Mover esta empresa para Clientes Fixos?', { titulo: 'Mover para Clientes', okLabel: 'Mover' }))) return;
    try { await API.post(`/prospeccao/${id}/mover-clientes`); UI.toast('Movida para Clientes Fixos.', 'success'); await carregar(); App.atualizarContadores(); } catch (err) { UI.toast(err.message, 'error'); }
  }
  async function importar(e) {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    UI.loading(true, 'Importando planilha...'); UI.progress(15);
    try {
      const r = await API.upload('/prospeccao/import', file);
      UI.progress(100);
      if (!r.ok) { UI.toast(r.erro, 'error', 'Importar'); return; }
      UI.toast(`Importação: ${r.inseridos} inseridos, ${r.duplicados} duplicados, ${r.invalidos} inválidos.`, 'success', 'Importar');
      await carregar(); App.atualizarContadores();
    } catch (err) { UI.toast(err.message, 'error', 'Importar'); } finally { UI.loading(false); }
  }
  return { render, novo: () => editar(null) };
})();

/* --------------------------------------------------- Pesquisa Automática */
window.Views.pesquisa = (() => {
  let container = null;
  const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  async function render(el) {
    container = el;
    const pre = sessionStorage.getItem('nichoPreselecionado') || '';
    el.innerHTML = `<div class="alert alert-info"><strong>Fontes gratuitas e abertas.</strong> A pesquisa utiliza o <strong>OpenStreetMap</strong> (Nominatim + Overpass API) — dados públicos, gratuitos e legais. Requer conexão com a internet. Você pode adicionar mais servidores (e até uma <strong>chave de API</strong>, como o LocationIQ) no botão <strong>⚙ Servidores</strong>. Sem internet, marque <strong>Modo demonstração</strong>.</div>
      <div class="grid-2">
        <div class="panel"><div class="panel-head"><h3>Nova Pesquisa</h3><div class="spacer"></div><button type="button" class="btn btn-sm" id="btnServidores">⚙ Servidores</button></div><div class="panel-body"><form id="formPesquisa">
          <div class="field"><label>Cidade *</label><input type="text" id="qCidade" placeholder="Ex.: Serra Azul" required /></div>
          <div class="grid-2"><div class="field"><label>Estado (UF)</label><select id="qEstado"><option value="">—</option>${UFS.map((u) => `<option>${u}</option>`).join('')}</select></div>
            <div class="field"><label>Quantidade máxima</label><input type="number" id="qMax" value="50" min="1" max="300" /></div></div>
          <div class="field"><label>Nicho *</label><input type="text" id="qNicho" placeholder="Ex.: Padarias" required autocomplete="off" value="${UI.esc(pre)}" /><div id="nichoSug" class="mt"></div></div>
          <label class="flex gap" style="align-items:center;margin:6px 0 12px"><input type="checkbox" id="qDemo" style="width:auto" /> <span class="small muted">Modo demonstração (offline) — gera exemplos rotulados, sem internet.</span></label>
          <button type="submit" class="btn btn-primary btn-block" id="btnPesquisar"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> Pesquisar</button>
        </form></div></div>
        <div class="panel"><div class="panel-head"><h3>Resultado</h3></div><div class="panel-body" id="resultadoBox"><div class="empty small">Preencha os campos e clique em <strong>Pesquisar</strong>. Os resultados aparecerão aqui e na aba <strong>Revisão</strong>.</div></div></div>
      </div>`;
    sessionStorage.removeItem('nichoPreselecionado');
    carregarSugestoes('');
    el.querySelector('#qNicho').addEventListener('input', UI.debounce((e) => carregarSugestoes(e.target.value.trim()), 300));
    el.querySelector('#formPesquisa').addEventListener('submit', executar);
    el.querySelector('#btnServidores').addEventListener('click', abrirServidores);
  }
  async function carregarSugestoes(termo) {
    const box = container.querySelector('#nichoSug');
    if (!box) return;
    try {
      const r = await API.get('/nichos?search=' + encodeURIComponent(termo));
      const alvo = container.querySelector('#nichoSug');
      if (!alvo) return;
      const itens = r.itens.slice(0, 18);
      alvo.innerHTML = itens.map((n) => `<span class="chip" data-nicho="${UI.esc(n.nome)}">${UI.esc(n.nome)} <span class="cat">${UI.esc(n.categoria)}</span></span>`).join('') || '<span class="small muted">Nenhum nicho na base — você pode digitar qualquer termo livre.</span>';
      alvo.querySelectorAll('[data-nicho]').forEach((c) => c.addEventListener('click', () => { const inp = container.querySelector('#qNicho'); if (inp) inp.value = c.dataset.nicho; }));
    } catch (_) { const alvo = container.querySelector('#nichoSug'); if (alvo) alvo.innerHTML = ''; }
  }
  async function executar(e) {
    e.preventDefault();
    const cidade = container.querySelector('#qCidade').value.trim();
    const estadoUf = container.querySelector('#qEstado').value;
    const nicho = container.querySelector('#qNicho').value.trim();
    const max = Number(container.querySelector('#qMax').value) || 50;
    const demo = container.querySelector('#qDemo').checked;
    if (!cidade || !nicho) { UI.toast('Informe cidade e nicho.', 'warning'); return; }
    const btn = container.querySelector('#btnPesquisar');
    btn.disabled = true;
    btn.innerHTML = '<span class="spin-inline"></span> Pesquisando... (pode levar alguns segundos)';
    const box = container.querySelector('#resultadoBox');
    box.innerHTML = '<div class="empty"><div class="spinner"></div><div class="loading-text mt">Coletando em fontes abertas...</div></div>';
    try {
      const r = await API.post('/pesquisa', { cidade, estado: estadoUf, nicho, max, demo });
      if (r.erro) {
        box.innerHTML = `<div class="alert alert-warn"><strong>Não foi possível concluir a pesquisa.</strong><br>${UI.esc(r.mensagem)}</div><p class="small muted">Dica: verifique a conexão com a internet e o nome da cidade. Você também pode marcar <strong>Modo demonstração</strong> para testar o fluxo offline.</p>`;
      } else {
        box.innerHTML = `<div class="cards" style="grid-template-columns:1fr 1fr"><div class="card stat-card"><div><div class="stat-val">${r.novos}</div><div class="stat-label">Novos encontrados</div></div></div><div class="card stat-card"><div><div class="stat-val">${r.duplicados}</div><div class="stat-label">Duplicados ignorados</div></div></div></div><p class="small muted">${UI.esc(r.mensagem)} Fonte: <strong>${UI.esc(r.fonte)}</strong>.</p><button class="btn btn-primary btn-block mt" id="irRevisao">Ver resultados na Revisão →</button>`;
        box.querySelector('#irRevisao').addEventListener('click', () => App.irPara('revisao'));
        UI.toast(`Pesquisa concluída: ${r.novos} novos.`, 'success', 'Pesquisa');
        App.atualizarContadores();
      }
    } catch (err) { box.innerHTML = `<div class="alert alert-warn">${UI.esc(err.message)}</div>`; UI.toast(err.message, 'error', 'Pesquisa'); }
    finally { btn.disabled = false; btn.innerHTML = 'Pesquisar'; }
  }
  return { render };
})();

/* ----------------------------------------------------------------- Revisão */
window.Views.revisao = (() => {
  let container = null;
  let pesquisaSel = null;
  const filtro = { status: 'novo', search: '', sort: 'id', order: 'ASC' };
  async function render(el) {
    container = el;
    el.innerHTML = `<div class="panel"><div class="panel-head"><h3>Pesquisas Realizadas</h3><div class="spacer"></div><button class="btn btn-sm btn-primary" onclick="App.irPara('pesquisa')">+ Nova Pesquisa</button></div><div class="table-wrap" id="listaPesquisas"></div></div><div id="painelResultados"></div>`;
    await carregarPesquisas();
  }
  async function carregarPesquisas() {
    const lista = container.querySelector('#listaPesquisas');
    lista.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const r = await API.get('/pesquisa');
    if (!r.itens.length) { lista.innerHTML = `<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><div>Nenhuma pesquisa ainda.</div><button class="btn btn-primary mt" onclick="App.irPara('pesquisa')">Fazer primeira pesquisa</button></div>`; return; }
    const linhas = r.itens.map((p) => `<tr><td>${UI.esc(p.nicho)}</td><td>${UI.esc(p.cidade)}${p.estado ? '/' + UI.esc(p.estado) : ''}</td><td>${p.total_encontrado}</td><td><strong>${p.pendentes}</strong></td><td>${statusPesquisa(p)}</td><td class="muted small">${UI.fmtDataHora(p.criado_em)}</td><td class="actions"><button class="btn btn-sm btn-primary" data-ver="${p.id}">Ver resultados</button></td></tr>`).join('');
    lista.innerHTML = `<table class="data"><thead><tr><th>Nicho</th><th>Local</th><th>Total</th><th>Pendentes</th><th>Status</th><th>Quando</th><th></th></tr></thead><tbody>${linhas}</tbody></table>`;
    lista.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => abrirResultados(Number(b.dataset.ver), r.itens.find((x) => x.id === Number(b.dataset.ver)))));
  }
  function statusPesquisa(p) { if (p.status === 'falha') return `<span class="badge perdido" title="${UI.esc(p.mensagem || '')}">falha</span>`; return `<span class="badge fechado">${UI.esc(p.fonte || 'ok')}</span>`; }
  async function abrirResultados(id, pesquisa) { pesquisaSel = pesquisa || { id }; filtro.status = 'novo'; filtro.search = ''; await carregarResultados(); container.querySelector('#painelResultados').scrollIntoView({ behavior: 'smooth' }); }
  async function carregarResultados() {
    const painel = container.querySelector('#painelResultados');
    painel.innerHTML = `<div class="panel"><div class="panel-head" style="flex-wrap:wrap;gap:10px"><h3>Resultados — ${UI.esc(pesquisaSel.nicho || '')} ${pesquisaSel.cidade ? 'em ' + UI.esc(pesquisaSel.cidade) : ''}</h3><div class="spacer"></div>
        <div class="search" style="max-width:240px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="rSearch" placeholder="Filtrar resultados..." /></div>
        <select id="rStatus"><option value="novo">Pendentes</option><option value="">Todos</option><option value="movido">Movidos</option><option value="descartado">Descartados</option></select></div>
      <div class="panel-body" style="padding:12px 18px"><div class="toolbar"><label class="flex gap" style="align-items:center;margin:0"><input type="checkbox" id="selAll" /> Selecionar todos</label><div class="spacer"></div>
        <button class="btn btn-sm btn-success" id="bMover">→ Mover selecionados para Prospecção</button><button class="btn btn-sm" id="bDescartar">Descartar</button><button class="btn btn-sm btn-danger" id="bExcluir">Excluir</button></div></div>
      <div class="table-wrap" id="rTabela"></div></div>`;
    painel.querySelector('#rSearch').addEventListener('input', UI.debounce((e) => { filtro.search = e.target.value.trim(); listar(); }, 300));
    painel.querySelector('#rStatus').addEventListener('change', (e) => { filtro.status = e.target.value; listar(); });
    painel.querySelector('#selAll').addEventListener('change', (e) => { painel.querySelectorAll('.rowChk').forEach((c) => (c.checked = e.target.checked)); });
    painel.querySelector('#bMover').addEventListener('click', () => acaoLote('mover'));
    painel.querySelector('#bDescartar').addEventListener('click', () => acaoLote('descartar'));
    painel.querySelector('#bExcluir').addEventListener('click', () => acaoLote('excluir'));
    await listar();
  }
  async function listar() {
    const tabela = container.querySelector('#rTabela');
    if (!tabela) return;
    tabela.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({ status: filtro.status, search: filtro.search, sort: filtro.sort, order: filtro.order });
    const r = await API.get(`/pesquisa/${pesquisaSel.id}/resultados?` + q.toString());
    const tabela2 = container.querySelector('#rTabela');
    if (!tabela2) return;
    if (!r.itens.length) { tabela2.innerHTML = '<div class="empty small">Nenhum resultado neste filtro.</div>'; return; }
    const linhas = r.itens.map((x) => {
      const wa = UI.waLink(x.whatsapp || x.telefone);
      const bStatus = x.status === 'novo' ? '' : `<span class="badge ${x.status === 'movido' ? 'fechado' : 'perdido'}">${x.status}</span>`;
      return `<tr><td class="checkbox-cell">${x.status === 'novo' ? `<input type="checkbox" class="rowChk" value="${x.id}" />` : ''}</td><td>${UI.esc(x.nome)} ${bStatus}</td><td>${UI.esc(x.telefone) || '—'}</td><td>${UI.esc(x.cidade) || '—'}</td><td class="wrap muted small">${UI.esc(x.endereco) || '—'}</td><td>${x.site ? `<a href="${/^https?:/.test(x.site) ? UI.esc(x.site) : 'https://' + UI.esc(x.site)}" target="_blank">site</a>` : '—'}</td>
        <td class="actions"><div class="row-actions">${wa ? `<a class="btn btn-sm btn-whatsapp" href="${wa}" target="_blank">Whats</a>` : ''}<button class="btn btn-sm" data-ver="${x.id}">Ver</button>${x.status === 'novo' ? `<button class="btn btn-sm btn-success" data-add="${x.id}">+ Prospecção</button>` : ''}</div></td></tr>`;
    }).join('');
    tabela.innerHTML = `<table class="data"><thead><tr><th class="checkbox-cell"></th><th>Nome</th><th>Telefone</th><th>Cidade</th><th>Endereço</th><th>Site</th><th>Ações</th></tr></thead><tbody>${linhas}</tbody></table>`;
    const dados = {}; r.itens.forEach((x) => (dados[x.id] = x));
    tabela.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => visualizar(dados[b.dataset.ver])));
    tabela.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => mover([Number(b.dataset.add)])));
  }
  function selecionados() { return Array.from(container.querySelectorAll('.rowChk:checked')).map((c) => Number(c.value)); }
  async function acaoLote(tipo) {
    const ids = selecionados();
    if (!ids.length) { UI.toast('Selecione ao menos um resultado.', 'warning'); return; }
    if (tipo === 'mover') return mover(ids);
    if (tipo === 'descartar') { if (!(await UI.confirmar(`Descartar ${ids.length} resultado(s)?`, { titulo: 'Descartar' }))) return; try { await API.post('/pesquisa/descartar', { ids }); UI.toast('Resultados descartados.', 'success'); await listar(); App.atualizarContadores(); } catch (e) { UI.toast(e.message, 'error'); } }
    if (tipo === 'excluir') { if (!(await UI.confirmar(`Excluir DEFINITIVAMENTE ${ids.length} resultado(s)?`, { titulo: 'Excluir', perigo: true, okLabel: 'Excluir' }))) return; try { await API.post('/pesquisa/excluir', { ids }); UI.toast('Resultados excluídos.', 'success'); await listar(); App.atualizarContadores(); } catch (e) { UI.toast(e.message, 'error'); } }
  }
  async function mover(ids) {
    try { const r = await API.post('/pesquisa/mover', { ids }); UI.toast(`${r.movidos} movido(s) para Prospecção. ${r.ignorados ? r.ignorados + ' ignorado(s) por duplicidade.' : ''}`, 'success', 'Mover'); await listar(); App.atualizarContadores(); } catch (err) { UI.toast(err.message, 'error'); }
  }
  function visualizar(x) {
    if (!x) return;
    const linha = (rot, v) => v ? `<div class="field" style="margin-bottom:8px"><label>${rot}</label><div>${UI.esc(v)}</div></div>` : '';
    const wa = UI.waLink(x.whatsapp || x.telefone);
    UI.abrirModal({ titulo: x.nome, corpo: `<div class="grid-2">${linha('Telefone', x.telefone)}${linha('WhatsApp', x.whatsapp)}${linha('Cidade', x.cidade)}${linha('Estado', x.estado)}${linha('Instagram', x.instagram)}${linha('E-mail', x.email)}${linha('Endereço', x.endereco)}${linha('Categoria', x.categoria)}${linha('Horário', x.horario)}${linha('Origem', x.origem)}${x.latitude ? linha('Coordenadas', `${x.latitude}, ${x.longitude}`) : ''}</div>${x.site ? `<p><a href="${/^https?:/.test(x.site) ? UI.esc(x.site) : 'https://' + UI.esc(x.site)}" target="_blank">Abrir site</a></p>` : ''}${x.url_origem ? `<p class="small"><a href="${UI.esc(x.url_origem)}" target="_blank">Ver fonte (OpenStreetMap)</a></p>` : ''}<div class="flex gap mt">${wa ? `<a class="btn btn-whatsapp" href="${wa}" target="_blank">Abrir WhatsApp</a>` : ''}${x.status === 'novo' ? `<button class="btn btn-success" id="mvOne">+ Adicionar à Prospecção</button>` : ''}</div>` });
    const b = document.getElementById('mvOne');
    if (b) b.addEventListener('click', () => { document.querySelector('.modal-overlay .close').click(); mover([x.id]); });
  }
  return { render };
})();

/* ------------------------------------------------------------------ Nichos */
window.Views.nichos = (() => {
  let container = null;
  const estado = { search: '', categoria: '' };
  async function render(el) {
    container = el;
    el.innerHTML = `<div class="panel"><div class="panel-head"><div class="toolbar" style="flex:1"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><input type="text" id="nSearch" placeholder="Pesquisar nicho (ex.: padaria, oficina, advogado)..." /></div><select id="nCategoria"><option value="">Todas as categorias</option></select></div></div><div class="panel-body" id="nLista"></div></div>
      <div class="alert alert-info">A base contém <strong id="nTotal">—</strong> nichos prontos para uso. Você também pode digitar <strong>qualquer termo livre</strong> na Pesquisa Automática — nichos fora da base são buscados por nome. Clique em um nicho para iniciar uma pesquisa com ele.</div>`;
    el.querySelector('#nSearch').addEventListener('input', UI.debounce((e) => { estado.search = e.target.value.trim(); carregar(); }, 300));
    el.querySelector('#nCategoria').addEventListener('change', (e) => { estado.categoria = e.target.value; carregar(); });
    await carregar(true);
  }
  async function carregar(primeira) {
    const lista = container.querySelector('#nLista');
    if (!lista) return;
    lista.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({ search: estado.search, categoria: estado.categoria });
    const r = await API.get('/nichos?' + q.toString());
    if (primeira) { const sel = container.querySelector('#nCategoria'); sel.innerHTML = '<option value="">Todas as categorias</option>' + r.categorias.map((c) => `<option>${UI.esc(c)}</option>`).join(''); container.querySelector('#nTotal').textContent = r.total; }
    if (!r.itens.length) { lista.innerHTML = '<div class="empty small">Nenhum nicho encontrado. Você ainda pode usar este termo livre na Pesquisa Automática.</div>'; return; }
    const grupos = {};
    r.itens.forEach((n) => { (grupos[n.categoria] = grupos[n.categoria] || []).push(n); });
    lista.innerHTML = Object.keys(grupos).sort().map((cat) => `<div style="margin-bottom:16px"><div class="small muted" style="text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">${UI.esc(cat)}</div><div>${grupos[cat].map((n) => `<span class="chip" data-nicho="${UI.esc(n.nome)}">${UI.esc(n.nome)}</span>`).join('')}</div></div>`).join('');
    lista.querySelectorAll('[data-nicho]').forEach((c) => c.addEventListener('click', () => { sessionStorage.setItem('nichoPreselecionado', c.dataset.nicho); App.irPara('pesquisa'); setTimeout(() => { const inp = document.getElementById('qNicho'); if (inp) { inp.value = c.dataset.nicho; inp.focus(); } }, 200); }));
  }
  return { render };
})();

/* --------------------------------------------------------------- Histórico */
window.Views.historico = (() => {
  let container = null;
  const estado = { tipo: '', page: 1, pageSize: 50 };
  const ICONE = { login: '🔑', pesquisa: '🔍', importacao: '📥', exclusao: '🗑️', alteracao: '✏️', movimentacao: '🔀', erro: '⚠️' };
  async function render(el) {
    container = el;
    el.innerHTML = `<div class="panel"><div class="panel-head"><h3>Histórico de Atividades</h3><div class="spacer"></div><select id="hTipo"><option value="">Todos os tipos</option></select></div><div class="table-wrap" id="hTabela"></div><div id="hPager"></div></div>`;
    el.querySelector('#hTipo').addEventListener('change', (e) => { estado.tipo = e.target.value; estado.page = 1; carregar(); });
    await carregar(true);
  }
  async function carregar(primeira) {
    const tabela = container.querySelector('#hTabela');
    if (!tabela) return;
    tabela.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({ tipo: estado.tipo, page: estado.page, pageSize: estado.pageSize });
    const r = await API.get('/historico?' + q.toString());
    if (primeira) { const sel = container.querySelector('#hTipo'); sel.innerHTML = '<option value="">Todos os tipos</option>' + r.tipos.map((t) => `<option value="${UI.esc(t)}">${UI.esc(t)}</option>`).join(''); }
    if (!r.itens.length) { tabela.innerHTML = '<div class="empty small">Nenhum registro no histórico.</div>'; container.querySelector('#hPager').innerHTML = ''; return; }
    const linhas = r.itens.map((h) => `<tr><td>${ICONE[h.tipo] || '•'} <span class="badge">${UI.esc(h.tipo)}</span></td><td class="wrap">${UI.esc(h.descricao)}</td><td class="muted small">${UI.esc(h.usuario_login) || '—'}</td><td class="muted small">${UI.fmtDataHora(h.criado_em)}</td></tr>`).join('');
    tabela.innerHTML = `<table class="data"><thead><tr><th>Tipo</th><th>Descrição</th><th>Usuário</th><th>Quando</th></tr></thead><tbody>${linhas}</tbody></table>`;
    const totalPag = Math.max(1, Math.ceil(r.total / r.pageSize));
    container.querySelector('#hPager').innerHTML = `<div class="pager"><span class="info">${r.total} registro(s) — página ${r.page} de ${totalPag}</span><div class="spacer"></div><button class="btn btn-sm" ${r.page <= 1 ? 'disabled' : ''} id="hPrev">‹ Anterior</button><button class="btn btn-sm" ${r.page >= totalPag ? 'disabled' : ''} id="hNext">Próxima ›</button></div>`;
    const prev = container.querySelector('#hPrev'), next = container.querySelector('#hNext');
    if (prev) prev.addEventListener('click', () => { estado.page--; carregar(); });
    if (next) next.addEventListener('click', () => { estado.page++; carregar(); });
  }
  return { render };
})();

/* ------------------------------------------- Servidores de pesquisa (modal) */
function abrirServidores() {
  const { overlay } = UI.abrirModal({ titulo: 'Servidores de pesquisa', tamanho: 'lg', corpo: '<div id="srvBody"></div>' });
  const body = overlay.querySelector('#srvBody');
  const AJUDA = {
    nominatim: 'Encontram a cidade (geocodificação). O padrão é o OpenStreetMap. Você pode adicionar um serviço <strong>compatível com Nominatim</strong> e com <strong>chave de API</strong> — por exemplo o <strong>LocationIQ</strong> (mais estável, com limites maiores).',
    overpass: 'Buscam as empresas do nicho. Já vêm 3 servidores públicos globais. Adicione outros (públicos ou privados) e, se o seu exigir, uma <strong>chave de API</strong>.<br><span class="small muted">Sugestões públicas: overpass.kumi.systems · overpass.private.coffee · maps.mail.ru/osm/tools/overpass/api/interpreter · overpass.osm.jp/api/interpreter</span>',
  };
  function linha(tipo, s) {
    const chave = s.apiKey ? ' <span class="badge" title="Chave de API configurada">🔑 chave</span>' : '';
    return `<div class="srv-row" data-id="${s.id}" data-tipo="${tipo}" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
      <input type="checkbox" class="srvAtivo" ${s.ativo ? 'checked' : ''} title="Ativo" style="width:auto" />
      <div style="flex:1;min-width:0">
        <div style="font-weight:600">${UI.esc(s.nome)}${chave} ${s.builtin ? '<span class="small muted">(padrão)</span>' : ''}</div>
        <div class="small muted" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${UI.esc(s.url)}</div>
        <div class="small srvResult" style="min-height:14px"></div>
      </div>
      <button class="btn btn-sm srvTestar" type="button">Testar</button>
      <button class="btn btn-sm srvEditar" type="button">Editar</button>
      ${s.builtin ? '' : '<button class="btn btn-sm btn-danger srvRemover" type="button">Remover</button>'}
    </div>`;
  }
  function secao(tipo, titulo) {
    const itens = Config.listar(tipo).map((s) => linha(tipo, s)).join('') || '<div class="small muted">Nenhum servidor.</div>';
    const preset = tipo === 'nominatim' ? '<button class="btn btn-sm" type="button" data-preset="locationiq">+ LocationIQ (com chave)</button>' : '';
    return `<div class="panel" style="margin-bottom:14px"><div class="panel-head"><h3>${titulo}</h3></div><div class="panel-body">
      <p class="small muted" style="margin-top:0">${AJUDA[tipo]}</p>
      <div class="srvLista" data-tipo="${tipo}">${itens}</div>
      <div class="flex gap mt" style="flex-wrap:wrap;align-items:flex-end">
        <div class="field" style="flex:1;min-width:140px;margin:0"><label>Nome</label><input type="text" class="addNome" placeholder="Ex.: Meu servidor" /></div>
        <div class="field" style="flex:2;min-width:220px;margin:0"><label>URL do servidor</label><input type="text" class="addUrl" placeholder="https://..." /></div>
        <div class="field" style="width:120px;margin:0"><label>Parâm. da chave</label><input type="text" class="addKeyParam" placeholder="key" /></div>
        <div class="field" style="flex:1;min-width:140px;margin:0"><label>Chave de API</label><input type="text" class="addKey" placeholder="(opcional)" /></div>
        <button class="btn btn-primary addBtn" type="button" data-tipo="${tipo}">Adicionar</button>
        ${preset}
      </div></div></div>`;
  }
  function render() {
    body.innerHTML = `<p class="small muted" style="margin-top:0">A pesquisa tenta os servidores <strong>ativos</strong> na ordem (de cima para baixo) até um responder. Tudo fica salvo neste navegador.</p>
      ${secao('nominatim', 'Geocodificação (encontrar a cidade)')}
      ${secao('overpass', 'Overpass (buscar as empresas)')}`;
    wire();
  }
  function wire() {
    body.querySelectorAll('.srv-row').forEach((row) => {
      const tipo = row.dataset.tipo, id = Number(row.dataset.id);
      row.querySelector('.srvAtivo').addEventListener('change', (e) => Config.toggle(tipo, id, e.target.checked));
      const rem = row.querySelector('.srvRemover');
      if (rem) rem.addEventListener('click', () => { const r = Config.remover(tipo, id); if (!r.ok) UI.toast(r.erro, 'error'); render(); });
      row.querySelector('.srvEditar').addEventListener('click', async () => {
        const s = Config.listar(tipo).find((x) => x.id === id);
        const dados = await UI.formModal({ titulo: 'Editar servidor', tamanho: '', okLabel: 'Salvar', valores: s, campos: [
          { name: 'nome', label: 'Nome', type: 'text', full: true },
          { name: 'url', label: 'URL' + (s.builtin ? ' (padrão — não editável)' : ''), type: 'text', full: true },
          { name: 'keyParam', label: 'Parâmetro da chave (ex.: key)', type: 'text' },
          { name: 'apiKey', label: 'Chave de API', type: 'text' },
        ] });
        if (!dados) return;
        Config.atualizar(tipo, id, dados);
        UI.toast('Servidor atualizado.', 'success');
        render();
      });
      row.querySelector('.srvTestar').addEventListener('click', async () => {
        const s = Config.listar(tipo).find((x) => x.id === id);
        const out = row.querySelector('.srvResult');
        out.textContent = 'Testando...'; out.style.color = 'var(--text-mute)';
        const r = await Config.testar(tipo, s);
        out.textContent = (r.ok ? '✓ ' : '✗ ') + r.msg;
        out.style.color = r.ok ? 'var(--success)' : 'var(--danger)';
      });
    });
    body.querySelectorAll('.addBtn').forEach((btn) => btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo, cont = btn.closest('.panel-body');
      const url = cont.querySelector('.addUrl').value.trim();
      if (!url) { UI.toast('Informe a URL do servidor.', 'warning'); return; }
      Config.adicionar(tipo, { nome: cont.querySelector('.addNome').value, url, keyParam: cont.querySelector('.addKeyParam').value, apiKey: cont.querySelector('.addKey').value });
      UI.toast('Servidor adicionado.', 'success');
      render();
    }));
    const preset = body.querySelector('[data-preset="locationiq"]');
    if (preset) preset.addEventListener('click', async () => {
      const dados = await UI.formModal({ titulo: 'Adicionar LocationIQ', tamanho: '', okLabel: 'Adicionar', valores: { url: 'https://us1.locationiq.com/v1/search' }, campos: [
        { name: 'apiKey', label: 'Sua chave (API key) do LocationIQ', type: 'text', required: true, full: true },
        { name: 'url', label: 'Endpoint (us1 ou eu1)', type: 'text', full: true },
      ] });
      if (!dados) return;
      Config.adicionar('nominatim', { nome: 'LocationIQ', url: dados.url || 'https://us1.locationiq.com/v1/search', keyParam: 'key', apiKey: dados.apiKey });
      UI.toast('LocationIQ adicionado.', 'success');
      render();
    });
  }
  render();
}

/* ================================================================== App */
const App = (() => {
  const TITULOS = { dashboard: 'Dashboard', clientes: 'Clientes Fixos', prospeccao: 'Prospectando', pesquisa: 'Pesquisa Automática', revisao: 'Revisão', nichos: 'Nichos', historico: 'Histórico' };
  let usuario = null, viewAtual = null, configurado = false;

  async function iniciar() {
    try { const r = await API.get('/auth/me'); usuario = r.usuario; }
    catch (e) { mostrarLogin(); return; }
    document.getElementById('userName').textContent = usuario.nome || usuario.login;
    document.getElementById('userAvatar').textContent = UI.iniciais(usuario.nome || usuario.login);
    if (!configurado) { configurarNavegacao(); configurarAcoes(); configurado = true; }
    await atualizarContadores();
    const inicial = (location.hash || '#dashboard').replace('#', '');
    irPara(TITULOS[inicial] ? inicial : 'dashboard');
  }
  function configurarNavegacao() {
    document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => irPara(item.dataset.view)));
    window.addEventListener('hashchange', () => { const v = location.hash.replace('#', ''); if (TITULOS[v] && v !== viewAtual) irPara(v); });
    const toggle = document.getElementById('menuToggle'), sidebar = document.getElementById('sidebar');
    toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.getElementById('view').addEventListener('click', () => sidebar.classList.remove('open'));
  }
  function configurarAcoes() {
    document.getElementById('btnLogout').addEventListener('click', logout);
    document.getElementById('btnBackup').addEventListener('click', backup);
    document.getElementById('btnSenha').addEventListener('click', trocarSenha);
  }
  async function irPara(nome) {
    if (!TITULOS[nome]) nome = 'dashboard';
    viewAtual = nome; location.hash = nome;
    document.querySelectorAll('.nav-item').forEach((i) => i.classList.toggle('active', i.dataset.view === nome));
    document.getElementById('pageTitle').textContent = TITULOS[nome];
    const container = document.getElementById('view');
    container.innerHTML = '';
    const view = window.Views && window.Views[nome];
    if (!view) { container.innerHTML = `<div class="empty">Tela "${nome}" não encontrada.</div>`; return; }
    try { await view.render(container, { usuario, app: App }); }
    catch (err) { console.error(err); container.innerHTML = `<div class="alert alert-warn">Erro ao carregar a tela: ${UI.esc(err.message)}</div>`; }
  }
  async function atualizarContadores() {
    try {
      const r = await API.get('/stats'); const s = r.stats;
      setCount('cntClientes', s.clientes); setCount('cntProspeccao', s.prospeccao); setCount('cntRevisao', s.resultadosPendentes); setCount('cntNichos', s.nichos);
    } catch (_) {}
  }
  function setCount(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
  async function logout() {
    if (!(await UI.confirmar('Deseja realmente sair?', { titulo: 'Sair', okLabel: 'Sair' }))) return;
    try { await API.post('/auth/logout'); } catch (_) {}
    mostrarLogin();
  }
  async function backup() {
    const corpo = `<p class="small muted">Seus dados ficam salvos neste navegador. Faça um <strong>backup</strong> para guardar em arquivo ou transferir para outro computador.</p>
      <div class="flex gap mt" style="flex-wrap:wrap">
        <button class="btn btn-primary" id="bkBaixar">Baixar backup (.json)</button>
        <button class="btn" id="bkRestaurar">Restaurar de arquivo</button>
      </div>
      <input type="file" id="bkFile" accept=".json" class="hidden" />
      <p class="small muted mt">A restauração substitui todos os dados atuais pelos do arquivo.</p>`;
    const { overlay, fechar } = UI.abrirModal({ titulo: 'Backup e restauração', corpo });
    overlay.querySelector('#bkBaixar').addEventListener('click', async () => { try { await API.post('/backup'); UI.toast('Backup gerado com sucesso.', 'success', 'Backup'); } catch (e) { UI.toast(e.message, 'error'); } });
    overlay.querySelector('#bkRestaurar').addEventListener('click', () => overlay.querySelector('#bkFile').click());
    overlay.querySelector('#bkFile').addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          Store.importarJSON(String(reader.result));
          const db = Store.get(); db.logado = true; Store.salvar();
          fechar();
          usuario = { login: db.usuario.login, nome: db.usuario.nome };
          document.getElementById('userName').textContent = usuario.nome || usuario.login;
          document.getElementById('userAvatar').textContent = UI.iniciais(usuario.nome || usuario.login);
          await atualizarContadores();
          irPara('dashboard');
          UI.toast('Backup restaurado com sucesso.', 'success', 'Restaurar');
        } catch (err) { UI.toast(err.message, 'error', 'Restaurar'); }
      };
      reader.readAsText(file, 'utf-8');
    });
  }
  async function trocarSenha() {
    const dados = await UI.formModal({ titulo: 'Alterar senha', tamanho: '', campos: [{ name: 'senhaAtual', label: 'Senha atual', type: 'password', required: true, full: true }, { name: 'senhaNova', label: 'Nova senha', type: 'password', required: true, full: true }], okLabel: 'Alterar' });
    if (!dados) return;
    try { await API.post('/auth/change-password', dados); UI.toast('Senha alterada com sucesso.', 'success'); } catch (err) { UI.toast(err.message, 'error'); }
  }
  return { iniciar, irPara, atualizarContadores, get usuario() { return usuario; } };
})();

/* ------------------------------------------------------- Login e boot */
function mostrarApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = '';
  App.iniciar();
}
function mostrarLogin() {
  document.getElementById('appScreen').style.display = 'none';
  const ls = document.getElementById('loginScreen');
  ls.style.display = '';
  const err = document.getElementById('loginError'); if (err) err.classList.remove('show');
  const li = document.getElementById('login'); if (li) { li.value = ''; setTimeout(() => li.focus(), 60); }
  const se = document.getElementById('senha'); if (se) se.value = '';
}
function configurarLogin() {
  const form = document.getElementById('loginForm');
  const erroBox = document.getElementById('loginError');
  const btn = document.getElementById('btnEntrar');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    erroBox.classList.remove('show');
    const login = document.getElementById('login').value.trim();
    const senha = document.getElementById('senha').value;
    if (!login || !senha) return;
    const db = Store.get();
    const ok = login.toLowerCase() === String(db.usuario.login).toLowerCase() && hashSenha(senha) === db.usuario.senha;
    if (!ok) { erroBox.textContent = 'Login ou senha inválidos.'; erroBox.classList.add('show'); return; }
    db.logado = true; Store.salvar();
    registrarHistorico('login', `Login de ${db.usuario.login}`, {});
    mostrarApp();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  window.UI = UI; window.API = API; window.App = App; window.Store = Store; window.Config = Config;
  Store.carregar();
  configurarLogin();
  if (Store.get().logado) mostrarApp();
  else mostrarLogin();
});
