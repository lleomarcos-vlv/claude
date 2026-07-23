'use strict';
/* Monta o arquivo único `estacao-trabalho.html` a partir das fontes em src/.
 * Uso:  node src/build.js
 */
const fs = require('fs');
const path = require('path');

const SRC = __dirname;
const ROOT = path.join(SRC, '..');

const css = fs.readFileSync(path.join(SRC, 'styles.css'), 'utf8');
const sheetlib = fs.readFileSync(path.join(SRC, 'sheetlib.js'), 'utf8');
const nichos = fs.readFileSync(path.join(SRC, 'nichos.json'), 'utf8');
const appCore = fs.readFileSync(path.join(SRC, 'app-core.js'), 'utf8');
const appUi = fs.readFileSync(path.join(SRC, 'app-ui.js'), 'utf8');

const LOGO = `<svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="etg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4895ef"/><stop offset="1" stop-color="#4361ee"/></linearGradient></defs><rect x="4" y="4" width="56" height="56" rx="14" fill="url(#etg)"/><path d="M20 40 L28 30 L36 36 L46 22" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="46" cy="22" r="3.6" fill="#fff"/><circle cx="20" cy="40" r="3.2" fill="#fff"/><rect x="18" y="46" width="28" height="3.4" rx="1.7" fill="#ffffff" opacity="0.85"/></svg>`;

const FAVICON = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="4" y="4" width="56" height="56" rx="14" fill="#4361ee"/><path d="M20 40 L28 30 L36 36 L46 22" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>');

const extraCss = `
/* Ajustes da versão HTML único */
.login-logo .brand-logo{width:64px;height:64px;margin-bottom:12px;display:inline-block}
.sidebar-head .brand-logo{width:38px;height:38px;display:inline-block}
.brand-logo svg{width:100%;height:100%;display:block}
`;

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Estação de Trabalho — Prospecção Comercial</title>
  <link rel="icon" type="image/svg+xml" href="${FAVICON}" />
  <style>
${css}
${extraCss}
  </style>
</head>
<body>

  <!-- ============================ Tela de Login ============================ -->
  <div class="login-wrap" id="loginScreen" style="display:none">
    <form class="login-card" id="loginForm" autocomplete="on">
      <div class="login-logo">
        <span class="brand-logo">${LOGO}</span>
        <h1>Estação de Trabalho</h1>
        <p>Prospecção Comercial Inteligente</p>
      </div>
      <div class="login-error" id="loginError"></div>
      <div class="field">
        <label for="login">Login</label>
        <input type="text" id="login" name="login" placeholder="Seu usuário" required autofocus autocomplete="username" />
      </div>
      <div class="field">
        <label for="senha">Senha</label>
        <input type="password" id="senha" name="senha" placeholder="Sua senha" required autocomplete="current-password" />
      </div>
      <button type="submit" class="btn btn-primary btn-block" id="btnEntrar">Entrar</button>
      <p class="login-hint">Primeiro acesso? Utilize <strong>admin / admin123</strong> e altere a senha depois.<br>Seus dados ficam salvos neste navegador.</p>
    </form>
  </div>

  <!-- ============================ Aplicativo ============================ -->
  <div id="appScreen" style="display:none">
    <div class="app">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-head">
          <span class="brand-logo">${LOGO}</span>
          <div>
            <div class="title" id="sbTitle">Estação</div>
            <div class="subtitle">de Trabalho</div>
          </div>
        </div>
        <nav class="nav" id="nav">
          <div class="nav-item" data-view="dashboard">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
            <span>Dashboard</span>
          </div>
          <div class="nav-item" data-view="clientes">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span>Clientes Fixos</span><span class="count" id="cntClientes">0</span>
          </div>
          <div class="nav-item" data-view="prospeccao">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span>Prospectando</span><span class="count" id="cntProspeccao">0</span>
          </div>
          <div class="nav-item" data-view="pesquisa">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <span>Pesquisa Automática</span>
          </div>
          <div class="nav-item" data-view="revisao">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            <span>Revisão</span><span class="count" id="cntRevisao">0</span>
          </div>
          <div class="nav-item" data-view="nichos">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            <span>Nichos</span><span class="count" id="cntNichos">0</span>
          </div>
          <div class="nav-item" data-view="historico">
            <svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
            <span>Histórico</span>
          </div>
        </nav>
        <div class="sidebar-foot">
          <div class="user-box">
            <div class="user-avatar" id="userAvatar">A</div>
            <div><div class="name" id="userName">—</div><div class="role">Sessão ativa</div></div>
          </div>
          <button class="btn btn-sm btn-block" id="btnSenha" style="margin-bottom:8px">Alterar senha</button>
          <button class="btn btn-sm btn-danger btn-block" id="btnLogout">Sair</button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button class="btn btn-icon menu-toggle" id="menuToggle" aria-label="Menu">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h2 id="pageTitle">Dashboard</h2>
          <div class="spacer"></div>
          <button class="btn btn-sm" id="btnBackup" title="Backup e restauração dos dados">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Backup
          </button>
        </header>
        <main class="content" id="view"></main>
      </div>
    </div>
  </div>

  <!-- Contêineres globais -->
  <div class="toasts" id="toasts"></div>
  <div class="loading-overlay" id="loadingOverlay">
    <div class="spinner"></div>
    <div class="loading-text" id="loadingText">Carregando...</div>
    <div class="progress hidden" id="loadingProgress"><span></span></div>
  </div>
  <div id="modalRoot"></div>

  <!-- ============================ Scripts ============================ -->
  <script>
/* Biblioteca de planilhas (xlsx/csv) — 100% offline */
${sheetlib}
  </script>
  <script>
/* Base de nichos comerciais (${JSON.parse(nichos).length} nichos) */
window.__NICHOS__ = ${nichos};
  </script>
  <script>
/* Núcleo da aplicação (dados, dedupe, pesquisa, serviços, API local) */
${appCore}
  </script>
  <script>
/* Interface, telas, controlador, login e inicialização */
${appUi}
  </script>
</body>
</html>
`;

const OUT = path.join(ROOT, 'estacao-trabalho.html');
fs.writeFileSync(OUT, html);
console.log('Gerado:', OUT);
console.log('Tamanho:', (fs.statSync(OUT).size / 1024).toFixed(1), 'KB');
