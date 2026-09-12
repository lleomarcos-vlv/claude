import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { instagramPatchSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await parseBody(request, instagramPatchSchema);
    const item = await prisma.instagramPost.update({ where: { id }, data: body });
    revalidatePublic();
    return jsonOk(item);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.instagramPost.delete({ where: { id } });
    revalidatePublic();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
