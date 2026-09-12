import type { Metadata } from "next";
import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { listGallery, listProducts } from "@/lib/catalog";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Cafeteria",
  description:
    "Espresso, café coado, cappuccino, chocolate quente e combos de café da manhã na Padaria Villa Reis.",
};

const COFFEE_SLUGS = ["cafe", "cappuccino", "bebidas", "lanches"];

export default async function CoffeePage() {
  const groups = await Promise.all(
    COFFEE_SLUGS.map(async (slug) => ({ slug, products: await listProducts({ categorySlug: slug }) })),
  );
  const gallery = await listGallery(3);
  const active = groups.filter((group) => group.products.length > 0);

  return (
    <div>
      <section className="relative overflow-hidden bg-espresso py-20 text-cream sm:py-28">
        <div className="absolute inset-0 opacity-45">
          {gallery[0]?.media ? (
            <MediaImage
              media={gallery[0].media}
              quality="hero"
              sizes="100vw"
              className="h-full w-full object-cover"
              alt="Cafeteria Villa Reis"
            />
          ) : null}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/80 to-espresso/50" />
        <div className="container-vr relative">
          <p className="kicker text-gold-soft">Experiencia Villa Reis</p>
          <h1 className="mt-3 max-w-2xl text-balance font-display text-4xl leading-tight sm:text-5xl text-cream">
            O café que abre o dia do bairro
          </h1>
          <p className="mt-5 max-w-xl text-cream/80">
            Grãos seletos, extracao no ponto e leite vaporizado na hora. Peça no balcão ou monte seu
            combo de café da manhã para levar.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/carrinho" className="btn btn-gold">
              Montar meu pedido
            </Link>
            <Link href="/encomendas" className="btn btn-ghost-light">
              Café da manhã para grupos
            </Link>
          </div>
        </div>
      </section>

      <div className="container-vr py-16">
        {active.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="font-display text-2xl">Cardapio da cafeteria em atualizacao</p>
            <p className="mt-2 text-muted">
              Cadastre produtos nas categorias Café, Cappuccino, Bebidas ou Lanches para que
              apareçam aqui.
            </p>
          </div>
        ) : (
          active.map((group) => (
            <section key={group.slug} className="mb-16 last:mb-0">
              <SectionHeading
                kicker="Cardapio"
                title={group.products[0]?.categoryName ?? group.slug}
                action={{ href: `/categoria/${group.slug}`, label: "Ver categoria" }}
              />
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {group.products.slice(0, 8).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
