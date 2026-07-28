#!/usr/bin/env node
/**
 * Gera as imagens do site como SVG.
 *
 * Por que SVG e não fotos: cada arquivo fica entre 1 e 4 KB (contra 150-400 KB de
 * um JPEG equivalente), é nítido em qualquer densidade de tela e não depende de
 * biblioteca de imagens no build. Isso é o que sustenta a meta de PageSpeed > 95.
 *
 * Para publicar com fotografia real, substitua os arquivos em public/img/
 * mantendo os mesmos nomes e proporções — nenhum código precisa mudar.
 *
 * Uso: npm run images:build
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "img");

// ---------------------------------------------------------------------------
// Paleta da marca
// ---------------------------------------------------------------------------
const C = {
  verde50: "#f5faf7",
  verde100: "#e6f2ec",
  verde200: "#d1ebe0",
  verde300: "#9fdfb9",
  verde400: "#63b795",
  verde500: "#38907a",
  verde600: "#2a7261",
  verde700: "#20574a",
  verde800: "#1d3a31",
  verde900: "#142822",
  grama: "#4f9e63",
  gramaEscura: "#3a7d4c",
  gramaClara: "#7cc286",
  terra: "#8a6f52",
  terraSeca: "#a89070",
  seco: "#b9a877",
  mato: "#6f7d4a",
  ceu: "#dff0f7",
  ceuBaixo: "#f4fafb",
  pedra: "#d8ded9",
  telha: "#b98a72",
  madeira: "#9c7a53",
  flor1: "#e8a0b8",
  flor2: "#f2c95e",
  flor3: "#a98cd0",
};

// ---------------------------------------------------------------------------
// Utilidades — PRNG determinístico para as imagens não mudarem entre builds
// ---------------------------------------------------------------------------
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

function svg(w, h, body, extra = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none"${extra}>${body}</svg>`;
}

function write(file, content) {
  const target = path.join(OUT, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content.replace(/\n\s*/g, ""));
  return { file, bytes: Buffer.byteLength(content) };
}

// ---------------------------------------------------------------------------
// Blocos de cena
// ---------------------------------------------------------------------------

/** Céu com gradiente suave + sol difuso. */
function sky(w, h, horizon, id) {
  return `
    <defs>
      <linearGradient id="ceu${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.ceu}"/>
        <stop offset="1" stop-color="${C.ceuBaixo}"/>
      </linearGradient>
      <radialGradient id="sol${id}" cx="0.78" cy="0.12" r="0.42">
        <stop offset="0" stop-color="#fff8e0" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#fff8e0" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${horizon + 2}" fill="url(#ceu${id})"/>
    <rect width="${w}" height="${horizon + 2}" fill="url(#sol${id})"/>`;
}

/** Faixas de morros ao fundo, para dar profundidade. */
function hills(w, horizon, id) {
  const layers = [
    { y: horizon - 46, amp: 26, fill: C.verde400, opacity: 0.28 },
    { y: horizon - 24, amp: 18, fill: C.verde500, opacity: 0.35 },
  ];
  return layers
    .map((l, i) => {
      const rand = rng(id * 31 + i * 7);
      let d = `M0 ${horizon + 4} L0 ${l.y}`;
      const step = w / 5;
      for (let x = 0; x <= w; x += step) {
        const cy = l.y - l.amp * (0.4 + rand() * 0.6);
        d += ` Q${r2(x + step / 2)} ${r2(cy)} ${r2(Math.min(x + step, w))} ${r2(l.y - l.amp * 0.2 * rand())}`;
      }
      d += ` L${w} ${horizon + 4} Z`;
      return `<path d="${d}" fill="${l.fill}" opacity="${l.opacity}"/>`;
    })
    .join("");
}

