import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Executa uma leitura no banco com fallback estático.
 *
 * As páginas públicas precisam renderizar mesmo sem banco disponível (build em CI,
 * primeiro deploy, banco em migração). Em vez de quebrar o build, caímos no
 * conteúdo de `src/content`.
 */
export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[db] leitura falhou, usando conteúdo estático:", (error as Error).message);
    }
    return fallback;
  }
}
