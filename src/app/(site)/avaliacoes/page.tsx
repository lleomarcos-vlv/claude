import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { TestimonialCard } from "@/components/sections/Testimonials";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { StarRating } from "@/components/ui/StarRating";
import { Reveal } from "@/components/ui/Reveal";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { getPublishedReviews } from "@/lib/catalog";
import { breadcrumbSchema, pageMetadata, reviewsSchema } from "@/lib/seo";
import { ratingDistribution, testimonials } from "@/content/testimonials";
import { site } from "@/lib/site";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Avaliações de Clientes",
  description: `Média de ${site.stats.rating} em ${site.stats.reviews} avaliações. Depoimentos de residências, condomínios, escolas, hotéis e sítios atendidos pela Verde Fixo.`,
  path: "/avaliacoes",
});

export default async function AvaliacoesPage() {
  // Depoimentos publicados a partir das pesquisas de satisfação + curadoria do conteúdo.
  const fromSurveys = await getPublishedReviews(6);
  const all = [
    ...testimonials,
    ...fromSurveys.map((r) => ({ ...r, plan: undefined, since: undefined }) as (typeof testimonials)[number]),
  ];

  return (
    <>
      <PageHeader
        eyebrow="Avaliações"
        title="O que nossos clientes dizem"
        description="Depoimentos reais de quem contrata a Verde Fixo — de quintais de 90 m² a condomínios de 4.000 m²."
        breadcrumb={[{ label: "Avaliações" }]}
      />

      <section className="section">
        <div className="container-page">
          {/* Resumo */}
          <div className="card grid gap-8 p-6 sm:grid-cols-[auto_1fr] sm:gap-14 sm:p-8">
            <div className="text-center sm:text-left">
              <p className="text-6xl font-semibold tracking-[-0.03em] text-verde-800">
                {site.stats.rating.toString().replace(".", ",")}
              </p>
              <StarRating value={site.stats.rating} size={19} className="mt-2" />
              <p className="mt-2 text-sm text-cinza-600">{site.stats.reviews} avaliações</p>
              <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-verde-700 sm:justify-start">
                <Icon name="shield-check" size={16} />
                Garantia de satisfação
              </p>
            </div>

            <div className="space-y-2 sm:border-l sm:border-cinza-200 sm:pl-14">
              {ratingDistribution.map((row) => (
                <div key={row.stars} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-sm text-cinza-700">{row.stars} ★</span>
                  <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-cinza-200">
                    <span className="block h-full rounded-full bg-verde-500" style={{ width: `${row.percent}%` }} />
                  </span>
                  <span className="w-10 shrink-0 text-right text-sm text-cinza-600">{row.percent}%</span>
                </div>
              ))}
              <p className="pt-3 text-sm leading-relaxed text-cinza-700">
                As avaliações vêm da pesquisa de satisfação enviada automaticamente depois de cada serviço concluído.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {all.map((item, i) => (
              <Reveal key={`${item.name}-${i}`} delay={(i % 3) * 90}>
                <TestimonialCard item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title="Quer esse resultado no seu jardim?"
        description="Comece com um orçamento gratuito ou assine um plano e esqueça o assunto."
        primary={{ href: "/orcamento", label: "Pedir orçamento" }}
        secondary={{ href: "/planos", label: "Ver planos" }}
      />

      <JsonLd
        data={[
          reviewsSchema(all.map((t) => ({ name: t.name, rating: t.rating, text: t.text, city: t.city }))),
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Avaliações", path: "/avaliacoes" },
          ]),
        ]}
      />
    </>
  );
}
