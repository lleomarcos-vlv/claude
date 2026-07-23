'use strict';

/**
 * Suíte de testes automatizados (sem dependências externas).
 * Cobre: normalização, similaridade, deduplicação, autenticação, importação,
 * exportação, construção de consultas OSM, mapeamento de resultados, e a API
 * HTTP de ponta a ponta (login, CRUD, stats, pesquisa em modo demonstração).
 *
 * Executa contra um banco temporário isolado (ET_DB_FILE).
 */

const os = require('os');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

// Banco temporário exclusivo dos testes (definido ANTES de qualquer require de app).
const TMP_DB = path.join(os.tmpdir(), `estacao-teste-${process.pid}.db`);
process.env.ET_DB_FILE = TMP_DB;
process.env.PORT = '4788';

// ---- Mini harness ----
let passou = 0, falhou = 0;
const falhas = [];
async function teste(nome, fn) {
  try {
    await fn();
    passou++;
    console.log('  \x1b[32m✔\x1b[0m ' + nome);
  } catch (err) {
    falhou++;
    falhas.push({ nome, err });
    console.log('  \x1b[31mx\x1b[0m ' + nome + '  ->  ' + err.message);
  }
}

function limpar() {
  for (const suf of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(TMP_DB + suf); } catch (_) {}
  }
}