/** Gramado com listras de corte (o acabamento que a Verde Fixo entrega). */
function mownLawn(w, h, horizon, id, stripes = 9) {
  const band = (h - horizon) / stripes;
  let out = `
    <defs>
      <linearGradient id="grama${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.gramaEscura}"/>
        <stop offset="1" stop-color="${C.grama}"/>
      </linearGradient>
    </defs>
    <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#grama${id})"/>`;

  for (let i = 0; i < stripes; i += 2) {
    const y = horizon + i * band;
    // Listras em perspectiva: mais largas na frente.
    const inset = (1 - i / stripes) * w * 0.06;
    out += `<path d="M${r2(inset)} ${r2(y)} L${r2(w - inset)} ${r2(y)} L${w} ${r2(y + band)} L0 ${r2(y + band)} Z" fill="${C.gramaClara}" opacity="0.3"/>`;
  }

  // Textura fina de folhas no primeiro plano — evita o aspecto de bloco chapado.
  const rand = rng(id * 23 + 11);
  for (let i = 0; i < 90; i++) {
    const x = rand() * w;
    const y = horizon + (h - horizon) * (0.45 + rand() * 0.55);
    const len = 4 + rand() * 9 * ((y - horizon) / (h - horizon));
    out += `<path d="M${r2(x)} ${r2(y)} l${r2((rand() - 0.5) * 4)} ${r2(-len)}" stroke="${rand() > 0.5 ? C.gramaClara : C.gramaEscura}" stroke-width="1.3" stroke-linecap="round" opacity="${r2(0.3 + rand() * 0.35)}"/>`;
  }
  return out;
}

/** Gramado alto e irregular, com falhas — o "antes". */
function overgrownLawn(w, h, horizon, id) {
  const rand = rng(id * 17 + 3);
  let out = `
    <defs>
      <linearGradient id="mato${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${C.mato}"/>
        <stop offset="1" stop-color="${C.seco}"/>
      </linearGradient>
    </defs>
    <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#mato${id})"/>`;

  // Manchas secas / falhas
  for (let i = 0; i < 7; i++) {
    const cx = rand() * w;
    const cy = horizon + 30 + rand() * (h - horizon - 40);
    const rx = 40 + rand() * 90;
    out += `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(rx * 0.34)}" fill="${C.terraSeca}" opacity="${r2(0.2 + rand() * 0.25)}"/>`;
  }

  // Tufos de mato alto
  for (let i = 0; i < 120; i++) {
    const x = rand() * w;
    const baseY = horizon + 8 + rand() * (h - horizon - 8);
    const tall = 18 + rand() * 46 * (baseY / h);
    const lean = (rand() - 0.5) * 22;
    const color = rand() > 0.55 ? C.mato : C.seco;
    out += `<path d="M${r2(x)} ${r2(baseY)} Q${r2(x + lean * 0.5)} ${r2(baseY - tall * 0.6)} ${r2(x + lean)} ${r2(baseY - tall)}" stroke="${color}" stroke-width="${r2(1.4 + rand() * 1.8)}" stroke-linecap="round" opacity="${r2(0.5 + rand() * 0.4)}"/>`;
  }
  return out;
}

/** Arbusto arredondado (topiaria). */
function shrub(cx, cy, r, color = C.verde600, highlight = C.verde500) {
  return `
    <ellipse cx="${r2(cx)}" cy="${r2(cy + r * 0.9)}" rx="${r2(r * 0.95)}" ry="${r2(r * 0.2)}" fill="${C.verde900}" opacity="0.16"/>
    <circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${color}"/>
    <path d="M${r2(cx - r * 0.62)} ${r2(cy - r * 0.3)} A ${r2(r)} ${r2(r)} 0 0 1 ${r2(cx + r * 0.1)} ${r2(cy - r * 0.95)}" stroke="${highlight}" stroke-width="${r2(r * 0.26)}" stroke-linecap="round" opacity="0.55"/>`;
}

/** Árvore com copa em três massas. */
function tree(x, groundY, scale = 1, trunk = C.madeira) {
  const s = scale;
  return `
    <ellipse cx="${r2(x)}" cy="${r2(groundY + 4 * s)}" rx="${r2(52 * s)}" ry="${r2(11 * s)}" fill="${C.verde900}" opacity="0.18"/>
    <path d="M${r2(x - 10 * s)} ${r2(groundY)} L${r2(x - 7 * s)} ${r2(groundY - 62 * s)} L${r2(x + 7 * s)} ${r2(groundY - 62 * s)} L${r2(x + 10 * s)} ${r2(groundY)} Z" fill="${trunk}"/>
    <circle cx="${r2(x - 26 * s)}" cy="${r2(groundY - 78 * s)}" r="${r2(30 * s)}" fill="${C.verde700}"/>
    <circle cx="${r2(x + 24 * s)}" cy="${r2(groundY - 84 * s)}" r="${r2(27 * s)}" fill="${C.verde600}"/>
    <circle cx="${r2(x)}" cy="${r2(groundY - 106 * s)}" r="${r2(34 * s)}" fill="${C.verde500}"/>
    <circle cx="${r2(x + 8 * s)}" cy="${r2(groundY - 118 * s)}" r="${r2(16 * s)}" fill="${C.verde400}" opacity="0.75"/>`;
}

