/** Todo valor monetario trafega em CENTAVOS (inteiro) para evitar erro de ponto flutuante. */

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Converte "12,90", "R$ 12,90" ou "12.90" para 1290. */
export function parseBRLToCents(input: string | number): number {
  if (typeof input === "number") return Math.round(input * 100);
  const cleaned = String(input)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function discountPercent(oldCents: number, newCents: number): number {
  if (oldCents <= 0 || newCents >= oldCents) return 0;
  return Math.round(((oldCents - newCents) / oldCents) * 100);
}
