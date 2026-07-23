'use strict';

/**
 * Controlador principal da SPA: autenticação, navegação, contadores e ações
 * globais (logout, backup, troca de senha). As telas ficam em window.Views.
 */
const App = (() => {
  const TITULOS = {
    dashboard: 'Dashboard',
    clientes: 'Clientes Fixos',
    prospeccao: 'Prospectando',
    pesquisa: 'Pesquisa Automática',
    revisao: 'Revisão',
    nichos: 'Nichos',
    historico: 'Histórico',
  };

  let usuario = null;
  let viewAtual = null;

  async function iniciar() {
    try {
      const r = await API.get('/auth/me');
      usuario = r.usuario;
    } catch (e) {
      window.location.href = '/';
      return;
    }
    document.getElementById('userName').textContent = usuario.nome || usuario.login;
    document.getElementById('userAvatar').textContent = UI.iniciais(usuario.nome || usuario.login);

    configurarNavegacao();
    configurarAcoes();
    await atualizarContadores();

    const inicial = (location.hash || '#dashboard').replace('#', '');
    irPara(TITULOS[inicial] ? inicial : 'dashboard');
  }

  function configurarNavegacao() {
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => irPara(item.dataset.view));
    });
    window.addEventListener('hashchange', () => {
      const v = location.hash.replace('#', '');
      if (TITULOS[v] && v !== viewAtual) irPara(v);
    });
    // Menu mobile
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
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
    viewAtual = nome;
    location.hash = nome;
    document.querySelectorAll('.nav-item').forEach((i) => i.classList.toggle('active', i.dataset.view === nome));
    document.getElementById('pageTitle').textContent = TITULOS[nome];

    const container = document.getElementById('view');
    container.innerHTML = '';
    const view = window.Views && window.Views[nome];
    if (!view) {
      container.innerHTML = `<div class="empty">Tela "${nome}" não encontrada.</div>`;
      return;
    }
    try {
      await view.render(container, { usuario, app: App });
    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="alert alert-warn">Erro ao carregar a tela: ${UI.esc(err.message)}</div>`;
    }
  }

  async function atualizarContadores() {
    try {
      const r = await API.get('/stats');
      const s = r.stats;
      setCount('cntClientes', s.clientes);
      setCount('cntProspeccao', s.prospeccao);
      setCount('cntRevisao', s.resultadosPendentes);
      setCount('cntNichos', s.nichos);
    } catch (_) {
      /* silencioso */
    }
  }
  function setCount(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  async function logout() {
    if (!(await UI.confirmar('Deseja realmente sair?', { titulo: 'Sair', okLabel: 'Sair' }))) return;
    try {
      await API.post('/auth/logout');
    } catch (_) {}
    window.location.href = '/';
  }

  async function backup() {
    UI.loading(true, 'Gerando backup...');
    try {
      const r = await API.post('/backup');
      UI.toast('Backup criado com sucesso.', 'success', 'Backup');
      console.log('Backup:', r.arquivo);
    } catch (err) {
      UI.toast(err.message, 'error', 'Backup');
    } finally {
      UI.loading(false);
    }
  }

  async function trocarSenha() {
    const dados = await UI.formModal({
      titulo: 'Alterar senha',
      tamanho: '',
      campos: [
        { name: 'senhaAtual', label: 'Senha atual', type: 'password', required: true, full: true },
        { name: 'senhaNova', label: 'Nova senha', type: 'password', required: true, full: true },
      ],
      okLabel: 'Alterar',
    });
    if (!dados) return;
    try {
      await API.post('/auth/change-password', dados);
      UI.toast('Senha alterada com sucesso.', 'success');
    } catch (err) {
      UI.toast(err.message, 'error');
    }
  }

  return { iniciar, irPara, atualizarContadores, get usuario() { return usuario; } };
})();

document.addEventListener('DOMContentLoaded', App.iniciar);
