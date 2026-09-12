import { formatBRL } from "./money";

export type OrderLine = { name: string; quantity: number; unitPriceCents: number };

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normaliza para o formato aceito pelo wa.me (55 + DDD + número). */
export function normalizeWhatsApp(value: string): string {
  const digits = onlyDigits(value);
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${normalizeWhatsApp(phone)}?text=${encodeURIComponent(message)}`;
}

export function buildOrderMessage(params: {
  brandName: string;
  code?: string;
  items: OrderLine[];
  totalCents: number;
  customerName: string;
  customerPhone: string;
  fulfillment: "retirada" | "entrega";
  address?: string | null;
  notes?: string | null;
}): string {
  const lines: string[] = [];
  lines.push(`Ola, ${params.brandName}!`);
  lines.push("Gostaria de fazer o seguinte pedido:");
  lines.push("");
  for (const item of params.items) {
    lines.push(
      `• ${item.name} - ${item.quantity}x (${formatBRL(item.unitPriceCents * item.quantity)})`,
    );
  }
  lines.push("");
  lines.push(`Total: ${formatBRL(params.totalCents)}`);
  lines.push("");
  lines.push(`Nome: ${params.customerName}`);
  lines.push(`Telefone: ${params.customerPhone}`);
  lines.push(
    `Forma de recebimento: ${params.fulfillment === "entrega" ? "Entrega" : "Retirada na loja"}`,
  );
  if (params.fulfillment === "entrega" && params.address) {
    lines.push(`Endereço: ${params.address}`);
  }
  lines.push(`Observações: ${params.notes?.trim() || "-"}`);
  if (params.code) {
    lines.push("");
    lines.push(`Pedido nº ${params.code}`);
  }
  return lines.join("\n");
}

export function buildCustomOrderMessage(params: {
  brandName: string;
  code: string;
  name: string;
  phone: string;
  desiredDate?: string | null;
  desiredTime?: string | null;
  peopleCount?: number | null;
  categoryName?: string | null;
  productName?: string | null;
  description: string;
  notes?: string | null;
}): string {
  const lines = [
    `Ola, ${params.brandName}!`,
    "Gostaria de solicitar um orçamento de encomenda:",
    "",
    `Tipo: ${params.categoryName || "-"}`,
    `Produto: ${params.productName || "-"}`,
    `Data desejada: ${params.desiredDate || "-"}`,
    `Horário: ${params.desiredTime || "-"}`,
    `Quantidade de pessoas: ${params.peopleCount ?? "-"}`,
    "",
    `Descrição: ${params.description}`,
    `Observações: ${params.notes?.trim() || "-"}`,
    "",
    `Nome: ${params.name}`,
    `Telefone: ${params.phone}`,
    `Protocolo: ${params.code}`,
  ];
  return lines.join("\n");
}
