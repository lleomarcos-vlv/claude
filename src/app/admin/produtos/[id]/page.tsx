import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/db";
import { mediaUrls } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { media: { include: { media: true }, orderBy: { position: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/produtos" className="text-sm text-muted hover:text-crust">
            ← Produtos
          </Link>
          <h1 className="mt-2 font-display text-3xl">{product.name}</h1>
        </div>
        <Link href={`/produtos/${product.slug}`} target="_blank" className="btn btn-outline">
          Ver no site ↗
        </Link>
      </header>

      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          shortDesc: product.shortDesc ?? "",
          description: product.description ?? "",
          ingredients: product.ingredients ?? "",
          extraInfo: product.extraInfo ?? "",
          priceCents: product.priceCents,
          unit: product.unit,
          categoryId: product.categoryId,
          available: product.available,
          featured: product.featured,
          isNew: product.isNew,
          artisanal: product.artisanal,
          orderable: product.orderable,
          position: product.position,
          mainImageId: product.mainImageId,
          media: product.media.map((item) => ({
            id: item.media.id,
            kind: item.media.kind === "video" ? ("video" as const) : ("image" as const),
            thumbUrl: mediaUrls(item.media)?.thumb ?? null,
          })),
        }}
      />
    </div>
  );
}
