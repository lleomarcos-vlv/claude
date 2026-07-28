import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ServicesGrid } from "@/components/sections/ServicesGrid";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { getServices } from "@/lib/catalog";
import { breadcrumbSchema, pageMetadata, serviceSchema } from "@/lib/seo";
import { money } from "@/lib/format";
import { MIN_VISIT_PRICE, priceBands } from "@/content/services";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Serviços de Jardinagem e Paisagismo",
  description:
    "Corte de grama, paisagismo, poda, limpeza de terreno, adubação, irrigação e mais. Preço por m² transparente, equipe própria e agendamento online.",
  path: "/servicos",
});

export default async function ServicosPage() {
  const services = await getServices();

  return (
    <>
      <PageHeader
        eyebrow="Serviços"
        title="Dez serviços, uma equipe só"
        description="Cobramos por metro quadrado com faixa publicada, sem letra miúda. Você agenda online e acompanha tudo pelo painel."
        breadcrumb={[{ label: "Serviços" }]}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/agendamento" className="btn btn-primary btn-lg">
              Agendar serviço
            </Link>
            <Link href="/simulador" className="btn btn-outline btn-lg">
              Simular valor
            </Link>
          </div>
        }
      />

      {/* Tabela de preços do catálogo */}
      <section className="section-tight">
        <div className="container-page">
          <div className="card overflow-hidden">
            <div className="border-b border-cinza-200 p-6 sm:p-8">
              <h2 className="text-title font-semibold text-verde-800">Nossa tabela por m²</h2>
              <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-cinza-700">
                Serviços avulsos são cobrados por metro quadrado. Avaliamos a metragem para chegar a um preço justo — e o
                valor final nunca sobe sem sua aprovação.
              </p>
            </div>

            <dl className="divide-y divide-cinza-200">
              {(Object.entries(priceBands) as [keyof typeof priceBands, { minPerM2: number; maxPerM2: number }][]).map(
                ([band, range]) => (
                  <div key={band} className="flex flex-col gap-1 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <dt className="font-medium text-verde-800">{band}</dt>
                    <dd className="text-lg font-semibold text-verde-700">
                      {money(range.minPerM2)} <span className="text-sm font-normal text-cinza-600">a</span>{" "}
                      {money(range.maxPerM2)} <span className="text-sm font-normal text-cinza-600">/ m²</span>
                    </dd>
                  </div>
                ),
              )}
            </dl>

            <div className="flex items-start gap-3 border-t border-cinza-200 bg-ambar-50 p-6 sm:p-8">
              <Icon name="info" size={20} className="mt-0.5 shrink-0 text-ambar-600" />
              <p className="text-[0.9375rem] leading-relaxed text-ambar-700">
                <strong className="font-semibold">Atenção:</strong> para manter nosso padrão de maquinário, equipe e
                pontualidade, operamos com valor mínimo de visita de {money(MIN_VISIT_PRICE)} para serviços avulsos. No{" "}
                <Link href="/planos" className="underline decoration-ambar-600/40 underline-offset-2">
                  Clube Verde Fixo
                </Link>{" "}
                esse mínimo não se aplica.
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-cinza-600">
            Paisagismo, poda, plantio e irrigação dependem de projeto, espécies e material — nesses casos trabalhamos com
            orçamento personalizado, e a visita técnica de avaliação é gratuita.
          </p>
        </div>
      </section>

      <ServicesGrid services={services} heading={false} />
      <CtaBanner />

      <JsonLd
        data={[
          ...services.map((s) => serviceSchema(s)),
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Serviços", path: "/servicos" },
          ]),
        ]}
      />
    </>
  );
}
