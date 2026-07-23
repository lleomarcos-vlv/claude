'use strict';

/**
 * Pesquisa Automática — coleta de empresas usando SOMENTE fontes gratuitas e
 * abertas: OpenStreetMap via Nominatim (geocodificação) e Overpass API
 * (consulta de POIs). Nenhuma API paga é utilizada; nenhuma proteção é burlada.
 *
 * Por que OpenStreetMap? O Google Maps proíbe scraping/coleta automatizada em
 * seus Termos de Uso, e sua API de Places é paga. O OpenStreetMap é uma base
 * pública, aberta (licença ODbL) e gratuita, sendo a alternativa legal e
 * estável equivalente para coleta de dados de empresas. Ver README.
 *
 * Modo demonstração: quando ativado (ou quando não há internet e o usuário
 * opta por ele), gera resultados de EXEMPLO claramente rotulados, para que o
 * fluxo completo (Revisão, mover para Prospecção, deduplicação) possa ser
 * demonstrado offline. Esses dados NÃO são reais.
 */

const config = require('../config/config');
const logger = require('../utils/logger');
const norm = require('../utils/normalize');
const osm = require('../utils/osmTags');

const P = config.pesquisa;

// --- utilidades de rede ----------------------------------------------------
function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchComTimeout(url, opcoes = {}, timeoutMs = P.timeoutMs) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opcoes, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

// --- Geocodificação (Nominatim) -------------------------------------------
/**
 * Localiza a cidade e retorna dados de área/bbox para o Overpass.
 * @returns {Promise<{areaId?:number, bbox:number[], displayName:string, lat:number, lon:number}>}
 */
async function geocodificarCidade(cidade, estado) {
  const consulta = [cidade, estado, 'Brasil'].filter(Boolean).join(', ');
  let ultimoErro;

  for (const base of P.nominatimUrls) {
    const url =
      `${base}?format=jsonv2&limit=1&addressdetails=1&countrycodes=br&` +
      `q=${encodeURIComponent(consulta)}`;
    try {
      const resp = await fetchComTimeout(url, {
        headers: { 'User-Agent': P.userAgent, 'Accept-Language': 'pt-BR' },
      });
      if (!resp.ok) throw new Error(`Nominatim HTTP ${resp.status}`);
      const dados = await resp.json();
      if (!Array.isArray(dados) || dados.length === 0) {
        throw new Error('Cidade não encontrada na base OpenStreetMap');
      }
      const lugar = dados[0];
      const bb = (lugar.boundingbox || []).map(Number); // [south, north, west, east]
      const bbox = [bb[0], bb[2], bb[1], bb[3]]; // -> [south, west, north, east]

      let areaId;
      if (lugar.osm_type === 'relation') areaId = 3600000000 + Number(lugar.osm_id);
      else if (lugar.osm_type === 'way') areaId = 2400000000 + Number(lugar.osm_id);

      return {
        areaId,
        bbox,
        displayName: lugar.display_name,
        lat: Number(lugar.lat),
        lon: Number(lugar.lon),
      };
    } catch (err) {
      ultimoErro = err;
      logger.aviso(`[pesquisa] Nominatim (${base}) falhou: ${err.message}`);
    }
  }
  throw new Error(
    `Não foi possível localizar a cidade "${consulta}" nas fontes abertas: ${ultimoErro ? ultimoErro.message : 'sem resposta'}`
  );
}

// --- Consulta Overpass -----------------------------------------------------
async function consultarOverpass(consultaQL) {
  let ultimoErro;
  for (const base of P.overpassUrls) {
    try {
      const resp = await fetchComTimeout(base, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': P.userAgent,
        },
        body: 'data=' + encodeURIComponent(consultaQL),
      });
      if (!resp.ok) throw new Error(`Overpass HTTP ${resp.status}`);
      const dados = await resp.json();
      return dados.elements || [];
    } catch (err) {
      ultimoErro = err;
      logger.aviso(`[pesquisa] Overpass (${base}) falhou: ${err.message}`);
      await delay(500);
    }
  }
  throw new Error(
    `Servidores Overpass indisponíveis: ${ultimoErro ? ultimoErro.message : 'sem resposta'}`
  );
}

// --- Mapeamento de elemento OSM -> registro padrão -------------------------
function extrairTelefone(tags) {
  return (
    tags['contact:phone'] ||
    tags.phone ||
    tags['contact:mobile'] ||
    tags['contact:whatsapp'] ||
    ''
  );
}

function extrairInstagram(tags) {
  let ig = tags['contact:instagram'] || tags.instagram || '';
  return norm.normalizarInstagram(ig);
}

function extrairSite(tags) {
  return tags['contact:website'] || tags.website || tags.url || '';
}

function montarEndereco(tags) {
  const partes = [
    tags['addr:street'],
    tags['addr:housenumber'],
    tags['addr:suburb'],
    tags['addr:neighbourhood'],
  ].filter(Boolean);
  return partes.join(', ');
}

