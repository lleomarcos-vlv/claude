import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { productSchema } from "@/lib/schemas";
import { uniqueProductSlug } from "@/lib/unique-slug";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get("q")?.trim();
    const products = await prisma.product.findMany({
      where: search ? { name: { contains: search } } : undefined,
      include: { category: true, mainImage: true, promotions: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: 300,
    });
    return jsonOk(products);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, productSchema);
    const slug = await uniqueProductSlug(body.slug || body.name);

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug,
        shortDesc: body.shortDesc,
        description: body.description,
        ingredients: body.ingredients,
        extraInfo: body.extraInfo,
        priceCents: body.priceCents,
        unit: body.unit,
        categoryId: body.categoryId,
        mainImageId: body.mainImageId || body.mediaIds[0] || null,
        available: body.available,
        featured: body.featured,
        isNew: body.isNew,
        artisanal: body.artisanal,
        orderable: body.orderable,
        position: body.position,
        media: {
          create: body.mediaIds.map((mediaId, index) => ({ mediaId, position: index })),
        },
      },
    });

    revalidatePublic();
    return jsonOk(product, 201);
  } catch (error) {
    return handleError(error);
  }
}
