'use strict';

window.Views = window.Views || {};

window.Views.nichos = (() => {
  let container = null;
  const estado = { search: '', categoria: '' };

  async function render(el) {
    container = el;
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <div class="toolbar" style="flex:1">
            <div class="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" id="nSearch" placeholder="Pesquisar nicho (ex.: padaria, oficina, advogado)..." />
            </div>
            <select id="nCategoria"><option value="">Todas as categorias</option></select>
          </div>
        </div>
        <div class="panel-body" id="nLista"></div>
      </div>
      <div class="alert alert-info">
        A base contém <strong id="nTotal">—</strong> nichos prontos para uso. Você também pode digitar
        <strong>qualquer termo livre</strong> na Pesquisa Automática — nichos fora da base são buscados por nome.
        Clique em um nicho para iniciar uma pesquisa com ele.
      </div>`;

    el.querySelector('#nSearch').addEventListener('input', UI.debounce((e) => { estado.search = e.target.value.trim(); carregar(); }, 300));
    el.querySelector('#nCategoria').addEventListener('change', (e) => { estado.categoria = e.target.value; carregar(); });
    await carregar(true);
  }

  async function carregar(primeira) {
    const lista = container.querySelector('#nLista');
    lista.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({ search: estado.search, categoria: estado.categoria });
    const r = await API.get('/nichos?' + q.toString());

    if (primeira) {
      const sel = container.querySelector('#nCategoria');
      sel.innerHTML = '<option value="">Todas as categorias</option>' + r.categorias.map((c) => `<option>${UI.esc(c)}</option>`).join('');
      container.querySelector('#nTotal').textContent = r.total;
    }

    if (!r.itens.length) {
      lista.innerHTML = '<div class="empty small">Nenhum nicho encontrado. Você ainda pode usar este termo livre na Pesquisa Automática.</div>';
      return;
    }

    // Agrupa por categoria.
    const grupos = {};
    r.itens.forEach((n) => { (grupos[n.categoria] = grupos[n.categoria] || []).push(n); });
    lista.innerHTML = Object.keys(grupos).sort().map((cat) => `
      <div style="margin-bottom:16px">
        <div class="small muted" style="text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">${UI.esc(cat)}</div>
        <div>${grupos[cat].map((n) => `<span class="chip" data-nicho="${UI.esc(n.nome)}">${UI.esc(n.nome)}</span>`).join('')}</div>
      </div>`).join('');

    lista.querySelectorAll('[data-nicho]').forEach((c) => c.addEventListener('click', () => {
      sessionStorage.setItem('nichoPreselecionado', c.dataset.nicho);
      App.irPara('pesquisa');
      setTimeout(() => {
        const inp = document.getElementById('qNicho');
        if (inp) { inp.value = c.dataset.nicho; inp.focus(); }
      }, 200);
    }));
  }

  return { render };
})();
