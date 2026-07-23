/* ============================================================================
 * sheetlib.js — Leitura e escrita de planilhas (.xlsx e .csv) 100% em
 * JavaScript puro, SEM dependências. Funciona offline dentro de um único HTML.
 *
 *   - crc32()                  : checksum para o ZIP
 *   - inflateRaw()             : descompactação DEFLATE (para LER .xlsx)
 *   - unzip()                  : lê um arquivo ZIP (.xlsx é um ZIP)
 *   - lerXlsx(bytes)           : -> matriz de linhas (array de arrays)
 *   - lerCsv(texto)            : -> matriz de linhas
 *   - escreverXlsx(aoa, nome)  : -> Uint8Array de um .xlsx real (ZIP "store")
 *
 * A leitura de .xlsx cobre o formato moderno do Excel/LibreOffice/Google
 * Sheets (Office Open XML). Arquivos .xls antigos (binário BIFF) não são
 * suportados — nesse caso oriente salvar como .xlsx ou .csv.
 * ========================================================================== */
(function (root) {
  'use strict';

  // -------------------------------------------------------------------------
  // CRC-32 (usado na escrita do ZIP)
  // -------------------------------------------------------------------------
  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  // -------------------------------------------------------------------------
  // INFLATE (DEFLATE raw) — portado de "tiny-inflate" (Devon Govett, MIT).
  // Descomprime os fluxos internos do .xlsx (método 8 do ZIP).
  // -------------------------------------------------------------------------
  function Tree() {
    this.table = new Uint16Array(16);
    this.trans = new Uint16Array(288);
  }

  function InflateData(source, dest) {
    this.s = source;
    this.i = 0;
    this.t = 0;
    this.bitcount = 0;
    this.dest = dest;
    this.destLen = 0;
    this.ltree = new Tree();
    this.dtree = new Tree();
  }

  const sltree = new Tree();
  const sdtree = new Tree();

  const length_bits = new Uint8Array(30);
  const length_base = new Uint16Array(30);
  const dist_bits = new Uint8Array(30);
  const dist_base = new Uint16Array(30);

  const clcidx = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);

  const code_tree = new Tree();
  const lengths = new Uint8Array(288 + 32);

  function tinf_build_bits_base(bits, base, delta, first) {
    let i, sum;
    for (i = 0; i < delta; ++i) bits[i] = 0;
    for (i = 0; i < 30 - delta; ++i) bits[i + delta] = (i / delta) | 0;
    for (sum = first, i = 0; i < 30; ++i) {
      base[i] = sum;
      sum += 1 << bits[i];
    }
  }

  function tinf_build_fixed_trees(lt, dt) {
    let i;
    for (i = 0; i < 7; ++i) lt.table[i] = 0;
    lt.table[7] = 24;
    lt.table[8] = 152;
    lt.table[9] = 112;
    for (i = 0; i < 24; ++i) lt.trans[i] = 256 + i;
    for (i = 0; i < 144; ++i) lt.trans[24 + i] = i;
    for (i = 0; i < 8; ++i) lt.trans[24 + 144 + i] = 280 + i;
    for (i = 0; i < 112; ++i) lt.trans[24 + 144 + 8 + i] = 144 + i;
    for (i = 0; i < 5; ++i) dt.table[i] = 0;
    dt.table[5] = 32;
    for (i = 0; i < 32; ++i) dt.trans[i] = i;
  }

  const offs = new Uint16Array(16);

  function tinf_build_tree(t, lengths, off, num) {
    let i, sum;
    for (i = 0; i < 16; ++i) t.table[i] = 0;
    for (i = 0; i < num; ++i) t.table[lengths[off + i]]++;
    t.table[0] = 0;
    for (sum = 0, i = 0; i < 16; ++i) {
      offs[i] = sum;
      sum += t.table[i];
    }
    for (i = 0; i < num; ++i) {
      if (lengths[off + i]) t.trans[offs[lengths[off + i]]++] = i;
    }
  }

  function tinf_getbit(d) {
    if (!d.bitcount--) {
      d.t = d.s[d.i++];
      d.bitcount = 7;
    }
    const bit = d.t & 1;
    d.t >>>= 1;
    return bit;
  }

  function tinf_read_bits(d, num, base) {
    if (!num) return base;
    while (d.bitcount < 24) {
      d.t |= d.s[d.i++] << d.bitcount;
      d.bitcount += 8;
    }
    const val = d.t & (0xffff >>> (16 - num));
    d.t >>>= num;
    d.bitcount -= num;
    return val + base;
  }

  function tinf_decode_symbol(d, t) {
    while (d.bitcount < 24) {
      d.t |= d.s[d.i++] << d.bitcount;
      d.bitcount += 8;
    }
    let sum = 0, cur = 0, len = 0, tag = d.t;
    do {
      cur = 2 * cur + (tag & 1);
      tag >>>= 1;
      ++len;
      sum += t.table[len];
      cur -= t.table[len];
    } while (cur >= 0);
    d.t = tag;
    d.bitcount -= len;
    return t.trans[sum + cur];
  }

  function tinf_decode_trees(d, lt, dt) {
    let hlit, hdist, hclen, i, num, length;
    hlit = tinf_read_bits(d, 5, 257);
    hdist = tinf_read_bits(d, 5, 1);
    hclen = tinf_read_bits(d, 4, 4);
    for (i = 0; i < 19; ++i) lengths[i] = 0;
    for (i = 0; i < hclen; ++i) {
      const clen = tinf_read_bits(d, 3, 0);
      lengths[clcidx[i]] = clen;
    }
    tinf_build_tree(code_tree, lengths, 0, 19);
    for (num = 0; num < hlit + hdist;) {
      const sym = tinf_decode_symbol(d, code_tree);
      switch (sym) {
        case 16:
          const prev = lengths[num - 1];
          for (length = tinf_read_bits(d, 2, 3); length; --length) lengths[num++] = prev;
          break;
        case 17:
          for (length = tinf_read_bits(d, 3, 3); length; --length) lengths[num++] = 0;
          break;
        case 18:
          for (length = tinf_read_bits(d, 7, 11); length; --length) lengths[num++] = 0;
          break;
        default:
          lengths[num++] = sym;
          break;
      }
    }
    tinf_build_tree(lt, lengths, 0, hlit);
    tinf_build_tree(dt, lengths, hlit, hdist);
  }

  function tinf_inflate_block_data(d, lt, dt) {
    while (1) {
      let sym = tinf_decode_symbol(d, lt);
      if (sym === 256) return; // TINF_OK
      if (sym < 256) {
        d.dest[d.destLen++] = sym;
      } else {
        let length, dist, offset, i;
        sym -= 257;
        length = tinf_read_bits(d, length_bits[sym], length_base[sym]);
        dist = tinf_decode_symbol(d, dt);
        offset = d.destLen - tinf_read_bits(d, dist_bits[dist], dist_base[dist]);
        for (i = offset; i < offset + length; ++i) d.dest[d.destLen++] = d.dest[i];
      }
    }
  }

  function tinf_inflate_uncompressed_block(d) {
    let length, invlength;
    while (d.bitcount > 8) {
      d.i--;
      d.bitcount -= 8;
    }
    length = d.s[d.i + 1];
    length = 256 * length + d.s[d.i];
    invlength = d.s[d.i + 3];
    invlength = 256 * invlength + d.s[d.i + 2];
    if (length !== (~invlength & 0x0000ffff)) return -3; // TINF_DATA_ERROR
    d.i += 4;
    for (let i = length; i; --i) d.dest[d.destLen++] = d.s[d.i++];
    d.bitcount = 0;
    return 0;
  }

  let treesReady = false;
  function tinf_init() {
    if (treesReady) return;
    tinf_build_fixed_trees(sltree, sdtree);
    tinf_build_bits_base(length_bits, length_base, 4, 3);
    tinf_build_bits_base(dist_bits, dist_base, 2, 1);
    length_bits[28] = 0;
    length_base[28] = 258;
    treesReady = true;
  }

  /** Descomprime DEFLATE cru. `expectedSize` deve ser o tamanho descomprimido. */
  function inflateRaw(source, expectedSize) {
    tinf_init();
    const dest = new Uint8Array(expectedSize);
    const d = new InflateData(source, dest);
    let bfinal, btype, res;
    do {
      bfinal = tinf_getbit(d);
      btype = tinf_read_bits(d, 2, 0);
      if (btype === 0) res = tinf_inflate_uncompressed_block(d);
      else if (btype === 1) { tinf_inflate_block_data(d, sltree, sdtree); res = 0; }
      else if (btype === 2) { tinf_decode_trees(d, d.ltree, d.dtree); tinf_inflate_block_data(d, d.ltree, d.dtree); res = 0; }
      else res = -3;
      if (res !== 0) throw new Error('Falha ao descomprimir (DEFLATE).');
    } while (!bfinal);
    return d.destLen === dest.length ? dest : dest.subarray(0, d.destLen);
  }

  // -------------------------------------------------------------------------
  // Leitura de ZIP
  // -------------------------------------------------------------------------
  function u16(dv, p) { return dv.getUint16(p, true); }
  function u32(dv, p) { return dv.getUint32(p, true); }

  /** Descompacta um ZIP e devolve { nome: Uint8Array }. */
  function unzip(bytes) {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    // Procura o End Of Central Directory (assinatura 0x06054b50) a partir do fim.
    let eocd = -1;
    for (let p = bytes.length - 22; p >= 0; p--) {
      if (u32(dv, p) === 0x06054b50) { eocd = p; break; }
    }
    if (eocd < 0) throw new Error('Arquivo não é um .xlsx/ZIP válido.');
    const cdCount = u16(dv, eocd + 10);
    let cdOffset = u32(dv, eocd + 16);
    const arquivos = {};
    let p = cdOffset;
    for (let n = 0; n < cdCount; n++) {
      if (u32(dv, p) !== 0x02014b50) break;
      const metodo = u16(dv, p + 10);
      const compSize = u32(dv, p + 20);
      const uncompSize = u32(dv, p + 24);
      const nameLen = u16(dv, p + 28);
      const extraLen = u16(dv, p + 30);
      const commentLen = u16(dv, p + 32);
      const localOff = u32(dv, p + 42);
      const nome = utf8Decode(bytes.subarray(p + 46, p + 46 + nameLen));
      // Cabeçalho local para achar o início real dos dados.
      const lNameLen = u16(dv, localOff + 26);
      const lExtraLen = u16(dv, localOff + 28);
      const dataStart = localOff + 30 + lNameLen + lExtraLen;
      const comp = bytes.subarray(dataStart, dataStart + compSize);
      let dados;
      if (metodo === 0) dados = comp.slice();
      else if (metodo === 8) dados = inflateRaw(comp, uncompSize);
      else throw new Error('Compressão ZIP não suportada (método ' + metodo + ').');
      arquivos[nome] = dados;
      p += 46 + nameLen + extraLen + commentLen;
    }
    return arquivos;
  }

  // -------------------------------------------------------------------------
  // UTF-8 e entidades XML
  // -------------------------------------------------------------------------
  function utf8Decode(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
    // Fallback (Node antigo).
    return Buffer.from(bytes).toString('utf8');
  }
  function utf8Encode(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    return new Uint8Array(Buffer.from(str, 'utf8'));
  }

  function decodeEntidades(s) {
    if (s.indexOf('&') === -1) return s;
    return s
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&amp;/g, '&');
  }
  function encodeEntidades(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // -------------------------------------------------------------------------
  // Parsing do XLSX -> matriz (array de arrays)
  // -------------------------------------------------------------------------
  function colParaIndice(ref) {
    // "AB12" -> índice 0-based da coluna AB
    const letras = ref.replace(/[0-9]+/g, '');
    let n = 0;
    for (let i = 0; i < letras.length; i++) {
      n = n * 26 + (letras.charCodeAt(i) - 64);
    }
    return n - 1;
  }

  function extrairSharedStrings(xml) {
    const strings = [];
    if (!xml) return strings;
    const reSi = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
    let m;
    while ((m = reSi.exec(xml))) {
      const bloco = m[1];
      let texto = '';
      const reT = /<t\b[^>]*>([\s\S]*?)<\/t>/g;
      let mt;
      let achou = false;
      while ((mt = reT.exec(bloco))) { texto += mt[1]; achou = true; }
      if (!achou) {
        // <t/> vazio ou sem conteúdo
        texto = '';
      }
      strings.push(decodeEntidades(texto));
    }
    return strings;
  }

  function parseWorksheet(xml, shared) {
    const linhas = [];
    const reRow = /<row\b[^>]*>([\s\S]*?)<\/row>|<row\b[^>]*\/>/g;
    let mr;
    while ((mr = reRow.exec(xml))) {
      const conteudo = mr[1] || '';
      const linha = [];
      const reCell = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
      let mc;
      while ((mc = reCell.exec(conteudo))) {
        const attrs = mc[1] || '';
        const inner = mc[2] || '';
        const refM = /r="([A-Z]+\d+)"/.exec(attrs);
        const col = refM ? colParaIndice(refM[1]) : linha.length;
        const tM = /t="([^"]+)"/.exec(attrs);
        const tipo = tM ? tM[1] : 'n';
        let valor = '';
        if (tipo === 's') {
          const vM = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner);
          if (vM) valor = shared[Number(vM[1])] != null ? shared[Number(vM[1])] : '';
        } else if (tipo === 'inlineStr') {
          const tsM = /<t\b[^>]*>([\s\S]*?)<\/t>/.exec(inner);
          valor = tsM ? decodeEntidades(tsM[1]) : '';
        } else if (tipo === 'str') {
          const vM = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner);
          valor = vM ? decodeEntidades(vM[1]) : '';
        } else {
          const vM = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner);
          valor = vM ? decodeEntidades(vM[1]) : '';
        }
        while (linha.length < col) linha.push('');
        linha[col] = valor;
      }
      linhas.push(linha);
    }
    return linhas;
  }

  /** Lê bytes de um .xlsx e devolve a primeira planilha como matriz de linhas. */
  function lerXlsx(bytes) {
    const arq = unzip(bytes);
    const sharedXml = arq['xl/sharedStrings.xml'] ? utf8Decode(arq['xl/sharedStrings.xml']) : '';
    const shared = extrairSharedStrings(sharedXml);

    // Descobre a primeira planilha via workbook.xml + rels (com fallback).
    let alvo = 'xl/worksheets/sheet1.xml';
    try {
      if (arq['xl/workbook.xml'] && arq['xl/_rels/workbook.xml.rels']) {
        const wb = utf8Decode(arq['xl/workbook.xml']);
        const rels = utf8Decode(arq['xl/_rels/workbook.xml.rels']);
        const sheetM = /<sheet\b[^>]*r:id="([^"]+)"[^>]*\/>|<sheet\b[^>]*r:id="([^"]+)"[^>]*>/.exec(wb);
        const rid = sheetM ? (sheetM[1] || sheetM[2]) : null;
        if (rid) {
          const relRe = new RegExp('<Relationship\\b[^>]*Id="' + rid + '"[^>]*Target="([^"]+)"', 'i');
          const relM = relRe.exec(rels);
          if (relM) {
            let target = relM[1].replace(/^\/?xl\//, '').replace(/^\//, '');
            alvo = 'xl/' + target.replace(/^xl\//, '');
          }
        }
      }
    } catch (_) { /* usa fallback */ }

    if (!arq[alvo]) {
      // Procura qualquer worksheet.
      const chave = Object.keys(arq).find((k) => /^xl\/worksheets\/sheet\d+\.xml$/.test(k));
      if (chave) alvo = chave;
    }
    if (!arq[alvo]) throw new Error('Planilha não encontrada dentro do .xlsx.');
    const wsXml = utf8Decode(arq[alvo]);
    return parseWorksheet(wsXml, shared);
  }

  // -------------------------------------------------------------------------
  // Leitura de CSV (separador ; ou ,) com suporte a aspas
  // -------------------------------------------------------------------------
  function lerCsv(texto) {
    if (texto.charCodeAt(0) === 0xfeff) texto = texto.slice(1); // remove BOM
    // Detecta separador na primeira linha (fora de aspas).
    const primeiraLinha = texto.split(/\r?\n/)[0] || '';
    let sep = ';';
    const ponto = (primeiraLinha.match(/;/g) || []).length;
    const virg = (primeiraLinha.match(/,/g) || []).length;
    const tab = (primeiraLinha.match(/\t/g) || []).length;
    if (tab > ponto && tab > virg) sep = '\t';
    else if (virg > ponto) sep = ',';

    const linhas = [];
    let campo = '';
    let linha = [];
    let dentroAspas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (dentroAspas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++; }
          else dentroAspas = false;
        } else campo += c;
      } else {
        if (c === '"') dentroAspas = true;
        else if (c === sep) { linha.push(campo); campo = ''; }
        else if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; }
        else if (c === '\r') { /* ignora */ }
        else campo += c;
      }
    }
    if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
    // Remove linhas totalmente vazias.
    return linhas.filter((l) => l.some((v) => String(v).trim() !== ''));
  }

  // -------------------------------------------------------------------------
  // Escrita de ZIP (método STORE, sem compressão) — .xlsx real
  // -------------------------------------------------------------------------
  function zipStore(entradas) {
    // entradas: [{ nome, dados: Uint8Array }]
    const partes = [];
    const central = [];
    let offset = 0;

    for (const e of entradas) {
      const nomeBytes = utf8Encode(e.nome);
      const crc = crc32(e.dados);
      const tam = e.dados.length;

      const lh = new Uint8Array(30 + nomeBytes.length);
      const lv = new DataView(lh.buffer);
      lv.setUint32(0, 0x04034b50, true);
      lv.setUint16(4, 20, true);        // versão
      lv.setUint16(6, 0, true);         // flags
      lv.setUint16(8, 0, true);         // método = store
      lv.setUint16(10, 0, true);        // hora
      lv.setUint16(12, 0x21, true);     // data (1980)
      lv.setUint32(14, crc, true);
      lv.setUint32(18, tam, true);      // comp size
      lv.setUint32(22, tam, true);      // uncomp size
      lv.setUint16(26, nomeBytes.length, true);
      lv.setUint16(28, 0, true);        // extra len
      lh.set(nomeBytes, 30);

      partes.push(lh, e.dados);

      const ch = new Uint8Array(46 + nomeBytes.length);
      const cv = new DataView(ch.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x21, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, tam, true);
      cv.setUint32(24, tam, true);
      cv.setUint16(28, nomeBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      ch.set(nomeBytes, 46);
      central.push(ch);

      offset += lh.length + tam;
    }

    let centralSize = 0;
    for (const c of central) centralSize += c.length;
    const centralOffset = offset;

    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, central.length, true);
    ev.setUint16(10, central.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, centralOffset, true);

    const todas = partes.concat(central, [eocd]);
    let total = 0;
    for (const p of todas) total += p.length;
    const out = new Uint8Array(total);
    let pos = 0;
    for (const p of todas) { out.set(p, pos); pos += p.length; }
    return out;
  }

  function cellRef(col, row) {
    let s = '';
    col += 1;
    while (col > 0) {
      const r = (col - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      col = Math.floor((col - 1) / 26);
    }
    return s + row;
  }

  /** Gera um .xlsx real a partir de uma matriz de linhas. */
  function escreverXlsx(aoa) {
    let linhasXml = '';
    for (let r = 0; r < aoa.length; r++) {
      const linha = aoa[r] || [];
      let celulas = '';
      for (let c = 0; c < linha.length; c++) {
        const v = linha[c];
        if (v === null || v === undefined || v === '') continue;
        const ref = cellRef(c, r + 1);
        if (typeof v === 'number' && isFinite(v)) {
          celulas += `<c r="${ref}"><v>${v}</v></c>`;
        } else {
          celulas += `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${encodeEntidades(v)}</t></is></c>`;
        }
      }
      linhasXml += `<row r="${r + 1}">${celulas}</row>`;
    }

    const sheetXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      `<sheetData>${linhasXml}</sheetData></worksheet>`;

    const workbookXml =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="Dados" sheetId="1" r:id="rId1"/></sheets></workbook>';

    const workbookRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '</Relationships>';

    const rootRels =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>';

    const contentTypes =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '</Types>';

    const entradas = [
      { nome: '[Content_Types].xml', dados: utf8Encode(contentTypes) },
      { nome: '_rels/.rels', dados: utf8Encode(rootRels) },
      { nome: 'xl/workbook.xml', dados: utf8Encode(workbookXml) },
      { nome: 'xl/_rels/workbook.xml.rels', dados: utf8Encode(workbookRels) },
      { nome: 'xl/worksheets/sheet1.xml', dados: utf8Encode(sheetXml) },
    ];
    return zipStore(entradas);
  }

  const API = { crc32, inflateRaw, unzip, lerXlsx, lerCsv, escreverXlsx, utf8Decode, utf8Encode };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else root.SheetLib = API;
})(typeof self !== 'undefined' ? self : this);
