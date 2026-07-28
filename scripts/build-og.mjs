#!/usr/bin/env node
/**
 * Gera as imagens Open Graph (PNG) e o ícone Apple a partir dos ativos da marca.
 *
 * Uso: npm run og:build   (requer Chromium — veja scripts/rasterize.mjs)
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "vf-og-"));

const LEAF = "M85 6C140 90 170 220 170 372C170 520 133 655 85 746C37 655 0 520 0 372C0 220 30 90 85 6Z";
const wordmark = JSON.parse(fs.readFileSync(path.join(root, "src/lib/brand.ts"), "utf8").match(/WORDMARK_GLYPHS = (\[[\s\S]*?\]) as const;/)[1].replace(/(\w+):/g, '"$1":').replace(/,(\s*[\]}])/g, "$1"))
  .map((g) => `<path transform="translate(${g.x} 0)" d="${g.d}"/>`)
  .join("");

const logo = (fill) =>
  `<svg viewBox="0 0 4690 752" height="60" style="display:block"><path d="${LEAF}" fill="#9fdfb9"/><g transform="translate(286 729) scale(1 -1)" fill="${fill}">${wordmark}</g></svg>`;

const hero = fs.readFileSync(path.join(root, "public/img/hero/jardim.svg"), "utf8");

const shell = (body, w, h) => `<html><head><style>
html,body{margin:0;padding:0;height:${h}px;overflow:hidden}
*{box-sizing:border-box;font-family:Helvetica,Arial,sans-serif}
</style></head><body><div style="width:${w}px;height:${h}px;position:relative;overflow:hidden;background:#1d3a31">${body}</div></body></html>`;

const heroLayer = `<div style="position:absolute;inset:0">${hero.replace("<svg ", '<svg preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%" ')}</div>
<div style="position:absolute;inset:0;background:linear-gradient(100deg,rgba(11,24,20,.95) 0%,rgba(20,40,34,.88) 50%,rgba(29,58,49,.6) 100%)"></div>`;

const targets = [
  {
    file: "public/img/og/default.png",
    w: 1200,
    h: 630,
    html: shell(
      `${heroLayer}
      <div style="position:absolute;left:76px;top:74px;right:76px">
        ${logo("#ffffff")}
        <div style="margin-top:50px;color:#fff;font-size:74px;line-height:1.04;font-weight:700;letter-spacing:-2.6px;max-width:880px">Cuidamos do seu jardim<br>o ano inteiro.</div>
        <div style="margin-top:26px;color:#9fdfb9;font-size:30px;line-height:1.4;max-width:790px">Corte de grama, paisagismo, poda e manutenção — com equipe própria.</div>
      </div>
      <div style="position:absolute;left:76px;bottom:58px;display:flex;gap:16px;align-items:center">
        <div style="background:#9fdfb9;color:#1d3a31;font-size:25px;font-weight:700;padding:15px 28px;border-radius:999px">Clube Verde Fixo · a partir de R$ 450/mês</div>
        <div style="color:#d1ebe0;font-size:23px">verdefixo.com.br</div>
      </div>`,
      1200,
      630,
    ),
  },
  {
    file: "public/apple-icon.png",
    w: 180,
    h: 180,
    html: `<html><head><style>html,body{margin:0;height:180px;overflow:hidden}</style></head><body>
      <div style="width:180px;height:180px;background:#2a7261;display:flex;align-items:center;justify-content:center">
        <svg viewBox="0 0 170 752" height="112"><path d="${LEAF}" fill="#9fdfb9"/></svg>
      </div></body></html>`,
  },
];

for (const target of targets) {
  const htmlFile = path.join(temp, `${path.basename(target.file, ".png")}.html`);
  fs.writeFileSync(htmlFile, target.html);
  execFileSync("node", [path.join(root, "scripts/rasterize.mjs"), htmlFile, path.join(root, target.file), String(target.w), String(target.h)], {
    stdio: "inherit",
  });
}

fs.rmSync(temp, { recursive: true, force: true });