/** Palmeira, para cenas de piscina e paisagismo premium. */
function palm(x, groundY, scale = 1) {
  const s = scale;
  const fronds = [];
  for (let i = 0; i < 7; i++) {
    const a = -160 + i * 27;
    const rad = (a * Math.PI) / 180;
    const len = 62 * s;
    const ex = x + Math.cos(rad) * len;
    const ey = groundY - 120 * s + Math.sin(rad) * len * 0.62;
    fronds.push(
      `<path d="M${r2(x)} ${r2(groundY - 120 * s)} Q${r2((x + ex) / 2)} ${r2((groundY - 120 * s + ey) / 2 - 22 * s)} ${r2(ex)} ${r2(ey)}" stroke="${i % 2 ? C.verde600 : C.verde500}" stroke-width="${r2(7 * s)}" stroke-linecap="round"/>`,
    );
  }
  return `
    <ellipse cx="${r2(x)}" cy="${r2(groundY + 4 * s)}" rx="${r2(30 * s)}" ry="${r2(8 * s)}" fill="${C.verde900}" opacity="0.18"/>
    <path d="M${r2(x - 5 * s)} ${r2(groundY)} Q${r2(x - 12 * s)} ${r2(groundY - 64 * s)} ${r2(x - 2 * s)} ${r2(groundY - 120 * s)} L${r2(x + 5 * s)} ${r2(groundY - 120 * s)} Q${r2(x + 2 * s)} ${r2(groundY - 62 * s)} ${r2(x + 6 * s)} ${r2(groundY)} Z" fill="${C.madeira}"/>
    ${fronds.join("")}`;
}

/** Canteiro com forração e flores. */
function flowerBed(x, y, w, h, seed) {
  const rand = rng(seed);
  let out = `
    <path d="M${r2(x)} ${r2(y + h)} Q${r2(x)} ${r2(y)} ${r2(x + w * 0.5)} ${r2(y)} Q${r2(x + w)} ${r2(y)} ${r2(x + w)} ${r2(y + h)} Z" fill="${C.terra}" opacity="0.9"/>`;
  const colors = [C.flor1, C.flor2, C.flor3, C.verde300];
  for (let i = 0; i < 26; i++) {
    const px = x + 8 + rand() * (w - 16);
    const py = y + 8 + rand() * (h - 12);
    const rr = 3 + rand() * 4;
    out += `<circle cx="${r2(px)}" cy="${r2(py)}" r="${r2(rr)}" fill="${colors[Math.floor(rand() * colors.length)]}" opacity="0.92"/>`;
  }
  return out;
}

/** Caminho de pedras. */
function stonePath(points, width = 44) {
  return `<path d="${points}" stroke="${C.pedra}" stroke-width="${width}" stroke-linecap="round" fill="none" opacity="0.95"/>
          <path d="${points}" stroke="#ffffff" stroke-width="${width - 14}" stroke-linecap="round" fill="none" opacity="0.35"/>`;
}

/** Silhueta de casa ao fundo. */
function house(x, groundY, w = 200, h = 120) {
  return `
    <rect x="${r2(x)}" y="${r2(groundY - h)}" width="${w}" height="${h}" fill="#ffffff" opacity="0.95"/>
    <path d="M${r2(x - 14)} ${r2(groundY - h)} L${r2(x + w / 2)} ${r2(groundY - h - 46)} L${r2(x + w + 14)} ${r2(groundY - h)} Z" fill="${C.telha}"/>
    <rect x="${r2(x + 26)}" y="${r2(groundY - h + 30)}" width="42" height="38" rx="3" fill="${C.verde200}"/>
    <rect x="${r2(x + w - 92)}" y="${r2(groundY - h + 30)}" width="42" height="38" rx="3" fill="${C.verde200}"/>
    <rect x="${r2(x + w / 2 - 18)}" y="${r2(groundY - 58)}" width="36" height="58" rx="3" fill="${C.verde700}"/>`;
}

