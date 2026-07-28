import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { fail, handleError } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

const MAX_BYTES = 6 * 1024 * 1024;

/**
 * Assinaturas de arquivo (magic numbers) aceitas.
 *
 * Confiar no `Content-Type` enviado pelo navegador não basta: verificamos os
 * primeiros bytes para garantir que é realmente uma imagem, e a extensão salva
 * vem dessa detecção — nunca do nome enviado pelo cliente.
 */
const SIGNATURES: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  { ext: "jpg", mime: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "png",
    mime: "image/png",
    test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: "webp",
    mime: "image/webp",
    test: (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
  },
  {
    ext: "avif",
    mime: "image/avif",
    test: (b) => b.subarray(4, 8).toString("latin1") === "ftyp" && /avif|avis/.test(b.subarray(8, 12).toString("latin1")),
  },
  {
    ext: "heic",
    mime: "image/heic",
    test: (b) => b.subarray(4, 8).toString("latin1") === "ftyp" && /heic|heix|mif1|msf1/.test(b.subarray(8, 12).toString("latin1")),
  },
];

/** Recebe as fotos do jardim enviadas nos formulários de agendamento e orçamento. */
export async function POST(request: Request) {
  try {
    const limited = rateLimit(`uploads:${clientIp(request)}`, 24, 15 * 60_000);
    if (!limited.ok) return fail("Muitos envios. Aguarde alguns minutos.", 429);

    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) return fail("Nenhum arquivo recebido.", 400);
    if (file.size === 0) return fail("O arquivo está vazio.", 400);
    if (file.size > MAX_BYTES) return fail("Cada imagem pode ter no máximo 6 MB.", 413);

    const bytes = Buffer.from(await file.arrayBuffer());
    const signature = SIGNATURES.find((s) => s.test(bytes));
    if (!signature) return fail("Envie uma imagem JPG, PNG, WebP, AVIF ou HEIC.", 415);

    // Nome gerado pelo servidor: elimina path traversal e colisão.
    const name = `${new Date().toISOString().slice(0, 10)}-${randomUUID()}.${signature.ext}`;
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, name), bytes);

    return NextResponse.json({ ok: true, url: `/uploads/${name}`, mime: signature.mime, size: file.size }, { status: 201 });
  } catch (error) {
    return handleError(error, "uploads");
  }
}
