'use strict';
/* ============================================================================
 * Estação de Trabalho — versão HTML único (offline, dados no navegador).
 *
 * Toda a lógica que antes ficava no servidor (Node/Express/SQLite) foi
 * reescrita para rodar 100% no navegador. Os dados são MEMORIZADOS no
 * localStorage do navegador — permanecem salvos ao fechar e reabrir o arquivo.
 * ========================================================================== */

/* ------------------------------------------------------------------ Helpers */
function _pad(n) { return String(n).padStart(2, '0'); }
function agora() {
  const d = new Date();
  return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())} ${_pad(d.getHours())}:${_pad(d.getMinutes())}:${_pad(d.getSeconds())}`;
}
function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`;
}
function hashSenha(s) {
  let h = 5381;
  s = String(s);
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return 'h' + h.toString(16);
}

/* ------------------------------------------------------ Normalização (norm) */
const norm = (() => {
  function semAcentos(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function normalizarTexto(t) {
    return semAcentos(t).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const RUIDO = new Set(['ltda', 'me', 'epp', 'eireli', 'sa', 's', 'a', 'cia', 'comercio', 'comercial', 'e', 'de', 'da', 'do', 'das', 'dos', 'the', 'and']);
  function normalizarNome(nome) {
    return normalizarTexto(nome).split(' ').filter((p) => p && !RUIDO.has(p)).join(' ');
  }
  function normalizarTelefone(t) {
    let d = String(t || '').replace(/\D/g, '');
    if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
    return d;
  }
  function telefoneParaWhatsapp(t) {
    let d = String(t || '').replace(/\D/g, '');
    if (!d) return '';
    if (d.length >= 12) return d;
    if (d.length === 10 || d.length === 11) return '55' + d;
    return d;
  }
  function normalizarUrlBase(url) {
    let s = String(url || '').trim().toLowerCase();
    if (!s) return '';
    s = s.replace(/^https?:\/\//, '').replace(/\/+$/, '').split(/[?#]/)[0];
    return s;
  }
  function normalizarSite(site) { return normalizarUrlBase(site).replace(/^www\./, ''); }
  function normalizarInstagram(insta) {
    let s = String(insta || '').trim().toLowerCase();
    if (!s) return '';
    s = s.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^instagram\.com\//, '').replace(/^@/, '').replace(/[/?#].*$/, '');
    return s;
  }
  function normalizarEmail(e) { return String(e || '').trim().toLowerCase(); }
  function normalizarEndereco(e) {
    return normalizarTexto(e).replace(/\b(rua|r|avenida|av|travessa|tv|alameda|al|rodovia|rod|estrada|est|praca|pca)\b/g, '').replace(/\s+/g, ' ').trim();
  }
  return { semAcentos, normalizarTexto, normalizarNome, normalizarTelefone, telefoneParaWhatsapp, normalizarSite, normalizarUrlBase, normalizarInstagram, normalizarEmail, normalizarEndereco };
})();

/* ------------------------------------------------------- Similaridade (sim) */
const sim = (() => {
  function levenshtein(a, b) {
    a = a || ''; b = b || '';
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let ant = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) ant[j] = j;
    for (let i = 1; i <= a.length; i++) {
      let atual = [i];
      for (let j = 1; j <= b.length; j++) {
        const custo = a[i - 1] === b[j - 1] ? 0 : 1;
        atual[j] = Math.min(atual[j - 1] + 1, ant[j] + 1, ant[j - 1] + custo);
      }
      ant = atual;
    }
    return ant[b.length];
  }
  function similaridadeLevenshtein(a, b) {
    a = norm.normalizarTexto(a); b = norm.normalizarTexto(b);
    const m = Math.max(a.length, b.length);
    if (m === 0) return 1;
    return 1 - levenshtein(a, b) / m;
  }
  function tokens(t) { return new Set(norm.normalizarTexto(t).split(' ').filter(Boolean)); }
  function similaridadeJaccard(a, b) {
    const sa = tokens(a), sb = tokens(b);
    if (sa.size === 0 && sb.size === 0) return 1;
    let inter = 0;
    for (const t of sa) if (sb.has(t)) inter++;
    const uni = sa.size + sb.size - inter;
    return uni === 0 ? 0 : inter / uni;
  }
  function similaridadeNome(a, b) {
    const lev = similaridadeLevenshtein(a, b);
    const jac = similaridadeJaccard(a, b);
    return Math.max(lev, jac * 0.6 + lev * 0.4);
  }
  return { levenshtein, similaridadeLevenshtein, similaridadeJaccard, similaridadeNome };
})();

/* ------------------------------------------------------------- Deduplicação */
const dedupe = (() => {
  const LIMIAR_NOME = 0.9;
  function extrair(reg) {
    const nome = reg.nome || reg.empresa || '';
    return {
      nomeNorm: norm.normalizarNome(nome),
      telefone: norm.normalizarTelefone(reg.telefone || reg.whatsapp || ''),
      whatsapp: norm.normalizarTelefone(reg.whatsapp || ''),
      site: norm.normalizarSite(reg.site || ''),
      instagram: norm.normalizarInstagram(reg.instagram || ''),
      email: norm.normalizarEmail(reg.email || ''),
      cidade: norm.normalizarTexto(reg.cidade || ''),
      endereco: norm.normalizarEndereco(reg.endereco || ''),
    };
  }
  function temForte(id) { return !!(id.telefone || id.site || id.instagram || id.email); }
  function gerarHash(reg) {
    const id = extrair(reg);
    return id.telefone || id.site || id.instagram || id.email || `${id.nomeNorm}|${id.cidade}`;
  }
  const COL_NOME = { clientes: 'nome', prospeccao: 'empresa', resultados: 'nome' };
  function verificarDuplicado(candidato, opts = {}) {
    const tabelas = opts.tabelas || ['clientes', 'prospeccao', 'resultados'];
    const id = extrair(candidato);
    const db = Store.get();
    for (const tabela of tabelas) {
      const registros = db[tabela] || [];
      const cNome = COL_NOME[tabela];
      // 1) Identificadores fortes.
      for (const r of registros) {
        if (id.telefone && norm.normalizarTelefone(r.telefone || '').includes(id.telefone)) return dup(tabela, r, 'identificador forte (telefone)');
        if (id.site && String(r.site || '').toLowerCase().includes(id.site)) return dup(tabela, r, 'identificador forte (site)');
        if (id.instagram && String(r.instagram || '').toLowerCase().includes(id.instagram)) return dup(tabela, r, 'identificador forte (instagram)');
        if (id.email && norm.normalizarEmail(r.email || '') === id.email) return dup(tabela, r, 'identificador forte (email)');
      }
      // 2) Nome + cidade (só quando o candidato não tem identificador forte).
      if (id.nomeNorm && !temForte(id)) {
        for (const r of registros) {
          const cidR = norm.normalizarTexto(r.cidade || '');
          if (!(cidR === id.cidade || id.cidade === '')) continue;
          const s = sim.similaridadeNome(candidato.nome || candidato.empresa || '', r[cNome] || '');
          if (s >= LIMIAR_NOME) return dup(tabela, r, `nome similar (${(s * 100).toFixed(0)}%) na mesma cidade`);
        }
      }
    }
    return { duplicado: false };
  }
  function dup(tabela, r, motivo) { return { duplicado: true, motivo, tabela, id: r.id }; }
  function deduplicarLista(lista) {
    const vistos = new Set();
    const unicos = [];
    for (const item of lista) {
      const h = gerarHash(item);
      if (vistos.has(h)) continue;
      const idItem = extrair(item);
      let dupe = false;
      if (!temForte(idItem)) {
        for (const u of unicos) {
          if (temForte(extrair(u))) continue;
          if (norm.normalizarTexto(u.cidade || '') === norm.normalizarTexto(item.cidade || '') &&
              sim.similaridadeNome(u.nome || u.empresa || '', item.nome || item.empresa || '') >= LIMIAR_NOME) { dupe = true; break; }
        }
      }
      if (dupe) continue;
      vistos.add(h);
      unicos.push(item);
    }
    return unicos;
  }
  return { extrair, gerarHash, verificarDuplicado, deduplicarLista };
})();

/* --------------------------------------------------- Validação (sanitizar) */
const val = (() => {
  function texto(v, max = 2000) {
    if (v === undefined || v === null) return '';
    let s = String(v).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
    if (s.length > max) s = s.slice(0, max);
    return s;
  }
  function inteiro(v, padrao = 0, min = -Infinity, max = Infinity) {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return padrao;
    return Math.min(max, Math.max(min, n));
  }
  function emailValido(email) {
    const e = texto(email, 254);
    if (!e) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }
  function dataOuVazio(v) {
    const s = texto(v, 30);
    if (!s) return '';
    const d = new Date(s.length <= 10 ? s + 'T00:00:00' : s);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}`;
  }
  return { texto, inteiro, emailValido, dataOuVazio };
})();

/* ---------------------------------------------------- OSM: consultas (osm) */
const osm = (() => {
  function escapar(v) { return String(v).replace(/["\\]/g, '\\$&'); }
  const FALLBACK = ['shop', 'amenity', 'craft', 'office', 'leisure', 'tourism'];
  function linhasPorTags(lista, ref) {
    const l = [];
    for (const def of lista) {
      if (def.v && def.regex) l.push(`  nwr["${escapar(def.k)}"~"${escapar(def.v)}",i](${ref});`);
      else if (def.v) l.push(`  nwr["${escapar(def.k)}"="${escapar(def.v)}"](${ref});`);
      else l.push(`  nwr["${escapar(def.k)}"](${ref});`);
    }
    return l;
  }
  function linhasPorNome(termos, ref) {
    const alt = termos.map((t) => escapar(t)).join('|');
    return FALLBACK.map((cat) => `  nwr["${cat}"]["name"~"${alt}",i](${ref});`);
  }
  function corpo(nicho, ref) {
    if (nicho.osm && nicho.osm.length) return linhasPorTags(nicho.osm, ref).join('\n');
    const termos = nicho.termos && nicho.termos.length ? nicho.termos : [nicho.nome];
    return linhasPorNome(termos, ref).join('\n');
  }
  function montarConsultaArea(nicho, areaId, timeoutSeg, limite) {
    return [`[out:json][timeout:${timeoutSeg}];`, `area(${areaId})->.a;`, '(', corpo(nicho, 'area.a'), ');', `out center tags ${limite};`].join('\n');
  }
  function montarConsultaBBox(nicho, bbox, timeoutSeg, limite) {
    const ref = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
    return [`[out:json][timeout:${timeoutSeg}];`, '(', corpo(nicho, ref), ');', `out center tags ${limite};`].join('\n');
  }
  return { montarConsultaArea, montarConsultaBBox };
})();

/* ------------------------------------------- OSM: coleta (providers) */
const providers = (() => {
  const TIMEOUT = 30000, DELAY = 1100, MAXP = 50, MAXA = 300;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  async function fetchTimeout(url, opts = {}, ms = TIMEOUT) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), ms);
    try { return await fetch(url, { ...opts, signal: ctrl.signal }); }
    finally { clearTimeout(id); }
  }
  /** Servidores ativos de um tipo ('nominatim' | 'overpass'), na ordem configurada. */
  function serversAtivos(tipo) {
    const db = Store.get();
    const cfg = (db && db.config && db.config.pesquisa) || {};
    return (cfg[tipo] || []).filter((s) => s.ativo && s.url);
  }
  /** Monta a URL final anexando parâmetros e, se houver, a chave de API. */
  function comChave(baseUrl, server, params) {
    let u = baseUrl;
    if (params) u += (u.includes('?') ? '&' : '?') + params;
    if (server.apiKey && server.keyParam) u += (u.includes('?') ? '&' : '?') + encodeURIComponent(server.keyParam) + '=' + encodeURIComponent(server.apiKey);
    return u;
  }
  async function geocodeEm(server, consulta) {
    const url = comChave(server.url, server, 'format=json&limit=1&addressdetails=1&countrycodes=br&q=' + encodeURIComponent(consulta));
    const resp = await fetchTimeout(url, { headers: { 'Accept-Language': 'pt-BR' } });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    if (!Array.isArray(dados) || !dados.length) throw new Error('cidade não encontrada');
    return dados[0];
  }
  async function geocodificarCidade(cidade, estado) {
    const servers = serversAtivos('nominatim');
    if (!servers.length) throw new Error('Nenhum servidor de geocodificação ativo. Abra "⚙ Servidores" e ative ou adicione um.');
    const consulta = [cidade, estado, 'Brasil'].filter(Boolean).join(', ');
    let ultimo;
    for (const s of servers) {
      try {
        const lugar = await geocodeEm(s, consulta);
        const bb = (lugar.boundingbox || []).map(Number);
        const bbox = [bb[0], bb[2], bb[1], bb[3]];
        let areaId;
        if (lugar.osm_type === 'relation') areaId = 3600000000 + Number(lugar.osm_id);
        else if (lugar.osm_type === 'way') areaId = 2400000000 + Number(lugar.osm_id);
        return { areaId, bbox, displayName: lugar.display_name, lat: Number(lugar.lat), lon: Number(lugar.lon) };
      } catch (e) { ultimo = e; }
    }
    throw new Error(`Não foi possível localizar a cidade "${consulta}" nas fontes ativas: ${ultimo ? ultimo.message : 'sem resposta'}`);
  }
  async function overpassEm(server, ql) {
    const url = comChave(server.url, server, '');
    const resp = await fetchTimeout(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(ql) });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const dados = await resp.json();
    return dados.elements || [];
  }
  async function consultarOverpass(ql) {
    const servers = serversAtivos('overpass');
    if (!servers.length) throw new Error('Nenhum servidor Overpass ativo. Abra "⚙ Servidores" e ative ou adicione um.');
    let ultimo;
    for (const s of servers) {
      try { return await overpassEm(s, ql); }
      catch (e) { ultimo = e; await delay(500); }
    }
    throw new Error(`Servidores Overpass indisponíveis: ${ultimo ? ultimo.message : 'sem resposta'}`);
  }
  /** Testes de conectividade (usados no gerenciador de servidores). */
  async function testarGeocode(server) {
    const lugar = await geocodeEm(server, 'São Paulo, SP, Brasil');
    return { ok: !!lugar, msg: lugar ? ('OK — ' + String(lugar.display_name || 'resposta recebida').slice(0, 60)) : 'sem resultado' };
  }
  async function testarOverpass(server) {
    const els = await overpassEm(server, '[out:json][timeout:15];node["amenity"="cafe"](-23.561,-46.656,-23.55,-46.645);out 1;');
    return { ok: true, msg: 'OK — respondeu (amostra: ' + els.length + ')' };
  }
  function extrairTelefone(t) { return t['contact:phone'] || t.phone || t['contact:mobile'] || t['contact:whatsapp'] || ''; }
  function categoriaDe(t) { return t.shop || t.amenity || t.craft || t.office || t.leisure || t.tourism || t.healthcare || ''; }
  function montarEndereco(t) { return [t['addr:street'], t['addr:housenumber'], t['addr:suburb'], t['addr:neighbourhood']].filter(Boolean).join(', '); }
  function mapear(el, ctx) {
    const t = el.tags || {};
    const nome = t.name || t.operator || t.brand || '';
    if (!nome) return null;
    const lat = el.lat != null ? el.lat : el.center ? el.center.lat : null;
    const lon = el.lon != null ? el.lon : el.center ? el.center.lon : null;
    const tel = extrairTelefone(t);
    return {
      nome, telefone: tel, whatsapp: t['contact:whatsapp'] || tel || '',
      instagram: norm.normalizarInstagram(t['contact:instagram'] || t.instagram || ''),
      site: t['contact:website'] || t.website || t.url || '',
      email: t['contact:email'] || t.email || '',
      cidade: t['addr:city'] || ctx.cidade || '', estado: t['addr:state'] || ctx.estado || '',
      endereco: montarEndereco(t), latitude: lat, longitude: lon,
      categoria: categoriaDe(t) || ctx.nicho || '', horario: t.opening_hours || '',
      avaliacao: null, qtd_avaliacoes: null, origem: 'OpenStreetMap',
      url_origem: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    };
  }
  function gerarDemo(cidade, estado, nicho, max) {
    const qtd = Math.min(max || 20, 25), ddd = '16', lista = [];
    for (let i = 1; i <= qtd; i++) {
      const num = String(90000000 + i * 137).slice(0, 8);
      lista.push({
        nome: `${nicho} Exemplo ${i} (DEMONSTRAÇÃO)`,
        telefone: `(${ddd}) 9${num.slice(0, 4)}-${num.slice(4)}`, whatsapp: `55${ddd}9${num}`,
        instagram: `${norm.normalizarTexto(nicho).replace(/\s/g, '')}exemplo${i}`,
        site: `www.exemplo${i}.com.br`, email: `contato${i}@exemplo.com.br`,
        cidade: cidade || 'Cidade Exemplo', estado: estado || '', endereco: `Rua Exemplo, ${100 + i}`,
        latitude: null, longitude: null, categoria: nicho, horario: 'Seg-Sex 08:00-18:00',
        avaliacao: null, qtd_avaliacoes: null, origem: 'Demonstração (dados de exemplo — não reais)', url_origem: '',
      });
    }
    return lista;
  }
  async function coletar({ cidade, estado, nicho, max, demo }, nichoDef) {
    const limite = Math.min(max || MAXP, MAXA);
    if (demo) return { resultados: gerarDemo(cidade, estado, nicho, limite), fonte: 'demonstracao', mensagem: 'Modo demonstração ativo — resultados de exemplo (não reais).' };
    const local = await geocodificarCidade(cidade, estado);
    await delay(DELAY);
    const timeoutSeg = Math.floor(TIMEOUT / 1000);
    const def = nichoDef || { nome: nicho, termos: [nicho] };
    const ql = local.areaId ? osm.montarConsultaArea(def, local.areaId, timeoutSeg, limite * 3) : osm.montarConsultaBBox(def, local.bbox, timeoutSeg, limite * 3);
    const elementos = await consultarOverpass(ql);
    const ctx = { cidade, estado, nicho };
    const mapeados = elementos.map((el) => mapear(el, ctx)).filter(Boolean);
    return { resultados: mapeados, fonte: 'openstreetmap', mensagem: `Coletados ${mapeados.length} registros no OpenStreetMap (${local.displayName}).` };
  }
  return { coletar, gerarDemo, testarGeocode, testarOverpass };
})();

/* -------------------------------------------- Camada de dados (localStorage) */
const Store = (() => {
  const KEY = 'estacaoTrabalhoDB_v1';
  let db = null;
  function seedNichos() { return (window.__NICHOS__ || []).map((n, i) => ({ id: i + 1, nome: n.nome, categoria: n.categoria, termos: n.termos || [], osm: n.osm || [] })); }
  function configPadrao() {
    return {
      pesquisa: {
        seq: 100,
        nominatim: [
          { id: 1, nome: 'OpenStreetMap (Nominatim)', url: 'https://nominatim.openstreetmap.org/search', keyParam: '', apiKey: '', ativo: true, builtin: true },
        ],
        overpass: [
          { id: 1, nome: 'overpass-api.de (oficial)', url: 'https://overpass-api.de/api/interpreter', keyParam: '', apiKey: '', ativo: true, builtin: true },
          { id: 2, nome: 'kumi.systems', url: 'https://overpass.kumi.systems/api/interpreter', keyParam: '', apiKey: '', ativo: true, builtin: true },
          { id: 3, nome: 'private.coffee', url: 'https://overpass.private.coffee/api/interpreter', keyParam: '', apiKey: '', ativo: true, builtin: true },
        ],
      },
    };
  }
  function novoDB() {
    return {
      versao: 1,
      usuario: { login: 'admin', nome: 'Administrador', senha: hashSenha('admin123') },
      logado: false,
      seq: { clientes: 0, prospeccao: 0, pesquisas: 0, resultados: 0, historico: 0 },
      clientes: [], prospeccao: [], pesquisas: [], resultados: [],
      nichos: seedNichos(), historico: [], config: configPadrao(),
    };
  }
  function carregar() {
    try { const raw = localStorage.getItem(KEY); if (raw) db = JSON.parse(raw); } catch (_) { db = null; }
    if (!db || !db.seq || !db.usuario) { db = novoDB(); salvar(); }
    if (!db.nichos || !db.nichos.length) { db.nichos = seedNichos(); salvar(); }
    if (!db.config || !db.config.pesquisa || !db.config.pesquisa.overpass) { db.config = configPadrao(); salvar(); }
    return db;
  }
  function salvar() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { try { UI.toast('Não foi possível salvar os dados (armazenamento cheio?).', 'error'); } catch (_) {} return false; }
  }
  function exportarJSON() { return JSON.stringify(db, null, 2); }
  function importarJSON(texto) {
    const novo = JSON.parse(texto);
    if (!novo || !novo.seq || !novo.usuario) throw new Error('Arquivo de backup inválido.');
    db = novo;
    if (!db.nichos || !db.nichos.length) db.nichos = seedNichos();
    salvar();
    return db;
  }
  return { carregar, salvar, get: () => db, novoDB, exportarJSON, importarJSON };
})();

/* ------------------------------------------- Config: servidores de pesquisa */
const Config = (() => {
  function pes() { return Store.get().config.pesquisa; }
  function listar(tipo) { return (pes()[tipo] || []).slice(); }
  function adicionar(tipo, dados) {
    const c = pes();
    if (!c[tipo]) c[tipo] = [];
    const id = ++c.seq;
    c[tipo].push({ id, nome: (dados.nome || '').trim() || ('Servidor ' + id), url: (dados.url || '').trim(), keyParam: (dados.keyParam || '').trim(), apiKey: (dados.apiKey || '').trim(), ativo: true, builtin: false });
    Store.salvar();
    return id;
  }
  function atualizar(tipo, id, dados) {
    const s = (pes()[tipo] || []).find((x) => x.id === Number(id));
    if (!s) return { ok: false, erro: 'Servidor não encontrado.' };
    if (dados.nome !== undefined) s.nome = String(dados.nome).trim() || s.nome;
    if (dados.url !== undefined && !s.builtin) s.url = String(dados.url).trim();
    if (dados.keyParam !== undefined) s.keyParam = String(dados.keyParam).trim();
    if (dados.apiKey !== undefined) s.apiKey = String(dados.apiKey).trim();
    Store.salvar();
    return { ok: true };
  }
  function remover(tipo, id) {
    const c = pes();
    const s = (c[tipo] || []).find((x) => x.id === Number(id));
    if (!s) return { ok: false, erro: 'Servidor não encontrado.' };
    if (s.builtin) return { ok: false, erro: 'Servidores padrão não podem ser removidos — apenas desativados.' };
    c[tipo] = c[tipo].filter((x) => x.id !== Number(id));
    Store.salvar();
    return { ok: true };
  }
  function toggle(tipo, id, ativo) {
    const s = (pes()[tipo] || []).find((x) => x.id === Number(id));
    if (s) { s.ativo = !!ativo; Store.salvar(); }
  }
  async function testar(tipo, server) {
    try {
      const r = tipo === 'nominatim' ? await providers.testarGeocode(server) : await providers.testarOverpass(server);
      return { ok: true, msg: r.msg };
    } catch (e) { return { ok: false, msg: e.message || 'falhou' }; }
  }
  return { listar, adicionar, atualizar, remover, toggle, testar };
})();

/* ---------------------------------------------------------------- Histórico */
function registrarHistorico(tipo, descricao, detalhes) {
  const db = Store.get();
  db.historico.unshift({ id: ++db.seq.historico, tipo, descricao, detalhes: detalhes || null, usuario_login: db.usuario.login, criado_em: agora() });
  if (db.historico.length > 5000) db.historico.length = 5000;
  Store.salvar();
}

/* ----------------------------------------------- Ordenação / busca (helpers) */
function cmp(a, b, dir) {
  const na = Number(a), nb = Number(b);
  let r;
  if (a !== '' && b !== '' && !Number.isNaN(na) && !Number.isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') r = na - nb;
  else r = String(a == null ? '' : a).localeCompare(String(b == null ? '' : b), 'pt-BR', { sensitivity: 'base' });
  return dir === 'DESC' ? -r : r;
}
function ordenar(arr, col, dir) { return arr.slice().sort((x, y) => cmp(x[col], y[col], dir)); }
function contem(v, termo) { return String(v || '').toLowerCase().includes(termo); }

/* -------------------------------------------------- Serviço: Clientes Fixos */
const svcClientes = (() => {
  const COLS = ['nome', 'cidade', 'telefone', 'email', 'data_cadastro', 'ultimo_contato', 'criado_em'];
  function sanitizar(d) {
    return {
      nome: val.texto(d.nome, 200), telefone: val.texto(d.telefone, 40), whatsapp: val.texto(d.whatsapp, 40),
      cidade: val.texto(d.cidade, 120), instagram: val.texto(d.instagram, 200), site: val.texto(d.site, 300),
      email: val.texto(d.email, 254), observacoes: val.texto(d.observacoes, 5000),
      data_cadastro: val.dataOuVazio(d.data_cadastro) || undefined, ultimo_contato: val.dataOuVazio(d.ultimo_contato) || null,
    };
  }
  function listar({ search = '', sort = 'nome', order = 'ASC', page = 1, pageSize = 50 } = {}) {
    const col = COLS.includes(sort) ? sort : 'nome';
    const dir = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    let itens = Store.get().clientes.slice();
    if (search) { const s = search.toLowerCase(); itens = itens.filter((c) => contem(c.nome, s) || contem(c.cidade, s) || contem(c.telefone, s) || contem(c.email, s) || contem(c.instagram, s)); }
    const total = itens.length;
    itens = ordenar(itens, col, dir);
    page = Number(page) || 1; pageSize = Number(pageSize) || 50;
    const off = (page - 1) * pageSize;
    return { total, page, pageSize, itens: itens.slice(off, off + pageSize) };
  }
  function obter(id) { return Store.get().clientes.find((c) => c.id === Number(id)); }
  function criar(dados, { forcar = false } = {}) {
    const d = sanitizar(dados);
    if (!d.nome) return { ok: false, erro: 'O nome é obrigatório.' };
    if (!val.emailValido(d.email)) return { ok: false, erro: 'E-mail inválido.' };
    if (!forcar) { const dup = dedupe.verificarDuplicado(d); if (dup.duplicado) return { ok: false, erro: `Registro duplicado (${dup.motivo}).`, duplicado: dup }; }
    const db = Store.get();
    const reg = { id: ++db.seq.clientes, ...d, data_cadastro: d.data_cadastro || hoje(), ultimo_contato: d.ultimo_contato || null, hash_dedupe: dedupe.gerarHash(d), criado_em: agora(), atualizado_em: agora() };
    delete reg.data_cadastro_undefined;
    db.clientes.push(reg);
    registrarHistorico('alteracao', `Cliente criado: ${d.nome}`, { id: reg.id });
    return { ok: true, id: reg.id };
  }
  function atualizar(id, dados) {
    const atual = obter(id);
    if (!atual) return { ok: false, erro: 'Cliente não encontrado.' };
    const d = sanitizar(dados);
    if (!d.nome) return { ok: false, erro: 'O nome é obrigatório.' };
    if (!val.emailValido(d.email)) return { ok: false, erro: 'E-mail inválido.' };
    Object.assign(atual, { nome: d.nome, telefone: d.telefone, whatsapp: d.whatsapp, cidade: d.cidade, instagram: d.instagram, site: d.site, email: d.email, observacoes: d.observacoes, ultimo_contato: d.ultimo_contato, hash_dedupe: dedupe.gerarHash(d), atualizado_em: agora() });
    registrarHistorico('alteracao', `Cliente atualizado: ${d.nome}`, { id: atual.id });
    Store.salvar();
    return { ok: true };
  }
  function excluir(id) {
    const db = Store.get();
    const i = db.clientes.findIndex((c) => c.id === Number(id));
    if (i < 0) return { ok: false, erro: 'Cliente não encontrado.' };
    const nome = db.clientes[i].nome;
    db.clientes.splice(i, 1);
    registrarHistorico('exclusao', `Cliente excluído: ${nome}`, { id: Number(id) });
    return { ok: true };
  }
  function todos() { return ordenar(Store.get().clientes, 'nome', 'ASC'); }
  return { listar, obter, criar, atualizar, excluir, todos };
})();

/* ---------------------------------------------------- Serviço: Prospecção */
const svcProspeccao = (() => {
  const STATUS = ['Novo', 'Contatado', 'Negociando', 'Proposta', 'Fechado', 'Perdido'];
  const COLS = ['empresa', 'cidade', 'estado', 'nicho', 'status', 'probabilidade', 'data', 'ultimo_contato'];
  function sanitizar(d) {
    let status = val.texto(d.status, 30) || 'Novo';
    if (!STATUS.includes(status)) status = 'Novo';
    return {
      empresa: val.texto(d.empresa, 200), cidade: val.texto(d.cidade, 120), estado: val.texto(d.estado, 40),
      nicho: val.texto(d.nicho, 120), telefone: val.texto(d.telefone, 40), whatsapp: val.texto(d.whatsapp, 40),
      instagram: val.texto(d.instagram, 200), site: val.texto(d.site, 300), email: val.texto(d.email, 254),
      responsavel: val.texto(d.responsavel, 120), status, origem: val.texto(d.origem, 120),
      data: val.dataOuVazio(d.data) || undefined, ultimo_contato: val.dataOuVazio(d.ultimo_contato) || null,
      probabilidade: val.inteiro(d.probabilidade, 0, 0, 100), observacoes: val.texto(d.observacoes, 5000),
    };
  }
  function listar({ search = '', cidade = '', estado = '', nicho = '', status = '', probMin = '', sort = 'empresa', order = 'ASC', page = 1, pageSize = 50 } = {}) {
    const col = COLS.includes(sort) ? sort : 'empresa';
    const dir = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    let itens = Store.get().prospeccao.slice();
    if (search) { const s = search.toLowerCase(); itens = itens.filter((p) => contem(p.empresa, s) || contem(p.cidade, s) || contem(p.telefone, s) || contem(p.email, s) || contem(p.responsavel, s)); }
    if (cidade) itens = itens.filter((p) => String(p.cidade || '').toLowerCase() === cidade.toLowerCase());
    if (estado) itens = itens.filter((p) => String(p.estado || '').toLowerCase() === estado.toLowerCase());
    if (nicho) itens = itens.filter((p) => contem(p.nicho, nicho.toLowerCase()));
    if (status) itens = itens.filter((p) => p.status === status);
    if (probMin !== '' && probMin !== undefined) { const pm = val.inteiro(probMin, 0, 0, 100); itens = itens.filter((p) => (p.probabilidade || 0) >= pm); }
    const total = itens.length;
    itens = ordenar(itens, col, dir);
    page = Number(page) || 1; pageSize = Number(pageSize) || 50;
    const off = (page - 1) * pageSize;
    return { total, page, pageSize, itens: itens.slice(off, off + pageSize), statusValidos: STATUS };
  }
  function obter(id) { return Store.get().prospeccao.find((p) => p.id === Number(id)); }
  function criar(dados, { forcar = false } = {}) {
    const d = sanitizar(dados);
    if (!d.empresa) return { ok: false, erro: 'O nome da empresa é obrigatório.' };
    if (!val.emailValido(d.email)) return { ok: false, erro: 'E-mail inválido.' };
    if (!forcar) { const dup = dedupe.verificarDuplicado({ ...d, nome: d.empresa }); if (dup.duplicado) return { ok: false, erro: `Registro duplicado (${dup.motivo}).`, duplicado: dup }; }
    const db = Store.get();
    const reg = { id: ++db.seq.prospeccao, ...d, data: d.data || hoje(), ultimo_contato: d.ultimo_contato || null, hash_dedupe: dedupe.gerarHash({ ...d, nome: d.empresa }), criado_em: agora(), atualizado_em: agora() };
    db.prospeccao.push(reg);
    registrarHistorico('alteracao', `Prospecção criada: ${d.empresa}`, { id: reg.id });
    return { ok: true, id: reg.id };
  }
  function atualizar(id, dados) {
    const atual = obter(id);
    if (!atual) return { ok: false, erro: 'Registro não encontrado.' };
    const d = sanitizar(dados);
    if (!d.empresa) return { ok: false, erro: 'O nome da empresa é obrigatório.' };
    if (!val.emailValido(d.email)) return { ok: false, erro: 'E-mail inválido.' };
    Object.assign(atual, { empresa: d.empresa, cidade: d.cidade, estado: d.estado, nicho: d.nicho, telefone: d.telefone, whatsapp: d.whatsapp, instagram: d.instagram, site: d.site, email: d.email, responsavel: d.responsavel, status: d.status, origem: d.origem, ultimo_contato: d.ultimo_contato, probabilidade: d.probabilidade, observacoes: d.observacoes, hash_dedupe: dedupe.gerarHash({ ...d, nome: d.empresa }), atualizado_em: agora() });
    registrarHistorico('alteracao', `Prospecção atualizada: ${d.empresa}`, { id: atual.id });
    Store.salvar();
    return { ok: true };
  }
  function excluir(id) {
    const db = Store.get();
    const i = db.prospeccao.findIndex((p) => p.id === Number(id));
    if (i < 0) return { ok: false, erro: 'Registro não encontrado.' };
    const nome = db.prospeccao[i].empresa;
    db.prospeccao.splice(i, 1);
    registrarHistorico('exclusao', `Prospecção excluída: ${nome}`, { id: Number(id) });
    return { ok: true };
  }
  function moverParaClientes(id) {
    const db = Store.get();
    const r = obter(id);
    if (!r) return { ok: false, erro: 'Registro não encontrado.' };
    const candidato = { nome: r.empresa, cidade: r.cidade, telefone: r.telefone, whatsapp: r.whatsapp, site: r.site, instagram: r.instagram, email: r.email };
    const dup = dedupe.verificarDuplicado(candidato, { tabelas: ['clientes'] });
    if (dup.duplicado) return { ok: false, erro: `Já existe em Clientes Fixos (${dup.motivo}).` };
    const cli = {
      id: ++db.seq.clientes, nome: r.empresa, telefone: r.telefone || '', whatsapp: r.whatsapp || '', cidade: r.cidade || '',
      instagram: r.instagram || '', site: r.site || '', email: r.email || '',
      observacoes: [r.observacoes, r.nicho ? `Nicho: ${r.nicho}` : '', r.origem ? `Origem: ${r.origem}` : ''].filter(Boolean).join(' | '),
      data_cadastro: hoje(), ultimo_contato: r.ultimo_contato || null, hash_dedupe: dedupe.gerarHash(candidato), criado_em: agora(), atualizado_em: agora(),
    };
    db.clientes.push(cli);
    const i = db.prospeccao.findIndex((p) => p.id === Number(id));
    db.prospeccao.splice(i, 1);
    registrarHistorico('movimentacao', `Prospecção movida para Clientes: ${r.empresa}`, { id: Number(id) });
    return { ok: true };
  }
  function todos() { return ordenar(Store.get().prospeccao, 'empresa', 'ASC'); }
  return { listar, obter, criar, atualizar, excluir, moverParaClientes, todos, STATUS };
})();

/* -------------------------------------------- Serviço: Pesquisa / Revisão */
const svcPesquisa = (() => {
  function resolverNicho(texto) {
    const nichos = Store.get().nichos;
    let row = nichos.find((n) => n.nome.toLowerCase() === String(texto).toLowerCase()) || nichos.find((n) => n.nome.toLowerCase().includes(String(texto).toLowerCase()));
    if (row) return { nome: row.nome, categoria: row.categoria, termos: row.termos || [texto], osm: row.osm || [] };
    return { nome: texto, termos: [texto], osm: [] };
  }
  async function executar({ cidade, estado, nicho, max, demo }) {
    const db = Store.get();
    const nichoDef = resolverNicho(nicho);
    let coleta;
    try {
      coleta = await providers.coletar({ cidade, estado, nicho, max, demo }, nichoDef);
    } catch (err) {
      const pid = ++db.seq.pesquisas;
      db.pesquisas.push({ id: pid, cidade, estado, nicho, max_qtd: max, total_encontrado: 0, total_novo: 0, fonte: 'erro', status: 'falha', mensagem: err.message, criado_em: agora() });
      registrarHistorico('erro', `Falha na pesquisa: ${nicho} em ${cidade}`, { erro: err.message });
      return { pesquisaId: pid, total: 0, novos: 0, duplicados: 0, fonte: 'erro', mensagem: err.message, erro: true };
    }
    const unicos = dedupe.deduplicarLista(coleta.resultados);
    const novos = [];
    let duplicados = 0;
    for (const item of unicos) {
      const check = dedupe.verificarDuplicado(item);
      if (check.duplicado) { duplicados++; continue; }
      novos.push(item);
      if (novos.length >= (max || novos.length)) break;
    }
    const pid = ++db.seq.pesquisas;
    db.pesquisas.push({ id: pid, cidade, estado, nicho, max_qtd: max, total_encontrado: coleta.resultados.length, total_novo: novos.length, fonte: coleta.fonte, status: 'concluida', mensagem: coleta.mensagem, criado_em: agora() });
    for (const r of novos) {
      db.resultados.push({
        id: ++db.seq.resultados, pesquisa_id: pid, nome: r.nome, telefone: r.telefone || '', whatsapp: r.whatsapp || '',
        instagram: r.instagram || '', site: r.site || '', email: r.email || '', cidade: r.cidade || cidade || '', estado: r.estado || estado || '',
        endereco: r.endereco || '', latitude: r.latitude, longitude: r.longitude, categoria: r.categoria || '', horario: r.horario || '',
        avaliacao: r.avaliacao, qtd_avaliacoes: r.qtd_avaliacoes, origem: r.origem || coleta.fonte, url_origem: r.url_origem || '',
        data_coleta: agora(), status: 'novo', hash_dedupe: dedupe.gerarHash(r),
      });
    }
    registrarHistorico('pesquisa', `Pesquisa: ${nicho} em ${cidade}/${estado} — ${novos.length} novos, ${duplicados} duplicados`, { cidade, estado, nicho, max, fonte: coleta.fonte });
    return { pesquisaId: pid, total: coleta.resultados.length, novos: novos.length, duplicados, fonte: coleta.fonte, mensagem: coleta.mensagem };
  }
  function listarPesquisas() {
    const db = Store.get();
    const itens = db.pesquisas.slice().sort((a, b) => b.id - a.id).map((p) => ({ ...p, pendentes: db.resultados.filter((r) => r.pesquisa_id === p.id && r.status === 'novo').length }));
    return { total: itens.length, itens };
  }
  function listarResultados(pesquisaId, { status = '', search = '', sort = 'id', order = 'ASC' } = {}) {
    let itens = Store.get().resultados.filter((r) => r.pesquisa_id === Number(pesquisaId));
    if (status) itens = itens.filter((r) => r.status === status);
    if (search) { const s = search.toLowerCase(); itens = itens.filter((r) => contem(r.nome, s) || contem(r.cidade, s) || contem(r.categoria, s)); }
    const col = ['id', 'nome', 'cidade', 'categoria', 'status'].includes(sort) ? sort : 'id';
    const dir = String(order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    return { itens: ordenar(itens, col, dir) };
  }
  function descartar(ids) {
    const db = Store.get();
    ids.forEach((id) => { const r = db.resultados.find((x) => x.id === Number(id)); if (r) r.status = 'descartado'; });
    registrarHistorico('movimentacao', `Descartados ${ids.length} resultados`, { ids });
    return { descartados: ids.length };
  }
  function excluirResultados(ids) {
    const db = Store.get();
    db.resultados = db.resultados.filter((r) => !ids.map(Number).includes(r.id));
    registrarHistorico('exclusao', `Excluídos ${ids.length} resultados de pesquisa`, { ids });
    Store.salvar();
    return { excluidos: ids.length };
  }
  function moverParaProspeccao(ids) {
    const db = Store.get();
    let movidos = 0, ignorados = 0;
    for (const id of ids) {
      const r = db.resultados.find((x) => x.id === Number(id));
      if (!r || r.status === 'movido') { ignorados++; continue; }
      const candidato = { empresa: r.nome, nome: r.nome, cidade: r.cidade, telefone: r.telefone, whatsapp: r.whatsapp, site: r.site, instagram: r.instagram, email: r.email, endereco: r.endereco };
      const dup = dedupe.verificarDuplicado(candidato, { tabelas: ['clientes', 'prospeccao'] });
      if (dup.duplicado) { r.status = 'movido'; ignorados++; continue; }
      const obs = [r.endereco, r.horario, r.url_origem ? `Fonte: ${r.url_origem}` : ''].filter(Boolean).join(' | ');
      db.prospeccao.push({
        id: ++db.seq.prospeccao, empresa: r.nome, cidade: r.cidade || '', estado: r.estado || '', nicho: r.categoria || '',
        telefone: r.telefone || '', whatsapp: r.whatsapp || '', instagram: r.instagram || '', site: r.site || '', email: r.email || '',
        responsavel: '', status: 'Novo', origem: r.origem || 'Pesquisa', data: hoje(), ultimo_contato: null, probabilidade: 0,
        observacoes: obs, hash_dedupe: r.hash_dedupe || dedupe.gerarHash(candidato), criado_em: agora(), atualizado_em: agora(),
      });
      r.status = 'movido';
      movidos++;
    }
    registrarHistorico('movimentacao', `Movidos ${movidos} resultados para Prospecção (${ignorados} ignorados por duplicidade)`, { ids });
    return { movidos, ignorados };
  }
  return { executar, listarPesquisas, listarResultados, descartar, excluirResultados, moverParaProspeccao };
})();

/* ------------------------------------------------------- Serviço: Nichos */
function listarNichos({ search = '', categoria = '' } = {}) {
  let itens = Store.get().nichos.slice();
  const categorias = Array.from(new Set(itens.map((n) => n.categoria).filter(Boolean))).sort();
  const total = itens.length;
  if (categoria) itens = itens.filter((n) => n.categoria === categoria);
  if (search) {
    const s = norm.normalizarTexto(search);
    itens = itens.filter((n) => norm.normalizarTexto(n.nome).includes(s) || (n.termos || []).some((t) => norm.normalizarTexto(t).includes(s)) || norm.normalizarTexto(n.categoria).includes(s));
  }
  itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  return { itens, categorias, total };
}

/* ---------------------------------------------------- Serviço: Histórico */
function listarHistorico({ tipo = '', page = 1, pageSize = 50 } = {}) {
  let itens = Store.get().historico.slice();
  const tipos = Array.from(new Set(itens.map((h) => h.tipo))).sort();
  if (tipo) itens = itens.filter((h) => h.tipo === tipo);
  const total = itens.length;
  page = Number(page) || 1; pageSize = Number(pageSize) || 50;
  const off = (page - 1) * pageSize;
  return { total, page, pageSize, tipos, itens: itens.slice(off, off + pageSize) };
}

/* ------------------------------------------------------------- Estatísticas */
function calcularStats() {
  const db = Store.get();
  const stats = {
    clientes: db.clientes.length,
    prospeccao: db.prospeccao.length,
    prospeccaoFechado: db.prospeccao.filter((p) => p.status === 'Fechado').length,
    prospeccaoNegociando: db.prospeccao.filter((p) => ['Negociando', 'Proposta', 'Contatado'].includes(p.status)).length,
    pesquisas: db.pesquisas.length,
    resultadosPendentes: db.resultados.filter((r) => r.status === 'novo').length,
    nichos: db.nichos.length,
  };
  const mapa = {};
  db.prospeccao.forEach((p) => { mapa[p.status] = (mapa[p.status] || 0) + 1; });
  const porStatus = Object.keys(mapa).map((status) => ({ status, n: mapa[status] })).sort((a, b) => b.n - a.n);
  const ultimasPesquisas = db.pesquisas.slice().sort((a, b) => b.id - a.id).slice(0, 5).map((p) => ({ id: p.id, cidade: p.cidade, estado: p.estado, nicho: p.nicho, total_novo: p.total_novo, criado_em: p.criado_em }));
  return { stats, porStatus, ultimasPesquisas };
}

/* ------------------------------------------------- Importação de planilhas */
const SINONIMOS = {
  nome: ['nome', 'empresa', 'razao social', 'razao', 'cliente', 'fantasia', 'nome fantasia', 'estabelecimento', 'name', 'company'],
  telefone: ['telefone', 'fone', 'tel', 'celular', 'contato', 'phone', 'telefone1', 'telefone 1', 'ddd telefone'],
  whatsapp: ['whatsapp', 'whats', 'zap', 'wpp', 'whatsapp1'],
  cidade: ['cidade', 'municipio', 'city', 'localidade'],
  estado: ['estado', 'uf', 'state'],
  nicho: ['nicho', 'segmento', 'categoria', 'ramo', 'atividade', 'setor'],
  instagram: ['instagram', 'insta', 'ig', '@'],
  site: ['site', 'website', 'url', 'pagina', 'web', 'homepage'],
  email: ['email', 'e-mail', 'e mail', 'mail'],
  responsavel: ['responsavel', 'contato responsavel', 'proprietario', 'dono', 'gerente'],
  status: ['status', 'situacao', 'estagio'],
  origem: ['origem', 'fonte', 'source'],
  observacoes: ['observacoes', 'observacao', 'obs', 'notas', 'anotacoes', 'descricao', 'comentarios'],
  probabilidade: ['probabilidade', 'chance', 'prob'],
  endereco: ['endereco', 'logradouro', 'rua', 'address'],
};
function mapearColunas(cabecalhos) {
  const mapa = {};
  cabecalhos.forEach((titulo, idx) => {
    const t = norm.normalizarTexto(titulo);
    if (!t) return;
    for (const [campo, alts] of Object.entries(SINONIMOS)) {
      if (mapa[campo] !== undefined) continue;
      if (alts.some((a) => t === a || t.includes(a) || a.includes(t))) { mapa[campo] = idx; break; }
    }
  });
  return mapa;
}
function lerArquivo(file) {
  return new Promise((resolve, reject) => {
    const nome = (file.name || '').toLowerCase();
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    if (nome.endsWith('.csv') || nome.endsWith('.txt') || nome.endsWith('.tsv')) {
      reader.onload = () => { try { resolve(SheetLib.lerCsv(String(reader.result))); } catch (e) { reject(e); } };
      reader.readAsText(file, 'utf-8');
    } else if (nome.endsWith('.xlsx')) {
      reader.onload = () => { try { resolve(SheetLib.lerXlsx(new Uint8Array(reader.result))); } catch (e) { reject(new Error('Falha ao ler o Excel: ' + e.message)); } };
      reader.readAsArrayBuffer(file);
    } else if (nome.endsWith('.xls')) {
      reject(new Error('Formato .xls antigo não é suportado. Abra no Excel e salve como .xlsx ou .csv.'));
    } else {
      // tenta como xlsx e, se falhar, como CSV
      reader.onload = () => {
        try { resolve(SheetLib.lerXlsx(new Uint8Array(reader.result))); }
        catch (_) {
          const r2 = new FileReader();
          r2.onload = () => { try { resolve(SheetLib.lerCsv(String(r2.result))); } catch (e) { reject(e); } };
          r2.onerror = () => reject(new Error('Formato não reconhecido. Use .xlsx ou .csv.'));
          r2.readAsText(file, 'utf-8');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  });
}
async function importarPlanilha(file, destino) {
  const linhas = await lerArquivo(file);
  if (!linhas.length) return { ok: false, erro: 'A planilha está vazia.' };
  const cabecalhos = (linhas[0] || []).map((c) => String(c || '').trim());
  const mapa = mapearColunas(cabecalhos);
  if (!Object.keys(mapa).length) return { ok: false, erro: 'Não foi possível identificar colunas conhecidas na planilha. Verifique se a primeira linha tem os títulos (Nome, Telefone, Cidade, ...).' };
  if (mapa.nome === undefined) return { ok: false, erro: 'A planilha precisa ter ao menos uma coluna de Nome/Empresa.' };

  const corpo = linhas.slice(1);
  const total = corpo.length;
  let inseridos = 0, duplicados = 0, invalidos = 0;
  const erros = [];
  const vistos = new Set();
  const valor = (linha, campo) => { const i = mapa[campo]; return i === undefined ? '' : String(linha[i] == null ? '' : linha[i]).trim(); };

  for (let i = 0; i < corpo.length; i++) {
    const linha = corpo[i];
    try {
      const nome = valor(linha, 'nome');
      if (!nome) { invalidos++; continue; }
      const registro = {
        nome, empresa: nome, telefone: valor(linha, 'telefone'), whatsapp: valor(linha, 'whatsapp') || valor(linha, 'telefone'),
        cidade: valor(linha, 'cidade'), estado: valor(linha, 'estado'), nicho: valor(linha, 'nicho'),
        instagram: valor(linha, 'instagram'), site: valor(linha, 'site'), email: valor(linha, 'email'),
        responsavel: valor(linha, 'responsavel'), status: valor(linha, 'status'), origem: valor(linha, 'origem') || 'Importação',
        observacoes: [valor(linha, 'observacoes'), valor(linha, 'endereco')].filter(Boolean).join(' | '),
        probabilidade: valor(linha, 'probabilidade'),
      };
      const h = dedupe.gerarHash(registro);
      if (vistos.has(h)) { duplicados++; continue; }
      vistos.add(h);
      const res = destino === 'prospeccao' ? svcProspeccao.criar(registro) : svcClientes.criar(registro);
      if (res.ok) inseridos++;
      else if (res.duplicado) duplicados++;
      else { invalidos++; if (erros.length < 50) erros.push({ linha: i + 2, motivo: res.erro }); }
    } catch (err) { invalidos++; if (erros.length < 50) erros.push({ linha: i + 2, motivo: err.message }); }
  }
  Store.salvar();
  registrarHistorico('importacao', `Importação para ${destino}: ${inseridos} inseridos, ${duplicados} duplicados, ${invalidos} inválidos (de ${total})`, { destino, total, inseridos, duplicados, invalidos });
  return { ok: true, total, inseridos, duplicados, invalidos, erros };
}

/* ---------------------------------------------------- Exportação de dados */
const COLUNAS_CLIENTES = [
  { campo: 'nome', titulo: 'Nome' }, { campo: 'telefone', titulo: 'Telefone' }, { campo: 'whatsapp', titulo: 'WhatsApp' },
  { campo: 'cidade', titulo: 'Cidade' }, { campo: 'instagram', titulo: 'Instagram' }, { campo: 'site', titulo: 'Site' },
  { campo: 'email', titulo: 'E-mail' }, { campo: 'observacoes', titulo: 'Observações' },
  { campo: 'data_cadastro', titulo: 'Data Cadastro' }, { campo: 'ultimo_contato', titulo: 'Último Contato' },
];
const COLUNAS_PROSPECCAO = [
  { campo: 'empresa', titulo: 'Empresa' }, { campo: 'cidade', titulo: 'Cidade' }, { campo: 'estado', titulo: 'Estado' },
  { campo: 'nicho', titulo: 'Nicho' }, { campo: 'telefone', titulo: 'Telefone' }, { campo: 'whatsapp', titulo: 'WhatsApp' },
  { campo: 'instagram', titulo: 'Instagram' }, { campo: 'site', titulo: 'Site' }, { campo: 'email', titulo: 'E-mail' },
  { campo: 'responsavel', titulo: 'Responsável' }, { campo: 'status', titulo: 'Status' }, { campo: 'origem', titulo: 'Origem' },
  { campo: 'probabilidade', titulo: 'Prob. (%)' }, { campo: 'data', titulo: 'Data' }, { campo: 'ultimo_contato', titulo: 'Último Contato' },
  { campo: 'observacoes', titulo: 'Observações' },
];
function carimbo() { const d = new Date(); return `${d.getFullYear()}-${_pad(d.getMonth() + 1)}-${_pad(d.getDate())}-${_pad(d.getHours())}-${_pad(d.getMinutes())}-${_pad(d.getSeconds())}`; }
function baixarBlob(nome, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function montarMatriz(linhas, colunas) {
  const cab = colunas.map((c) => c.titulo);
  const corpo = linhas.map((l) => colunas.map((c) => { const v = l[c.campo]; return v === null || v === undefined ? '' : v; }));
  return [cab, ...corpo];
}
function exportarDados(entidade, formato) {
  const ehCliente = entidade === 'clientes';
  const linhas = ehCliente ? svcClientes.todos() : svcProspeccao.todos();
  const colunas = ehCliente ? COLUNAS_CLIENTES : COLUNAS_PROSPECCAO;
  const nomeBase = ehCliente ? 'clientes' : 'prospeccao';
  const titulo = ehCliente ? 'Clientes Fixos' : 'Prospecção';
  const aoa = montarMatriz(linhas, colunas);
  formato = String(formato).toLowerCase();
  if (formato === 'csv') {
    const csv = aoa.map((linha) => linha.map((v) => { let s = String(v); if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"'; return s; }).join(';')).join('\r\n');
    baixarBlob(`${nomeBase}-${carimbo()}.csv`, new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  } else if (formato === 'pdf') {
    exportarPDF(linhas, colunas.slice(0, 7), titulo);
  } else {
    const bytes = SheetLib.escreverXlsx(aoa);
    baixarBlob(`${nomeBase}-${carimbo()}.xlsx`, new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
  }
  registrarHistorico('alteracao', `Exportação (${formato.toUpperCase()}) de ${titulo}: ${linhas.length} registros`, { entidade, formato });
  Store.salvar();
}
function exportarPDF(linhas, colunas, titulo) {
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ths = colunas.map((c) => `<th>${esc(c.titulo)}</th>`).join('');
  const trs = linhas.map((l) => `<tr>${colunas.map((c) => `<td>${esc(l[c.campo])}</td>`).join('')}</tr>`).join('');
  const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
    <style>
      body{font-family:'Segoe UI',Arial,sans-serif;color:#222;margin:18px;}
      h1{font-size:18px;margin:0 0 2px;color:#1a1a2e;}
      .sub{font-size:11px;color:#666;margin-bottom:12px;}
      table{width:100%;border-collapse:collapse;font-size:10px;}
      th{background:#4361ee;color:#fff;text-align:left;padding:6px 6px;}
      td{padding:5px 6px;border-bottom:1px solid #e3e6f5;}
      tr:nth-child(even) td{background:#f2f4ff;}
      @media print{@page{size:A4 landscape;margin:12mm;}}
    </style></head><body>
    <h1>${esc(titulo)}</h1>
    <div class="sub">Gerado em ${new Date().toLocaleString('pt-BR')} — ${linhas.length} registros</div>
    <table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>
    <script>window.onload=function(){setTimeout(function(){window.print();},250);};<\/script>
    </body></html>`;
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0';
  iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  UI.toast('Na janela de impressão, escolha "Salvar como PDF" como destino.', 'info', 'Exportar PDF');
  setTimeout(() => { try { document.body.removeChild(iframe); } catch (_) {} }, 60000);
}

/* ==========================================================================
 *  API — roteador local que substitui o servidor. Mantém o MESMO contrato
 *  das telas (views), mas lê/grava no Store (localStorage).
 * ======================================================================== */
const API = (() => {
  class ApiError extends Error { constructor(m, s, d) { super(m); this.status = s; this.dados = d; } }
  function parse(caminho) { const [p, q] = caminho.split('?'); return { p, q: new URLSearchParams(q || '') }; }
  function obj(q) { const o = {}; for (const [k, v] of q.entries()) o[k] = v; return o; }

  async function get(caminho) {
    const { p, q } = parse(caminho);
    const db = Store.get();
    if (p === '/auth/me') { if (!db.logado) throw new ApiError('Não autenticado', 401); return { usuario: { login: db.usuario.login, nome: db.usuario.nome } }; }
    if (p === '/stats') return calcularStats();
    if (p === '/clientes') return svcClientes.listar(obj(q));
    let m;
    if ((m = p.match(/^\/clientes\/(\d+)$/))) { const c = svcClientes.obter(m[1]); if (!c) throw new ApiError('Cliente não encontrado.', 404); return c; }
    if (p === '/prospeccao') return svcProspeccao.listar(obj(q));
    if ((m = p.match(/^\/prospeccao\/(\d+)$/))) { const c = svcProspeccao.obter(m[1]); if (!c) throw new ApiError('Registro não encontrado.', 404); return c; }
    if (p === '/pesquisa') return svcPesquisa.listarPesquisas();
    if ((m = p.match(/^\/pesquisa\/(\d+)\/resultados$/))) return svcPesquisa.listarResultados(m[1], obj(q));
    if (p === '/nichos') return listarNichos(obj(q));
    if (p === '/historico') return listarHistorico(obj(q));
    throw new ApiError('Rota não encontrada: ' + p, 404);
  }

  async function post(caminho, corpo) {
    const { p } = parse(caminho);
    corpo = corpo || {};
    const db = Store.get();
    if (p === '/auth/logout') { db.logado = false; Store.salvar(); return {}; }
    if (p === '/auth/change-password') {
      if (hashSenha(corpo.senhaAtual) !== db.usuario.senha) throw new ApiError('Senha atual incorreta.', 400);
      if (!corpo.senhaNova || String(corpo.senhaNova).length < 4) throw new ApiError('A nova senha deve ter ao menos 4 caracteres.', 400);
      db.usuario.senha = hashSenha(corpo.senhaNova); Store.salvar();
      registrarHistorico('alteracao', 'Senha alterada', {});
      return {};
    }
    if (p === '/backup') { const arquivo = `estacao-backup-${carimbo()}.json`; baixarBlob(arquivo, new Blob([Store.exportarJSON()], { type: 'application/json' })); return { arquivo }; }
    if (p === '/clientes') { const r = svcClientes.criar(corpo, { forcar: !!corpo.forcar }); if (!r.ok) throw new ApiError(r.erro, r.duplicado ? 409 : 400); Store.salvar(); return r; }
    if (p === '/prospeccao') { const r = svcProspeccao.criar(corpo, { forcar: !!corpo.forcar }); if (!r.ok) throw new ApiError(r.erro, r.duplicado ? 409 : 400); Store.salvar(); return r; }
    let m;
    if ((m = p.match(/^\/prospeccao\/(\d+)\/mover-clientes$/))) { const r = svcProspeccao.moverParaClientes(m[1]); if (!r.ok) throw new ApiError(r.erro, 409); Store.salvar(); return r; }
    if (p === '/pesquisa') { const r = await svcPesquisa.executar(corpo); Store.salvar(); return r; }
    if (p === '/pesquisa/mover') { const r = svcPesquisa.moverParaProspeccao(corpo.ids || []); Store.salvar(); return r; }
    if (p === '/pesquisa/descartar') { const r = svcPesquisa.descartar(corpo.ids || []); Store.salvar(); return r; }
    if (p === '/pesquisa/excluir') { const r = svcPesquisa.excluirResultados(corpo.ids || []); return r; }
    throw new ApiError('Rota não encontrada: ' + p, 404);
  }

  async function put(caminho, corpo) {
    const { p } = parse(caminho);
    let m;
    if ((m = p.match(/^\/clientes\/(\d+)$/))) { const r = svcClientes.atualizar(m[1], corpo); if (!r.ok) throw new ApiError(r.erro, 400); return r; }
    if ((m = p.match(/^\/prospeccao\/(\d+)$/))) { const r = svcProspeccao.atualizar(m[1], corpo); if (!r.ok) throw new ApiError(r.erro, 400); return r; }
    throw new ApiError('Rota não encontrada: ' + p, 404);
  }

  async function del(caminho) {
    const { p } = parse(caminho);
    let m;
    if ((m = p.match(/^\/clientes\/(\d+)$/))) { const r = svcClientes.excluir(m[1]); if (!r.ok) throw new ApiError(r.erro, 404); Store.salvar(); return r; }
    if ((m = p.match(/^\/prospeccao\/(\d+)$/))) { const r = svcProspeccao.excluir(m[1]); if (!r.ok) throw new ApiError(r.erro, 404); Store.salvar(); return r; }
    throw new ApiError('Rota não encontrada: ' + p, 404);
  }

  async function upload(caminho, arquivo) {
    const { p } = parse(caminho);
    if (p === '/clientes/import') return importarPlanilha(arquivo, 'clientes');
    if (p === '/prospeccao/import') return importarPlanilha(arquivo, 'prospeccao');
    throw new ApiError('Rota de importação inválida.', 404);
  }

  function download(caminho) {
    const { p, q } = parse(caminho);
    const formato = q.get('format') || 'xlsx';
    if (p === '/clientes/export') return exportarDados('clientes', formato);
    if (p === '/prospeccao/export') return exportarDados('prospeccao', formato);
  }

  return { get, post, put, del, upload, download, ApiError };
})();
