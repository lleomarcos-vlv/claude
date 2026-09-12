import { prisma } from "@/lib/db";
import { handleError, jsonError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { promotionPatchSchema } from "@/lib/schemas";
import { discountPercent } from "@/lib/money";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await parseBody(request, promotionPatchSchema);
    const current = await prisma.promotion.findUnique({ where: { id } });
    if (!current) return jsonError("Promoção não encontrada.", 404);

    const oldPriceCents = body.oldPriceCents ?? current.oldPriceCents;
    const newPriceCents = body.newPriceCents ?? current.newPriceCents;
    if (newPriceCents >= oldPriceCents) {
      return jsonError("O preço promocional precisa ser menor que o preço normal.", 422);
    }

    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        ...body,
        oldPriceCents,
        newPriceCents,
        discountPct: discountPercent(oldPriceCents, newPriceCents),
      },
    });

    revalidatePublic();
    return jsonOk(promotion);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.promotion.delete({ where: { id } });
    revalidatePublic();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
