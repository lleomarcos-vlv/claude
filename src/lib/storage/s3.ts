import crypto from "node:crypto";
import { env } from "../env";
import { sanitizeKey, type StorageDriver } from "./types";

/**
 * Driver compativel com S3 (AWS S3, Cloudflare R2, Backblaze B2, MinIO, Wasabi).
 * Assinatura AWS Signature V4 implementada aqui para evitar a dependencia
 * pesada do SDK oficial em um projeto pequeno.
 */
export class S3Storage implements StorageDriver {
  readonly name = "s3";

  constructor() {
    const { bucket, accessKeyId, secretAccessKey, endpoint } = env.s3;
    if (!bucket || !accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error(
        "STORAGE_DRIVER=s3 exige S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY e S3_ENDPOINT",
      );
    }
  }

  private target(key: string): { url: URL; host: string } {
    const safe = sanitizeKey(key);
    const base = new URL(env.s3.endpoint);
    if (env.s3.forcePathStyle) {
      base.pathname = `/${env.s3.bucket}/${safe}`;
      return { url: base, host: base.host };
    }
    base.host = `${env.s3.bucket}.${base.host}`;
    base.pathname = `/${safe}`;
    return { url: base, host: base.host };
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.signedRequest("PUT", key, body, contentType);
  }

  async remove(key: string): Promise<void> {
    await this.signedRequest("DELETE", key, Buffer.alloc(0)).catch(() => undefined);
  }

  publicUrl(key: string): string {
    const safe = sanitizeKey(key);
    if (env.s3.publicUrl) return `${env.s3.publicUrl}/${safe}`;
    return this.target(key).url.toString();
  }

  private async signedRequest(
    method: "PUT" | "DELETE",
    key: string,
    body: Buffer,
    contentType?: string,
  ): Promise<void> {
    const { url, host } = this.target(key);
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = crypto.createHash("sha256").update(body).digest("hex");

    const headers: Record<string, string> = {
      host,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    };
    if (contentType) headers["content-type"] = contentType;
    if (method === "PUT") headers["cache-control"] = "public, max-age=31536000, immutable";

    const sortedKeys = Object.keys(headers).sort();
    const canonicalHeaders = sortedKeys.map((h) => `${h}:${headers[h].trim()}\n`).join("");
    const signedHeaders = sortedKeys.join(";");
    const canonicalUri = url.pathname.split("/").map(uriEncode).join("/");

    const canonicalRequest = [
      method,
      canonicalUri,
      "",
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join("\n");

    const scope = `${dateStamp}/${env.s3.region}/s3/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      scope,
      crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");

    const signingKey = ["aws4_request", "s3", env.s3.region, dateStamp].reduceRight(
      (prev, part) => hmac(prev, part),
      Buffer.from(`AWS4${env.s3.secretAccessKey}`) as Buffer,
    );
    const signature = hmac(signingKey, stringToSign).toString("hex");

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${env.s3.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const res = await fetch(url.toString(), {
      method,
      headers: { ...headers, Authorization: authorization },
      body: method === "PUT" ? new Uint8Array(body) : undefined,
    });

    if (!res.ok && !(method === "DELETE" && res.status === 404)) {
      throw new Error(`S3 respondeu ${res.status}: ${await res.text()}`);
    }
  }
}

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest();
}

/** Codificacao exigida pela AWS (mais restritiva que encodeURIComponent). */
function uriEncode(segment: string): string {
  return encodeURIComponent(segment).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}
