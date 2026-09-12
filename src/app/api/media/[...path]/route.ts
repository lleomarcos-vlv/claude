import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { storage } from "@/lib/storage";

/**
 * Serve os arquivos do driver LOCAL.
 * Com STORAGE_DRIVER=supabase ou s3 as URLs apontam direto para o CDN e esta
 * rota deixa de ser usada.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (env.storageDriver !== "local") {
    return NextResponse.json({ error: "Storage remoto: use a URL pública" }, { status: 404 });
  }

  const { path } = await params;
  const driver = storage();
  if (!driver.read) return NextResponse.json({ error: "Driver sem leitura" }, { status: 404 });

  const file = await driver.read(path.join("/"));
  if (!file) return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
