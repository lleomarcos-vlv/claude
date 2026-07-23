'use strict';
const zlib = require('zlib');
const SheetLib = require('./sheetlib.js');

let falhas = 0;
function ok(cond, msg) {
  console.log((cond ? '✓' : '✗ FALHOU') + ' ' + msg);
  if (!cond) falhas++;
}

// ---------------------------------------------------------------------------
// 1) Cria um .xlsx REAL comprimido (DEFLATE método 8) usando zlib do Node,
//    para testar inflate/unzip/lerXlsx de forma independente do meu writer.
// ---------------------------------------------------------------------------
function crc32Node(buf) {
  // usa a mesma tabela do SheetLib via API pública
  return SheetLib.crc32(buf);
}
function zipDeflate(entradas) {
  const partes = [];
  const central = [];
  let offset = 0;
  for (const e of entradas) {
    const nome = Buffer.from(e.nome, 'utf8');
    const raw = Buffer.from(e.dados, 'utf8');
    const comp = zlib.deflateRawSync(raw, { level: 9 });
    const crc = crc32Node(raw);
    const lh = Buffer.alloc(30 + nome.length);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(8, 8); // método 8 = deflate
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0x21, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18);
    lh.writeUInt32LE(raw.length, 22);
    lh.writeUInt16LE(nome.length, 26);
    lh.writeUInt16LE(0, 28);
    nome.copy(lh, 30);
    partes.push(lh, comp);

    const ch = Buffer.alloc(46 + nome.length);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0, 8);
    ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0, 12);
    ch.writeUInt16LE(0x21, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(raw.length, 24);
    ch.writeUInt16LE(nome.length, 28);
    ch.writeUInt16LE(0, 30);
    ch.writeUInt16LE(0, 32);
    ch.writeUInt16LE(0, 34);
    ch.writeUInt16LE(0, 36);
    ch.writeUInt32LE(0, 38);
    ch.writeUInt32LE(offset, 42);
    nome.copy(ch, 46);
    central.push(ch);
    offset += lh.length + comp.length;
  }
  const centralBuf = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(central.length, 8);
  eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...partes, centralBuf, eocd]);
}

// Planilha de teste: cabeçalhos + linhas com acentos, aspas, células vazias,
// números, e uma coluna "pulada" (gap) para testar índices de coluna.
const sharedStrings = [
  'Nome', 'Telefone', 'Cidade', 'E-mail', 'Observações',
  'Padaria Pão & Cia', '(16) 99999-1234', 'Ribeirão Preto', 'contato@pao.com', 'Cliente "VIP" — acentuação çãõ',
  'Óticas Visão', 'São Paulo', 'ver@otica.com',
];
function siList(strs) {
  return strs.map((s) => `<si><t xml:space="preserve">${s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</t></si>`).join('');
}
const sharedXml = `<?xml version="1.0"?><sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${sharedStrings.length}" uniqueCount="${sharedStrings.length}">${siList(sharedStrings)}</sst>`;

// sheet: linha1 cabeçalho (s0..s4), linha2 dados, linha3 dados com gap (sem coluna B)
const sheetXml = `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>
<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c></row>
<row r="2"><c r="A2" t="s"><v>5</v></c><c r="B2" t="s"><v>6</v></c><c r="C2" t="s"><v>7</v></c><c r="D2" t="s"><v>8</v></c><c r="E2" t="s"><v>9</v></c></row>
<row r="3"><c r="A3" t="s"><v>10</v></c><c r="C3" t="s"><v>11</v></c><c r="D3" t="s"><v>12</v></c><c r="E3" t="inlineStr"><is><t>inline!</t></is></c></row>
<row r="4"><c r="A4" t="s"><v>0</v></c><c r="B4"><v>42</v></c></row>
</sheetData></worksheet>`;

