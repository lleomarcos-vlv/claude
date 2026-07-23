'use strict';

window.Views = window.Views || {};

window.Views.clientes = (() => {
  const estado = { search: '', sort: 'nome', order: 'ASC', page: 1, pageSize: 50 };
  let container = null;

  const CAMPOS = [
    { name: 'nome', label: 'Nome', type: 'text', required: true },
    { name: 'telefone', label: 'Telefone', type: 'text' },
    { name: 'whatsapp', label: 'WhatsApp', type: 'text' },
    { name: 'cidade', label: 'Cidade', type: 'text' },
    { name: 'instagram', label: 'Instagram', type: 'text' },
    { name: 'site', label: 'Site', type: 'text' },
    { name: 'email', label: 'E-mail', type: 'email' },
    { name: 'ultimo_contato', label: 'Último contato', type: 'date' },
    { name: 'observacoes', label: 'Observações', type: 'textarea', full: true, rows: 3 },
  ];

  async function render(el) {
    container = el;
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head">
          <div class="toolbar" style="flex:1">
            <div class="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" id="cliSearch" placeholder="Pesquisar por nome, cidade, telefone, e-mail..." />
            </div>
            <button class="btn btn-primary" id="cliNovo">+ Novo Cliente</button>
            <button class="btn" id="cliImportar">Importar Meus Clientes</button>
            <div class="flex gap">
              <button class="btn btn-sm" data-exp="xlsx">Excel</button>
              <button class="btn btn-sm" data-exp="csv">CSV</button>
              <button class="btn btn-sm" data-exp="pdf">PDF</button>
            </div>
          </div>
        </div>
        <div class="table-wrap" id="cliTabela"></div>
        <div id="cliPager"></div>
      </div>
      <input type="file" id="cliFile" accept=".csv,.xls,.xlsx" class="hidden" />`;

    el.querySelector('#cliSearch').addEventListener('input', UI.debounce((e) => {
      estado.search = e.target.value.trim();
      estado.page = 1;
      carregar();
    }, 350));
    el.querySelector('#cliNovo').addEventListener('click', () => editar(null));
    el.querySelector('#cliImportar').addEventListener('click', () => el.querySelector('#cliFile').click());
    el.querySelector('#cliFile').addEventListener('change', importar);
    el.querySelectorAll('[data-exp]').forEach((b) =>
      b.addEventListener('click', () => API.download(`/clientes/export?format=${b.dataset.exp}`))
    );

    await carregar();
  }

  async function carregar() {
    const tabela = container.querySelector('#cliTabela');
    tabela.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({
      search: estado.search, sort: estado.sort, order: estado.order,
      page: estado.page, pageSize: estado.pageSize,
    });
    const r = await API.get('/clientes?' + q.toString());
    render_tabela(r);
    render_pager(r);
  }

  function th(campo, label) {
    const ativo = estado.sort === campo;
    const seta = ativo ? (estado.order === 'ASC' ? ' ▲' : ' ▼') : '';
    return `<th class="sortable" data-sort="${campo}">${label}${seta}</th>`;
  }

  function render_tabela(r) {
    const tabela = container.querySelector('#cliTabela');
    if (!r.itens.length) {
      tabela.innerHTML = `<div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <div>Nenhum cliente encontrado.</div>
        <button class="btn btn-primary mt" onclick="Views.clientes.novo()">Cadastrar primeiro cliente</button>
      </div>`;
      return;
    }
    const linhas = r.itens.map((c) => {
      const wa = UI.waLink(c.whatsapp || c.telefone);
      return `<tr>
        <td>${UI.esc(c.nome)}</td>
        <td>${UI.esc(c.telefone) || '—'}</td>
        <td>${UI.esc(c.cidade) || '—'}</td>
        <td>${c.instagram ? `<a href="https://instagram.com/${UI.esc(c.instagram.replace(/^@/,''))}" target="_blank">@${UI.esc(c.instagram.replace(/^@/,''))}</a>` : '—'}</td>
        <td>${c.site ? `<a href="${/^https?:/.test(c.site) ? UI.esc(c.site) : 'https://' + UI.esc(c.site)}" target="_blank">site</a>` : '—'}</td>
        <td class="muted small">${UI.fmtData(c.ultimo_contato)}</td>
        <td class="actions"><div class="row-actions">
          ${wa ? `<a class="btn btn-sm btn-whatsapp" href="${wa}" target="_blank" title="Abrir WhatsApp">WhatsApp</a>` : ''}
          <button class="btn btn-sm" data-edit="${c.id}" title="Editar">Editar</button>
          <button class="btn btn-sm btn-danger" data-del="${c.id}" title="Excluir">Excluir</button>
        </div></td>
      </tr>`;
    }).join('');

    tabela.innerHTML = `<table class="data">
      <thead><tr>
        ${th('nome', 'Nome')}${th('telefone', 'Telefone')}${th('cidade', 'Cidade')}
        <th>Instagram</th><th>Site</th>${th('ultimo_contato', 'Último Contato')}<th>Ações</th>
      </tr></thead>
      <tbody>${linhas}</tbody></table>`;

    tabela.querySelectorAll('th.sortable').forEach((t) =>
      t.addEventListener('click', () => {
        const campo = t.dataset.sort;
        if (estado.sort === campo) estado.order = estado.order === 'ASC' ? 'DESC' : 'ASC';
        else { estado.sort = campo; estado.order = 'ASC'; }
        carregar();
      })
    );
    tabela.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => editar(Number(b.dataset.edit))));
    tabela.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => excluir(Number(b.dataset.del))));
  }

  function render_pager(r) {
    const pager = container.querySelector('#cliPager');
    const totalPag = Math.max(1, Math.ceil(r.total / r.pageSize));
    pager.innerHTML = `<div class="pager">
      <span class="info">${r.total} cliente(s) — página ${r.page} de ${totalPag}</span>
      <div class="spacer"></div>
      <button class="btn btn-sm" ${r.page <= 1 ? 'disabled' : ''} id="pgPrev">‹ Anterior</button>
      <button class="btn btn-sm" ${r.page >= totalPag ? 'disabled' : ''} id="pgNext">Próxima ›</button>
    </div>`;
    const prev = pager.querySelector('#pgPrev');
    const next = pager.querySelector('#pgNext');
    if (prev) prev.addEventListener('click', () => { estado.page--; carregar(); });
    if (next) next.addEventListener('click', () => { estado.page++; carregar(); });
  }

  async function editar(id) {
    let valores = {};
    if (id) {
      try { valores = await API.get('/clientes/' + id); } catch (e) { UI.toast(e.message, 'error'); return; }
    }
    const dados = await UI.formModal({
      titulo: id ? 'Editar Cliente' : 'Novo Cliente',
      campos: CAMPOS,
      valores,
      okLabel: id ? 'Salvar alterações' : 'Cadastrar',
    });
    if (!dados) return;
    try {
      if (id) await API.put('/clientes/' + id, dados);
      else await API.post('/clientes', dados);
      UI.toast(id ? 'Cliente atualizado.' : 'Cliente cadastrado.', 'success');
      await carregar();
      App.atualizarContadores();
    } catch (err) {
      if (err.status === 409) {
        const forcar = await UI.confirmar(`${err.message}\n\nDeseja cadastrar mesmo assim?`, { titulo: 'Possível duplicado', okLabel: 'Cadastrar assim mesmo' });
        if (forcar) {
          try { await API.post('/clientes', { ...dados, forcar: true }); UI.toast('Cliente cadastrado.', 'success'); await carregar(); App.atualizarContadores(); }
          catch (e2) { UI.toast(e2.message, 'error'); }
        }
      } else UI.toast(err.message, 'error');
    }
  }

  async function excluir(id) {
    if (!(await UI.confirmar('Excluir este cliente? Esta ação não pode ser desfeita.', { titulo: 'Excluir', perigo: true, okLabel: 'Excluir' }))) return;
    try {
      await API.del('/clientes/' + id);
      UI.toast('Cliente excluído.', 'success');
      await carregar();
      App.atualizarContadores();
    } catch (err) { UI.toast(err.message, 'error'); }
  }

  async function importar(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    UI.loading(true, 'Importando planilha...');
    UI.progress(15);
    try {
      const r = await API.upload('/clientes/import', file);
      UI.progress(100);
      UI.toast(`Importação concluída: ${r.inseridos} inseridos, ${r.duplicados} duplicados, ${r.invalidos} inválidos (de ${r.total}).`, 'success', 'Importar');
      if (r.erros && r.erros.length) mostrarErros(r);
      await carregar();
      App.atualizarContadores();
    } catch (err) {
      UI.toast(err.message, 'error', 'Importar');
    } finally {
      UI.loading(false);
    }
  }

  function mostrarErros(r) {
    const linhas = r.erros.map((e) => `<tr><td>${e.linha}</td><td>${UI.esc(e.motivo)}</td></tr>`).join('');
    UI.abrirModal({
      titulo: `Detalhes da importação (${r.inseridos}/${r.total})`,
      corpo: `<p class="small muted">Algumas linhas não foram importadas:</p>
        <div class="table-wrap"><table class="data"><thead><tr><th>Linha</th><th>Motivo</th></tr></thead><tbody>${linhas}</tbody></table></div>`,
    });
  }

  return { render, novo: () => editar(null) };
})();
