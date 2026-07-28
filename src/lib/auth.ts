import { randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, createSessionToken, verifySessionToken, type Role, type SessionPayload } from "@/lib/session";

export { SESSION_COOKIE, createSessionToken, verifySessionToken };
export type { Role, SessionPayload };

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

// --------------------------------------------------------------------------
// Senhas — scrypt com salt por usuário
// --------------------------------------------------------------------------

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password.normalize("NFKC"), salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const salt = Buffer.from(saltB64, "base64url");
  const expected = Buffer.from(hashB64, "base64url");
  const derived = await scrypt(password.normalize("NFKC"), salt, expected.length);
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

// --------------------------------------------------------------------------
// Cookie de sessão
// --------------------------------------------------------------------------

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(payload), cookieOptions);
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { ...cookieOptions, maxAge: 0 });
}

/** Sessão do request atual, validada apenas pela assinatura (sem consultar o banco). */
export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

// --------------------------------------------------------------------------
// Usuário atual
// --------------------------------------------------------------------------

const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  whatsapp: true,
  role: true,
  city: true,
  state: true,
  street: true,
  number: true,
  complement: true,
  district: true,
  zip: true,
  propertyType: true,
  areaM2: true,
  marketingOptIn: true,
  active: true,
  createdAt: true,
} as const;

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Usuário completo do banco. `null` quando não autenticado ou desativado. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  try {
    const user = await prisma.user.findUnique({ where: { id: session.sub }, select: userSelect });
    return user?.active ? user : null;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Faça login para continuar.", 401);
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Faça login para continuar.", 401);
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new AuthError("Acesso restrito à equipe Verde Fixo.", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}
