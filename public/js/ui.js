'use strict';

/**
 * Componentes e utilitários de interface: toasts, overlay de carregamento,
 * barra de progresso, modais (confirmação e formulário) e helpers diversos.
 */
const UI = (() => {
  // ---------- Helpers ----------
  function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function soDigitos(s) {
    return String(s || '').replace(/\D/g, '');
  }

  /** Monta um link wa.me a partir de um telefone (assume Brasil sem DDI). */
  function waLink(telefone) {
    let d = soDigitos(telefone);
    if (!d) return '';
    if (d.length === 10 || d.length === 11) d = '55' + d;
    return `https://wa.me/${d}`;
  }

  function fmtData(iso) {
    if (!iso) return '—';
    const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d)) return esc(iso);
    return d.toLocaleDateString('pt-BR');
  }
  function fmtDataHora(iso) {
    if (!iso) return '—';
    const d = new Date(iso.replace(' ', 'T'));
    if (isNaN(d)) return esc(iso);
    return d.toLocaleString('pt-BR');
  }

  function iniciais(nome) {
    if (!nome) return '?';
    return nome.trim().slice(0, 1).toUpperCase();
  }

  function debounce(fn, ms = 350) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ---------- Toasts ----------
  function toast(mensagem, tipo = 'info', titulo = '') {
    const cont = document.getElementById('toasts');
    if (!cont) return;
    const el = document.createElement('div');
    el.className = `toast ${tipo}`;
    el.innerHTML = `<div class="msg">${titulo ? `<div class="t-title">${esc(titulo)}</div>` : ''}${esc(mensagem)}</div>`;
    cont.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(30px)';
      setTimeout(() => el.remove(), 220);
    }, 4200);
  }

  // ---------- Loading / Progress ----------
  function loading(mostrar, texto = 'Carregando...') {
    const ov = document.getElementById('loadingOverlay');
    if (!ov) return;
    document.getElementById('loadingText').textContent = texto;
    ov.classList.toggle('show', !!mostrar);
    if (!mostrar) progress(null);
  }
  function progress(pct) {
    const p = document.getElementById('loadingProgress');
    if (!p) return;
    if (pct === null || pct === undefined) {
      p.classList.add('hidden');
      p.querySelector('span').style.width = '0';
    } else {
      p.classList.remove('hidden');
      p.querySelector('span').style.width = Math.max(0, Math.min(100, pct)) + '%';
    }
  }

  // ---------- Modal base ----------
  function abrirModal({ titulo, corpo, tamanho = '', rodape = '' }) {
    const root = document.getElementById('modalRoot');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal ${tamanho}">
        <div class="modal-head">
          <h3>${esc(titulo)}</h3>
          <button class="close" aria-label="Fechar">&times;</button>
        </div>
        <div class="modal-body">${corpo}</div>
        ${rodape ? `<div class="modal-foot">${rodape}</div>` : ''}
      </div>`;
    root.appendChild(overlay);

    const fechar = () => overlay.remove();
    overlay.querySelector('.close').addEventListener('click', fechar);
    overlay.addEventListener('mousedown', (e) => {
      if (e.target === overlay) fechar();
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        fechar();
        document.removeEventListener('keydown', onEsc);
      }
    });
    return { overlay, fechar };
  }

  // ---------- Confirmação ----------
  function confirmar(mensagem, { titulo = 'Confirmar', perigo = false, okLabel = 'Confirmar' } = {}) {
    return new Promise((resolve) => {
      const rodape = `
        <button class="btn" data-acao="cancelar">Cancelar</button>
        <button class="btn ${perigo ? 'btn-danger' : 'btn-primary'}" data-acao="ok">${esc(okLabel)}</button>`;
      const { overlay, fechar } = abrirModal({ titulo, corpo: `<p style="margin:0">${esc(mensagem)}</p>`, rodape });
      overlay.querySelector('[data-acao="cancelar"]').addEventListener('click', () => {
        fechar();
        resolve(false);
      });
      overlay.querySelector('[data-acao="ok"]').addEventListener('click', () => {
        fechar();
        resolve(true);
      });
    });
  }

  // ---------- Formulário em modal ----------
  function campoHTML(f, valor) {
    const v = valor === null || valor === undefined ? '' : valor;
    const req = f.required ? 'required' : '';
    let ctrl;
    if (f.type === 'textarea') {
      ctrl = `<textarea name="${f.name}" rows="${f.rows || 3}" placeholder="${esc(f.placeholder || '')}" ${req}>${esc(v)}</textarea>`;
    } else if (f.type === 'select') {
      const opts = (f.options || [])
        .map((o) => {
          const val = typeof o === 'object' ? o.value : o;
          const lab = typeof o === 'object' ? o.label : o;
          return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`;
        })
        .join('');
      ctrl = `<select name="${f.name}" ${req}>${opts}</select>`;
    } else if (f.type === 'range') {
      ctrl = `<input type="range" name="${f.name}" min="0" max="100" step="5" value="${esc(v || 0)}" oninput="this.nextElementSibling.textContent=this.value+'%'" />
              <span class="small muted">${esc(v || 0)}%</span>`;
    } else {
      ctrl = `<input type="${f.type || 'text'}" name="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${req} />`;
    }
    return `<div class="field ${f.full ? 'full' : ''}" ${f.full ? 'style="grid-column:1/-1"' : ''}>
      <label>${esc(f.label)}${f.required ? ' *' : ''}</label>${ctrl}</div>`;
  }

  /**
   * Abre um formulário. Resolve com o objeto de valores ao salvar, ou null.
   * @param {object} cfg { titulo, campos:[], valores:{}, tamanho, okLabel }
   */
  function formModal(cfg) {
    return new Promise((resolve) => {
      const valores = cfg.valores || {};
      const corpo = `<form id="uiForm"><div class="grid-2">${cfg.campos
        .map((f) => campoHTML(f, valores[f.name]))
        .join('')}</div></form>`;
      const rodape = `
        <button class="btn" data-acao="cancelar">Cancelar</button>
        <button class="btn btn-primary" data-acao="salvar">${esc(cfg.okLabel || 'Salvar')}</button>`;
      const { overlay, fechar } = abrirModal({ titulo: cfg.titulo, corpo, tamanho: cfg.tamanho || 'lg', rodape });

      const form = overlay.querySelector('#uiForm');
      const submit = () => {
        if (!form.reportValidity()) return;
        const dados = {};
        cfg.campos.forEach((f) => {
          const el = form.elements[f.name];
          if (el) dados[f.name] = el.value;
        });
        fechar();
        resolve(dados);
      };
      overlay.querySelector('[data-acao="salvar"]').addEventListener('click', submit);
      overlay.querySelector('[data-acao="cancelar"]').addEventListener('click', () => {
        fechar();
        resolve(null);
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        submit();
      });
      const primeiro = form.querySelector('input, select, textarea');
      if (primeiro) setTimeout(() => primeiro.focus(), 50);
    });
  }

  return {
    esc, soDigitos, waLink, fmtData, fmtDataHora, iniciais, debounce,
    toast, loading, progress,
    abrirModal, confirmar, formModal,
  };
})();
