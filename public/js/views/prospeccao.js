'use strict';

window.Views = window.Views || {};

window.Views.prospeccao = (() => {
  const estado = {
    search: '', cidade: '', estado: '', nicho: '', status: '', probMin: '',
    sort: 'empresa', order: 'ASC', page: 1, pageSize: 50,
  };
  let container = null;
  let statusValidos = ['Novo', 'Contatado', 'Negociando', 'Proposta', 'Fechado', 'Perdido'];

  function campos() {
    return [
      { name: 'empresa', label: 'Empresa', type: 'text', required: true },
      { name: 'cidade', label: 'Cidade', type: 'text' },
      { name: 'estado', label: 'Estado (UF)', type: 'text' },
      { name: 'nicho', label: 'Nicho', type: 'text' },
      { name: 'telefone', label: 'Telefone', type: 'text' },
      { name: 'whatsapp', label: 'WhatsApp', type: 'text' },
      { name: 'instagram', label: 'Instagram', type: 'text' },
      { name: 'site', label: 'Site', type: 'text' },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'responsavel', label: 'Responsável', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: statusValidos },
      { name: 'origem', label: 'Origem', type: 'text' },
      { name: 'probabilidade', label: 'Probabilidade de fechamento', type: 'range' },
      { name: 'ultimo_contato', label: 'Último contato', type: 'date' },
      { name: 'observacoes', label: 'Observações', type: 'textarea', full: true, rows: 3 },
    ];
  }

  async function render(el) {
    container = el;
    el.innerHTML = `
      <div class="panel">
        <div class="panel-head" style="flex-direction:column;align-items:stretch;gap:10px">
          <div class="toolbar">
            <div class="search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" id="pSearch" placeholder="Pesquisar empresa, telefone, responsável..." />
            </div>
            <button class="btn btn-primary" id="pNovo">+ Nova Empresa</button>
            <button class="btn" id="pImportar">Importar</button>
            <div class="flex gap">
              <button class="btn btn-sm" data-exp="xlsx">Excel</button>
              <button class="btn btn-sm" data-exp="csv">CSV</button>
              <button class="btn btn-sm" data-exp="pdf">PDF</button>
            </div>
          </div>
          <div class="toolbar">
            <input type="text" id="fCidade" placeholder="Cidade" />
            <input type="text" id="fEstado" placeholder="UF" style="max-width:80px" />
            <input type="text" id="fNicho" placeholder="Nicho" />
            <select id="fStatus"><option value="">Todos os status</option>${statusValidos.map((s) => `<option>${s}</option>`).join('')}</select>
            <select id="fProb">
              <option value="">Qualquer probabilidade</option>
              <option value="25">≥ 25%</option><option value="50">≥ 50%</option>
              <option value="75">≥ 75%</option><option value="90">≥ 90%</option>
            </select>
            <button class="btn btn-sm btn-ghost" id="fLimpar">Limpar filtros</button>
          </div>
        </div>
        <div class="table-wrap" id="pTabela"></div>
        <div id="pPager"></div>
      </div>
      <input type="file" id="pFile" accept=".csv,.xls,.xlsx" class="hidden" />`;

    el.querySelector('#pSearch').addEventListener('input', UI.debounce((e) => { estado.search = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#fCidade').addEventListener('input', UI.debounce((e) => { estado.cidade = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#fEstado').addEventListener('input', UI.debounce((e) => { estado.estado = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#fNicho').addEventListener('input', UI.debounce((e) => { estado.nicho = e.target.value.trim(); estado.page = 1; carregar(); }, 350));
    el.querySelector('#fStatus').addEventListener('change', (e) => { estado.status = e.target.value; estado.page = 1; carregar(); });
    el.querySelector('#fProb').addEventListener('change', (e) => { estado.probMin = e.target.value; estado.page = 1; carregar(); });
    el.querySelector('#fLimpar').addEventListener('click', () => {
      Object.assign(estado, { search: '', cidade: '', estado: '', nicho: '', status: '', probMin: '', page: 1 });
      el.querySelector('#pSearch').value = ''; el.querySelector('#fCidade').value = '';
      el.querySelector('#fEstado').value = ''; el.querySelector('#fNicho').value = '';
      el.querySelector('#fStatus').value = ''; el.querySelector('#fProb').value = '';
      carregar();
    });
    el.querySelector('#pNovo').addEventListener('click', () => editar(null));
    el.querySelector('#pImportar').addEventListener('click', () => el.querySelector('#pFile').click());
    el.querySelector('#pFile').addEventListener('change', importar);
    el.querySelectorAll('[data-exp]').forEach((b) => b.addEventListener('click', () => API.download(`/prospeccao/export?format=${b.dataset.exp}`)));

    await carregar();
  }

  async function carregar() {
    const tabela = container.querySelector('#pTabela');
    tabela.innerHTML = '<div class="empty"><div class="spinner"></div></div>';
    const q = new URLSearchParams({
      search: estado.search, cidade: estado.cidade, estado: estado.estado, nicho: estado.nicho,
      status: estado.status, probMin: estado.probMin, sort: estado.sort, order: estado.order,
      page: estado.page, pageSize: estado.pageSize,
    });
    const r = await API.get('/prospeccao?' + q.toString());
    if (r.statusValidos) statusValidos = r.statusValidos;
    render_tabela(r);
    render_pager(r);
  }

  function th(campo, label) {
    const ativo = estado.sort === campo;
    const seta = ativo ? (estado.order === 'ASC' ? ' ▲' : ' ▼') : '';
    return `<th class="sortable" data-sort="${campo}">${label}${seta}</th>`;
  }

  function render_tabela(r) {
    const tabela = container.querySelector('#pTabela');
    if (!r.itens.length) {
      tabela.innerHTML = `<div class="empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        <div>Nenhuma empresa em prospecção.</div>
        <button class="btn btn-primary mt" onclick="Views.prospeccao.novo()">Adicionar empresa</button>
      </div>`;
      return;
    }
    const linhas = r.itens.map((p) => {
      const wa = UI.waLink(p.whatsapp || p.telefone);
      const st = (p.status || 'Novo').toLowerCase();
      return `<tr>
        <td>${UI.esc(p.empresa)}</td>
        <td>${UI.esc(p.cidade) || '—'}${p.estado ? '/' + UI.esc(p.estado) : ''}</td>
        <td>${UI.esc(p.nicho) || '—'}</td>
        <td>${UI.esc(p.telefone) || '—'}</td>
        <td><span class="badge ${st}">${UI.esc(p.status)}</span></td>
        <td><div class="prob-bar"><span style="width:${p.probabilidade || 0}%"></span></div> <span class="small muted">${p.probabilidade || 0}%</span></td>
        <td class="actions"><div class="row-actions">
          ${wa ? `<a class="btn btn-sm btn-whatsapp" href="${wa}" target="_blank" title="WhatsApp">Whats</a>` : ''}
          <button class="btn btn-sm btn-success" data-mover="${p.id}" title="Mover para Clientes Fixos">→ Cliente</button>
          <button class="btn btn-sm" data-edit="${p.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-del="${p.id}">Excluir</button>
        </div></td>
      </tr>`;
    }).join('');

    tabela.innerHTML = `<table class="data">
      <thead><tr>
        ${th('empresa', 'Empresa')}${th('cidade', 'Cidade')}${th('nicho', 'Nicho')}
        <th>Telefone</th>${th('status', 'Status')}${th('probabilidade', 'Probabilidade')}<th>Ações</th>
      </tr></thead><tbody>${linhas}</tbody></table>`;

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
    tabela.querySelectorAll('[data-mover]').forEach((b) => b.addEventListener('click', () => mover(Number(b.dataset.mover))));
  }

  function render_pager(r) {
    const pager = container.querySelector('#pPager');
    const totalPag = Math.max(1, Math.ceil(r.total / r.pageSize));
    pager.innerHTML = `<div class="pager">
      <span class="info">${r.total} empresa(s) — página ${r.page} de ${totalPag}</span>
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
    let valores = { status: 'Novo', probabilidade: 0 };
    if (id) { try { valores = await API.get('/prospeccao/' + id); } catch (e) { UI.toast(e.message, 'error'); return; } }
    const dados = await UI.formModal({
      titulo: id ? 'Editar Empresa' : 'Nova Empresa',
      campos: campos(),
      valores,
      okLabel: id ? 'Salvar alterações' : 'Cadastrar',
    });
    if (!dados) return;
    try {
      if (id) await API.put('/prospeccao/' + id, dados);
      else await API.post('/prospeccao', dados);
      UI.toast(id ? 'Empresa atualizada.' : 'Empresa cadastrada.', 'success');
      await carregar();
      App.atualizarContadores();
    } catch (err) {
      if (err.status === 409) {
        const forcar = await UI.confirmar(`${err.message}\n\nCadastrar mesmo assim?`, { titulo: 'Possível duplicado', okLabel: 'Cadastrar assim mesmo' });
        if (forcar) { try { await API.post('/prospeccao', { ...dados, forcar: true }); UI.toast('Empresa cadastrada.', 'success'); await carregar(); App.atualizarContadores(); } catch (e2) { UI.toast(e2.message, 'error'); } }
      } else UI.toast(err.message, 'error');
    }
  }

  async function excluir(id) {
    if (!(await UI.confirmar('Excluir esta empresa da prospecção?', { titulo: 'Excluir', perigo: true, okLabel: 'Excluir' }))) return;
    try { await API.del('/prospeccao/' + id); UI.toast('Empresa excluída.', 'success'); await carregar(); App.atualizarContadores(); }
    catch (err) { UI.toast(err.message, 'error'); }
  }

  async function mover(id) {
    if (!(await UI.confirmar('Mover esta empresa para Clientes Fixos?', { titulo: 'Mover para Clientes', okLabel: 'Mover' }))) return;
    try { await API.post(`/prospeccao/${id}/mover-clientes`); UI.toast('Movida para Clientes Fixos.', 'success'); await carregar(); App.atualizarContadores(); }
    catch (err) { UI.toast(err.message, 'error'); }
  }

  async function importar(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    UI.loading(true, 'Importando planilha...');
    UI.progress(15);
    try {
      const r = await API.upload('/prospeccao/import', file);
      UI.progress(100);
      UI.toast(`Importação: ${r.inseridos} inseridos, ${r.duplicados} duplicados, ${r.invalidos} inválidos.`, 'success', 'Importar');
      await carregar();
      App.atualizarContadores();
    } catch (err) { UI.toast(err.message, 'error', 'Importar'); }
    finally { UI.loading(false); }
  }

  return { render, novo: () => editar(null) };
})();