/** Cerca-viva contínua. */
function hedge(x, y, w, h, trimmed) {
  if (trimmed) {
    return `
      <rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="6" fill="${C.verde600}"/>
      <rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h * 0.34)}" rx="6" fill="${C.verde500}" opacity="0.6"/>
      <rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="3" fill="${C.verde300}" opacity="0.8"/>`;
  }
  // Cerca-viva sem poda: topo irregular, brotos escapando e tom amarelado.
  const rand = rng(Math.round(x + w));
  let top = `M${r2(x)} ${r2(y + h)}`;
  for (let px = x; px <= x + w; px += w / 18) {
    top += ` L${r2(px)} ${r2(y - 10 + rand() * 30)}`;
  }
  top += ` L${r2(x + w)} ${r2(y + h)} Z`;

  let sprouts = "";
  for (let i = 0; i < 46; i++) {
    const px = x + rand() * w;
    const py = y + rand() * 14;
    const tall = 16 + rand() * 40;
    sprouts += `<path d="M${r2(px)} ${r2(py)} Q${r2(px + (rand() - 0.5) * 16)} ${r2(py - tall * 0.6)} ${r2(px + (rand() - 0.5) * 30)} ${r2(py - tall)}" stroke="${rand() > 0.45 ? C.mato : C.seco}" stroke-width="${r2(1.6 + rand() * 2)}" stroke-linecap="round" opacity="${r2(0.55 + rand() * 0.4)}"/>`;
  }
  return `<path d="${top}" fill="${C.mato}"/>${sprouts}`;
}

/** Vinheta suave para dar acabamento fotográfico. */
function vignette(w, h, id) {
  return `
    <defs>
      <radialGradient id="vig${id}" cx="0.5" cy="0.45" r="0.78">
        <stop offset="0.55" stop-color="#000" stop-opacity="0"/>
        <stop offset="1" stop-color="${C.verde900}" stop-opacity="0.2"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#vig${id})"/>`;
}

// ---------------------------------------------------------------------------
// Cenas completas
// ---------------------------------------------------------------------------

/** Jardim impecável — usada no hero e nos "depois". */
function sceneGardenPerfect(w, h, id, opts = {}) {
  const horizon = h * (opts.horizon ?? 0.44);
  return svg(
    w,
    h,
    [
      sky(w, h, horizon, id),
      hills(w, horizon, id),
      opts.house !== false ? house(w * 0.08, horizon + 6, w * 0.2, h * 0.14) : "",
      mownLawn(w, h, horizon, id, opts.stripes ?? 9),
      opts.path !== false ? stonePath(`M${w * 0.14} ${h} Q${w * 0.42} ${h * 0.78} ${w * 0.56} ${horizon + 12}`, w * 0.045) : "",
      hedge(w * 0.6, horizon - h * 0.05, w * 0.36, h * 0.06, true),
      flowerBed(w * 0.04, horizon + h * 0.06, w * 0.24, h * 0.1, id + 5),
      tree(w * 0.82, horizon + h * 0.04, (h / 700) * 1.1),
      shrub(w * 0.36, horizon + h * 0.02, h * 0.045),
      shrub(w * 0.45, horizon + h * 0.035, h * 0.032),
      opts.palm ? palm(w * 0.68, horizon + h * 0.1, h / 620) : "",
      vignette(w, h, id),
    ].join(""),
  );
}

/** Jardim abandonado — usada nos "antes". */
function sceneGardenNeglected(w, h, id, opts = {}) {
  const horizon = h * (opts.horizon ?? 0.44);
  return svg(
    w,
    h,
    [
      sky(w, h, horizon, id),
      hills(w, horizon, id),
      opts.house !== false ? house(w * 0.08, horizon + 6, w * 0.2, h * 0.14) : "",
      overgrownLawn(w, h, horizon, id),
      hedge(w * 0.6, horizon - h * 0.07, w * 0.36, h * 0.08, false),
      // Entulho e galhos secos
      `<path d="M${w * 0.2} ${h * 0.82} l60 -14 l-14 26 z" fill="${C.terraSeca}" opacity="0.8"/>`,
      `<path d="M${w * 0.3} ${h * 0.9} l${w * 0.1} -8" stroke="${C.madeira}" stroke-width="7" stroke-linecap="round" opacity="0.85"/>`,
      `<path d="M${w * 0.34} ${h * 0.86} l${w * 0.06} 14" stroke="${C.madeira}" stroke-width="5" stroke-linecap="round" opacity="0.7"/>`,
      tree(w * 0.82, horizon + h * 0.04, (h / 700) * 1.1, "#7a5f42"),
      vignette(w, h, id),
    ].join(""),
  );
}

