import { GalleryManager } from "@/components/admin/gallery-manager";
import { prisma } from "@/lib/db";
import { mediaUrls } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const [gallery, instagram, assets] = await Promise.all([
    prisma.galleryItem.findMany({ include: { media: true }, orderBy: { position: "asc" } }),
    prisma.instagramPost.findMany({ include: { media: true }, orderBy: { position: "asc" } }),
    prisma.mediaAsset.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Conteúdo visual</p>
        <h1 className="mt-1 font-display text-3xl">Galeria e Instagram</h1>
        <p className="mt-1 text-sm text-muted">
          Fotos e vídeos da padaria. O arquivo original fica guardado; o site usa as versões
          otimizadas.
        </p>
      </header>

      <GalleryManager
        gallery={gallery.map((item) => ({
          id: item.id,
          caption: item.caption ?? "",
          active: item.active,
          thumbUrl: mediaUrls(item.media)?.thumb ?? null,
        }))}
        instagram={instagram.map((item) => ({
          id: item.id,
          caption: item.caption ?? "",
          link: item.link ?? "",
          active: item.active,
          thumbUrl: mediaUrls(item.media)?.thumb ?? null,
        }))}
        library={assets.map((asset) => ({
          id: asset.id,
          kind: asset.kind,
          originalName: asset.originalName,
          sizeMb: (asset.size / 1024 / 1024).toFixed(1),
          dimensions: asset.width && asset.height ? `${asset.width}×${asset.height}` : "-",
          thumbUrl: mediaUrls(asset)?.thumb ?? null,
          originalUrl: mediaUrls(asset)?.original ?? null,
        }))}
      />
    </div>
  );
}
