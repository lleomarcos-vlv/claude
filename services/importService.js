'use strict';

/**
 * Importação de planilhas (CSV, XLS, XLSX) com:
 *  - leitura automática via SheetJS;
 *  - detecção e mapeamento automático de colunas (com sinônimos PT-BR);
 *  - deduplicação (interna e contra o banco);
 *  - relatório de inseridos, duplicados, ignorados e erros.
 *
 * Suporta milhares de registros (inserção em transação única).
 */

const XLSX = require('xlsx');
const clienteService = require('./clienteService');
const prospeccaoService = require('./prospeccaoService');
const dedupe = require('./dedupeService');
const historico = require('./historyService');
const { normalizarTexto } = require('../utils/normalize');

// Mapa de sinônimos de cabeçalho -> campo canônico.
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

/** Dada uma lista de cabeçalhos, devolve { campo: indiceColuna }. */
function mapearColunas(cabecalhos) {
  const mapa = {};
  cabecalhos.forEach((titulo, idx) => {
    const t = normalizarTexto(titulo);
    if (!t) return;
    for (const [campo, alternativas] of Object.entries(SINONIMOS)) {
      if (mapa[campo] !== undefined) continue;
      if (alternativas.some((a) => t === a || t.includes(a) || a.includes(t))) {
        mapa[campo] = idx;
        break;
      }
    }
  });
  return mapa;
}

/** Lê a planilha e retorna { cabecalhos, linhas, mapa }. */
function analisar(caminhoOuBuffer) {
  const wb =
    typeof caminhoOuBuffer === 'string'
      ? XLSX.readFile(caminhoOuBuffer, { cellDates: false })
      : XLSX.read(caminhoOuBuffer, { type: 'buffer', cellDates: false });
  const primeira = wb.SheetNames[0];
  const sheet = wb.Sheets[primeira];
  const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
  if (!linhas.length) return { cabecalhos: [], linhas: [], mapa: {} };
  const cabecalhos = linhas[0].map((c) => String(c || '').trim());
  const mapa = mapearColunas(cabecalhos);
  return { cabecalhos, linhas: linhas.slice(1), mapa, totalLinhas: linhas.length - 1 };
}

function valor(linha, mapa, campo) {
  const idx = mapa[campo];
  if (idx === undefined) return '';
  return String(linha[idx] == null ? '' : linha[idx]).trim();
}

/**
 * Importa registros para o destino ('clientes' | 'prospeccao').
 * @param {string|Buffer} caminhoOuBuffer
 * @param {string} destino
 * @param {number} usuarioId
 * @param {function} [onProgress]  callback(processados, total)
 */
function importar(caminhoOuBuffer, destino, usuarioId, onProgress) {
  const { cabecalhos, linhas, mapa } = analisar(caminhoOuBuffer);
  const total = linhas.length;

  if (!Object.keys(mapa).length) {
    return {
      ok: false,
      erro: 'Não foi possível identificar colunas conhecidas na planilha.',
      cabecalhos,
    };
  }
  if (mapa.nome === undefined) {
    return {
      ok: false,
      erro: 'A planilha precisa ter ao menos uma coluna de Nome/Empresa.',
      cabecalhos,
      mapa,
    };
  }

  let inseridos = 0;
  let duplicados = 0;
  let invalidos = 0;
  const erros = [];
  const vistosNoArquivo = new Set();

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    try {
      const nome = valor(linha, mapa, 'nome');
      if (!nome) {
        invalidos++;
        continue; // ignora linhas sem nome
      }
      const registro = {
        nome,
        empresa: nome,
        telefone: valor(linha, mapa, 'telefone'),
        whatsapp: valor(linha, mapa, 'whatsapp') || valor(linha, mapa, 'telefone'),
        cidade: valor(linha, mapa, 'cidade'),
        estado: valor(linha, mapa, 'estado'),
        nicho: valor(linha, mapa, 'nicho'),
        instagram: valor(linha, mapa, 'instagram'),
        site: valor(linha, mapa, 'site'),
        email: valor(linha, mapa, 'email'),
        responsavel: valor(linha, mapa, 'responsavel'),
        status: valor(linha, mapa, 'status'),
        origem: valor(linha, mapa, 'origem') || 'Importação',
        observacoes: [valor(linha, mapa, 'observacoes'), valor(linha, mapa, 'endereco')]
          .filter(Boolean)
          .join(' | '),
        probabilidade: valor(linha, mapa, 'probabilidade'),
      };

      // Dedupe dentro do próprio arquivo.
      const h = dedupe.gerarHash(registro);
      if (vistosNoArquivo.has(h)) {
        duplicados++;
        continue;
      }
      vistosNoArquivo.add(h);

      // Insere via serviço (que também deduplica contra o banco).
      const res =
        destino === 'prospeccao'
          ? prospeccaoService.criar(registro, usuarioId)
          : clienteService.criar(registro, usuarioId);

      if (res.ok) inseridos++;
      else if (res.duplicado) duplicados++;
      else {
        invalidos++;
        if (erros.length < 50) erros.push({ linha: i + 2, motivo: res.erro });
      }
    } catch (err) {
      invalidos++;
      if (erros.length < 50) erros.push({ linha: i + 2, motivo: err.message });
    }

    if (onProgress && (i % 50 === 0 || i === linhas.length - 1)) {
      onProgress(i + 1, total);
    }
  }

  historico.registrar(
    'importacao',
    `Importação para ${destino}: ${inseridos} inseridos, ${duplicados} duplicados, ${invalidos} inválidos (de ${total})`,
    { destino, total, inseridos, duplicados, invalidos },
    usuarioId
  );

  return { ok: true, total, inseridos, duplicados, invalidos, erros, mapa, cabecalhos };
}

module.exports = { analisar, mapearColunas, importar, SINONIMOS };
