import { prisma } from "@/lib/db";

/**
 * Protocolos legíveis por humanos, no formato PREFIXO-ANO-SEQUENCIAL.
 * O sequencial é derivado da contagem do ano corrente; em caso de colisão
 * (concorrência), tentamos novamente com sufixo aleatório.
 */

const prefixes = { booking: "VF", quote: "ORC", invoice: "FAT" } as const;

export async function nextProtocol(kind: keyof typeof prefixes) {
  const year = new Date().getFullYear();
  const prefix = `${prefixes[kind]}-${year}-`;

  let count = 0;
  try {
    count =
      kind === "booking"
        ? await prisma.booking.count({ where: { protocol: { startsWith: prefix } } })
        : kind === "quote"
          ? await prisma.quote.count({ where: { protocol: { startsWith: prefix } } })
          : await prisma.invoice.count({ where: { number: { startsWith: prefix } } });
  } catch {
    count = 0;
  }

  const candidate = `${prefix}${String(count + 1).padStart(4, "0")}`;
  const taken = await isTaken(kind, candidate);
  if (!taken) return candidate;

  // Fallback determinístico-o-suficiente para não bloquear a conversão.
  return `${prefix}${String(count + 1).padStart(4, "0")}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
}

async function isTaken(kind: keyof typeof prefixes, value: string) {
  try {
    if (kind === "booking") return Boolean(await prisma.booking.findUnique({ where: { protocol: value }, select: { id: true } }));
    if (kind === "quote") return Boolean(await prisma.quote.findUnique({ where: { protocol: value }, select: { id: true } }));
    return Boolean(await prisma.invoice.findUnique({ where: { number: value }, select: { id: true } }));
  } catch {
    return false;
  }
}
