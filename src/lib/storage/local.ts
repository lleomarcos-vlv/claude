import { promises as fs } from "node:fs";
import path from "node:path";
import { env } from "../env";
import { sanitizeKey, type StorageDriver, type StoredObject } from "./types";

/**
 * Driver de disco local.
 * Exige disco persistente (VPS, Railway/Render com volume, Fly com volume).
 * NAO funciona em plataformas serverless de sistema de arquivos efemero.
 */
export class LocalStorage implements StorageDriver {
  readonly name = "local";
  private cachedRoot: string | null = null;

  private get root(): string {
    if (!this.cachedRoot) {
      this.cachedRoot = path.resolve(/* turbopackIgnore: true */ process.cwd(), env.uploadDir);
    }
    return this.cachedRoot;
  }

  private resolve(key: string): string {
    const safe = sanitizeKey(key);
    const root = this.root;
    const full = path.resolve(/* turbopackIgnore: true */ root, safe);
    if (!full.startsWith(root + path.sep) && full !== root) {
      throw new Error("Tentativa de escrita fora do diretorio de uploads");
    }
    return full;
  }

  async put(key: string, body: Buffer, _contentType: string): Promise<void> {
    const full = this.resolve(key);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, body);
  }

  async remove(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolve(key));
    } catch {
      /* arquivo já removido */
    }
  }

  publicUrl(key: string): string {
    return `/api/media/${sanitizeKey(key)}`;
  }

  async read(key: string): Promise<StoredObject | null> {
    try {
      const full = this.resolve(key);
      const [body, stat] = await Promise.all([fs.readFile(full), fs.stat(full)]);
      return { body, size: stat.size, contentType: contentTypeFor(full) };
    } catch {
      return null;
    }
  }
}

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".mov": "video/quicktime",
    ".webm": "video/webm",
    ".svg": "image/svg+xml",
  };
  return map[ext] ?? "application/octet-stream";
}
