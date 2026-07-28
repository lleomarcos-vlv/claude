import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServiceCard } from "@/components/sections/ServicesGrid";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { getPlans, getServices } from "@/lib/catalog";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { money } from "@/lib/format";
import { cities, cityBySlug } from "@/content/cities";
import { testimonials } from "@/content/testimonials";
import { site, siteUrl } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return cities.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = cityBySlug(slug);
  if (!city) return {};

  return pageMetadata({
    title: `Jardinagem e Corte de Grama em ${city.city} — ${site.name}`,
    description: `Corte de grama, paisagismo, poda e manutenção de jardins em ${city.city}/${city.state}. Equipe própria, resposta em até ${city.responseTime} e orçamento gratuito.`,
    path: `/atendemos/${city.slug}`,
    keywords: [
      `jardinagem ${city.city}`,
      `corte de grama ${city.city}`,
      `paisagismo ${city.city}`,
      `jardineiro ${city.city}`,
    ],
  });
}

export default async function CidadePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = cityBySlug(slug);
  if (!city) notFound();

  const [services, plans] = await Promise.all([getServices(), getPlans()]);
  const nearby = cities.filter((c) => c.slug !== city.slug).slice(0, 6);
  const localReviews = testimonials.filter((t) => t.city.includes(city.city));

  return (
    <>
      <PageHeader
        eyebrow={`${city.city} · ${city.state}`}
        title={`Jardinagem e corte de grama em ${city.city}`}
        description={`Atendemos ${city.city} com equipe própria, equipamento completo e resposta em até ${city.responseTime}. Orçamento e visita de avaliação gratuitos.`}
        breadcrumb={[{ label: "Atendemos", href: "/atendemos" }, { label: city.city }]}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/agendamento" className="btn btn-primary btn-lg">
              Agendar em {city.city}
            </Link>
            <Link href="/orcamento" className="btn btn-outline btn-lg">
              Pedir orçamento
            </Link>
          </div>
        }
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <div className="prose-vf">
              <h2>Como atendemos {city.city}</h2>
              <p>
                A Verde Fixo mantém equipes fixas circulando pela região de Campinas, e {city.city} está na nossa rota
                {city.hub ? " — é onde fica nossa base operacional" : ` com resposta em até ${city.responseTime}`}. Isso
                significa cronograma cumprido, custo logístico baixo e a possibilidade de encaixar urgências.
              </p>
              <p>
                Trabalhamos com residências, condomínios, empresas, comércios, escolas, hotéis, pousadas, sítios e
                fazendas. Levamos todo o equipamento — cortadores profissionais, roçadeiras, sopradores, motosserras e
                trator cortador para grandes áreas — e retiramos 100% dos resíduos.
              </p>
            </div>

            {city.neighborhoods.length ? (
              <>
                <h2 className="mt-12 text-title font-semibold text-verde-800">Bairros e regiões atendidas</h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {city.neighborhoods.map((n) => (
                    <li key={n} className="chip">
                      <Icon name="map-pin" size={13} className="text-verde-500" />
                      {n}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-cinza-600">
                  Não achou seu bairro? Atendemos toda a cidade — a lista mostra só as regiões com mais clientes.
                </p>
              </>
            ) : null}

            <h2 className="mt-14 text-title font-semibold text-verde-800">Serviços disponíveis em {city.city}</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {services.slice(0, 4).map((s, i) => (
                <Reveal key={s.slug} delay={(i % 2) * 90}>
                  <ServiceCard service={s} />
                </Reveal>
              ))}
            </div>
            <Link href="/servicos" className="btn btn-outline btn-md mt-6">
              Ver todos os serviços
              <Icon name="arrow-right" size={17} />
            </Link>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="card overflow-hidden">
              <div className="bg-verde-800 p-6 text-white">
                <p className="text-xs font-semibold tracking-[0.1em] text-verde-300 uppercase">Atendimento</p>
                <p className="mt-2.5 text-2xl font-semibold">{city.city}</p>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-verde-200">Tempo de resposta</dt>
                    <dd className="font-semibold">até {city.responseTime}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-verde-200">Taxa de deslocamento</dt>
                    <dd className="font-semibold">{city.hub || city.responseTime !== "72h" ? "Isenta" : "Sob consulta"}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-verde-200">Orçamento</dt>
                    <dd className="font-semibold">Gratuito</dd>
                  </div>
                </dl>
              </div>

              <div className="grid gap-2.5 p-6">
                <Link href="/agendamento" className="btn btn-primary btn-lg w-full">
                  Agendar serviço
                </Link>
                <Link href="/simulador" className="btn btn-outline btn-md w-full">
                  Simular valor
                </Link>
              </div>
            </div>

            <div className="card mt-5 border-verde-300 p-6">
              <p className="eyebrow">Clube Verde Fixo</p>
              <h2 className="mt-2.5 text-lg font-semibold text-verde-800">Plano mensal em {city.city}</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-cinza-700">
                Vaga fixa na agenda, frequência ajustada à estação e custo por visita menor.
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-verde-700">
                {money(plans[0].priceMonthly)}
                <span className="text-sm font-normal text-cinza-600">/mês a partir de</span>
              </p>
              <Link href="/planos" className="btn btn-accent btn-md mt-5 w-full">
                Ver planos
              </Link>
            </div>

            <div className="card mt-5 p-6">
              <h2 className="text-sm font-semibold tracking-[0.1em] text-cinza-600 uppercase">Cidades vizinhas</h2>
              <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {nearby.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/atendemos/${c.slug}`} className="text-[0.9375rem] text-cinza-800 hover:text-verde-600">
                      {c.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {localReviews.length ? <Testimonials items={localReviews} limit={3} /> : null}

      <CtaBanner
        title={`Vamos cuidar do seu jardim em ${city.city}`}
        description={`Orçamento gratuito e resposta em até ${city.responseTime}.`}
        primary={{ href: "/orcamento", label: "Pedir orçamento" }}
        secondary={{ href: "/agendamento", label: "Agendar serviço" }}
      />

      <JsonLd
        data={[
          {
            "@type": "Service",
            "@id": `${siteUrl}/atendemos/${city.slug}#servico-local`,
            name: `Jardinagem e paisagismo em ${city.city}`,
            provider: { "@id": `${siteUrl}/#organizacao` },
            areaServed: {
              "@type": "City",
              name: city.city,
              address: { "@type": "PostalAddress", addressLocality: city.city, addressRegion: city.state, addressCountry: "BR" },
            },
            url: `${siteUrl}/atendemos/${city.slug}`,
          },
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Atendemos", path: "/atendemos" },
            { name: city.city, path: `/atendemos/${city.slug}` },
          ]),
        ]}
      />
    </>
  );
}
