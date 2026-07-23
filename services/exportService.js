'use strict';

/**
 * Exportação de dados para CSV, XLSX (Excel) e PDF.
 * Retorna sempre { buffer, filename, contentType } para envio via HTTP.
 */

const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

/** Extrai valores segundo as definições de coluna. */
function montarMatriz(linhas, colunas) {
  const cabecalho = colunas.map((c) => c.titulo);
  const corpo = linhas.map((l) =>
    colunas.map((c) => {
      const val = l[c.campo];
      return val === null || val === undefined ? '' : val;
    })
  );
  return { cabecalho, corpo };
}

function carimbo() {
  return new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
}

function paraXLSX(linhas, colunas, nomeBase) {
  const { cabecalho, corpo } = montarMatriz(linhas, colunas);
  const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...corpo]);
  ws['!cols'] = colunas.map((c) => ({ wch: Math.max(12, c.titulo.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dados');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return {
    buffer,
    filename: `${nomeBase}-${carimbo()}.xlsx`,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

function paraCSV(linhas, colunas, nomeBase) {
  const { cabecalho, corpo } = montarMatriz(linhas, colunas);
  const ws = XLSX.utils.aoa_to_sheet([cabecalho, ...corpo]);
  let csv = XLSX.utils.sheet_to_csv(ws, { FS: ';' }); // ';' facilita abertura no Excel PT-BR
  const buffer = Buffer.from('﻿' + csv, 'utf8'); // BOM para acentuação correta
  return {
    buffer,
    filename: `${nomeBase}-${carimbo()}.csv`,
    contentType: 'text/csv; charset=utf-8',
  };
}

function paraPDF(linhas, colunas, nomeBase, titulo) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () =>
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `${nomeBase}-${carimbo()}.pdf`,
          contentType: 'application/pdf',
        })
      );

      doc.fontSize(16).fillColor('#1a1a2e').text(titulo || nomeBase, { align: 'left' });
      doc.moveDown(0.2);
      doc.fontSize(8).fillColor('#666').text(`Gerado em ${new Date().toLocaleString('pt-BR')} — ${linhas.length} registros`);
      doc.moveDown(0.6);

      // Escolhe um subconjunto de colunas para caber na página.
      const colsPDF = colunas.slice(0, 7);
      const larguraUtil = doc.page.width - 60;
      const larguraCol = larguraUtil / colsPDF.length;

      const desenharLinha = (valores, opcoes = {}) => {
        const y = doc.y;
        let x = 30;
        doc.fontSize(opcoes.header ? 9 : 8).fillColor(opcoes.header ? '#ffffff' : '#222');
        if (opcoes.header) doc.rect(30, y - 2, larguraUtil, 16).fill('#4361ee').fillColor('#fff');
        valores.forEach((val, i) => {
          doc.fillColor(opcoes.header ? '#fff' : '#222');
          doc.text(String(val).slice(0, 40), x + 3, y + 1, {
            width: larguraCol - 6,
            height: 14,
            ellipsis: true,
            lineBreak: false,
          });
          x += larguraCol;
        });
        doc.y = y + 16;
      };

      desenharLinha(colsPDF.map((c) => c.titulo), { header: true });
      const { corpo } = montarMatriz(linhas, colsPDF);
      corpo.forEach((linha, idx) => {
        if (doc.y > doc.page.height - 40) {
          doc.addPage();
          desenharLinha(colsPDF.map((c) => c.titulo), { header: true });
        }
        if (idx % 2 === 0) doc.rect(30, doc.y - 2, larguraUtil, 16).fill('#f2f4ff');
        desenharLinha(linha);
      });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/** Ponto de entrada genérico. */
async function exportar(linhas, colunas, formato, nomeBase, titulo) {
  switch (String(formato).toLowerCase()) {
    case 'csv':
      return paraCSV(linhas, colunas, nomeBase);
    case 'pdf':
      return paraPDF(linhas, colunas, nomeBase, titulo);
    case 'xlsx':
    case 'excel':
    default:
      return paraXLSX(linhas, colunas, nomeBase);
  }
}

// Definições de colunas reutilizáveis.
const COLUNAS_CLIENTES = [
  { campo: 'nome', titulo: 'Nome' },
  { campo: 'telefone', titulo: 'Telefone' },
  { campo: 'whatsapp', titulo: 'WhatsApp' },
  { campo: 'cidade', titulo: 'Cidade' },
  { campo: 'instagram', titulo: 'Instagram' },
  { campo: 'site', titulo: 'Site' },
  { campo: 'email', titulo: 'E-mail' },
  { campo: 'observacoes', titulo: 'Observações' },
  { campo: 'data_cadastro', titulo: 'Data Cadastro' },
  { campo: 'ultimo_contato', titulo: 'Último Contato' },
];

const COLUNAS_PROSPECCAO = [
  { campo: 'empresa', titulo: 'Empresa' },
  { campo: 'cidade', titulo: 'Cidade' },
  { campo: 'estado', titulo: 'Estado' },
  { campo: 'nicho', titulo: 'Nicho' },
  { campo: 'telefone', titulo: 'Telefone' },
  { campo: 'whatsapp', titulo: 'WhatsApp' },
  { campo: 'instagram', titulo: 'Instagram' },
  { campo: 'site', titulo: 'Site' },
  { campo: 'email', titulo: 'E-mail' },
  { campo: 'responsavel', titulo: 'Responsável' },
  { campo: 'status', titulo: 'Status' },
  { campo: 'origem', titulo: 'Origem' },
  { campo: 'probabilidade', titulo: 'Prob. (%)' },
  { campo: 'data', titulo: 'Data' },
  { campo: 'ultimo_contato', titulo: 'Último Contato' },
  { campo: 'observacoes', titulo: 'Observações' },
];

module.exports = {
  exportar,
  paraCSV,
  paraXLSX,
  paraPDF,
  COLUNAS_CLIENTES,
  COLUNAS_PROSPECCAO,
};
