import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await parseBody(request, z.object({ read: z.boolean() }));
    const message = await prisma.contactMessage.update({ where: { id }, data: { read: body.read } });
    return jsonOk(message);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.contactMessage.delete({ where: { id } });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
