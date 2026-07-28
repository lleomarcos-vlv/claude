import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { FaqFiltered } from "@/components/sections/Faq";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { allFaqSchema, breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { faq } from "@/content/faq";
import { site, whatsappLink } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Perguntas Frequentes",
  description:
    "Tudo sobre serviços, planos, agendamento, preços e garantias da Verde Fixo. Preço por m², sem fidelidade e com garantia de satisfação.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Perguntas frequentes"
        title="Tudo o que você quer saber antes de contratar"
        description={`${faq.length} perguntas respondidas sem rodeio — preço, prazo, garantia, cancelamento e como funciona no dia do serviço.`}
        breadcrumb={[{ label: "FAQ" }]}
      />

      <section className="section">
        <div className="container-page">
          <FaqFiltered items={faq} />

          <div className="card mt-12 flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 className="text-lg font-semibold text-verde-800">Não achou sua pergunta?</h2>
              <p className="mt-1.5 text-[0.9375rem] text-cinza-700">
                Chame no WhatsApp {site.whatsappLabel} — respondemos rápido no horário comercial.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
              <a href={whatsappLink()} target="_blank" rel="noopener" className="btn btn-primary btn-md">
                <Icon name="whatsapp" size={17} />
                WhatsApp
              </a>
              <Link href="/contato" className="btn btn-outline btn-md">
                Formulário de contato
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaBanner />

      <JsonLd
        data={[
          allFaqSchema(),
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />
    </>
  );
}
