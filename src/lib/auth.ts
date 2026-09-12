import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { SESSION_COOKIE, readSessionToken, type SessionPayload } from "./session";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return readSessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Usar dentro de rotas /api/admin/* e páginas do painel. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Não autorizado");
    this.name = "UnauthorizedError";
  }
}

// ---------------------------------------------------------------------------
// Proteção contra forca bruta no login (memória do processo).
// Em ambiente com várias instancias, troque por Redis/Upstash.
// ---------------------------------------------------------------------------
const attempts = new Map<string, { count: number; firstAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function loginThrottleCheck(key: string): { allowed: boolean; retryInMin: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) return { allowed: true, retryInMin: 0 };
  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryInMin: Math.ceil((WINDOW_MS - (now - entry.firstAt)) / 60000) };
  }
  return { allowed: true, retryInMin: 0 };
}

export function loginThrottleRegisterFailure(key: string): void {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.firstAt > WINDOW_MS) {
    attempts.set(key, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
}

export function loginThrottleReset(key: string): void {
  attempts.delete(key);
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) {
    // Custo constante: evita descobrir e-mails validos pelo tempo de resposta.
    await bcrypt.compare(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
    return null;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}
