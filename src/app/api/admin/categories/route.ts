import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { categorySchema } from "@/lib/schemas";
import { uniqueCategorySlug } from "@/lib/unique-slug";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { image: true, _count: { select: { products: true } } },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    return jsonOk(categories);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, categorySchema);
    const category = await prisma.category.create({
      data: { ...body, slug: await uniqueCategorySlug(body.slug || body.name) },
    });
    revalidatePublic();
    return jsonOk(category, 201);
  } catch (error) {
    return handleError(error);
  }
}
