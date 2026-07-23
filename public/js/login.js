'use strict';

/** Lógica da tela de login. */
(async function () {
  const form = document.getElementById('loginForm');
  const erroBox = document.getElementById('loginError');
  const btn = document.getElementById('btnEntrar');

  // Personaliza nome/descrição a partir de /api/info e detecta sessão ativa.
  try {
    const resp = await fetch('/api/info', { credentials: 'same-origin' });
    const json = await resp.json();
    if (json && json.dados) {
      document.getElementById('appNome').textContent = json.dados.nome || 'Estação de Trabalho';
      document.getElementById('appDesc').textContent = json.dados.descricao || '';
      document.title = 'Entrar — ' + (json.dados.nome || 'Estação de Trabalho');
      if (json.dados.autenticado) {
        window.location.href = '/app';
        return;
      }
    }
  } catch (_) {
    /* segue mesmo sem info */
  }

  function mostrarErro(msg) {
    erroBox.textContent = msg;
    erroBox.classList.add('show');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroBox.classList.remove('show');
    const login = document.getElementById('login').value.trim();
    const senha = document.getElementById('senha').value;
    if (!login || !senha) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="spin-inline"></span> Entrando...';

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ login, senha }),
      });
      const json = await resp.json();
      if (!resp.ok || json.ok === false) {
        mostrarErro(json.erro || 'Não foi possível entrar.');
        btn.disabled = false;
        btn.textContent = 'Entrar';
        return;
      }
      window.location.href = '/app';
    } catch (err) {
      mostrarErro('Falha de conexão com o servidor.');
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });
})();
