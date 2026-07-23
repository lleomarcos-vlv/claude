'use strict';

window.Views = window.Views || {};

window.Views.revisao = (() => {
  let container = null;
  let pesquisaSel = null;
  const filtro = { status: 'novo', search: '', sort: 'id', order: 'ASC' };

  async function render(el) {
    container = el;
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head"><h3>Pesquisas Realizadas</h3><div class="spacer"></div>
          <button class="btn btn-sm btn-primary" onclick="App.irPara('pesquisa')">+ Nova Pesquisa</button>
        </div>
        <div class="table-wrap" id="listaPesquisas"></div>
      </div>
      <div id="painelResultados"></div>`;
    await carregarPesquisas();
  }

  async function carregarPesquisas() {
    const lista = container.querySelector('#listaPesquisas');
    lista.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const r = await API.get('/pesquisa');
    if (!r.itens.length) {
      lista.innerHTML = `<div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
        <div>Nenhuma pesquisa ainda.</div>
        <button class="btn btn-primary mt" onclick="App.irPara('pesquisa')">Fazer primeira pesquisa</button>
      </div>`;
      return;
    }
    const linhas = r.itens.map((p) => `<tr>
      <td>${UI.esc(p.nicho)}</td>
      <td>${UI.esc(p.cidade)}${p.estado ? '/' + UI.esc(p.estado) : ''}</td>
      <td>${p.total_encontrado}</td>
      <td><strong>${p.pendentes}</strong></td>
      <td>${statusPesquisa(p)}</td>
      <td class="muted small">${UI.fmtDataHora(p.criado_em)}</td>
      <td class="actions"><button class="btn btn-sm btn-primary" data-ver="${p.id}">Ver resultados</button></td>
    </tr>`).join('');
    lista.innerHTML = `<table class="data">
      <thead><tr><th>Nicho</th><th>Local</th><th>Total</th><th>Pendentes</th><th>Status</th><th>Quando</th><th></th></tr></thead>
      <tbody>${linhas}</tbody></table>`;
    lista.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => abrirResultados(Number(b.dataset.ver), r.itens.find((x) => x.id === Number(b.dataset.ver)))));
  }

  function statusPesquisa(p) {
    if (p.status === 'falha') return `<span class="badge perdido" title="${UI.esc(p.mensagem || '')}">falha</span>`;
    return `<span class="badge fechado">${UI.esc(p.fonte || 'ok')}</span>`;
  }

  async function abrirResultados(id, pesquisa) {
    pesquisaSel = pesquisa || { id };
    filtro.status = 'novo';
    filtro.search = '';
    await carregarResultados();
    container.querySelector('#painelResultados').scrollIntoView({ behavior: 'smooth' });
  }

  async function carregarResultados() {
    const painel = container.querySelector('#painelResultados');
    painel.innerHTML = `
      <div class="panel">
        <div class="panel-head" style="flex-wrap:wrap;gap:10px">
          <h3>Resultados — ${UI.esc(pesquisaSel.nicho || '')} ${pesquisaSel.cidade ? 'em ' + UI.esc(pesquisaSel.cidade) : ''}</h3>
          <div class="spacer"></div>
          <div class="search" style="max-width:240px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" id="rSearch" placeholder="Filtrar resultados..." />
          </div>
          <select id="rStatus">
            <option value="novo">Pendentes</option>
            <option value="">Todos</option>
            <option value="movido">Movidos</option>
            <option value="descartado">Descartados</option>
          </select>
        </div>
        <div class="panel-body" style="padding:12px 18px">
          <div class="toolbar">
            <label class="flex gap" style="align-items:center;margin:0"><input type="checkbox" id="selAll" /> Selecionar todos</label>
            <div class="spacer"></div>
            <button class="btn btn-sm btn-success" id="bMover">→ Mover selecionados para Prospecção</button>
            <button class="btn btn-sm" id="bDescartar">Descartar</button>
            <button class="btn btn-sm btn-danger" id="bExcluir">Excluir</button>
          </div>
        </div>
        <div class="table-wrap" id="rTabela"></div>
      </div>`;

    painel.querySelector('#rSearch').addEventListener('input', UI.debounce((e) => { filtro.search = e.target.value.trim(); listar(); }, 300));
    painel.querySelector('#rStatus').addEventListener('change', (e) => { filtro.status = e.target.value; listar(); });
    painel.querySelector('#selAll').addEventListener('change', (e) => {
      painel.querySelectorAll('.rowChk').forEach((c) => (c.checked = e.target.checked));
    });
    painel.querySelector('#bMover').addEventListener('click', () => acaoLote('mover'));
    painel.querySelector('#bDescartar').addEventListener('click', () => acaoLote('descartar'));
    painel.querySelector('#bExcluir').addEventListener('click', () => acaoLote('excluir'));

    await listar();
  }

  async function listar() {
    const tabela = container.querySelector('#rTabela');
    tabela.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({ status: filtro.status, search: filtro.search, sort: filtro.sort, order: filtro.order });
    const r = await API.get(`/pesquisa/${pesquisaSel.id}/resultados?` + q.toString());
    if (!r.itens.length) {
      tabela.innerHTML = '<div class="empty small">Nenhum resultado neste filtro.</div>';
      return;
    }
    const linhas = r.itens.map((x) => {
      const wa = UI.waLink(x.whatsapp || x.telefone);
      const bStatus = x.status === 'novo' ? '' : `<span class="badge ${x.status === 'movido' ? 'fechado' : 'perdido'}">${x.status}</span>`;
      return `<tr>
        <td class="checkbox-cell">${x.status === 'novo' ? `<input type="checkbox" class="rowChk" value="${x.id}" />` : ''}</td>
        <td>${UI.esc(x.nome)} ${bStatus}</td>
        <td>${UI.esc(x.telefone) || '—'}</td>
        <td>${UI.esc(x.cidade) || '—'}</td>
        <td class="wrap muted small">${UI.esc(x.endereco) || '—'}</td>
        <td>${x.site ? `<a href="${/^https?:/.test(x.site) ? UI.esc(x.site) : 'https://' + UI.esc(x.site)}" target="_blank">site</a>` : '—'}</td>
        <td class="actions"><div class="row-actions">
          ${wa ? `<a class="btn btn-sm btn-whatsapp" href="${wa}" target="_blank">Whats</a>` : ''}
          <button class="btn btn-sm" data-ver="${x.id}">Ver</button>
          ${x.status === 'novo' ? `<button class="btn btn-sm btn-success" data-add="${x.id}">+ Prospecção</button>` : ''}
        </div></td>
      </tr>`;
    }).join('');
    tabela.innerHTML = `<table class="data">
      <thead><tr><th class="checkbox-cell"></th><th>Nome</th><th>Telefone</th><th>Cidade</th><th>Endereço</th><th>Site</th><th>Ações</th></tr></thead>
      <tbody>${linhas}</tbody></table>`;

    const dados = {}; r.itens.forEach((x) => (dados[x.id] = x));
    tabela.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => visualizar(dados[b.dataset.ver])));
    tabela.querySelectorAll('[data-add]').forEach((b) => b.addEventListener('click', () => mover([Number(b.dataset.add)])));
  }

  function selecionados() {
    return Array.from(container.querySelectorAll('.rowChk:checked')).map((c) => Number(c.value));
  }

  async function acaoLote(tipo) {
    const ids = selecionados();
    if (!ids.length) { UI.toast('Selecione ao menos um resultado.', 'warning'); return; }
    if (tipo === 'mover') return mover(ids);
    if (tipo === 'descartar') {
      if (!(await UI.confirmar(`Descartar ${ids.length} resultado(s)?`, { titulo: 'Descartar' }))) return;
      try { await API.post('/pesquisa/descartar', { ids }); UI.toast('Resultados descartados.', 'success'); await listar(); App.atualizarContadores(); } catch (e) { UI.toast(e.message, 'error'); }
    }
    if (tipo === 'excluir') {
      if (!(await UI.confirmar(`Excluir DEFINITIVAMENTE ${ids.length} resultado(s)?`, { titulo: 'Excluir', perigo: true, okLabel: 'Excluir' }))) return;
      try { await API.post('/pesquisa/excluir', { ids }); UI.toast('Resultados excluídos.', 'success'); await listar(); App.atualizarContadores(); } catch (e) { UI.toast(e.message, 'error'); }
    }
  }

  async function mover(ids) {
    try {
      const r = await API.post('/pesquisa/mover', { ids });
      UI.toast(`${r.movidos} movido(s) para Prospecção. ${r.ignorados ? r.ignorados + ' ignorado(s) por duplicidade.' : ''}`, 'success', 'Mover');
      await listar();
      App.atualizarContadores();
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  function visualizar(x) {
    if (!x) return;
    const linha = (rot, val) => val ? `<div class="field" style="margin-bottom:8px"><label>${rot}</label><div>${UI.esc(val)}</div></div>` : '';
    const wa = UI.waLink(x.whatsapp || x.telefone);
    UI.abrirModal({
      titulo: x.nome,
      corpo: `<div class="grid-2">
        ${linha('Telefone', x.telefone)}${linha('WhatsApp', x.whatsapp)}
        ${linha('Cidade', x.cidade)}${linha('Estado', x.estado)}
        ${linha('Instagram', x.instagram)}${linha('E-mail', x.email)}
        ${linha('Endereço', x.endereco)}${linha('Categoria', x.categoria)}
        ${linha('Horário', x.horario)}${linha('Origem', x.origem)}
        ${x.latitude ? linha('Coordenadas', `${x.latitude}, ${x.longitude}`) : ''}
      </div>
      ${x.site ? `<p><a href="${/^https?:/.test(x.site) ? UI.esc(x.site) : 'https://' + UI.esc(x.site)}" target="_blank">Abrir site</a></p>` : ''}
      ${x.url_origem ? `<p class="small"><a href="${UI.esc(x.url_origem)}" target="_blank">Ver fonte (OpenStreetMap)</a></p>` : ''}
      <div class="flex gap mt">
        ${wa ? `<a class="btn btn-whatsapp" href="${wa}" target="_blank">Abrir WhatsApp</a>` : ''}
        ${x.status === 'novo' ? `<button class="btn btn-success" id="mvOne">+ Adicionar à Prospecção</button>` : ''}
      </div>`,
    });
    const b = document.getElementById('mvOne');
    if (b) b.addEventListener('click', () => { document.querySelector('.modal-overlay .close').click(); mover([x.id]); });
  }

  return { render };
})();
