'use strict';

window.Views = window.Views || {};

window.Views.dashboard = {
  async render(el) {
    el.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    let data;
    try {
      data = await API.get('/stats');
    } catch (err) {
      el.innerHTML = `<div class="alert alert-warn">Não foi possível carregar os indicadores: ${UI.esc(err.message)}</div>`;
      return;
    }
    const s = data.stats;

    const card = (val, label, cor, icon) => `
      <div class="card stat-card">
        <div class="stat-ico" style="background:${cor}22;color:${cor}">${icon}</div>
        <div>
          <div class="stat-val">${val}</div>
          <div class="stat-label">${label}</div>
        </div>
      </div>`;

    const ICON = {
      users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
      trend: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
      check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
      inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
      tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>',
    };

    const totalStatus = data.porStatus.reduce((a, b) => a + b.n, 0) || 1;
    const barras = data.porStatus
      .map((r) => {
        const pct = ((r.n / totalStatus) * 100).toFixed(0);
        return `<div style="margin-bottom:10px">
          <div class="flex" style="justify-content:space-between;margin-bottom:4px">
            <span class="badge ${r.status.toLowerCase()}">${UI.esc(r.status)}</span>
            <span class="small muted">${r.n} (${pct}%)</span>
          </div>
          <div class="prob-bar" style="width:100%"><span style="width:${pct}%"></span></div>
        </div>`;
      })
      .join('') || '<div class="empty small">Sem dados de prospecção ainda.</div>';

    const ultimas = data.ultimasPesquisas
      .map(
        (p) => `<tr>
          <td>${UI.esc(p.nicho)}</td>
          <td>${UI.esc(p.cidade)}${p.estado ? '/' + UI.esc(p.estado) : ''}</td>
          <td>${p.total_novo}</td>
          <td class="muted small">${UI.fmtDataHora(p.criado_em)}</td>
        </tr>`
      )
      .join('') || '<tr><td colspan="4" class="empty small">Nenhuma pesquisa realizada ainda.</td></tr>';

    el.innerHTML = `
      <div class="cards">
        ${card(s.clientes, 'Clientes Fixos', '#2dd4a7', ICON.users)}
        ${card(s.prospeccao, 'Em Prospecção', '#4895ef', ICON.trend)}
        ${card(s.prospeccaoNegociando, 'Em Negociação', '#f7b955', ICON.trend)}
        ${card(s.prospeccaoFechado, 'Negócios Fechados', '#2dd4a7', ICON.check)}
        ${card(s.pesquisas, 'Pesquisas Feitas', '#56b4ff', ICON.search)}
        ${card(s.resultadosPendentes, 'Aguardando Revisão', '#4361ee', ICON.inbox)}
        ${card(s.nichos, 'Nichos Disponíveis', '#a78bfa', ICON.tag)}
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h3>Prospecção por Status</h3></div>
          <div class="panel-body">${barras}</div>
        </div>
        <div class="panel">
          <div class="panel-head"><h3>Últimas Pesquisas</h3></div>
          <div class="table-wrap">
            <table class="data">
              <thead><tr><th>Nicho</th><th>Local</th><th>Novos</th><th>Quando</th></tr></thead>
              <tbody>${ultimas}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head"><h3>Atalhos</h3></div>
        <div class="panel-body flex gap" style="flex-wrap:wrap">
          <button class="btn btn-primary" onclick="App.irPara('pesquisa')">Nova Pesquisa Automática</button>
          <button class="btn" onclick="App.irPara('clientes')">Ver Clientes</button>
          <button class="btn" onclick="App.irPara('prospeccao')">Ver Prospecção</button>
          <button class="btn" onclick="App.irPara('revisao')">Ir para Revisão</button>
        </div>
      </div>`;
  },
};