const workbookXml = `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Plan1" sheetId="1" r:id="rId1"/></sheets></workbook>`;
const workbookRels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
const contentTypes = `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>`;
const rootRels = `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

const xlsxReal = zipDeflate([
  { nome: '[Content_Types].xml', dados: contentTypes },
  { nome: '_rels/.rels', dados: rootRels },
  { nome: 'xl/workbook.xml', dados: workbookXml },
  { nome: 'xl/_rels/workbook.xml.rels', dados: workbookRels },
  { nome: 'xl/sharedStrings.xml', dados: sharedXml },
  { nome: 'xl/worksheets/sheet1.xml', dados: sheetXml },
]);

console.log('--- TESTE 1: ler .xlsx real comprimido (DEFLATE) ---');
const rows = SheetLib.lerXlsx(new Uint8Array(xlsxReal));
console.log(JSON.stringify(rows, null, 1));
ok(rows.length === 4, 'leu 4 linhas');
ok(rows[0][0] === 'Nome' && rows[0][4] === 'Observações', 'cabeçalho correto (acentos)');
ok(rows[1][0] === 'Padaria Pão & Cia', 'decodificou "&" e acentos');
ok(rows[1][4] === 'Cliente "VIP" — acentuação çãõ', 'decodificou aspas e travessão');
ok(rows[2][1] === '' && rows[2][0] === 'Óticas Visão', 'gap de coluna B preenchido com vazio');
ok(rows[2][4] === 'inline!', 'inlineStr lido');
ok(rows[3][1] === '42', 'número lido');

// ---------------------------------------------------------------------------
// 2) Teste do WRITER (escreverXlsx) via round-trip com o próprio reader
// ---------------------------------------------------------------------------
console.log('\n--- TESTE 2: escreverXlsx -> lerXlsx (round-trip) ---');
const aoa = [
  ['Nome', 'Telefone', 'Cidade', 'Prob'],
  ['Empresa Açaí & Cia', '(11) 98888-7777', 'São Paulo', 90],
  ['Bar do "Zé"', '', 'Belo Horizonte', 0],
  ['Café Central', '1633334444', 'Ribeirão', 55],
];
const xlsxBytes = SheetLib.escreverXlsx(aoa);
ok(xlsxBytes instanceof Uint8Array && xlsxBytes.length > 0, 'gerou bytes do xlsx');
const rt = SheetLib.lerXlsx(xlsxBytes);
console.log(JSON.stringify(rt, null, 1));
ok(rt.length === 4, 'round-trip: 4 linhas');
ok(rt[0][0] === 'Nome' && rt[0][3] === 'Prob', 'round-trip: cabeçalho');
ok(rt[1][0] === 'Empresa Açaí & Cia', 'round-trip: acentos e &');
ok(rt[2][0] === 'Bar do "Zé"', 'round-trip: aspas');
ok(String(rt[1][3]) === '90', 'round-trip: número 90');

// Cross-check: o xlsx gerado pode ser descomprimido pelo Node (STORE)?
const check = SheetLib.unzip(xlsxBytes);
ok(!!check['xl/worksheets/sheet1.xml'], 'writer produziu sheet1.xml');
ok(!!check['[Content_Types].xml'], 'writer produziu [Content_Types].xml');

// ---------------------------------------------------------------------------
// 3) Teste do leitor de CSV
// ---------------------------------------------------------------------------
console.log('\n--- TESTE 3: lerCsv ---');
const csv = '﻿Nome;Telefone;Cidade\r\nPadaria "A;B";(16) 1234;Serra Azul\r\nÓtica Visão;99999;São Paulo\r\n';
const csvRows = SheetLib.lerCsv(csv);
console.log(JSON.stringify(csvRows, null, 1));
ok(csvRows.length === 3, 'CSV: 3 linhas');
ok(csvRows[0][0] === 'Nome', 'CSV: BOM removido');
ok(csvRows[1][0] === 'Padaria "A;B"' || csvRows[1][0] === 'Padaria A;B', 'CSV: aspas com separador interno');
ok(csvRows[2][2] === 'São Paulo', 'CSV: acentos');

const csvVirg = 'a,b,c\n1,2,3\n';
const cr = SheetLib.lerCsv(csvVirg);
ok(cr[0].length === 3 && cr[1][2] === '3', 'CSV: detecta separador vírgula');

console.log('\n=================================');
console.log(falhas === 0 ? 'TODOS OS TESTES PASSARAM ✓' : (falhas + ' TESTE(S) FALHARAM ✗'));
process.exit(falhas === 0 ? 0 : 1);
