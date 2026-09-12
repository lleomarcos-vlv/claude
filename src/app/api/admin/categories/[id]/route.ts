import { prisma } from "@/lib/db";
import { handleError, jsonError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { categoryPatchSchema } from "@/lib/schemas";
import { uniqueCategorySlug } from "@/lib/unique-slug";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const body = await parseBody(request, categoryPatchSchema);
    const current = await prisma.category.findUnique({ where: { id } });
    if (!current) return jsonError("Categoria não encontrada.", 404);

    const slug =
      body.slug || (body.name && body.name !== current.name)
        ? await uniqueCategorySlug(body.slug || body.name || current.name, id)
        : current.slug;

    const category = await prisma.category.update({ where: { id }, data: { ...body, slug } });
    revalidatePublic([`/categoria/${category.slug}`]);
    return jsonOk(category);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const count = await prisma.product.count({ where: { categoryId: id } });
    if (count > 0) {
      return jsonError(
        `Esta categoria tem ${count} produto(s). Mova ou exclua os produtos antes de remover a categoria.`,
        409,
      );
    }
    await prisma.category.delete({ where: { id } });
    revalidatePublic();
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
