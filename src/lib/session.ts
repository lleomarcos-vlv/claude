/**
 * Token de sessão assinado com HMAC-SHA256.
 *
 * Usa Web Crypto (`crypto.subtle`), não `node:crypto` — assim o mesmo código roda
 * no middleware (Edge Runtime) e nos handlers de rota (Node.js), sem duplicação.
 */

export const SESSION_COOKIE = "vf_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 dias

export type Role = "CLIENT" | "STAFF" | "ADMIN";
export type SessionPayload = { sub: string; role: Role; name: string; exp: number };

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 24) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET ausente ou muito curto. Defina uma string aleatória de 32+ caracteres.");
    }
    return "verde-fixo-dev-secret-nao-usar-em-producao";
  }
  return value;
}

let keyPromise: Promise<CryptoKey> | null = null;
let keyForSecret: string | null = null;

function hmacKey() {
  const current = secret();
  if (!keyPromise || keyForSecret !== current) {
    keyForSecret = current;
    keyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(current),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"],
    );
  }
  return keyPromise;
}

function base64urlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function createSessionToken(payload: Omit<SessionPayload, "exp">, ttl = SESSION_TTL_SECONDS) {
  const body: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + ttl };
  const data = base64urlEncode(new TextEncoder().encode(JSON.stringify(body)));
  const signature = await crypto.subtle.sign("HMAC", await hmacKey(), new TextEncoder().encode(data));
  return `${data}.${base64urlEncode(new Uint8Array(signature))}`;
}

/** `null` quando o token está ausente, adulterado ou expirado. */
export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator <= 0) return null;

  const data = token.slice(0, separator);
  const signature = token.slice(separator + 1);

  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(),
      base64urlDecode(signature),
      new TextEncoder().encode(data),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(data))) as SessionPayload;
    if (!payload.sub || typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
