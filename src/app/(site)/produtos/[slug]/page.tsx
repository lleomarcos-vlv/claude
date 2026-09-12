import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { MediaImage } from "@/components/media-image";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { getProductBySlug, listProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { formatBRL } from "@/lib/money";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 60;

export async function generateStaticParams() {
  const products = await prisma.product
    .findMany({ where: { available: true }, select: { slug: true }, take: 200 })
    .catch(() => []);
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProductBySlug(slug);
  if (!data) return { title: "Produto" };
  return {
    title: data.card.name,
    description: data.card.shortDesc ?? data.description ?? undefined,
    alternates: { canonical: `/produtos/${slug}` },
    openGraph: {
      title: data.card.name,
      description: data.card.shortDesc ?? undefined,
      images: data.images[0] ? [{ url: `${env.siteUrl}${data.images[0].desktop}` }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [data, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!data) notFound();

  const { card } = data;
  const related = (await listProducts({ categorySlug: card.categorySlug, take: 5 })).filter(
    (item) => item.id !== card.id,
  );

  // Contador de visualizações do painel (não bloqueia a renderizacao).
  prisma.product
    .update({ where: { id: card.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: card.name,
    description: card.shortDesc ?? data.description ?? undefined,
    image: data.images.map((image) => `${env.siteUrl}${image.desktop}`),
    brand: { "@type": "Brand", name: settings.brandName },
    offers: {
      "@type": "Offer",
      price: (card.priceCents / 100).toFixed(2),
      priceCurrency: "BRL",
      availability: card.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${env.siteUrl}/produtos/${card.slug}`,
    },
  };

  return (
    <div className="container-vr py-8 sm:py-14">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/produtos" className="hover:text-crust">
          Produtos
        </Link>
        <span className="px-2">/</span>
        <Link href={`/categoria/${card.categorySlug}`} className="hover:text-crust">
          {card.categoryName}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={data.images} videos={data.videos} name={card.name} />

        <div>
          <p className="kicker">{card.categoryName}</p>
          <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">{card.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {card.onSale ? (
              <span className="badge bg-crust text-white">Oferta -{card.discountPct}%</span>
            ) : null}
            {card.isNew ? <span className="badge bg-espresso text-cream">Novidade</span> : null}
            {card.artisanal ? (
              <span className="badge bg-sand text-crust">Feito na Villa Reis</span>
            ) : null}
            {card.featured ? <span className="badge bg-gold/20 text-crust">Mais pedido</span> : null}
          </div>

          {card.shortDesc ? (
            <p className="mt-4 text-lg leading-relaxed text-muted">{card.shortDesc}</p>
          ) : null}

          <div className="mt-6 flex items-baseline gap-3">
            <span className="font-display text-4xl font-semibold text-espresso">
              {formatBRL(card.priceCents)}
            </span>
            {card.oldPriceCents ? (
              <span className="text-lg text-muted line-through">{formatBRL(card.oldPriceCents)}</span>
            ) : null}
            <span className="text-sm text-muted">por {card.unit}</span>
          </div>

          <div className="mt-8">
            {card.orderable ? (
              <AddToCart
                withQuantity
                full
                label="Adicionar ao pedido"
                item={{
                  productId: card.id,
                  name: card.name,
                  slug: card.slug,
                  priceCents: card.priceCents,
                  unit: card.unit,
                  imageUrl: card.image?.thumb ?? null,
                }}
              />
            ) : (
              <Link href="/encomendas" className="btn btn-gold w-full">
                Solicitar orçamento
              </Link>
            )}
            <a
              href={whatsappLink(
                settings.whatsapp,
                `Ola, ${settings.brandName}! Tenho interesse em: ${card.name}`,
              )}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-whats mt-3 w-full"
            >
              Tirar dúvida no WhatsApp
            </a>
          </div>

          {data.description ? (
            <section className="prose-vr mt-10 border-t border-line pt-8">
              <h2 className="font-display text-xl">Sobre o produto</h2>
              <p className="mt-3 whitespace-pre-line text-muted">{data.description}</p>
            </section>
          ) : null}

          {data.ingredients ? (
            <section className="mt-8 border-t border-line pt-8">
              <h2 className="font-display text-xl">Ingredientes</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{data.ingredients}</p>
            </section>
          ) : null}

          {data.extraInfo ? (
            <section className="mt-8 border-t border-line pt-8">
              <h2 className="font-display text-xl">Informações adicionais</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{data.extraInfo}</p>
            </section>
          ) : null}
        </div>
      </div>

      {data.videos.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-2xl">Veja em movimento</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {data.videos.map((video) => (
              <MediaImage
                key={video.original}
                media={video}
                className="w-full rounded-2xl border border-line bg-black"
              />
            ))}
          </div>
        </section>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-2xl">Combina bem com</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
    </div>
  );
}
