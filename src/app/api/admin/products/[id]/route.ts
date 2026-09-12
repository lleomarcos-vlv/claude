import { prisma } from "@/lib/db";
import { handleError, jsonError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { productPatchSchema } from "@/lib/schemas";
import { uniqueProductSlug } from "@/lib/unique-slug";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { media: { include: { media: true }, orderBy: { position: "asc" } }, promotions: true },
    });
    if (!product) return jsonError("Produto não encontrado.", 404);
    return jsonOk(product);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await parseBody(request, productPatchSchema);
    const current = await prisma.product.findUnique({ where: { id } });
    if (!current) return jsonError("Produto não encontrado.", 404);

    const slug =
      body.slug || (body.name && body.name !== current.name)
        ? await uniqueProductSlug(body.slug || body.name || current.name, id)
        : current.slug;

    const { mediaIds, ...rest } = body;

    const product = await prisma.$transaction(async (tx) => {
      if (mediaIds) {
        await tx.productMedia.deleteMany({ where: { productId: id } });
        for (const [index, mediaId] of mediaIds.entries()) {
          await tx.productMedia.create({ data: { productId: id, mediaId, position: index } });
        }
      }
      return tx.product.update({
        where: { id },
        data: {
          ...rest,
          slug,
          mainImageId:
            rest.mainImageId !== undefined
              ? rest.mainImageId || mediaIds?.[0] || null
              : undefined,
        },
      });
    });

    revalidatePublic([`/produtos/${product.slug}`]);
    return jsonOk(product);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    revalidatePublic();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
