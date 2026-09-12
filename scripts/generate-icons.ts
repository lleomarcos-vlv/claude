/**
 * Gera os icones do PWA e a imagem de compartilhamento (Open Graph).
 * Rode novamente depois de trocar a marca: npx tsx scripts/generate-icons.ts
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const CREAM = "#FBF6EE";
const ESPRESSO = "#241609";
const GOLD = "#C08A35";

function seal(size: number, padding: number): string {
  const center = size / 2;
  const radius = center - padding;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${ESPRESSO}"/>
  <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="${GOLD}" stroke-width="${size * 0.022}"/>
  <circle cx="${center}" cy="${center}" r="${radius * 0.88}" fill="none" stroke="${CREAM}" stroke-opacity="0.3" stroke-width="${size * 0.008}"/>
  <g stroke="${GOLD}" stroke-width="${size * 0.02}" stroke-linecap="round" fill="none">
    <path d="M${center} ${center - radius * 0.55}V${center - radius * 0.12}"/>
  </g>
  <g fill="${GOLD}">
    <path d="M${center} ${center - radius * 0.48}c-${radius * 0.16} .01-${radius * 0.24} ${radius * 0.1}-${radius * 0.25} ${radius * 0.24} ${radius * 0.15} .02 ${radius * 0.24}-${radius * 0.07} ${radius * 0.25}-${radius * 0.24}Z"/>
    <path d="M${center} ${center - radius * 0.48}c${radius * 0.16} .01 ${radius * 0.24} ${radius * 0.1} ${radius * 0.25} ${radius * 0.24} -${radius * 0.15} .02-${radius * 0.24}-${radius * 0.07}-${radius * 0.25}-${radius * 0.24}Z"/>
  </g>
  <text x="${center}" y="${center + radius * 0.48}" text-anchor="middle" fill="${CREAM}"
        font-family="DejaVu Serif, Georgia, serif" font-size="${size * 0.34}" font-weight="bold">VR</text>
</svg>`;
}

function ogImage(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${ESPRESSO}"/>
      <stop offset="60%" stop-color="#5C3315"/>
      <stop offset="100%" stop-color="${ESPRESSO}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1000" cy="120" r="260" fill="${GOLD}" opacity="0.16"/>
  <circle cx="180" cy="560" r="220" fill="${CREAM}" opacity="0.08"/>
  <rect x="56" y="56" width="1088" height="518" fill="none" stroke="${CREAM}" stroke-opacity="0.28" stroke-width="3" rx="28"/>
  <text x="100" y="230" fill="${GOLD}" font-family="DejaVu Sans, sans-serif" font-size="30" letter-spacing="10">PADARIA</text>
  <text x="100" y="330" fill="${CREAM}" font-family="DejaVu Serif, Georgia, serif" font-size="96" font-weight="bold">VILLA REIS</text>
  <text x="100" y="400" fill="${CREAM}" fill-opacity="0.8" font-family="DejaVu Sans, sans-serif" font-size="30">Pães artesanais, confeitaria e cafeteria</text>
  <text x="100" y="470" fill="${CREAM}" fill-opacity="0.6" font-family="DejaVu Sans, sans-serif" font-size="26">Peca pelo site ou pelo WhatsApp</text>
</svg>`;
}

async function main() {
  const iconsDir = path.resolve("public/icons");
  await fs.mkdir(iconsDir, { recursive: true });

  const targets = [
    { file: "icon-192.png", size: 192, padding: 10 },
    { file: "icon-512.png", size: 512, padding: 26 },
    { file: "maskable-512.png", size: 512, padding: 92 },
    { file: "apple-touch-icon.png", size: 180, padding: 8 },
    { file: "favicon-32.png", size: 32, padding: 1 },
  ];

  for (const target of targets) {
    const buffer = await sharp(Buffer.from(seal(target.size, target.padding))).png().toBuffer();
    await fs.writeFile(path.join(iconsDir, target.file), buffer);
    console.log(`  ✓ public/icons/${target.file}`);
  }

  const og = await sharp(Buffer.from(ogImage())).png().toBuffer();
  await fs.writeFile(path.resolve("public/og.png"), og);
  console.log("  ✓ public/og.png");

  await fs.copyFile(path.join(iconsDir, "favicon-32.png"), path.resolve("public/favicon.ico"));
  console.log("  ✓ public/favicon.ico");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
