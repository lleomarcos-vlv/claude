'use strict';

window.Views = window.Views || {};

window.Views.historico = (() => {
  let container = null;
  const estado = { tipo: '', page: 1, pageSize: 50 };

  const ICONE_TIPO = {
    login: '🔑', pesquisa: '🔍', importacao: '📥', exclusao: '🗑️',
    alteracao: '✏️', movimentacao: '🔀', erro: '⚠️',
  };

  async function render(el) {
    container = el;
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <h3>Histórico de Atividades</h3>
          <div class="spacer"></div>
          <select id="hTipo"><option value="">Todos os tipos</option></select>
        </div>
        <div class="table-wrap" id="hTabela"></div>
        <div id="hPager"></div>
      </div>`;
    el.querySelector('#hTipo').addEventListener('change', (e) => { estado.tipo = e.target.value; estado.page = 1; carregar(); });
    await carregar(true);
  }

  async function carregar(primeira) {
    const tabela = container.querySelector('#hTabela');
    tabela.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({ tipo: estado.tipo, page: estado.page, pageSize: estado.pageSize });
    const r = await API.get('/historico?' + q.toString());

    if (primeira) {
      const sel = container.querySelector('#hTipo');
      sel.innerHTML = '<option value="">Todos os tipos</option>' + r.tipos.map((t) => `<option value="${UI.esc(t)}">${UI.esc(t)}</option>`).join('');
    }

    if (!r.itens.length) {
      tabela.innerHTML = '<div class="empty small">Nenhum registro no histórico.</div>';
      container.querySelector('#hPager').innerHTML = '';
      return;
    }

    const linhas = r.itens.map((h) => `<tr>
      <td>${ICONE_TIPO[h.tipo] || '•'} <span class="badge">${UI.esc(h.tipo)}</span></td>
      <td class="wrap">${UI.esc(h.descricao)}</td>
      <td class="muted small">${UI.esc(h.usuario_login) || '—'}</td>
      <td class="muted small">${UI.fmtDataHora(h.criado_em)}</td>
    </tr>`).join('');
    tabela.innerHTML = `<table class="data">
      <thead><tr><th>Tipo</th><th>Descrição</th><th>Usuário</th><th>Quando</th></tr></thead>
      <tbody>${linhas}</tbody></table>`;

    const totalPag = Math.max(1, Math.ceil(r.total / r.pageSize));
    container.querySelector('#hPager').innerHTML = `<div class="pager">
      <span class="info">${r.total} registro(s) — página ${r.page} de ${totalPag}</span>
      <div class="spacer"></div>
      <button class="btn btn-sm" ${r.page <= 1 ? 'disabled' : ''} id="hPrev">‹ Anterior</button>
      <button class="btn btn-sm" ${r.page >= totalPag ? 'disabled' : ''} id="hNext">Próxima ›</button>
    </div>`;
    const prev = container.querySelector('#hPrev');
    const next = container.querySelector('#hNext');
    if (prev) prev.addEventListener('click', () => { estado.page--; carregar(); });
    if (next) next.addEventListener('click', () => { estado.page++; carregar(); });
  }

  return { render };
})();
