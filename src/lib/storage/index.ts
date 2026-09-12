import { env } from "../env";
import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import { SupabaseStorage } from "./supabase";
import type { StorageDriver } from "./types";

let cached: StorageDriver | null = null;

/**
 * Ponto único de troca de storage.
 * Basta mudar STORAGE_DRIVER no .env: nenhuma outra parte do código muda.
 */
export function storage(): StorageDriver {
  if (cached) return cached;
  switch (env.storageDriver) {
    case "supabase":
      cached = new SupabaseStorage();
      break;
    case "s3":
      cached = new S3Storage();
      break;
    default:
      cached = new LocalStorage();
  }
  return cached;
}

export type { StorageDriver } from "./types";
