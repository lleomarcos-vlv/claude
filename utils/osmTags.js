'use strict';

/**
 * Construção de consultas Overpass QL a partir das definições de nicho.
 *
 * Cada nicho pode declarar filtros OSM explícitos (ex.: shop=bakery). Quando um
 * nicho não tem filtro específico, caímos para uma busca por nome dentro das
 * categorias mais prováveis (shop / amenity / craft / office / leisure), o que
 * cobre a "cauda longa" de nichos sem depender de cadastro manual.
 */

/** Escapa aspas duplas/contrabarra para uso seguro em expressões Overpass. */
function escapar(valor) {
  return String(valor).replace(/["\\]/g, '\\$&');
}

const CATEGORIAS_FALLBACK = ['shop', 'amenity', 'craft', 'office', 'leisure', 'tourism'];

/** Gera as linhas de filtro para um conjunto de definições OSM. */
function linhasPorTags(osm, areaRef) {
  const linhas = [];
  for (const def of osm) {
    if (def.v && def.regex) {
      linhas.push(`  nwr["${escapar(def.k)}"~"${escapar(def.v)}",i](${areaRef});`);
    } else if (def.v) {
      linhas.push(`  nwr["${escapar(def.k)}"="${escapar(def.v)}"](${areaRef});`);
    } else {
      linhas.push(`  nwr["${escapar(def.k)}"](${areaRef});`);
    }
  }
  return linhas;
}

/** Busca por nome (fallback) para nichos sem tag específica. */
function linhasPorNome(termos, areaRef) {
  const alternativas = termos.map((t) => escapar(t)).join('|');
  const linhas = [];
  for (const cat of CATEGORIAS_FALLBACK) {
    linhas.push(`  nwr["${cat}"]["name"~"${alternativas}",i](${areaRef});`);
  }
  return linhas;
}

/** Corpo (união de filtros) de um nicho para uma referência de área/bbox. */
function corpoDoNicho(nicho, areaRef) {
  if (nicho.osm && nicho.osm.length) {
    return linhasPorTags(nicho.osm, areaRef).join('\n');
  }
  const termos = nicho.termos && nicho.termos.length ? nicho.termos : [nicho.nome];
  return linhasPorNome(termos, areaRef).join('\n');
}

/**
 * Consulta Overpass usando uma ÁREA OSM (relação/way fechado).
 * @param {number} areaId  osm_id + 3600000000 (relação) ou + 2400000000 (way)
 */
function montarConsultaArea(nicho, areaId, timeoutSeg, limite) {
  const corpo = corpoDoNicho(nicho, 'area.a');
  return [
    `[out:json][timeout:${timeoutSeg}];`,
    `area(${areaId})->.a;`,
    '(',
    corpo,
    ');',
    `out center tags ${limite};`,
  ].join('\n');
}

/**
 * Consulta Overpass usando uma BOUNDING BOX (fallback quando não há área).
 * @param {number[]} bbox  [south, west, north, east]
 */
function montarConsultaBBox(nicho, bbox, timeoutSeg, limite) {
  const ref = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;
  const corpo = corpoDoNicho(nicho, ref);
  return [
    `[out:json][timeout:${timeoutSeg}];`,
    '(',
    corpo,
    ');',
    `out center tags ${limite};`,
  ].join('\n');
}

module.exports = {
  escapar,
  corpoDoNicho,
  montarConsultaArea,
  montarConsultaBBox,
};
