#!/usr/bin/env node
/**
 * Garante que o banco SQLite exista antes de `next dev` / `next build`.
 *
 * As páginas públicas têm fallback para o conteúdo estático, então o build passa
 * mesmo sem banco — mas o painel administrativo e a área do cliente precisam de
 * dados. Este script cria o schema e roda o seed na primeira execução.
 *
 * Em produção com Postgres/MySQL, aponte DATABASE_URL para o banco gerenciado e
 * use `prisma migrate deploy` no lugar deste script.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envFile = path.join(root, ".env");

// 1) Cria um .env local na primeira execução, com um AUTH_SECRET aleatório.
if (!fs.existsSync(envFile)) {
  const secret = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString("base64url");
  fs.writeFileSync(
    envFile,
    [
      "# Gerado automaticamente na primeira execução. Não versione este arquivo.",
      'DATABASE_URL="file:./verde-fixo.db"',
      `AUTH_SECRET="${secret}"`,
      'NEXT_PUBLIC_SITE_URL="http://localhost:3000"',
      "",
    ].join("\n"),
  );
  console.log("✓ .env criado com AUTH_SECRET aleatório");
}

// Carrega o .env sem depender de dotenv.
for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
  const match = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
}

const url = process.env.DATABASE_URL ?? "file:./verde-fixo.db";

// 2) Só cuidamos do ciclo de vida quando é SQLite local.
if (!url.startsWith("file:")) {
  console.log("· DATABASE_URL não é SQLite — pulando criação automática do banco.");
  process.exit(0);
}

const dbFile = path.resolve(root, "prisma", url.replace(/^file:/, ""));
const fresh = !fs.existsSync(dbFile);

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit", env: process.env });
}

try {
  if (fresh) {
    console.log("· Banco não encontrado, criando schema…");
    run("npx", ["prisma", "db", "push", "--skip-generate", "--accept-data-loss"]);
    console.log("· Populando dados iniciais…");
    run("node", ["--experimental-strip-types", "prisma/seed.ts"]);
    console.log("✓ Banco pronto");
  } else {
    // Mantém o schema sincronizado sem apagar dados existentes.
    run("npx", ["prisma", "db", "push", "--skip-generate"]);
  }
} catch (error) {
  console.warn(`⚠ Não foi possível preparar o banco: ${error.message}`);
  console.warn("  O site continua funcionando com o conteúdo estático de src/content.");
}
