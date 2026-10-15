/* Núcleo de cálculo: dinheiro em centavos (inteiros), datas e valor por extenso.
   Funciona no navegador (window.JP) e no Node (module.exports) para os testes. */
(function (root) {
  'use strict';

  /** "3.743,04" | "3743.04" | "R$ 3.743,04" -> 374304 (centavos). Inválido -> NaN. */
  function parseBRL(str) {
    if (typeof str === 'number') return Math.round(str * 100);
    let s = String(str == null ? '' : str).replace(/R\$|\s/g, '');
    if (s === '') return 0;
    if (!/^-?[\d.,]+$/.test(s)) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n * 100) : NaN;
  }

  /** 374304 -> "3.743,04" */
  function formatBRL(cents) {
    const neg = cents < 0;
    const abs = Math.abs(Math.round(cents));
    const int = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + int + ',' + String(abs % 100).padStart(2, '0');
  }

  /** "12,5" -> 12.5 ; vazio -> 0 ; inválido -> NaN */
  function parseNum(str) {
    const s = String(str == null ? '' : str).trim().replace(',', '.');
    if (s === '') return 0;
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
  }

  /* Preço unitário: inteiro em décimos de milésimo de real (R$ 0,0001), para aceitar até 4 casas decimais
     (alguns sistemas guardam 3.779,735 e exibem 3.779,74; o total da linha usa o valor exato). */
  function parseUnit(str) {
    if (typeof str === 'number') return Math.round(str * 10000);
    let s = String(str == null ? '' : str).replace(/R\$|\s/g, '');
    if (s === '') return 0;
    if (!/^-?[\d.,]+$/.test(s)) return NaN;
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n * 10000) : NaN;
  }
  /** unidade 1e-4 -> "3.779,735" (2 a 4 casas, sem zeros desnecessários além das 2 primeiras) */
  function formatUnit(u) {
    u = Math.round(u);
    const neg = u < 0, a = Math.abs(u);
    const int = String(Math.floor(a / 10000)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    let frac = String(a % 10000).padStart(4, '0').replace(/0+$/, '');
    if (frac.length < 2) frac = frac.padEnd(2, '0');
    return (neg ? '-' : '') + int + ',' + frac;
  }
  function itemTotal(it) {
    return Math.round((Number(it.qtd) || 0) * (Number(it.unit) || 0) / 100); // centavos
  }

  /** Calcula todos os totais de um orçamento. Nunca lança; devolve também erros de validação. */
  function calcTotals(q) {
    const items = q.items || [];
    const subtotal = items.reduce((a, it) => a + itemTotal(it), 0);
    let desconto = 0;
    const dv = Number(q.descontoValor) || 0;
    if (q.descontoTipo === '%') desconto = Math.round(subtotal * dv / 100); // dv = percentual (ex.: 5 ou 7.5)
    else desconto = Math.round(dv);                                          // dv = centavos
    const frete = Math.round(Number(q.frete) || 0);
    const instalacao = Math.round(Number(q.instalacao) || 0);
    const outros = Math.round(Number(q.outros) || 0);
    const total = subtotal - desconto + frete + instalacao + outros;
    const errors = [];
    if (desconto < 0) errors.push('Desconto não pode ser negativo.');
    if (q.descontoTipo === '%' && dv > 100) errors.push('Desconto percentual maior que 100%.');
    else if (desconto > subtotal) errors.push('Desconto maior que o subtotal.');
    return { subtotal, desconto, frete, instalacao, outros, total, qtdItens: items.length,
             qtdPecas: items.reduce((a, it) => a + (Number(it.qtd) || 0), 0), errors };
  }

  // ---------- valor por extenso (pt-BR) ----------
  const U = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze',
    'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const Cn = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos',
    'oitocentos', 'novecentos'];

  function ate999(n) {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100), r = n % 100, parts = [];
    if (c) parts.push(Cn[c]);
    if (r) {
      if (r < 20) parts.push(U[r]);
      else parts.push(D[Math.floor(r / 10)] + (r % 10 ? ' e ' + U[r % 10] : ''));
    }
    return parts.join(' e ');
  }

  function inteiroExtenso(n) {
    if (n === 0) return 'zero';
    const grupos = [], nomes = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
    let i = 0;
    while (n > 0) { grupos.push(n % 1000); n = Math.floor(n / 1000); i++; }
    const partes = [];
    for (let g = grupos.length - 1; g >= 0; g--) {
      const v = grupos[g];
      if (!v) continue;
      if (g === 1) partes.push(v === 1 ? 'mil' : ate999(v) + ' mil');
      else if (g === 0) partes.push(ate999(v));
      else partes.push(ate999(v) + ' ' + (v === 1 ? nomes[g][0] : nomes[g][1]));
    }
    // conectivo "e": entre o último grupo e o anterior quando o último é < 100 ou múltiplo de 100
    if (partes.length > 1) {
      const ultimo = grupos[0];
      if (ultimo && (ultimo < 100 || ultimo % 100 === 0)) {
        const head = partes.slice(0, -1).join(', ');
        return head + ' e ' + partes[partes.length - 1];
      }
      return partes.join(', ');
    }
    return partes[0];
  }

  function extensoBRL(cents) {
    cents = Math.round(cents);
    if (cents < 0) return 'menos ' + extensoBRL(-cents);
    const reais = Math.floor(cents / 100), cent = cents % 100;
    const out = [];
    if (reais > 0 || cent === 0) out.push(inteiroExtenso(reais) + (reais === 1 ? ' real' :
      (reais !== 0 && reais % 1000000 === 0 ? ' de reais' : ' reais')));
    if (cent > 0) out.push(inteiroExtenso(cent) + (cent === 1 ? ' centavo' : ' centavos'));
    return out.join(' e ');
  }

  // ---------- datas ----------
  function pad(n) { return String(n).padStart(2, '0'); }
  function todayISO() { const d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function fmtDate(iso) { // 'YYYY-MM-DD' -> 'DD/MM/AAAA'
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
  }
  function addDaysISO(iso, days) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    if (!m) return '';
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + days));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }

  // ---------- máscaras / validação ----------
  function maskPhone(v) {
    const d = String(v || '').replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }
  function maskCEP(v) { const d = String(v || '').replace(/\D/g, '').slice(0, 8); return d.length > 5 ? d.slice(0, 5) + '-' + d.slice(5) : d; }
  function maskDoc(v) {
    const d = String(v || '').replace(/\D/g, '').slice(0, 14);
    if (d.length <= 11) return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  function validCPF(v) {
    const d = String(v || '').replace(/\D/g, '');
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    for (let t = 9; t < 11; t++) {
      let s = 0; for (let i = 0; i < t; i++) s += d[i] * (t + 1 - i);
      if ((s * 10) % 11 % 10 !== +d[t]) return false;
    }
    return true;
  }
  function validCNPJ(v) {
    const d = String(v || '').replace(/\D/g, '');
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    for (let t = 12; t < 14; t++) {
      const w = t === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      let s = 0; for (let i = 0; i < t; i++) s += d[i] * w[i];
      const r = s % 11; if ((r < 2 ? 0 : 11 - r) !== +d[t]) return false;
    }
    return true;
  }
  function validDoc(v) {
    const d = String(v || '').replace(/\D/g, '');
    if (!d) return true; // opcional
    return d.length === 11 ? validCPF(d) : d.length === 14 ? validCNPJ(d) : false;
  }

  /** Hash rápido (cyrb53) para verificar integridade de backups. Não é criptográfico. */
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  }

  const api = { parseBRL, formatBRL, parseUnit, formatUnit, parseNum, itemTotal, calcTotals, extensoBRL, todayISO, fmtDate, addDaysISO,
    maskPhone, maskCEP, maskDoc, validCPF, validCNPJ, validDoc, hash };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.JP = Object.assign(root.JP || {}, api);
})(typeof window !== 'undefined' ? window : globalThis);
