#!/usr/bin/env node
/**
 * Rasteriza um HTML em PNG com dimensões exatas.
 *
 * Usado para gerar as imagens Open Graph, que precisam ser PNG/JPG — redes
 * sociais não renderizam SVG. O resultado fica versionado em public/img/og/,
 * então este script só precisa rodar quando a arte mudar.
 *
 * Requer um Chromium/Chrome local. Defina CHROME_PATH se não estiver no PATH.
 *
 * Uso: node scripts/rasterize.mjs entrada.html saida.png 1200 630
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import zlib from "node:zlib";

const [input, output, widthArg, heightArg] = process.argv.slice(2);
if (!input || !output) {
  console.error("uso: node scripts/rasterize.mjs entrada.html saida.png [largura] [altura]");
  process.exit(1);
}
const width = Number(widthArg ?? 1200);
const height = Number(heightArg ?? 630);

/** O headless antigo do Chrome só pinta a viewport, que é ~87px menor que a janela. */
const CHROME_UI_HEIGHT = 90;

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const candidates = [
    "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
  ];
  const found = candidates.find((c) => fs.existsSync(c));
  if (found) return found;
  // Última tentativa: qualquer chromium instalado pelo Playwright.
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  if (fs.existsSync(pw)) {
    for (const dir of fs.readdirSync(pw)) {
      const candidate = path.join(pw, dir, "chrome-linux", "chrome");
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  throw new Error("Chromium não encontrado. Defina CHROME_PATH.");
}

// ---------------------------------------------------------------------------
// PNG: leitura, recorte e escrita
// ---------------------------------------------------------------------------

function readPng(file) {
  const buf = fs.readFileSync(file);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const colorType = buf[25];
  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 1;

  const chunks = [];
  let i = 8;
  while (i < buf.length) {
    const len = buf.readUInt32BE(i);
    const type = buf.subarray(i + 4, i + 8).toString("latin1");
    if (type === "IDAT") chunks.push(buf.subarray(i + 8, i + 8 + len));
    if (type === "IEND") break;
    i += 12 + len;
  }

  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = w * channels;
  const pixels = Buffer.alloc(h * stride);
  let prev = Buffer.alloc(stride);
  let pos = 0;

  for (let y = 0; y < h; y++) {
    const filter = raw[pos++];
    const line = Buffer.from(raw.subarray(pos, pos + stride));
    pos += stride;

    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? line[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      if (filter === 1) line[x] = (line[x] + a) & 255;
      else if (filter === 2) line[x] = (line[x] + b) & 255;
      else if (filter === 3) line[x] = (line[x] + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }
    line.copy(pixels, y * stride);
    prev = line;
  }

  return { width: w, height: h, channels, stride, pixels };
}

function writePng({ width: w, height: h, channels, stride, pixels }, file) {
  // Filtro 0 (None) em todas as linhas: simples e comprime bem em arte plana.
  const rawSize = h * (stride + 1);
  const raw = Buffer.alloc(rawSize);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  const chunk = (type, data) => {
    const out = Buffer.alloc(data.length + 12);
    out.writeUInt32BE(data.length, 0);
    out.write(type, 4, "latin1");
    data.copy(out, 8);
    out.writeInt32BE(crc32(Buffer.concat([Buffer.from(type, "latin1"), data])), data.length + 8);
    return out;
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = channels === 4 ? 6 : channels === 3 ? 2 : 0;

  fs.writeFileSync(
    file,
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

let crcTable;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = -1;
  for (const byte of buf) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return crc ^ -1;
}

function crop(image, w, h) {
  if (image.width === w && image.height === h) return image;
  const stride = w * image.channels;
  const pixels = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    image.pixels.copy(pixels, y * stride, y * image.stride, y * image.stride + stride);
  }
  return { width: w, height: h, channels: image.channels, stride, pixels };
}

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

const chrome = findChrome();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "vf-raster-"));
const shot = path.join(temp, "shot.png");

execFileSync(
  chrome,
  [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--virtual-time-budget=2000",
    `--window-size=${width},${height + CHROME_UI_HEIGHT}`,
    `--screenshot=${shot}`,
    `file://${path.resolve(input)}`,
  ],
  { stdio: "ignore" },
);

const image = readPng(shot);
fs.mkdirSync(path.dirname(output), { recursive: true });
writePng(crop(image, width, height), output);
fs.rmSync(temp, { recursive: true, force: true });

console.log(`✓ ${output} (${width}×${height}, ${(fs.statSync(output).size / 1024).toFixed(0)} KB)`);
