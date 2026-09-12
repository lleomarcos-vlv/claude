import Link from "next/link";
import type { ProductCard as ProductCardData } from "@/lib/catalog";
import { formatBRL } from "@/lib/money";
import { AddToCart } from "./add-to-cart";
import { MediaImage } from "./media-image";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/produtos/${product.slug}`} className="relative block overflow-hidden">
        <div className="aspect-[4/5] w-full overflow-hidden bg-cream-deep">
          <MediaImage
            media={product.image}
            alt={product.name}
            priority={priority}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            fallbackLabel={product.name}
          />
        </div>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.onSale ? (
            <span className="badge bg-crust text-white">-{product.discountPct}%</span>
          ) : null}
          {product.isNew ? <span className="badge bg-espresso text-cream">Novidade</span> : null}
          {product.artisanal && !product.onSale && !product.isNew ? (
            <span className="badge bg-white/90 text-crust">Artesanal</span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-gold">
          {product.categoryName}
        </p>
        <h3 className="mt-1 font-display text-lg leading-snug">
          <Link href={`/produtos/${product.slug}`} className="transition hover:text-crust">
            {product.name}
          </Link>
        </h3>
        {product.shortDesc ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.shortDesc}</p>
        ) : null}

        <div className="mt-auto pt-4">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-espresso">
              {formatBRL(product.priceCents)}
            </span>
            {product.oldPriceCents ? (
              <span className="text-sm text-muted line-through">
                {formatBRL(product.oldPriceCents)}
              </span>
            ) : null}
            <span className="text-xs text-muted">/ {product.unit}</span>
          </div>

          <div className="mt-3">
            {product.orderable ? (
              <AddToCart
                full
                label="+ Adicionar"
                item={{
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  priceCents: product.priceCents,
                  unit: product.unit,
                  imageUrl: product.image?.thumb ?? null,
                }}
              />
            ) : (
              <Link href="/encomendas" className="btn btn-outline w-full">
                Sob encomenda
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
