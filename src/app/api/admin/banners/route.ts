import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody, revalidatePublic } from "@/lib/api";
import { bannerSchema } from "@/lib/schemas";

export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      include: { media: true },
      orderBy: [{ placement: "asc" }, { position: "asc" }],
    });
    return jsonOk(banners);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, bannerSchema);
    const banner = await prisma.banner.create({ data: body });
    revalidatePublic();
    return jsonOk(banner, 201);
  } catch (error) {
    return handleError(error);
  }
}
