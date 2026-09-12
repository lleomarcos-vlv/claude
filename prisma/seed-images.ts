import sharp from "sharp";

/**
 * Gera imagens de demonstração com a identidade da Villa Reis.
 * Elas existem apenas para o sistema nascer com conteúdo: o administrador
 * substitui cada uma por fotos reais pelo painel.
 */

const PALETTES: Record<string, [string, string, string]> = {
  paes: ["#8C4A22", "#C08A35", "#F2E0C2"],
  bolos: ["#7A3B49", "#C2727F", "#F7E3E6"],
  tortas: ["#6B4423", "#B58150", "#F5E7D3"],
  doces: ["#8A3B6B", "#D48FB4", "#FBE6F0"],
  salgados: ["#7C5312", "#D2A13C", "#F8EBCD"],
  cafe: ["#2E1A10", "#6F4423", "#D9BFA3"],
  cappuccino: ["#4A2C1A", "#A9713F", "#EFDCC4"],
  bebidas: ["#1F4438", "#4C8C6F", "#DDF0E5"],
  lanches: ["#7A4A1F", "#C99248", "#F6E6CC"],
  especiais: ["#3B2A5A", "#8878C0", "#E7E2F7"],
  kits: ["#1E3A5F", "#5C86B5", "#DCE8F5"],
  encomendas: ["#5C2E2E", "#A76060", "#F3DEDE"],
  marca: ["#241609", "#8C4A22", "#FBF6EE"],
};

function hash(value: string): number {
  let total = 0;
  for (let index = 0; index < value.length; index += 1) {
    total = (total * 31 + value.charCodeAt(index)) % 100000;
  }
  return total;
}

export async function generatePlaceholder(options: {
  label: string;
  palette?: keyof typeof PALETTES;
  width?: number;
  height?: number;
  kicker?: string;
  /** Fundo limpo, sem texto: usado nos banners, onde o título vem do site. */
  plain?: boolean;
}): Promise<Buffer> {
  const width = options.width ?? 1400;
  const height = options.height ?? 1750;
  const [dark, mid, light] = PALETTES[options.palette ?? "paes"] ?? PALETTES.paes;
  const seed = hash(options.label);

  const blobs = Array.from({ length: 5 }).map((_, index) => {
    const cx = ((seed * (index + 3)) % width) | 0;
    const cy = ((seed * (index + 7)) % height) | 0;
    const r = 120 + ((seed * (index + 2)) % 260);
    const opacity = 0.08 + ((seed + index * 13) % 12) / 100;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${light}" opacity="${opacity.toFixed(2)}" />`;
  });

  const words = options.label.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > 16) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }
  if (current.trim()) lines.push(current.trim());

  const fontSize = Math.round(width / 11);
  const startY = height / 2 - ((lines.length - 1) * fontSize * 1.15) / 2;

  const textLayer = options.plain
    ? ""
    : `<rect x="${width * 0.06}" y="${height * 0.06}" width="${width * 0.88}" height="${height * 0.88}"
        fill="none" stroke="${light}" stroke-opacity="0.35" stroke-width="3" rx="${width * 0.04}"/>
  <text x="50%" y="${height * 0.155}" text-anchor="middle" fill="${light}" fill-opacity="0.85"
        font-family="DejaVu Sans, sans-serif" font-size="${Math.round(width / 32)}" letter-spacing="${width / 160}">
    ${escapeXml((options.kicker ?? "PADARIA VILLA REIS").toUpperCase())}
  </text>
  ${lines
    .map(
      (line, index) =>
        `<text x="50%" y="${startY + index * fontSize * 1.15}" text-anchor="middle" fill="${light}"
           font-family="DejaVu Serif, Georgia, serif" font-size="${fontSize}" font-weight="bold">${escapeXml(line)}</text>`,
    )
    .join("\n  ")}
  <circle cx="50%" cy="${height * 0.8}" r="${width / 22}" fill="none" stroke="${light}" stroke-opacity="0.5" stroke-width="3"/>
  <text x="50%" y="${height * 0.8 + width / 60}" text-anchor="middle" fill="${light}"
        font-family="DejaVu Serif, serif" font-size="${Math.round(width / 26)}" font-weight="bold">VR</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${dark}"/>
      <stop offset="55%" stop-color="${mid}"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  ${blobs.join("\n  ")}
  ${textLayer}
</svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer();
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