/** Terreno tomado por capoeira. */
function sceneLotOvergrown(w, h, id) {
  const horizon = h * 0.34;
  return svg(
    w,
    h,
    [
      sky(w, h, horizon, id),
      hills(w, horizon, id),
      overgrownLawn(w, h, horizon, id),
      // Capoeira alta em primeiro plano
      (() => {
        const rand = rng(id * 91);
        let out = "";
        for (let i = 0; i < 90; i++) {
          const x = rand() * w;
          const baseY = h - rand() * h * 0.42;
          const tall = 60 + rand() * 130;
          out += `<path d="M${r2(x)} ${r2(baseY)} Q${r2(x + (rand() - 0.5) * 40)} ${r2(baseY - tall * 0.55)} ${r2(x + (rand() - 0.5) * 70)} ${r2(baseY - tall)}" stroke="${rand() > 0.5 ? C.mato : C.seco}" stroke-width="${r2(2 + rand() * 3)}" stroke-linecap="round" opacity="0.75"/>`;
        }
        return out;
      })(),
      `<rect x="${w * 0.05}" y="${h * 0.5}" width="${w * 0.9}" height="6" fill="${C.madeira}" opacity="0.5"/>`,
      vignette(w, h, id),
    ].join(""),
  );
}

/** Terreno limpo e nivelado. */
function sceneLotClean(w, h, id) {
  const horizon = h * 0.34;
  return svg(
    w,
    h,
    [
      sky(w, h, horizon, id),
      hills(w, horizon, id),
      `<rect y="${horizon}" width="${w}" height="${h - horizon}" fill="${C.terraSeca}"/>`,
      // Marcas de nivelamento
      (() => {
        let out = "";
        for (let i = 0; i < 12; i++) {
          const y = horizon + ((h - horizon) / 12) * i;
          out += `<path d="M0 ${r2(y)} L${w} ${r2(y + 6)}" stroke="${C.terra}" stroke-width="2" opacity="0.35"/>`;
        }
        return out;
      })(),
      `<rect x="${w * 0.05}" y="${h * 0.5}" width="${w * 0.9}" height="6" fill="${C.madeira}" opacity="0.8"/>`,
      `<rect y="${horizon}" width="${w}" height="${h * 0.02}" fill="${C.grama}" opacity="0.5"/>`,
      vignette(w, h, id),
    ].join(""),
  );
}

/**
 * Composição botânica para capas de blog: folhagem densa vinda dos cantos,
 * com clareira central onde o título é sobreposto pelo layout da página.
 */
function sceneAbstract(w, h, id, tone = "verde") {
  const rand = rng(id * 137);
  const dark = tone === "escuro";

  let out = `<defs>
      <linearGradient id="ab${id}" x1="0" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color="${dark ? C.verde700 : C.verde100}"/>
        <stop offset="1" stop-color="${dark ? C.verde900 : C.verde200}"/>
      </linearGradient>
      <radialGradient id="clareira${id}" cx="0.5" cy="0.48" r="0.5">
        <stop offset="0" stop-color="${dark ? C.verde600 : "#ffffff"}" stop-opacity="${dark ? 0.4 : 0.75}"/>
        <stop offset="1" stop-color="${dark ? C.verde600 : "#ffffff"}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#ab${id})"/>`;

  const palette = dark
    ? [C.verde300, C.verde400, C.verde500, C.verde600]
    : [C.verde400, C.verde500, C.verde600, C.verde300];

  // Folhagem ancorada nos quatro cantos: mais densa e maior nas bordas.
  const anchors = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: 0, y: h },
    { x: w, y: h },
  ];

  for (const anchor of anchors) {
    for (let i = 0; i < 11; i++) {
      const spread = 0.16 + rand() * 0.42;
      const cx = anchor.x + (w * 0.5 - anchor.x) * spread * (0.5 + rand() * 0.9);
      const cy = anchor.y + (h * 0.5 - anchor.y) * spread * (0.5 + rand() * 0.9);
      const s = 78 + rand() * 105;
      const rot = rand() * 360;
      const fill = palette[Math.floor(rand() * palette.length)];
      out += `<g transform="translate(${r2(cx)} ${r2(cy)}) rotate(${r2(rot)}) scale(${r2(s / 100)})" opacity="${r2(0.42 + rand() * 0.5)}">
        <path d="M0 -50C28 -20 34 10 0 50C-34 10 -28 -20 0 -50Z" fill="${fill}"/>
        <path d="M0 -44L0 44" stroke="${dark ? C.verde900 : C.verde800}" stroke-width="2.6" opacity="0.3"/>
        <path d="M0 -22 l14 -8M0 -2 l16 -6M0 18 l13 -4M0 -22 l-14 -8M0 -2 l-16 -6M0 18 l-13 -4" stroke="${dark ? C.verde900 : C.verde800}" stroke-width="1.8" opacity="0.22"/>
      </g>`;
    }
  }

  // Clareira central para o texto respirar.
  out += `<rect width="${w}" height="${h}" fill="url(#clareira${id})"/>`;
  return svg(w, h, out);
}

