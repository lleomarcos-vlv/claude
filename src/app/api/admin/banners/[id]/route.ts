import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { bannerPatchSchema } from "@/lib/schemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await parseBody(request, bannerPatchSchema);
    const banner = await prisma.banner.update({ where: { id }, data: body });
    revalidatePublic();
    return jsonOk(banner);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    revalidatePublic();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
