'use strict';

window.Views = window.Views || {};

window.Views.pesquisa = (() => {
  let container = null;

  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

  async function render(el) {
    container = el;
    el.innerHTML = `
      <div class="alert alert-info">
        <strong>Fontes gratuitas e abertas.</strong> A pesquisa utiliza o
        <strong>OpenStreetMap</strong> (Nominatim + Overpass API) — dados públicos,
        gratuitos e legais. Requer conexão com a internet. Nenhuma API paga é usada
        e nenhum termo de serviço é violado. Veja o README para detalhes.
      </div>

      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><h3>Nova Pesquisa</h3></div>
          <div class="panel-body">
            <form id="formPesquisa">
              <div class="field">
                <label>Cidade *</label>
                <input type="text" id="qCidade" placeholder="Ex.: Serra Azul" required />
              </div>
              <div class="grid-2">
                <div class="field">
                  <label>Estado (UF)</label>
                  <select id="qEstado"><option value="">—</option>${UFS.map((u) => `<option>${u}</option>`).join('')}</select>
                </div>
                <div class="field">
                  <label>Quantidade máxima</label>
                  <input type="number" id="qMax" value="50" min="1" max="300" />
                </div>
              </div>
              <div class="field">
                <label>Nicho *</label>
                <input type="text" id="qNicho" placeholder="Ex.: Padarias" required autocomplete="off" />
                <div id="nichoSug" class="mt"></div>
              </div>
              <button type="submit" class="btn btn-primary btn-block" id="btnPesquisar">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Pesquisar
              </button>
            </form>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><h3>Resultado</h3></div>
          <div class="panel-body" id="resultadoBox">
            <div class="empty small">Preencha os campos e clique em <strong>Pesquisar</strong>. Os resultados aparecerão aqui e na aba <strong>Revisão</strong>.</div>
          </div>
        </div>
      </div>`;

    // Sugestões de nicho (chips) a partir da base.
    carregarSugestoes('');
    const inputNicho = el.querySelector('#qNicho');
    inputNicho.addEventListener('input', UI.debounce((e) => carregarSugestoes(e.target.value.trim()), 300));

    el.querySelector('#formPesquisa').addEventListener('submit', executar);
  }

  async function carregarSugestoes(termo) {
    const box = container.querySelector('#nichoSug');
    try {
      const r = await API.get('/nichos?search=' + encodeURIComponent(termo));
      const itens = r.itens.slice(0, 18);
      box.innerHTML = itens.map((n) => `<span class="chip" data-nicho="${UI.esc(n.nome)}">${UI.esc(n.nome)} <span class="cat">${UI.esc(n.categoria)}</span></span>`).join('')
        || '<span class="small muted">Nenhum nicho na base — você pode digitar qualquer termo livre.</span>';
      box.querySelectorAll('[data-nicho]').forEach((c) => c.addEventListener('click', () => {
        container.querySelector('#qNicho').value = c.dataset.nicho;
      }));
    } catch (_) { box.innerHTML = ''; }
  }

  async function executar(e) {
    e.preventDefault();
    const cidade = container.querySelector('#qCidade').value.trim();
    const estadoUf = container.querySelector('#qEstado').value;
    const nicho = container.querySelector('#qNicho').value.trim();
    const max = Number(container.querySelector('#qMax').value) || 50;
    if (!cidade || !nicho) { UI.toast('Informe cidade e nicho.', 'warning'); return; }

    const btn = container.querySelector('#btnPesquisar');
    btn.disabled = true;
    btn.innerHTML = '<span class="spin-inline"></span> Pesquisando... (pode levar alguns segundos)';
    const box = container.querySelector('#resultadoBox');
    box.innerHTML = '<div class="empty"><div class="spinner"></div><div class="loading-text mt">Coletando em fontes abertas...</div></div>';

    try {
      const r = await API.post('/pesquisa', { cidade, estado: estadoUf, nicho, max });
      if (r.erro) {
        box.innerHTML = `<div class="alert alert-warn"><strong>Não foi possível concluir a pesquisa.</strong><br>${UI.esc(r.mensagem)}</div>
          <p class="small muted">Dica: verifique a conexão com a internet e o nome da cidade. Você também pode ativar o
          <strong>modo demonstração</strong> em <span class="mono">config/default.json</span> para testar o fluxo offline.</p>`;
      } else {
        box.innerHTML = `
          <div class="cards" style="grid-template-columns:1fr 1fr">
            <div class="card stat-card"><div><div class="stat-val">${r.novos}</div><div class="stat-label">Novos encontrados</div></div></div>
            <div class="card stat-card"><div><div class="stat-val">${r.duplicados}</div><div class="stat-label">Duplicados ignorados</div></div></div>
          </div>
          <p class="small muted">${UI.esc(r.mensagem)} Fonte: <strong>${UI.esc(r.fonte)}</strong>.</p>
          <button class="btn btn-primary btn-block mt" id="irRevisao">Ver resultados na Revisão →</button>`;
        box.querySelector('#irRevisao').addEventListener('click', () => App.irPara('revisao'));
        UI.toast(`Pesquisa concluída: ${r.novos} novos.`, 'success', 'Pesquisa');
        App.atualizarContadores();
      }
    } catch (err) {
      box.innerHTML = `<div class="alert alert-warn">${UI.esc(err.message)}</div>`;
      UI.toast(err.message, 'error', 'Pesquisa');
    } finally {
      btn.disabled = false;
      btn.innerHTML = 'Pesquisar';
    }
  }

  return { render };
})();
