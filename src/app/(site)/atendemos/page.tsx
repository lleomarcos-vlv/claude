import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { CoverageMap } from "@/components/sections/CoverageMap";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { getServiceAreas } from "@/lib/catalog";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { cities } from "@/content/cities";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Onde Atendemos — Campinas e Região",
  description: `Verde Fixo atende ${cities.length} cidades na região de Campinas: ${cities
    .slice(0, 6)
    .map((c) => c.city)
    .join(", ")} e mais. Orçamento gratuito em toda a área de cobertura.`,
  path: "/atendemos",
});

export default async function AtendemosPage() {
  const areas = await getServiceAreas();

  return (
    <>
      <PageHeader
        eyebrow="Atendemos"
        title={`${areas.length} cidades na região de Campinas`}
        description="Equipe própria circulando pela região metropolitana. Atendimento em até 24h nas cidades próximas à base e até 72h nas demais."
        breadcrumb={[{ label: "Atendemos" }]}
      />

      <section className="section">
        <div className="container-page">
          <CoverageMap cities={areas} />
        </div>
      </section>

      <section className="section-tight bg-cinza-50">
        <div className="container-page">
          <h2 className="text-title font-semibold text-verde-800">Todas as cidades atendidas</h2>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/atendemos/${city.slug}`}
                  className="card card-hover flex items-center gap-3.5 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-verde-100 text-verde-700">
                    <Icon name="map-pin" size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-verde-800">
                      {city.city}
                      {city.hub ? <span className="ml-2 badge-accent align-middle">Base</span> : null}
                    </span>
                    <span className="block text-sm text-cinza-600">Resposta em até {city.responseTime}</span>
                  </span>
                  <Icon name="chevron-right" size={17} className="shrink-0 text-cinza-400" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBanner
        title="Sua cidade está na lista?"
        description="Orçamento e visita de avaliação são gratuitos em toda a área de cobertura."
        primary={{ href: "/orcamento", label: "Pedir orçamento" }}
        secondary={{ href: "/agendamento", label: "Agendar serviço" }}
      />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Atendemos", path: "/atendemos" },
        ])}
      />
    </>
  );
}