// ---------------------------------------------------------------------------
// Cartões de serviço — cada um com uma cena coerente
// ---------------------------------------------------------------------------

const SERVICE_SCENES = {
  "corte-de-grama": (w, h, id) => sceneGardenPerfect(w, h, id, { stripes: 11, palm: false }),
  paisagismo: (w, h, id) =>
    svg(
      w,
      h,
      [
        sky(w, h, h * 0.4, id),
        hills(w, h * 0.4, id),
        mownLawn(w, h, h * 0.4, id, 7),
        stonePath(`M${w * 0.1} ${h} Q${w * 0.4} ${h * 0.72} ${w * 0.52} ${h * 0.42}`, w * 0.05),
        flowerBed(w * 0.55, h * 0.5, w * 0.4, h * 0.16, id + 2),
        flowerBed(w * 0.05, h * 0.62, w * 0.3, h * 0.14, id + 3),
        palm(w * 0.78, h * 0.52, h / 560),
        shrub(w * 0.3, h * 0.5, h * 0.06),
        shrub(w * 0.42, h * 0.55, h * 0.045),
        vignette(w, h, id),
      ].join(""),
    ),
  jardinagem: (w, h, id) =>
    svg(
      w,
      h,
      [
        sky(w, h, h * 0.38, id),
        hills(w, h * 0.38, id),
        mownLawn(w, h, h * 0.38, id, 8),
        flowerBed(w * 0.08, h * 0.52, w * 0.36, h * 0.18, id + 1),
        flowerBed(w * 0.56, h * 0.58, w * 0.36, h * 0.16, id + 4),
        shrub(w * 0.5, h * 0.46, h * 0.07),
        // Ferramentas apoiadas
        `<path d="M${w * 0.86} ${h * 0.9} L${w * 0.9} ${h * 0.42}" stroke="${C.madeira}" stroke-width="8" stroke-linecap="round"/>`,
        `<path d="M${w * 0.87} ${h * 0.4} l${w * 0.06} 0 l-${w * 0.01} ${h * 0.06} l-${w * 0.04} 0 z" fill="${C.pedra}"/>`,
        vignette(w, h, id),
      ].join(""),
    ),
  poda: (w, h, id) =>
    svg(
      w,
      h,
      [
        sky(w, h, h * 0.5, id),
        hills(w, h * 0.5, id),
        mownLawn(w, h, h * 0.5, id, 6),
        hedge(w * 0.05, h * 0.34, w * 0.5, h * 0.16, true),
        hedge(w * 0.58, h * 0.3, w * 0.36, h * 0.2, false),
        shrub(w * 0.2, h * 0.66, h * 0.07),
        shrub(w * 0.34, h * 0.7, h * 0.055),
        tree(w * 0.8, h * 0.6, (h / 700) * 0.9),
        vignette(w, h, id),
      ].join(""),
    ),
  "limpeza-de-terreno": (w, h, id) => sceneLotClean(w, h, id),
  plantio: (w, h, id) =>
    svg(
      w,
      h,
      [
        sky(w, h, h * 0.36, id),
        hills(w, h * 0.36, id),
        `<rect y="${h * 0.36}" width="${w}" height="${h * 0.64}" fill="${C.terra}"/>`,
        // Placas de grama sendo assentadas
        (() => {
          let out = "";
          for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 6; col++) {
              const x = w * 0.06 + col * w * 0.15 + (row % 2) * w * 0.04;
              const y = h * 0.44 + row * h * 0.12;
              if (row === 3 && col > 3) continue;
              out += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w * 0.13)}" height="${r2(h * 0.1)}" rx="4" fill="${row % 2 ? C.grama : C.gramaClara}" opacity="0.95"/>`;
            }
          }
          return out;
        })(),
        shrub(w * 0.88, h * 0.44, h * 0.05),
        vignette(w, h, id),
      ].join(""),
    ),
  adubacao: (w, h, id) =>
    svg(
      w,
      h,
      [
        sky(w, h, h * 0.4, id),
        hills(w, h * 0.4, id),
        mownLawn(w, h, h * 0.4, id, 10),
        // Grânulos de adubo distribuídos
        (() => {
          const rand = rng(id * 53);
          let out = "";
          for (let i = 0; i < 200; i++) {
            out += `<circle cx="${r2(rand() * w)}" cy="${r2(h * 0.44 + rand() * h * 0.56)}" r="${r2(1.2 + rand() * 2.2)}" fill="${C.flor2}" opacity="${r2(0.35 + rand() * 0.5)}"/>`;
          }
          return out;
        })(),
        shrub(w * 0.85, h * 0.5, h * 0.06),
        vignette(w, h, id),
      ].join(""),
    ),
  "controle-de-pragas": (w, h, id) =>
    svg(
      w,
      h,
      [
        sky(w, h, h * 0.42, id),
        hills(w, h * 0.42, id),
        mownLawn(w, h, h * 0.42, id, 8),
        // Folha em destaque com lupa
        `<g transform="translate(${w * 0.3} ${h * 0.6}) scale(${h / 380})">
          <path d="M0 -60C34 -24 40 12 0 60C-40 12 -34 -24 0 -60Z" fill="${C.verde500}"/>
          <path d="M0 -56L0 56" stroke="${C.verde800}" stroke-width="3" opacity="0.3"/>
        </g>`,
        `<circle cx="${w * 0.58}" cy="${h * 0.52}" r="${h * 0.14}" fill="#ffffff" opacity="0.28"/>
         <circle cx="${w * 0.58}" cy="${h * 0.52}" r="${h * 0.14}" stroke="${C.verde700}" stroke-width="7"/>
         <path d="M${w * 0.66} ${h * 0.63} L${w * 0.76} ${h * 0.78}" stroke="${C.verde700}" stroke-width="11" stroke-linecap="round"/>`,
        vignette(w, h, id),
      ].join(""),
    ),
  irrigacao: (w, h, id) =>
    svg(
      w,
      h,
      [
        sky(w, h, h * 0.4, id),
        hills(w, h * 0.4, id),
        mownLawn(w, h, h * 0.4, id, 9),
        // Aspersores em funcionamento
        (() => {
          const rand = rng(id * 61);
          let out = "";
          for (const cx of [w * 0.24, w * 0.56, w * 0.84]) {
            const cy = h * 0.62;
            out += `<rect x="${r2(cx - 4)}" y="${r2(cy)}" width="8" height="${r2(h * 0.06)}" rx="4" fill="${C.pedra}"/>`;
            for (let i = 0; i < 26; i++) {
              const a = -170 + rand() * 160;
              const rad = (a * Math.PI) / 180;
              const len = h * (0.1 + rand() * 0.14);
              out += `<path d="M${r2(cx)} ${r2(cy)} Q${r2(cx + Math.cos(rad) * len * 0.6)} ${r2(cy + Math.sin(rad) * len - h * 0.03)} ${r2(cx + Math.cos(rad) * len)} ${r2(cy + Math.sin(rad) * len * 0.4)}" stroke="#bfe6f2" stroke-width="2" stroke-linecap="round" opacity="${r2(0.35 + rand() * 0.4)}"/>`;
            }
          }
          return out;
        })(),
        vignette(w, h, id),
      ].join(""),
    ),
  "revitalizacao-de-jardins": (w, h, id) => {
    // Metade abandonada, metade recuperada — a promessa do serviço.
    const horizon = h * 0.42;
    return svg(
      w,
      h,
      [
        sky(w, h, horizon, id),
        hills(w, horizon, id),
        `<g clip-path="url(#esq${id})">${overgrownLawn(w, h, horizon, id)}${hedge(w * 0.05, horizon - h * 0.07, w * 0.3, h * 0.08, false)}</g>`,
        `<g clip-path="url(#dir${id})">${mownLawn(w, h, horizon, id + 1, 9)}${flowerBed(w * 0.56, horizon + h * 0.1, w * 0.36, h * 0.12, id + 8)}${shrub(w * 0.72, horizon + h * 0.04, h * 0.05)}</g>`,
        `<defs>
          <clipPath id="esq${id}"><rect width="${w * 0.5}" height="${h}"/></clipPath>
          <clipPath id="dir${id}"><rect x="${w * 0.5}" width="${w * 0.5}" height="${h}"/></clipPath>
        </defs>`,
        `<rect x="${w * 0.5 - 2}" y="${horizon}" width="4" height="${h - horizon}" fill="#ffffff" opacity="0.85"/>`,
        tree(w * 0.86, horizon + h * 0.04, (h / 700) * 1.05),
        vignette(w, h, id),
      ].join(""),
    );
  },
};

