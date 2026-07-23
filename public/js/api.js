'use strict';

/**
 * Cliente HTTP da API. Encapsula fetch com tratamento de erros e JSON.
 * Cookies de sessão são enviados automaticamente (mesma origem).
 */
const API = (() => {
  const BASE = '/api';

  async function req(metodo, caminho, corpo) {
    const opcoes = {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    if (corpo !== undefined) opcoes.body = JSON.stringify(corpo);

    let resp;
    try {
      resp = await fetch(BASE + caminho, opcoes);
    } catch (e) {
      throw new ApiError('Falha de conexão com o servidor.', 0);
    }

    // Sessão expirada -> volta ao login.
    if (resp.status === 401 && !caminho.startsWith('/auth')) {
      window.location.href = '/';
      throw new ApiError('Sessão expirada.', 401);
    }

    let dados = null;
    const ct = resp.headers.get('content-type') || '';
    if (ct.includes('application/json')) dados = await resp.json();

    if (!resp.ok || (dados && dados.ok === false)) {
      const msg = (dados && dados.erro) || `Erro ${resp.status}`;
      throw new ApiError(msg, resp.status, dados);
    }
    return dados ? dados.dados : null;
  }

  async function upload(caminho, arquivo, campos = {}) {
    const fd = new FormData();
    fd.append('arquivo', arquivo);
    for (const [k, v] of Object.entries(campos)) fd.append(k, v);
    let resp;
    try {
      resp = await fetch(BASE + caminho, { method: 'POST', body: fd, credentials: 'same-origin' });
    } catch (e) {
      throw new ApiError('Falha de conexão com o servidor.', 0);
    }
    if (resp.status === 401) {
      window.location.href = '/';
      throw new ApiError('Sessão expirada.', 401);
    }
    const dados = await resp.json().catch(() => null);
    if (!resp.ok || (dados && dados.ok === false)) {
      throw new ApiError((dados && dados.erro) || `Erro ${resp.status}`, resp.status, dados);
    }
    return dados ? dados.dados : null;
  }

  /** Dispara download de um endpoint (ex.: exportação). */
  function download(caminho) {
    const a = document.createElement('a');
    a.href = BASE + caminho;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  class ApiError extends Error {
    constructor(mensagem, status, dados) {
      super(mensagem);
      this.status = status;
      this.dados = dados;
    }
  }

  return {
    get: (c) => req('GET', c),
    post: (c, b) => req('POST', c, b || {}),
    put: (c, b) => req('PUT', c, b || {}),
    del: (c) => req('DELETE', c),
    upload,
    download,
    ApiError,
  };
})();
