import Link from "next/link";
import { MediaImage } from "@/components/media-image";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import {
  listCategories,
  listGallery,
  listHeroBanners,
  listInstagramPosts,
  listProducts,
} from "@/lib/catalog";
import { fullAddress, getSettings, parseOpeningHours } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 60;

export default async function HomePage() {
  const [settings, banners, categories, featured, novelties, offers, artisanal, gallery, instagram] =
    await Promise.all([
      getSettings(),
      listHeroBanners(),
      listCategories({ onlyHome: true }),
      listProducts({ featured: true, take: 8 }),
      listProducts({ isNew: true, take: 8 }),
      listProducts({ onSaleOnly: true, take: 8 }),
      listProducts({ artisanal: true, take: 6 }),
      listGallery(8),
      listInstagramPosts(6),
    ]);

  const hero = banners[0];
  const hours = parseOpeningHours(settings.openingHours);

  return (
    <>
      {/* ----------------------------- HERO ----------------------------- */}
      <section className="relative -mt-[4.5rem] flex min-h-[88svh] items-end overflow-hidden bg-espresso">
        <div className="absolute inset-0">
          {hero?.media ? (
            <MediaImage
              media={hero.media}
              quality="hero"
              priority
              sizes="100vw"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_25%_20%,#6a3d18,transparent_55%),radial-gradient(circle_at_75%_70%,#8c4a22,transparent_50%),linear-gradient(160deg,#241609,#3c2410)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/70 to-espresso/25" />
        </div>

        <div className="container-vr relative z-10 pb-16 pt-32 sm:pb-24">
          <div className="max-w-2xl fade-up">
            <p className="kicker text-gold-soft">{hero?.subtitle ?? "Desde o primeiro forno do dia"}</p>
            <h1 className="mt-4 whitespace-pre-line text-balance font-display text-4xl leading-[1.08] text-cream sm:text-6xl">
              {hero?.title ?? settings.heroTitle}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-cream/80 sm:text-lg">
              {settings.heroSubtitle}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={hero?.buttonLink ?? "/produtos"} className="btn btn-gold">
                {hero?.buttonLabel ?? settings.heroButtonLabel}
              </Link>
              <Link href="/carrinho" className="btn btn-ghost-light">
                Faça seu pedido
              </Link>
              <a
                href={whatsappLink(settings.whatsapp, `Ola, ${settings.brandName}!`)}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-ghost-light"
              >
                Fale conosco
              </a>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-4 border-t border-cream/20 pt-6 text-cream/75">
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-gold-soft">Fornada</dt>
                <dd className="mt-1 font-display text-lg text-cream">De hora em hora</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-gold-soft">Aberto</dt>
                <dd className="mt-1 font-display text-lg text-cream">{hours[0]?.hours ?? "05h30"}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] uppercase tracking-[0.18em] text-gold-soft">Pedido</dt>
                <dd className="mt-1 font-display text-lg text-cream">Pelo WhatsApp</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* -------------------------- CATEGORIAS -------------------------- */}
      <section className="container-vr py-16 sm:py-20">
        <SectionHeading
          kicker="O que você procura"
          title="Nossas categorias"
          description="Do pão da manhã ao bolo da festa, tudo sai da mesma cozinha."
          action={{ href: "/produtos", label: "Ver catalogo completo" }}
        />

        <div className="scroll-x sm:grid sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/categoria/${category.slug}`}
              className="group w-[7.5rem] overflow-hidden rounded-2xl border border-line bg-white p-4 text-center transition hover:-translate-y-1 hover:border-gold sm:w-auto"
            >
              <span className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-cream-deep text-2xl">
                {category.image ? (
                  <MediaImage
                    media={category.image}
                    alt={category.name}
                    sizes="56px"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (category.emoji ?? "🥐")
                )}
              </span>
              <p className="mt-3 font-display text-sm leading-tight text-espresso">{category.name}</p>
              <p className="mt-0.5 text-[0.7rem] text-muted">{category.productCount} itens</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------- MAIS PEDIDOS ------------------------- */}
      {featured.length > 0 ? (
        <section className="bg-cream-deep/60 py-16 sm:py-20">
          <div className="container-vr">
            <SectionHeading
              kicker="Os campeoes do balcão"
              title="Mais pedidos"
              description="O que os clientes da Villa Reis levam todo dia."
              action={{ href: "/produtos", label: "Ver todos" }}
            />
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {featured.slice(0, 8).map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 2} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* --------------------------- OFERTAS ---------------------------- */}
      {offers.length > 0 ? (
        <section className="container-vr py-16 sm:py-20">
          <SectionHeading
            kicker="Por tempo limitado"
            title="Ofertas da semana"
            action={{ href: "/ofertas", label: "Ver todas as ofertas" }}
          />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {offers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {/* -------------------------- NOVIDADES --------------------------- */}
      {novelties.length > 0 ? (
        <section className="container-vr pb-16 sm:pb-20">
          <SectionHeading kicker="Acabou de chegar" title="Novidades" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {novelties.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ---------------------- FEITO NA VILLA REIS --------------------- */}
      <section className="bg-espresso py-16 text-cream sm:py-24">
        <div className="container-vr grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading
              kicker="Nossa cozinha"
              title={settings.aboutTitle}
              description={settings.aboutText}
              tone="light"
            />
            <Link href="/produtos" className="btn btn-gold">
              Conheça nossos produtos
            </Link>
          </div>

          {artisanal.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {artisanal.slice(0, 6).map((product) => (
                <Link
                  key={product.id}
                  href={`/produtos/${product.slug}`}
                  className="group overflow-hidden rounded-2xl border border-cream/15"
                >
                  <div className="aspect-square overflow-hidden bg-espresso/40">
                    <MediaImage
                      media={product.image}
                      alt={product.name}
                      sizes="(max-width: 640px) 45vw, 20vw"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      fallbackLabel={product.name}
                    />
                  </div>
                  <p className="px-3 py-2 text-xs text-cream/80">{product.name}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* --------------------------- CAFETERIA -------------------------- */}
      <section className="container-vr py-16 sm:py-20">
        <div className="card overflow-hidden lg:grid lg:grid-cols-2">
          <div className="aspect-[4/3] bg-cream-deep lg:aspect-auto lg:h-full">
            {gallery[0]?.media ? (
              <MediaImage
                media={gallery[0].media}
                quality="detail"
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full w-full object-cover"
                alt="Cafeteria da Villa Reis"
              />
            ) : (
              <div className="h-full w-full bg-[linear-gradient(140deg,#8c4a22,#241609)]" />
            )}
          </div>
          <div className="p-8 sm:p-12">
            <p className="kicker">Experiencia Villa Reis</p>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
              Um café que vale a caminhada
            </h2>
            <div className="rule-gold mt-4" />
            <p className="mt-4 leading-relaxed text-muted">
              Espresso, coado da casa, cappuccino cremoso e chocolate quente. Combine com um
              croissant que acabou de sair do forno e o dia começa diferente.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/café" className="btn btn-primary">
                Ver a cafeteria
              </Link>
              <Link href="/encomendas" className="btn btn-outline">
                Encomendar café da manhã
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------- INSTAGRAM --------------------------- */}
      {instagram.length > 0 || gallery.length > 0 ? (
        <section className="container-vr pb-16 sm:pb-20">
          <SectionHeading
            kicker={settings.instagramHandle}
            title={settings.instagramSectionTitle}
            description={settings.instagramSectionText}
            center
          />
          <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:grid-cols-6">
            {(instagram.length > 0 ? instagram : gallery).slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={("link" in item && item.link) || settings.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="group aspect-square overflow-hidden rounded-xl bg-cream-deep"
              >
                <MediaImage
                  media={item.media}
                  sizes="(max-width: 640px) 33vw, 16vw"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                  alt={settings.brandName}
                />
              </a>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href={settings.instagramUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="btn btn-outline"
            >
              Instagram
            </a>
          </div>
        </section>
      ) : null}

      {/* -------------------------- LOCALIZACAO ------------------------- */}
      <section className="container-vr pb-8">
        <div className="card flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div>
            <p className="kicker">Onde estamos</p>
            <h2 className="mt-2 font-display text-2xl">{fullAddress(settings)}</h2>
            <p className="mt-2 text-sm text-muted">
              {hours.map((hour) => `${hour.label}: ${hour.hours}`).join("  •  ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer noopener" className="btn btn-primary">
              Como chegar
            </a>
            <Link href="/contato" className="btn btn-outline">
              Ver contato
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
