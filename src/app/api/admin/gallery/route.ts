import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { gallerySchema } from "@/lib/schemas";

export async function GET() {
  try {
    const items = await prisma.galleryItem.findMany({
      include: { media: true },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    });
    return jsonOk(items);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, gallerySchema);
    const item = await prisma.galleryItem.create({ data: body });
    revalidatePublic();
    return jsonOk(item, 201);
  } catch (error) {
    return handleError(error);
  }
}