(async function main() {
  limpar();
  console.log('\n=== Testes da Estação de Trabalho ===\n');

  // Módulos
  const norm = require('../utils/normalize');
  const sim = require('../utils/similarity');
  const osm = require('../utils/osmTags');
  const db = require('../database/db');
  const { semear } = require('../database/seed');
  const auth = require('../services/authService');
  const dedupe = require('../services/dedupeService');
  const clienteService = require('../services/clienteService');
  const importService = require('../services/importService');
  const exportService = require('../services/exportService');
  const providers = require('../services/searchProviders');
  const config = require('../config/config');

  await db.inicializar();
  await semear();

  console.log('— Normalização —');
  await teste('telefone p/ WhatsApp adiciona DDI 55', () => {
    assert.strictEqual(norm.telefoneParaWhatsapp('(16) 99999-8888'), '5516999998888');
  });
  await teste('instagram normaliza handle', () => {
    assert.strictEqual(norm.normalizarInstagram('https://instagram.com/@Minha.Loja/'), 'minha.loja');
  });
  await teste('site normaliza sem protocolo/www', () => {
    assert.strictEqual(norm.normalizarSite('HTTPS://www.Exemplo.com.br/'), 'exemplo.com.br');
  });
  await teste('nome remove sufixos societários', () => {
    assert.strictEqual(norm.normalizarNome('Padaria Central LTDA'), 'padaria central');
  });

  console.log('— Similaridade —');
  await teste('nomes quase iguais têm alta similaridade', () => {
    assert.ok(sim.similaridadeNome('Padaria Central', 'PADARIA  CENTRAL!') >= 0.9);
  });
  await teste('nomes distintos têm baixa similaridade', () => {
    assert.ok(sim.similaridadeNome('Padaria Central', 'Auto Peças Silva') < 0.5);
  });

  console.log('— Deduplicação —');
  await teste('hash é estável para mesmo telefone', () => {
    const a = dedupe.gerarHash({ nome: 'X', telefone: '16 99999-8888' });
    const b = dedupe.gerarHash({ nome: 'Y', telefone: '(16) 999998888' });
    assert.strictEqual(a, b);
  });
  await teste('deduplicarLista remove repetidos', () => {
    const lista = [
      { nome: 'Padaria Pão Quente', cidade: 'Serra Azul', telefone: '1611112222' },
      { nome: 'Padaria Pao Quente', cidade: 'Serra Azul', telefone: '1611112222' },
      { nome: 'Outra Padaria', cidade: 'Serra Azul', telefone: '1633334444' },
    ];
    assert.strictEqual(dedupe.deduplicarLista(lista).length, 2);
  });
  await teste('filiais com mesmo nome mas telefones diferentes NÃO são fundidas', () => {
    const lista = [
      { nome: 'Rede Farma Unidade 1', cidade: 'Franca', telefone: '1630001111' },
      { nome: 'Rede Farma Unidade 2', cidade: 'Franca', telefone: '1630002222' },
      { nome: 'Rede Farma Unidade 3', cidade: 'Franca', telefone: '1630003333' },
    ];
    assert.strictEqual(dedupe.deduplicarLista(lista).length, 3);
  });
  await teste('registros só com nome+cidade ainda dedupam por similaridade', () => {
    const lista = [
      { nome: 'Mercado Bom Preço', cidade: 'Franca' },
      { nome: 'Mercado Bom Preco', cidade: 'Franca' },
    ];
    assert.strictEqual(dedupe.deduplicarLista(lista).length, 1);
  });

  console.log('— Autenticação —');
  await teste('admin padrão autentica', () => {
    const r = auth.autenticar('admin', 'admin123', 'teste');
    assert.ok(r.ok, r.erro);
    assert.ok(r.token && r.token.length > 20);
  });
  await teste('senha errada é rejeitada', () => {
    const r = auth.autenticar('admin', 'errada', 'teste');
    assert.strictEqual(r.ok, false);
  });
  await teste('sessão válida resolve usuário', () => {
    const r = auth.autenticar('admin', 'admin123', 'teste');
    const u = auth.usuarioDaSessao(r.token);
    assert.strictEqual(u.login, 'admin');
  });

  console.log('— Clientes + Dedupe —');
  let idCliente;
  await teste('cria cliente', () => {
    const r = clienteService.criar({ nome: 'Cliente Teste', telefone: '16 91234-5678', cidade: 'Ribeirão Preto' }, 1);
    assert.ok(r.ok, r.erro);
    idCliente = r.id;
  });
  await teste('bloqueia cliente duplicado (mesmo telefone)', () => {
    const r = clienteService.criar({ nome: 'Outro Nome', telefone: '(16) 91234-5678' }, 1);
    assert.strictEqual(r.ok, false);
    assert.ok(r.duplicado);
  });
  await teste('permite duplicado quando forçado', () => {
    const r = clienteService.criar({ nome: 'Forçado', telefone: '(16) 91234-5678' }, 1, { forcar: true });
    assert.ok(r.ok);
  });

  console.log('— Importação —');
  await teste('importa CSV com detecção de colunas', () => {
    const csv = 'Nome;Telefone;Cidade;Email\n' +
      'Empresa Importada A;1699990001;Franca;a@x.com\n' +
      'Empresa Importada B;1699990002;Batatais;b@x.com\n' +
      'Empresa Importada A;1699990001;Franca;a@x.com\n'; // 3ª linha duplicada
    const buf = Buffer.from(csv, 'utf8');
    const r = importService.importar(buf, 'clientes', 1);
    assert.ok(r.ok, r.erro);
    assert.strictEqual(r.inseridos, 2);
    assert.ok(r.duplicados >= 1);
  });

  console.log('— Exportação —');
  await teste('exporta XLSX (buffer válido)', async () => {
    const linhas = clienteService.todos();
    const arq = await exportService.exportar(linhas, exportService.COLUNAS_CLIENTES, 'xlsx', 'clientes', 'Clientes');
    assert.ok(arq.buffer.length > 100);
    assert.ok(arq.filename.endsWith('.xlsx'));
  });
  await teste('exporta CSV com BOM', async () => {
    const linhas = clienteService.todos();
    const arq = await exportService.exportar(linhas, exportService.COLUNAS_CLIENTES, 'csv', 'clientes');
    assert.ok(arq.buffer.length > 10);
  });
  await teste('exporta PDF (assinatura %PDF)', async () => {
    const linhas = clienteService.todos();
    const arq = await exportService.exportar(linhas, exportService.COLUNAS_CLIENTES, 'pdf', 'clientes', 'Clientes');
    assert.strictEqual(arq.buffer.slice(0, 4).toString(), '%PDF');
  });

  console.log('— Consulta OSM / Coleta —');
  await teste('monta consulta Overpass por área com tag correta', () => {
    const q = osm.montarConsultaArea({ nome: 'Padarias', osm: [{ k: 'shop', v: 'bakery' }] }, 3600000001, 30, 50);
    assert.ok(q.includes('area(3600000001)'));
    assert.ok(q.includes('"shop"="bakery"'));
    assert.ok(q.includes('out center'));
  });
  await teste('nicho sem tag usa busca por nome', () => {
    const q = osm.montarConsultaBBox({ nome: 'Cooperativas', termos: ['cooperativa'] }, [-21, -47, -20, -46], 30, 50);
    assert.ok(q.includes('"name"~"cooperativa",i'));
  });
  await teste('mapeia elemento OSM para registro', () => {
    const el = {
      type: 'node', id: 42, lat: -21.3, lon: -47.8,
      tags: { name: 'Padaria Modelo', 'contact:phone': '+55 16 3333-4444', shop: 'bakery', website: 'padariamodelo.com.br', 'addr:city': 'Serra Azul' },
    };
    const r = providers.mapearElemento(el, { cidade: 'Serra Azul', nicho: 'Padarias' });
    assert.strictEqual(r.nome, 'Padaria Modelo');
    assert.strictEqual(r.categoria, 'bakery');
    assert.ok(r.url_origem.includes('node/42'));
  });
  await teste('modo demonstração gera resultados', () => {
    const demo = providers.gerarDemo('Serra Azul', 'SP', 'Padarias', 10);
    assert.strictEqual(demo.length, 10);
    assert.ok(demo[0].nome.includes('DEMONSTRAÇÃO'));
  });

  console.log('— Pesquisa ponta a ponta (modo demo) —');
  await teste('executa pesquisa em modo demonstração e persiste', async () => {
    config.pesquisa.modoDemonstracao = true;
    const pesquisaService = require('../services/pesquisaService');
    const r = await pesquisaService.executarPesquisa({ cidade: 'Serra Azul', estado: 'SP', nicho: 'Padarias', max: 12 }, 1);
    assert.ok(r.novos > 0, 'deveria coletar resultados demo');
    const lista = pesquisaService.listarResultados(r.pesquisaId, { status: 'novo' });
    assert.ok(lista.length > 0);
    config.pesquisa.modoDemonstracao = false;
  });

  // ---- Testes HTTP de ponta a ponta ----
  console.log('— API HTTP —');
  const { criarApp } = require('../server');
  const http = require('http');
  const app = await criarApp();
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const porta = server.address().port;
  const base = `http://127.0.0.1:${porta}`;
  let cookie = '';

  async function httpReq(metodo, caminho, corpo, comCookie = true) {
    const opts = { method: metodo, headers: { 'Content-Type': 'application/json' } };
    if (comCookie && cookie) opts.headers.Cookie = cookie;
    if (corpo) opts.body = JSON.stringify(corpo);
    const resp = await fetch(base + caminho, opts);
    const setC = resp.headers.get('set-cookie');
    if (setC) cookie = setC.split(';')[0];
    let json = null;
    try { json = await resp.json(); } catch (_) {}
    return { status: resp.status, json };
  }

  await teste('GET /api/info responde 200', async () => {
    const r = await httpReq('GET', '/api/info', null, false);
    assert.strictEqual(r.status, 200);
    assert.ok(r.json.dados.nome);
  });
  await teste('rota protegida sem login retorna 401', async () => {
    const r = await httpReq('GET', '/api/stats', null, false);
    assert.strictEqual(r.status, 401);
  });
  await teste('POST /api/auth/login com admin funciona', async () => {
    const r = await httpReq('POST', '/api/auth/login', { login: 'admin', senha: 'admin123' });
    assert.strictEqual(r.status, 200);
    assert.ok(cookie.length > 10);
  });
  await teste('GET /api/stats autenticado retorna indicadores', async () => {
    const r = await httpReq('GET', '/api/stats');
    assert.strictEqual(r.status, 200);
    assert.ok(typeof r.json.dados.stats.clientes === 'number');
  });
  await teste('POST /api/clientes cria via HTTP', async () => {
    const r = await httpReq('POST', '/api/clientes', { nome: 'Cliente HTTP', telefone: '16 98888-1111' });
    assert.strictEqual(r.status, 200);
    assert.ok(r.json.dados.id);
  });
  await teste('POST /api/clientes duplicado retorna 409', async () => {
    const r = await httpReq('POST', '/api/clientes', { nome: 'Cliente HTTP 2', telefone: '(16) 98888-1111' });
    assert.strictEqual(r.status, 409);
  });
  await teste('GET /api/nichos retorna base semeada', async () => {
    const r = await httpReq('GET', '/api/nichos?search=padaria');
    assert.strictEqual(r.status, 200);
    assert.ok(r.json.dados.itens.length >= 1);
  });
  await teste('GET /api/clientes/export?format=csv baixa arquivo', async () => {
    const resp = await fetch(base + '/api/clientes/export?format=csv', { headers: { Cookie: cookie } });
    assert.strictEqual(resp.status, 200);
    assert.ok((resp.headers.get('content-disposition') || '').includes('.csv'));
  });
  await teste('POST /api/auth/logout encerra sessão', async () => {
    const r = await httpReq('POST', '/api/auth/logout');
    assert.strictEqual(r.status, 200);
  });

  await new Promise((r) => server.close(r));
  db.fechar();
  limpar();

  console.log(`\n=== Resultado: ${passou} passaram, ${falhou} falharam ===\n`);
  if (falhou > 0) {
    console.log('Falhas:');
    falhas.forEach((f) => console.log(` - ${f.nome}: ${f.err.stack || f.err.message}`));
    process.exit(1);
  }
  process.exit(0);
})().catch((err) => {
  console.error('Erro fatal na suíte de testes:', err);
  process.exit(1);
});
