import { getSession } from "@/lib/auth";
import { handleError, jsonError, jsonOk } from "@/lib/api";
import { processUpload, UploadError, type MediaFolder } from "@/lib/media";

export const runtime = "nodejs";
export const maxDuration = 300;

const FOLDERS: MediaFolder[] = [
  "produtos",
  "banners",
  "categorias",
  "galeria",
  "instagram",
  "encomendas",
  "marca",
  "geral",
];

/**
 * Upload direto do computador ou do celular do administrador.
 * Aceita um ou vários arquivos no mesmo envio (campo "files").
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return jsonError("Sessão expirada. Faca login novamente.", 401);

  try {
    const form = await request.formData();
    const folderRaw = String(form.get("folder") ?? "geral") as MediaFolder;
    const folder: MediaFolder = FOLDERS.includes(folderRaw) ? folderRaw : "geral";
    const alt = form.get("alt") ? String(form.get("alt")) : null;

    const entries = [...form.getAll("files"), ...form.getAll("file")].filter(
      (entry): entry is File => entry instanceof File && entry.size > 0,
    );

    if (entries.length === 0) return jsonError("Nenhum arquivo recebido.", 400);
    if (entries.length > 20) return jsonError("Envie no máximo 20 arquivos por vez.", 400);

    const results = [];
    const failures: string[] = [];

    for (const file of entries) {
      const buffer = Buffer.from(await file.arrayBuffer());
      try {
        results.push(
          await processUpload({ buffer, originalName: file.name, folder, alt }),
        );
      } catch (error) {
        failures.push(
          `${file.name}: ${error instanceof UploadError ? error.message : "falha no processamento"}`,
        );
      }
    }

    if (results.length === 0) {
      return jsonError(failures.join(" | ") || "Nenhum arquivo pode ser processado.", 415);
    }

    return jsonOk({ uploaded: results, failures });
  } catch (error) {
    return handleError(error);
  }
}
