import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { serviceBySlug } from "@/content/services";
import { site, whatsappLink } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: "Solicitar Orçamento Gratuito de Jardinagem",
  description:
    "Orçamento gratuito e sem compromisso para corte de grama, paisagismo, poda e limpeza de terreno. Resposta em até 2 horas úteis por WhatsApp.",
  path: "/orcamento",
});

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ servico?: string; area?: string; utm_source?: string; utm_campaign?: string }>;
}) {
  const params = await searchParams;
  const service = params.servico && serviceBySlug(params.servico) ? params.servico : undefined;
  const areaM2 = params.area && Number.isFinite(Number(params.area)) ? Number(params.area) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Orçamento gratuito"
        title="Vamos calcular o seu jardim"
        description="Preencha os dados abaixo e receba o orçamento em até 2 horas úteis. Avaliamos a metragem para chegar a um preço justo."
        breadcrumb={[{ label: "Orçamento" }]}
      />

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div className="card p-6 sm:p-8">
            <QuoteForm
              defaultService={service}
              defaultArea={areaM2}
              utmSource={params.utm_source}
              utmCampaign={params.utm_campaign}
            />
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-verde-800">Como funciona</h2>
              <ol className="mt-5 space-y-5">
                {[
                  { title: "Você envia os dados", text: "Com fotos, se possível — acelera muito a resposta." },
                  { title: "Analisamos em até 2h úteis", text: "Nosso time confere metragem, acesso e volume de resíduo." },
                  { title: "Você recebe o valor fechado", text: "Por WhatsApp e e-mail, sem compromisso e sem custo." },
                  { title: "Só então você decide", text: "Nada é executado antes da sua aprovação." },
                ].map((step, i) => (
                  <li key={step.title} className="flex gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-verde-600 text-sm font-semibold text-white">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-verde-800">{step.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-cinza-700">{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="card mt-5 p-6">
              <h2 className="text-lg font-semibold text-verde-800">Prefere conversar?</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-cinza-700">
                Chame no WhatsApp com uma foto do seu jardim — respondemos na hora no horário comercial.
              </p>
              <a
                href={whatsappLink("Olá! Gostaria de um orçamento. Vou enviar uma foto do meu jardim.")}
                target="_blank"
                rel="noopener"
                className="btn btn-primary btn-md mt-5 w-full"
              >
                <Icon name="whatsapp" size={17} />
                {site.whatsappLabel}
              </a>
              <p className="mt-4 text-sm text-cinza-600">
                Seg a sex, 7h às 19h · sábado até 15h
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-verde-50 p-5">
              <p className="flex items-start gap-2.5 text-sm leading-relaxed text-cinza-800">
                <Icon name="shield-check" size={18} className="mt-0.5 shrink-0 text-verde-600" />
                <span>
                  <strong className="font-semibold text-verde-800">Sem custo e sem compromisso.</strong> Orçamento e visita
                  técnica de avaliação são gratuitos em todas as cidades que atendemos.
                </span>
              </p>
            </div>
          </aside>
        </div>
      </section>

      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Orçamento", path: "/orcamento" },
        ])}
      />
    </>
  );
}
