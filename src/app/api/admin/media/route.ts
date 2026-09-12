import { prisma } from "@/lib/db";
import { handleError, jsonOk } from "@/lib/api";
import { mediaUrls } from "@/lib/media";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const folder = url.searchParams.get("folder");
    const kind = url.searchParams.get("kind");
    const take = Math.min(Number(url.searchParams.get("take") ?? 120), 300);

    const assets = await prisma.mediaAsset.findMany({
      where: {
        ...(folder && folder !== "todas" ? { folder } : {}),
        ...(kind && kind !== "todos" ? { kind } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
    });

    return jsonOk(
      assets.map((asset) => ({
        id: asset.id,
        kind: asset.kind,
        folder: asset.folder,
        originalName: asset.originalName,
        size: asset.size,
        width: asset.width,
        height: asset.height,
        alt: asset.alt,
        createdAt: asset.createdAt,
        urls: mediaUrls(asset),
      })),
    );
  } catch (error) {
    return handleError(error);
  }
}
