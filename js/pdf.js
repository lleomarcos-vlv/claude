/* Gerador do PDF do orçamento (jsPDF, 100% offline). A mesma função alimenta pré-visualização, download e impressão. */
(function (root) {
  'use strict';
  const PW = 595.28, PH = 841.89, M = 28, W = PW - 2 * M, FOOT = 34, BOTTOM = PH - FOOT - 8;
  const COL = {
    band: [4, 5, 7], ink: [24, 24, 28], gray: [105, 105, 112], mid: [150, 150, 156], light: [244, 244, 245],
    line: [205, 205, 210], orange: [235, 98, 24], red: [186, 28, 28], glass: [196, 224, 238], frame: [58, 60, 66],
    white: [255, 255, 255]
  };
  const J = () => root.JP;

  const fill = (d, c) => d.setFillColor(c[0], c[1], c[2]);
  const stroke = (d, c) => d.setDrawColor(c[0], c[1], c[2]);
  const color = (d, c) => d.setTextColor(c[0], c[1], c[2]);
  function text(d, s, x, y, o) { o = o || {}; d.setFont('helvetica', o.bold ? 'bold' : (o.italic ? 'oblique' : 'normal')); d.setFontSize(o.size || 9); color(d, o.color || COL.ink); d.text(String(s), x, y, { align: o.align || 'left', baseline: 'alphabetic' }); }
  function wrap(d, s, w, size, bold) { d.setFont('helvetica', bold ? 'bold' : 'normal'); d.setFontSize(size); return d.splitTextToSize(String(s || ''), w); }
  const hasText = (v) => v != null && String(v).trim() !== '';

  /* ---------- ícones vetoriais das tipologias (sem imagens de terceiros) ---------- */
  function drawIcon(d, tipo, x, y, w, h) {
    const pad = 6, ix = x + pad, iy = y + pad, iw = w - 2 * pad, ih = h - 2 * pad;
    d.setLineJoin('miter');
    const frameRect = (rx, ry, rw, rh, lw) => { fill(d, COL.glass); stroke(d, COL.frame); d.setLineWidth(lw || 2.2); d.rect(rx, ry, rw, rh, 'FD'); };
    const arrow = (cx, cy, dir) => { fill(d, COL.frame); const s = 3.2; d.triangle(cx + dir * s, cy, cx - dir * s * 0.2, cy - s, cx - dir * s * 0.2, cy + s, 'F'); stroke(d, COL.frame); d.setLineWidth(1); d.line(cx - dir * s * 1.2, cy, cx + dir * s * 0.2, cy); };
    const sash = (n, rx, ry, rw, rh) => { const sw = rw / n; for (let i = 0; i < n; i++) { frameRect(rx + i * sw, ry, sw, rh, 1.8); arrow(rx + i * sw + sw / 2, ry + rh / 2, i % 2 ? -1 : 1); } };
    const t = String(tipo || '');
    if (t === 'porta_correr') {
      const dw = iw * 0.62, dh = ih; frameRect(ix + (iw - dw) / 2, iy, dw, dh, 2.6); sash(2, ix + (iw - dw) / 2, iy, dw, dh);
    } else if (t === 'janela_correr') {
      const wh = ih * 0.62; sash(2, ix, iy + (ih - wh) / 2, iw, wh);
    } else if (t === 'janela_integrada') {
      const bh = ih * 0.28; fill(d, [150, 152, 158]); stroke(d, COL.frame); d.setLineWidth(1.6); d.rect(ix, iy, iw, bh, 'FD');
      stroke(d, [110, 112, 118]); d.setLineWidth(0.6); for (let k = 1; k < 5; k++) d.line(ix, iy + k * bh / 5, ix + iw, iy + k * bh / 5);
      sash(2, ix + 2, iy + bh, iw - 4, ih - bh);
    } else if (t === 'maxim_ar') {
      const mw = iw * 0.8, mh = ih * 0.8, mx = ix + (iw - mw) / 2, my = iy + (ih - mh) / 2; frameRect(mx, my, mw, mh, 2.4);
      stroke(d, COL.frame); d.setLineWidth(0.9); d.line(mx, my + mh, mx + mw / 2, my); d.line(mx + mw, my + mh, mx + mw / 2, my);
    } else if (t === 'porta_giro') {
      const dw = iw * 0.55, dh = ih, dx = ix + (iw - dw) / 2; frameRect(dx, iy, dw, dh, 2.6);
      stroke(d, COL.frame); d.setLineWidth(0.9); d.line(dx + dw, iy, dx, iy + dh / 2); d.line(dx + dw, iy + dh, dx, iy + dh / 2);
      fill(d, COL.frame); d.circle(dx + dw - 5, iy + dh / 2, 1.8, 'F');
    } else if (t === 'veneziana') {
      const vw = iw * 0.8, vh = ih * 0.8, vx = ix + (iw - vw) / 2, vy = iy + (ih - vh) / 2; frameRect(vx, vy, vw, vh, 2.4);
      stroke(d, COL.frame); d.setLineWidth(1.4); for (let k = 1; k < 9; k++) d.line(vx + 3, vy + k * vh / 9, vx + vw - 3, vy + k * vh / 9);
    } else if (t === 'fixo') {
      const fw = iw * 0.8, fh = ih * 0.8; frameRect(ix + (iw - fw) / 2, iy + (ih - fh) / 2, fw, fh, 2.4);
      stroke(d, [255, 255, 255]); d.setLineWidth(1); const fx = ix + (iw - fw) / 2, fy = iy + (ih - fh) / 2; d.line(fx + 8, fy + fh - 8, fx + fw - 8, fy + 8);
    } else { // genérico
      frameRect(ix + iw * 0.1, iy + ih * 0.1, iw * 0.8, ih * 0.8, 2.2);
    }
  }
  const TIPOS = [['', 'Genérico'], ['porta_correr', 'Porta de correr'], ['porta_giro', 'Porta de giro'], ['janela_correr', 'Janela de correr'],
    ['janela_integrada', 'Janela de correr integrada (persiana)'], ['maxim_ar', 'Maxim-ar'], ['veneziana', 'Veneziana'], ['fixo', 'Vidro fixo']];

  /* ---------- blocos de página ---------- */
  function companyLines(s) {
    const e = s.empresa || {}, l = [];
    if (e.endereco) l.push(e.endereco);
    const c = [e.cidade, e.cep ? 'CEP ' + e.cep : ''].filter(hasText).join(' · '); if (c) l.push(c);
    const doc = [e.cnpj ? 'CNPJ ' + e.cnpj : '', e.ie ? 'I.E. ' + e.ie : ''].filter(hasText).join('   '); if (doc) l.push(doc);
    const ct = [e.tel ? 'Tel ' + e.tel : '', e.whats ? 'WhatsApp ' + e.whats : ''].filter(hasText).join('   '); if (ct) l.push(ct);
    if (e.email) l.push(e.email);
    return l;
  }

  function header(d, q, s) {
    const e = s.empresa || {}, H = 90;
    fill(d, COL.band); d.rect(0, 0, PW, H, 'F'); fill(d, COL.orange); d.rect(0, H, PW, 3, 'F');
    const logo = s.logo || root.JP_LOGO;
    if (logo) { try { const p = d.getImageProperties(logo), lh = 68, lw = lh * p.width / p.height; d.addImage(logo, M - 6, (H - lh) / 2, Math.min(lw, 120), lh); } catch (_) { /* logo inválido: segue sem */ } }
    const tx = M + 116, bw = 172, bx = PW - M - bw, maxNome = bx - tx - 14;
    let ns = 14; const nome = (e.nome || 'EMPRESA').toUpperCase();
    d.setFont('helvetica', 'bold'); while (ns > 9) { d.setFontSize(ns); if (d.getTextWidth(nome) <= maxNome) break; ns -= 0.5; }
    text(d, nome, tx, 28, { bold: true, size: ns, color: COL.white });
    companyLines(s).forEach((ln, i) => text(d, ln, tx, 42 + i * 11.2, { size: 8, color: [205, 205, 210] }));
    // caixa do orçamento
    fill(d, [20, 21, 25]); d.rect(bx, 9, bw, H - 18, 'F'); fill(d, COL.orange); d.rect(bx, 9, 3, H - 18, 'F');
    text(d, 'ORÇAMENTO', bx + 14, 24, { bold: true, size: 8, color: COL.orange });
    text(d, 'Nº ' + (q.numero || '—'), bx + 14, 45, { bold: true, size: 20, color: COL.white });
    const rows = [['Emissão', J().fmtDate(q.emissao)], ['Validade', J().fmtDate(q.validade) || 'a combinar'], ['Vendedor', q.vendedor || '—']];
    rows.forEach((r, i) => {
      text(d, r[0], bx + 14, 59 + i * 10.5, { size: 7.5, color: [150, 150, 158] });
      let v = String(r[1]); d.setFont('helvetica', 'bold'); d.setFontSize(8.5); while (v.length > 3 && d.getTextWidth(v) > bw - 62 - 8) v = v.slice(0, -1);
      text(d, v, bx + 54, 59 + i * 10.5, { size: 8.5, color: COL.white, bold: true });
    });
    return H + 3 + 10;
  }

  function miniHeader(d, q, s) {
    const e = s.empresa || {};
    fill(d, COL.band); d.rect(0, 0, PW, 30, 'F'); fill(d, COL.orange); d.rect(0, 30, PW, 2, 'F');
    text(d, (e.nome || '').toUpperCase(), M, 19, { bold: true, size: 9, color: COL.white });
    text(d, 'Orçamento Nº ' + q.numero + ' · continuação', PW - M, 19, { size: 9, color: [205, 205, 210], align: 'right' });
    return 32 + 14;
  }

  function clientBlock(d, y, q) {
    const c = q.cliente || {}, half = W / 2 - 6;
    const pairs = [['CPF/CNPJ', c.doc], ['IE/RG', c.ie], ['Celular', c.cel], ['Telefone', c.tel], ['E-mail', c.email]].filter(r => hasText(r[1]));
    const nl = Math.ceil(pairs.length / 2), left = pairs.slice(0, nl), right = pairs.slice(nl);
    const end = [c.endereco, [c.cep ? 'CEP ' + c.cep : '', c.cidade].filter(hasText).join(' ')].filter(hasText).join(' - ');
    const endLines = end ? wrap(d, end, W - 24 - 62, 9) : [];
    const rowsN = Math.max(left.length, right.length), h = 30 + rowsN * 12 + (endLines.length ? endLines.length * 11 + 4 : 0) + 6;
    fill(d, COL.light); d.rect(M, y, W, h, 'F'); fill(d, COL.orange); d.rect(M, y, 3, h, 'F');
    text(d, 'CLIENTE', M + 14, y + 14, { size: 7, bold: true, color: COL.gray });
    text(d, (c.nome || 'Cliente não informado').toUpperCase(), M + 14, y + 27, { size: 12, bold: true });
    let yy = y + 41;
    left.forEach((r, i) => { text(d, r[0], M + 14, yy + i * 12, { size: 7.5, color: COL.gray }); text(d, r[1], M + 14 + 52, yy + i * 12, { size: 9 }); });
    right.forEach((r, i) => { text(d, r[0], M + 14 + half, yy + i * 12, { size: 7.5, color: COL.gray }); text(d, r[1], M + 14 + half + 46, yy + i * 12, { size: 9 }); });
    yy += rowsN * 12;
    if (endLines.length) { text(d, 'Endereço', M + 14, yy + 2, { size: 7.5, color: COL.gray }); endLines.forEach((ln, i) => text(d, ln, M + 14 + 52, yy + 2 + i * 11, { size: 9 })); }
    return y + h + 10;
  }

  function itemHeight(d, it) {
    const obsLines = hasText(it.obs) ? wrap(d, it.obs, W - 24, 8.5) : [];
    const titleLines = wrap(d, it.descricao || 'Item sem descrição', W - 112 - 14, 11.5, true);
    const body = Math.max(66, 12 + titleLines.length * 14 + 36);
    return { total: 20 + body + 16 + 24 + (obsLines.length ? 18 + obsLines.length * 10.5 : 0), obsLines, titleLines, body };
  }

  function drawItem(d, y, n, it) {
    const hh = itemHeight(d, it), x = M;
    stroke(d, COL.line); d.setLineWidth(0.7); d.rect(x, y, W, hh.total);
    fill(d, COL.light); d.rect(x, y, W, 20, 'F');
    fill(d, COL.orange); d.rect(x, y, 3, 20, 'F');
    text(d, 'ITEM ' + n, x + 12, y + 13.5, { bold: true, size: 9 });
    const amb = hasText(it.amb) ? 'AMBIENTE: ' + String(it.amb).toUpperCase() : 'AMBIENTE: —';
    text(d, amb, x + 58, y + 13.5, { size: 8.5, color: COL.gray });
    if (hasText(it.linha)) text(d, 'LINHA: ' + String(it.linha).toUpperCase(), x + W - 10, y + 13.5, { bold: true, size: 8.5, align: 'right' });
    // imagem / ícone
    const by = y + 20, ib = 62;
    fill(d, [250, 250, 251]); d.rect(x, by, ib + 8, hh.body, 'F');
    if (it.imagem) { try { const p = d.getImageProperties(it.imagem), r = Math.min((ib - 8) / p.width, (hh.body - 12) / p.height); d.addImage(it.imagem, x + 8 + (ib - 8 - p.width * r) / 2, by + 6 + (hh.body - 12 - p.height * r) / 2, p.width * r, p.height * r); } catch (_) { drawIcon(d, it.tipo, x + 4, by + (hh.body - ib) / 2, ib, ib); } }
    else drawIcon(d, it.tipo, x + 4, by + (hh.body - ib) / 2, ib, ib);
    const tx = x + ib + 22;
    hh.titleLines.forEach((ln, i) => text(d, ln, tx, by + 18 + i * 14, { bold: true, size: 11.5 }));
    const cy = by + 18 + hh.titleLines.length * 14 + 4, colw = (W - ib - 22 - 10) / 2;
    text(d, 'COR DO PERFIL', tx, cy, { size: 6.8, color: COL.gray, bold: true }); text(d, it.corPerfil || '—', tx, cy + 11, { size: 9.5 });
    text(d, 'COR DO ACESSÓRIO', tx + colw, cy, { size: 6.8, color: COL.gray, bold: true }); text(d, it.corAcessorio || '—', tx + colw, cy + 11, { size: 9.5 });
    // tabela
    const ty = by + hh.body, cols = [['QTDE.', 44, 'c'], ['LARGURA (mm)', 74, 'c'], ['ALTURA (mm)', 70, 'c'], ['VIDRO · COR E ESPESSURA', 0, 'l'], ['VLR. UNIT. (R$)', 86, 'r'], ['VLR. TOTAL (R$)', 92, 'r']];
    cols[3][1] = W - cols.reduce((a, c) => a + c[1], 0);
    fill(d, COL.light); d.rect(x, ty, W, 16, 'F'); stroke(d, COL.line); d.line(x, ty, x + W, ty);
    let cx = x;
    const vals = [String(it.qtd), it.largura ? String(it.largura) : '—', it.altura ? String(it.altura) : '—', it.vidro || '—', J().formatUnit(it.unit), J().formatBRL(J().itemTotal(it))];
    cols.forEach((c, i) => {
      const ax = c[2] === 'c' ? cx + c[1] / 2 : c[2] === 'r' ? cx + c[1] - 8 : cx + 8, al = c[2] === 'c' ? 'center' : c[2] === 'r' ? 'right' : 'left';
      text(d, c[0], ax, ty + 11, { size: 6.6, bold: true, color: COL.gray, align: al });
      let v = vals[i], bold = i === 5; let size = i === 3 ? 9 : 10;
      if (i === 3) { d.setFontSize(size); while (v.length > 4 && d.getTextWidth(v) > c[1] - 14) v = v.slice(0, -2); if (v !== vals[i]) v += '…'; }
      text(d, v, ax, ty + 16 + 15, { size, bold, align: al });
      if (i > 0) { stroke(d, COL.line); d.line(cx, ty, cx, ty + 40); }
      cx += c[1];
    });
    stroke(d, COL.line); d.line(x, ty + 16, x + W, ty + 16);
    let by2 = ty + 40;
    if (hh.obsLines.length) {
      fill(d, [253, 242, 236]); d.rect(x, by2, W, 18 + hh.obsLines.length * 10.5, 'F'); fill(d, COL.orange); d.rect(x, by2, 3, 18 + hh.obsLines.length * 10.5, 'F');
      text(d, 'OBSERVAÇÕES DESTE ITEM', x + 12, by2 + 12, { size: 7, bold: true, color: COL.orange });
      hh.obsLines.forEach((ln, i) => text(d, ln, x + 12, by2 + 23 + i * 10.5, { size: 8.5, color: COL.red }));
    }
    return y + hh.total + 6;
  }

  function totalsBlock(d, q, t) {
    const lines = [['Subtotal (' + t.qtdItens + (t.qtdItens === 1 ? ' item' : ' itens') + ')', J().formatBRL(t.subtotal)]];
    if (t.desconto) lines.push(['Desconto' + (q.descontoTipo === '%' ? ' (' + String(q.descontoValor).replace('.', ',') + '%)' : ''), '- ' + J().formatBRL(t.desconto)]);
    if (t.frete) lines.push(['Frete', J().formatBRL(t.frete)]);
    if (t.instalacao) lines.push(['Instalação', J().formatBRL(t.instalacao)]);
    if (t.outros) lines.push([q.outrosRotulo || 'Outros serviços', J().formatBRL(t.outros)]);
    return lines;
  }

  function buildPdf(q, s) {
    const jsPDF = root.jspdf.jsPDF, d = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    d.setProperties({ title: 'Orçamento ' + q.numero + ' - ' + ((q.cliente && q.cliente.nome) || ''), author: (s.empresa && s.empresa.nome) || '', creator: 'Sistema JP Alumínios' });
    const t = J().calcTotals(q);
    let y = header(d, q, s);
    y = clientBlock(d, y, q);
    const items = q.items || [];
    items.forEach((it, i) => {
      const h = itemHeight(d, it).total + 6;
      if (y + h > BOTTOM) { d.addPage(); y = miniHeader(d, q, s); }
      y = drawItem(d, y, i + 1, it);
    });
    if (!items.length) { text(d, 'Nenhum item neste orçamento.', M, y + 14, { color: COL.gray, italic: true }); y += 30; }

    // ---- fechamento: condições + totais + assinatura (mantidos juntos) ----
    const tl = totalsBlock(d, q, t), ext = J().extensoBRL(t.total);
    const extL = wrap(d, ext.charAt(0).toUpperCase() + ext.slice(1) + '.', W - 24, 8.5);
    const condParts = [];
    if (hasText(q.pagamento)) condParts.push(['CONDIÇÃO DE PAGAMENTO', q.pagamento]);
    if (hasText(q.prazoEntrega)) condParts.push(['PRAZO DE ENTREGA', q.prazoEntrega]);
    if (q.validade) condParts.push(['VALIDADE DA PROPOSTA', 'até ' + J().fmtDate(q.validade)]);
    if (hasText(q.obs)) condParts.push(['OBSERVAÇÕES', q.obs]);
    const condW = W - 232 - 14;
    const condLines = condParts.map(([k, v]) => [k, wrap(d, v, condW - 24, 8.8)]);
    const condH = condParts.length ? 10 + condLines.reduce((a, [, l]) => a + 11 + l.length * 10.5 + 4, 0) : 0;
    const totH = 8 + tl.length * 14 + 6 + 38;
    const blockH = Math.max(condH, totH) + 6 + (extL.length * 11 + 14) + 26 + 16;
    if (y + blockH > BOTTOM) { d.addPage(); y = miniHeader(d, q, s); }

    const top = y;
    // totais (direita)
    const tx = M + W - 232;
    stroke(d, COL.line); d.setLineWidth(0.7); d.rect(tx, top, 232, totH);
    tl.forEach((r, i) => { text(d, r[0], tx + 12, top + 16 + i * 14, { size: 9, color: COL.gray }); text(d, r[1], tx + 220, top + 16 + i * 14, { size: 9.5, align: 'right' }); });
    const gy = top + totH - 38; fill(d, COL.band); d.rect(tx, gy, 232, 38, 'F'); fill(d, COL.orange); d.rect(tx, gy, 3, 38, 'F');
    text(d, 'TOTAL GERAL', tx + 14, gy + 15, { size: 7.5, bold: true, color: [170, 170, 178] });
    text(d, 'R$ ' + J().formatBRL(t.total), tx + 220, gy + 27, { size: 17, bold: true, color: COL.white, align: 'right' });
    // condições (esquerda)
    if (condParts.length) {
      stroke(d, COL.line); d.rect(M, top, condW, Math.max(condH, totH));
      let cy = top + 13;
      condLines.forEach(([k, ls]) => { text(d, k, M + 12, cy, { size: 7, bold: true, color: COL.orange }); ls.forEach((ln, i) => text(d, ln, M + 12, cy + 11 + i * 10.5, { size: 8.8 })); cy += 11 + ls.length * 10.5 + 4; });
    }
    y = top + Math.max(condH, totH) + 6;
    // extenso
    fill(d, COL.light); d.rect(M, y, W, extL.length * 11 + 14, 'F');
    text(d, 'VALOR POR EXTENSO', M + 12, y + 11, { size: 6.8, bold: true, color: COL.gray });
    extL.forEach((ln, i) => text(d, ln, M + 12, y + 23 + i * 11, { size: 8.5 }));
    y += extL.length * 11 + 14 + 26;
    // assinaturas
    stroke(d, COL.ink); d.setLineWidth(0.7);
    d.line(M, y, M + 250, y); text(d, 'Aceite do cliente', M, y + 11, { size: 8.5, color: COL.gray }); text(d, 'Data:  ____ / ____ / ________', M + 150, y + 11, { size: 8.5, color: COL.gray });
    const ve = (q.vendedor || '').toUpperCase();
    text(d, 'Atenciosamente,', M + W, y - 22, { size: 8.5, align: 'right', color: COL.gray });
    text(d, ve, M + W, y - 10, { size: 9, bold: true, align: 'right' });
    if (hasText(q.contatoVendedor)) text(d, q.contatoVendedor, M + W, y + 2, { size: 8.5, align: 'right' });
    if (s.empresa && s.empresa.nome) text(d, s.empresa.nome, M + W, y + 13, { size: 7.5, align: 'right', color: COL.gray });

    // rodapé em todas as páginas
    const e = s.empresa || {}, n = d.getNumberOfPages();
    const foot = [e.instagram, e.whats || e.tel, e.email].filter(hasText).join('   ·   ');
    for (let p = 1; p <= n; p++) {
      d.setPage(p); fill(d, COL.band); d.rect(0, PH - FOOT, PW, FOOT, 'F'); fill(d, COL.orange); d.rect(0, PH - FOOT, PW, 2, 'F');
      text(d, foot, M, PH - 13, { size: 8.5, color: [215, 215, 220] });
      text(d, 'Página ' + p + ' de ' + n, PW - M, PH - 13, { size: 8, color: [150, 150, 158], align: 'right' });
    }
    return d;
  }

  root.JPPdf = { buildPdf, TIPOS, drawIcon };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.JPPdf;
})(typeof window !== 'undefined' ? window : globalThis);
