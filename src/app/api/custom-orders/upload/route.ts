import { clientIp, handleError, jsonError, jsonOk } from "@/lib/api";
import { processUpload, UploadError } from "@/lib/media";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024;
const uploadsByIp = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 30 * 60 * 1000;
const MAX_PER_WINDOW = 6;

/**
 * Upload público e restrito: apenas a foto de referência da encomenda.
 * Limite menor, apenas imagem e com controle de frequência por IP.
 */
export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const now = Date.now();
    const entry = uploadsByIp.get(ip);
    if (entry && now - entry.firstAt < WINDOW_MS) {
      if (entry.count >= MAX_PER_WINDOW) {
        return jsonError("Você já enviou várias imagens. Tente novamente mais tarde.", 429);
      }
      entry.count += 1;
    } else {
      uploadsByIp.set(ip, { count: 1, firstAt: now });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) return jsonError("Envie uma imagem.", 400);
    if (file.size > MAX_BYTES) return jsonError("A imagem precisa ter no máximo 8 MB.", 413);

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await processUpload({
      buffer,
      originalName: file.name,
      folder: "encomendas",
    });

    if (uploaded.kind !== "image") return jsonError("Envie apenas imagens como referência.", 415);
    return jsonOk(uploaded);
  } catch (error) {
    if (error instanceof UploadError) return jsonError(error.message, 415);
    return handleError(error);
  }
}
