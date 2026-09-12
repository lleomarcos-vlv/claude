import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { deleteMedia } from "@/lib/media";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  alt: z.string().trim().max(200).optional().nullable(),
  folder: z.string().trim().max(40).optional(),
  posterPath: z.string().trim().max(300).optional().nullable(),
});

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await parseBody(request, patchSchema);
    const asset = await prisma.mediaAsset.update({ where: { id }, data: body });
    return jsonOk(asset);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await deleteMedia(id);
    revalidatePublic();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
