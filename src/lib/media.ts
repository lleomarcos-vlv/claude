import sharp from "sharp";
import { prisma } from "./db";
import { env } from "./env";
import { storage } from "./storage";
import { slugify } from "./slug";

export type MediaFolder = "produtos" | "banners" | "categorias" | "galeria" | "instagram" | "encomendas" | "marca" | "geral";

type DetectedType = {
  kind: "image" | "video";
  ext: string;
  mime: string;
};

/**
 * Validação por ASSINATURA BINARIA (magic bytes), não pela extensão nem pelo
 * Content-Type enviado pelo navegador. Bloqueia o upload de executaveis,
 * scripts ou SVG com script disfarcados de imagem.
 */
export function detectFileType(buffer: Buffer): DetectedType | null {
  const hex = buffer.subarray(0, 12).toString("hex").toLowerCase();
  const ascii = (start: number, length: number) =>
    buffer.subarray(start, start + length).toString("ascii");

  if (hex.startsWith("ffd8ff")) return { kind: "image", ext: "jpg", mime: "image/jpeg" };
  if (hex.startsWith("89504e470d0a1a0a")) return { kind: "image", ext: "png", mime: "image/png" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP")
    return { kind: "image", ext: "webp", mime: "image/webp" };
  if (ascii(4, 8) === "ftypavif" || ascii(4, 8) === "ftypavis")
    return { kind: "image", ext: "avif", mime: "image/avif" };

  if (ascii(4, 4) === "ftyp") {
    const brand = ascii(8, 4);
    if (brand.startsWith("qt")) return { kind: "video", ext: "mov", mime: "video/quicktime" };
    return { kind: "video", ext: "mp4", mime: "video/mp4" };
  }
  if (hex.startsWith("1a45dfa3")) return { kind: "video", ext: "webm", mime: "video/webm" };

  return null;
}

export class UploadError extends Error {}

export type ProcessedUpload = {
  id: string;
  kind: "image" | "video";
  url: string;
  thumbUrl: string | null;
};

/**
 * Recebe o arquivo cru, grava o ORIGINAL intacto no storage e gera as
 * variantes otimizadas (desktop, mobile, thumbnail).
 *
 * O original nunca e recomprimido: é ele que garante que a foto do produto
 * mantenha a qualidade que saiu da camera, sem o estrago que o WhatsApp faz.
 */
export async function processUpload(params: {
  buffer: Buffer;
  originalName: string;
  folder: MediaFolder;
  alt?: string | null;
}): Promise<ProcessedUpload> {
  const { buffer, originalName, folder } = params;

  const detected = detectFileType(buffer);
  if (!detected) {
    throw new UploadError(
      "Formato não reconhecido. Aceitamos JPG, JPEG, PNG, WEBP, AVIF (fotos) e MP4, MOV, WEBM (vídeos).",
    );
  }

  const limit = detected.kind === "image" ? env.limits.imageBytes : env.limits.videoBytes;
  if (buffer.byteLength > limit) {
    throw new UploadError(
      `Arquivo de ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB excede o limite de ${(limit / 1024 / 1024).toFixed(0)} MB para ${detected.kind === "image" ? "fotos" : "videos"}.`,
    );
  }

  const id = cuidLike();
  const now = new Date();
  const baseKey = `${folder}/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${id}`;
  const store = storage();

  const originalKey = `${baseKey}/original.${detected.ext}`;
  await store.put(originalKey, buffer, detected.mime);

  let width: number | null = null;
  let height: number | null = null;
  let desktopPath: string | null = null;
  let mobilePath: string | null = null;
  let thumbPath: string | null = null;

  if (detected.kind === "image") {
    let meta;
    try {
      meta = await sharp(buffer).metadata();
    } catch {
      await store.remove(originalKey);
      throw new UploadError("Não foi possível ler esta imagem. O arquivo pode estar corrompido.");
    }
    width = meta.width ?? null;
    height = meta.height ?? null;

    const format = env.image.format;
    const variants = [
      { name: "desktop", width: env.image.desktopWidth, quality: env.image.desktopQuality },
      { name: "mobile", width: env.image.mobileWidth, quality: env.image.mobileQuality },
      { name: "thumb", width: env.image.thumbWidth, quality: env.image.thumbQuality },
    ] as const;

    for (const variant of variants) {
      // Nunca ampliamos: se a foto original já e menor, mantémos o tamanho dela.
      const pipeline = sharp(buffer, { failOn: "none" })
        .rotate()
        .resize({ width: variant.width, withoutEnlargement: true });

      const output =
        format === "avif"
          ? await pipeline.avif({ quality: variant.quality }).toBuffer()
          : await pipeline.webp({ quality: variant.quality }).toBuffer();

      const key = `${baseKey}/${variant.name}.${format}`;
      await store.put(key, output, format === "avif" ? "image/avif" : "image/webp");
      if (variant.name === "desktop") desktopPath = key;
      if (variant.name === "mobile") mobilePath = key;
      if (variant.name === "thumb") thumbPath = key;
    }
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      id,
      kind: detected.kind,
      originalName: originalName.slice(0, 180),
      mimeType: detected.mime,
      size: buffer.byteLength,
      width,
      height,
      alt: params.alt?.slice(0, 200) ?? null,
      folder,
      originalPath: originalKey,
      desktopPath,
      mobilePath,
      thumbPath,
    },
  });

  return {
    id: asset.id,
    kind: detected.kind as "image" | "video",
    url: store.publicUrl(asset.desktopPath ?? asset.originalPath),
    thumbUrl: asset.thumbPath ? store.publicUrl(asset.thumbPath) : null,
  };
}

export async function deleteMedia(id: string): Promise<void> {
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });
  if (!asset) return;
  const store = storage();
  for (const key of [
    asset.originalPath,
    asset.desktopPath,
    asset.mobilePath,
    asset.thumbPath,
    asset.posterPath,
  ]) {
    if (key) await store.remove(key);
  }
  await prisma.mediaAsset.delete({ where: { id } });
}

type MediaLike = {
  originalPath: string;
  desktopPath?: string | null;
  mobilePath?: string | null;
  thumbPath?: string | null;
  posterPath?: string | null;
  kind: string;
  alt?: string | null;
  width?: number | null;
  height?: number | null;
};

export type MediaUrls = {
  original: string;
  desktop: string;
  mobile: string;
  thumb: string;
  poster: string | null;
  kind: "image" | "video";
  alt: string;
  width: number | null;
  height: number | null;
};

/** Monta todas as URLs de uma mídia, com fallback para o original. */
export function mediaUrls(asset: MediaLike | null | undefined, altFallback = ""): MediaUrls | null {
  if (!asset) return null;
  const store = storage();
  const original = store.publicUrl(asset.originalPath);
  return {
    original,
    desktop: asset.desktopPath ? store.publicUrl(asset.desktopPath) : original,
    mobile: asset.mobilePath ? store.publicUrl(asset.mobilePath) : original,
    thumb: asset.thumbPath ? store.publicUrl(asset.thumbPath) : original,
    poster: asset.posterPath ? store.publicUrl(asset.posterPath) : null,
    kind: asset.kind === "video" ? "video" : "image",
    alt: asset.alt || altFallback,
    width: asset.width ?? null,
    height: asset.height ?? null,
  };
}

function cuidLike(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `m${time}${rand}`;
}

export function safeFileLabel(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  return slugify(base) || "arquivo";
}
