import { BannersManager } from "@/components/admin/banners-manager";
import { prisma } from "@/lib/db";
import { mediaUrls } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await prisma.banner.findMany({
    include: { media: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Vitrine</p>
        <h1 className="mt-1 font-display text-3xl">Banners</h1>
        <p className="mt-1 text-sm text-muted">
          O primeiro banner ativo dentro do periodo vira o destaque da home.
        </p>
      </header>

      <BannersManager
        initial={banners.map((banner) => ({
          id: banner.id,
          title: banner.title ?? "",
          subtitle: banner.subtitle ?? "",
          buttonLabel: banner.buttonLabel ?? "",
          buttonLink: banner.buttonLink ?? "",
          placement: banner.placement,
          position: banner.position,
          active: banner.active,
          startsAt: banner.startsAt ? banner.startsAt.toISOString().slice(0, 10) : "",
          endsAt: banner.endsAt ? banner.endsAt.toISOString().slice(0, 10) : "",
          mediaId: banner.mediaId,
          thumbUrl: mediaUrls(banner.media)?.thumb ?? null,
        }))}
      />
    </div>
  );
}