// ---------------------------------------------------------------------------
// Execução
// ---------------------------------------------------------------------------

const results = [];

// Hero — grande e leve
results.push(write("hero/jardim.svg", sceneGardenPerfect(1600, 1000, 1, { stripes: 12, palm: true })));
results.push(write("hero/jardim-mobile.svg", sceneGardenPerfect(800, 900, 2, { stripes: 8, house: false })));

// Cartões de serviço
let sid = 10;
for (const [slug, scene] of Object.entries(SERVICE_SCENES)) {
  results.push(write(`servicos/${slug}.svg`, scene(800, 600, sid++)));
}

// Galeria antes/depois
const galleryPairs = [
  ["paisagismo-1", "garden"],
  ["paisagismo-2", "pool"],
  ["corte-1", "garden"],
  ["corte-2", "garden"],
  ["revitalizacao-1", "garden"],
  ["revitalizacao-2", "garden"],
  ["poda-1", "hedge"],
  ["poda-2", "hedge"],
  ["limpeza-1", "lot"],
];
let gid = 40;
for (const [name, kind] of galleryPairs) {
  const id = gid++;
  if (kind === "lot") {
    results.push(write(`galeria/${name}-antes.svg`, sceneLotOvergrown(1200, 800, id)));
    results.push(write(`galeria/${name}-depois.svg`, sceneLotClean(1200, 800, id)));
  } else if (kind === "hedge") {
    results.push(
      write(
        `galeria/${name}-antes.svg`,
        svg(1200, 800, [sky(1200, 800, 400, id), hills(1200, 400, id), mownLawn(1200, 800, 400, id, 7), hedge(80, 250, 1040, 150, false), vignette(1200, 800, id)].join("")),
      ),
    );
    results.push(
      write(
        `galeria/${name}-depois.svg`,
        svg(1200, 800, [sky(1200, 800, 400, id + 1), hills(1200, 400, id + 1), mownLawn(1200, 800, 400, id + 1, 9), hedge(80, 280, 1040, 120, true), shrub(240, 560, 44), shrub(420, 590, 34), vignette(1200, 800, id + 1)].join("")),
      ),
    );
  } else {
    results.push(write(`galeria/${name}-antes.svg`, sceneGardenNeglected(1200, 800, id)));
    results.push(write(`galeria/${name}-depois.svg`, sceneGardenPerfect(1200, 800, id + 1, { palm: kind === "pool", stripes: 10 })));
  }
}

