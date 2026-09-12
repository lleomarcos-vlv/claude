import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleError, jsonError, jsonOk, parseBody } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { resolvePrice } from "@/lib/pricing";
import { buildOrderMessage, whatsappLink } from "@/lib/whatsapp";

const schema = z.object({
  customerName: z.string().trim().min(2, "informe seu nome"),
  customerPhone: z.string().trim().min(8, "informe um telefone valido"),
  fulfillment: z.enum(["retirada", "entrega"]),
  address: z.string().trim().max(300).optional().nullable(),
  notes: z.string().trim().max(600).optional().nullable(),
  items: z
    .array(z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(99) }))
    .min(1, "o carrinho está vazio"),
});

/**
 * Registra o pedido no banco (para o painel) e devolve o link do WhatsApp
 * já com a mensagem montada. Os preços são SEMPRE recalculados no servidor:
 * o valor enviado pelo navegador nunca e aceito.
 */
export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    const settings = await getSettings();

    if (settings.orderingEnabled !== "true") {
      return jsonError("Os pedidos online estão temporariamente desativados.", 503);
    }
    if (body.fulfillment === "entrega" && !body.address) {
      return jsonError("Informe o endereço para entrega.", 422);
    }

    const products = await prisma.product.findMany({
      where: { id: { in: body.items.map((item) => item.productId) }, available: true },
      include: { promotions: true },
    });

    if (products.length === 0) return jsonError("Os produtos do carrinho não estão disponíveis.", 409);

    const items = body.items
      .map((item) => {
        const product = products.find((candidate) => candidate.id === item.productId);
        if (!product || !product.orderable) return null;
        const price = resolvePrice(product);
        return {
          productId: product.id,
          productName: product.name,
          unitPriceCents: price.priceCents,
          quantity: item.quantity,
          subtotalCents: price.priceCents * item.quantity,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    if (items.length === 0) return jsonError("Nenhum item valido no pedido.", 409);

    const totalCents = items.reduce((sum, item) => sum + item.subtotalCents, 0);
    const minOrder = Number(settings.minOrderCents) || 0;
    if (minOrder > 0 && totalCents < minOrder) {
      return jsonError(`O pedido mínimo é de R$ ${(minOrder / 100).toFixed(2)}.`, 422);
    }

    const count = await prisma.order.count();
    const code = `VR${String(count + 1).padStart(4, "0")}`;

    const order = await prisma.order.create({
      data: {
        code,
        customerName: body.customerName,
        customerPhone: body.customerPhone,
        notes: body.notes ?? null,
        fulfillment: body.fulfillment,
        address: body.address ?? null,
        totalCents,
        items: { create: items },
      },
      include: { items: true },
    });

    const message = buildOrderMessage({
      brandName: settings.brandName,
      code: order.code,
      items: order.items.map((item) => ({
        name: item.productName,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
      })),
      totalCents: order.totalCents,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      fulfillment: order.fulfillment as "retirada" | "entrega",
      address: order.address,
      notes: order.notes,
    });

    return jsonOk({
      code: order.code,
      totalCents: order.totalCents,
      whatsappUrl: whatsappLink(settings.whatsapp, message),
      message,
    });
  } catch (error) {
    return handleError(error);
  }
}
