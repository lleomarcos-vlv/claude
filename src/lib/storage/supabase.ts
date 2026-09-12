import { env } from "../env";
import { sanitizeKey, type StorageDriver } from "./types";

/**
 * Supabase Storage via API REST (sem SDK adicional).
 * Requer SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e um bucket PUBLICO.
 */
export class SupabaseStorage implements StorageDriver {
  readonly name = "supabase";

  constructor() {
    if (!env.supabase.url || !env.supabase.serviceKey) {
      throw new Error("STORAGE_DRIVER=supabase exige SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY");
    }
  }

  private endpoint(key: string): string {
    return `${env.supabase.url}/storage/v1/object/${env.supabase.bucket}/${sanitizeKey(key)}`;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    const res = await fetch(this.endpoint(key), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.supabase.serviceKey}`,
        "Content-Type": contentType,
        "x-upsert": "true",
        "cache-control": "31536000",
      },
      body: new Uint8Array(body),
    });
    if (!res.ok) {
      throw new Error(`Supabase Storage respondeu ${res.status}: ${await res.text()}`);
    }
  }

  async remove(key: string): Promise<void> {
    await fetch(this.endpoint(key), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${env.supabase.serviceKey}` },
    }).catch(() => undefined);
  }

  publicUrl(key: string): string {
    return `${env.supabase.url}/storage/v1/object/public/${env.supabase.bucket}/${sanitizeKey(key)}`;
  }
}