// Capas de blog
const blogCovers = [
  "frequencia-corte",
  "custos-jardim",
  "grama-amarelada",
  "plantas-resistentes",
  "economia-agua",
  "calendario-jardinagem",
];
blogCovers.forEach((name, i) => {
  results.push(write(`blog/${name}.svg`, sceneAbstract(1200, 630, 70 + i, i % 2 === 0 ? "verde" : "escuro")));
});

// Padrão decorativo para faixas
results.push(
  write(
    "textura/folhas.svg",
    svg(
      600,
      600,
      `<defs><pattern id="p" width="150" height="150" patternUnits="userSpaceOnUse">
        <g transform="translate(75 75) scale(0.5)" opacity="0.5">
          <path d="M0 -60C34 -24 40 12 0 60C-40 12 -34 -24 0 -60Z" fill="${C.verde300}"/>
        </g>
      </pattern></defs><rect width="600" height="600" fill="url(#p)"/>`,
    ),
  ),
);

const total = results.reduce((sum, r) => sum + r.bytes, 0);
console.log(`✓ ${results.length} imagens geradas em public/img (${(total / 1024).toFixed(1)} KB no total)`);
const heaviest = [...results].sort((a, b) => b.bytes - a.bytes).slice(0, 3);
console.log(`  maiores: ${heaviest.map((r) => `${r.file} ${(r.bytes / 1024).toFixed(1)}KB`).join(", ")}`);
