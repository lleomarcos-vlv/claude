import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody } from "@/lib/api";
import { orderStatusSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await parseBody(request, orderStatusSchema);
    const order = await prisma.order.update({ where: { id }, data: { status: body.status } });
    return jsonOk(order);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.order.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