function categoriaDe(tags) {
  return (
    tags.shop ||
    tags.amenity ||
    tags.craft ||
    tags.office ||
    tags.leisure ||
    tags.tourism ||
    tags.healthcare ||
    ''
  );
}

function mapearElemento(el, contexto) {
  const tags = el.tags || {};
  const nome = tags.name || tags['operator'] || tags['brand'] || '';
  if (!nome) return null; // sem nome não é útil como lead

  const lat = el.lat != null ? el.lat : el.center ? el.center.lat : null;
  const lon = el.lon != null ? el.lon : el.center ? el.center.lon : null;
  const telefone = extrairTelefone(tags);

  return {
    nome,
    telefone,
    whatsapp: tags['contact:whatsapp'] || telefone || '',
    instagram: extrairInstagram(tags),
    site: extrairSite(tags),
    email: tags['contact:email'] || tags.email || '',
    cidade: tags['addr:city'] || contexto.cidade || '',
    estado: tags['addr:state'] || contexto.estado || '',
    endereco: montarEndereco(tags),
    latitude: lat,
    longitude: lon,
    categoria: categoriaDe(tags) || contexto.nicho || '',
    horario: tags.opening_hours || '',
    avaliacao: null, // OSM não fornece avaliações públicas
    qtd_avaliacoes: null,
    origem: 'OpenStreetMap',
    url_origem: `https://www.openstreetmap.org/${el.type}/${el.id}`,
  };
}

// --- Modo demonstração (dados de EXEMPLO, claramente rotulados) ------------
function gerarDemo(cidade, estado, nicho, max) {
  const qtd = Math.min(max || 20, 25);
  const ddd = '16';
  const lista = [];
  for (let i = 1; i <= qtd; i++) {
    const num = String(90000000 + i * 137).slice(0, 8);
    lista.push({
      nome: `${nicho} Exemplo ${i} (DEMONSTRAÇÃO)`,
      telefone: `(${ddd}) 9${num.slice(0, 4)}-${num.slice(4)}`,
      whatsapp: `55${ddd}9${num}`,
      instagram: `${norm.normalizarTexto(nicho).replace(/\s/g, '')}exemplo${i}`,
      site: `www.exemplo${i}.com.br`,
      email: `contato${i}@exemplo.com.br`,
      cidade: cidade || 'Cidade Exemplo',
      estado: estado || '',
      endereco: `Rua Exemplo, ${100 + i}`,
      latitude: null,
      longitude: null,
      categoria: nicho,
      horario: 'Seg-Sex 08:00-18:00',
      avaliacao: null,
      qtd_avaliacoes: null,
      origem: 'Demonstração (dados de exemplo — não reais)',
      url_origem: '',
    });
  }
  return lista;
}

// --- Orquestração principal ------------------------------------------------
/**
 * Executa a coleta para (cidade, estado, nicho) até `max` resultados.
 * @param {object} params
 * @param {object} nichoDef definição do nicho (com termos/osm) ou {nome}
 * @returns {Promise<{resultados:array, fonte:string, mensagem:string}>}
 */
async function coletar({ cidade, estado, nicho, max }, nichoDef) {
  const limite = Math.min(max || P.maxPadrao, P.maxAbsoluto);

  if (P.modoDemonstracao) {
    return {
      resultados: gerarDemo(cidade, estado, nicho, limite),
      fonte: 'demonstracao',
      mensagem: 'Modo demonstração ativo — resultados de exemplo (não reais).',
    };
  }

  // 1) Geocodifica a cidade.
  const local = await geocodificarCidade(cidade, estado);
  await delay(P.delayEntreRequisicoesMs); // cortesia com o Nominatim (1 req/s)

  // 2) Monta e executa a consulta Overpass (área quando disponível, senão bbox).
  const timeoutSeg = Math.floor(P.timeoutMs / 1000);
  const def = nichoDef || { nome: nicho, termos: [nicho] };
  const consultaQL = local.areaId
    ? osm.montarConsultaArea(def, local.areaId, timeoutSeg, limite * 3)
    : osm.montarConsultaBBox(def, local.bbox, timeoutSeg, limite * 3);

  logger.debug('[pesquisa] Overpass QL:\n' + consultaQL);
  const elementos = await consultarOverpass(consultaQL);

  // 3) Mapeia, filtra sem nome e limita.
  const contexto = { cidade, estado, nicho };
  const mapeados = elementos
    .map((el) => mapearElemento(el, contexto))
    .filter(Boolean);

  return {
    resultados: mapeados,
    fonte: 'openstreetmap',
    mensagem: `Coletados ${mapeados.length} registros no OpenStreetMap (${local.displayName}).`,
  };
}

module.exports = {
  coletar,
  geocodificarCidade,
  consultarOverpass,
  mapearElemento,
  gerarDemo,
};
