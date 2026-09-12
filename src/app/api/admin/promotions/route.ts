import { prisma } from "@/lib/db";
import { handleError, jsonError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { promotionSchema } from "@/lib/schemas";
import { discountPercent } from "@/lib/money";

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      include: { product: { select: { name: true, slug: true, priceCents: true } }, media: true },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(promotions);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, promotionSchema);
    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product) return jsonError("Produto não encontrado.", 404);

    const oldPriceCents = body.oldPriceCents ?? product.priceCents;
    if (body.newPriceCents >= oldPriceCents) {
      return jsonError("O preço promocional precisa ser menor que o preço normal.", 422);
    }

    const promotion = await prisma.promotion.create({
      data: {
        title: body.title,
        productId: body.productId,
        oldPriceCents,
        newPriceCents: body.newPriceCents,
        discountPct: discountPercent(oldPriceCents, body.newPriceCents),
        startsAt: body.startsAt,
        endsAt: body.endsAt,
        active: body.active,
        mediaId: body.mediaId,
      },
    });

    revalidatePublic();
    return jsonOk(promotion, 201);
  } catch (error) {
    return handleError(error);
  }
}
