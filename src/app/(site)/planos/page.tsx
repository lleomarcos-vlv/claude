import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PlansSection } from "@/components/sections/PlansSection";
import { FaqAccordion } from "@/components/sections/Faq";
import { Testimonials } from "@/components/sections/Testimonials";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { getPlans } from "@/lib/catalog";
import { breadcrumbSchema, faqSchema, pageMetadata, planSchema } from "@/lib/seo";
import { faq } from "@/content/faq";
import { testimonials } from "@/content/testimonials";

export const revalidate = 600;

export const metadata: Metadata = pageMetadata({
  title: "Planos de Manutenção de Jardim — Clube Verde Fixo",
  description:
    "Assine um plano mensal de manutenção de jardim a partir de R$ 450. Corte de grama, poda, adubação e controle de pragas com vaga fixa na agenda, sem fidelidade.",
  path: "/planos",
  keywords: ["plano de manutenção de jardim", "assinatura jardinagem", "clube de assinatura jardim", "mensalidade corte de grama"],
});

const planFaq = faq.filter((f) => f.group === "Planos e assinatura");

export default async function PlanosPage() {
  const plans = await getPlans();

  return (
    <>
      <PageHeader
        eyebrow="Clube Verde Fixo"
        title="Assine e esqueça o assunto"
        description="A tranquilidade de ter seu jardim perfeito o mês todo. Nossos pacotes garantem sua vaga na agenda e valor diferenciado em relação aos serviços avulsos."
        breadcrumb={[{ label: "Planos" }]}
        tone="dark"
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/simulador" className="btn btn-accent btn-lg">
              Simular meu jardim
            </Link>
            <Link href="/orcamento" className="btn btn-onDark btn-lg">
              Falar com a equipe
            </Link>
          </div>
        }
      />

      {/* Garantias */}
      <section className="border-b border-cinza-200 bg-white py-10">
        <div className="container-page grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "shield-check", title: "Sem fidelidade", text: "Cancele quando quiser, sem multa." },
            { icon: "calendar", title: "Vaga fixa na agenda", text: "Data reservada nos próximos 12 meses." },
            { icon: "repeat", title: "Frequência por estação", text: "Mais visitas no verão, menos no inverno." },
            { icon: "badge", title: "Equipe própria", text: "CLT, treinada e com EPI completo." },
          ].map((item) => (
            <div key={item.title} className="flex items-start gap-3.5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-verde-100 text-verde-700">
                <Icon name={item.icon} size={21} />
              </span>
              <div>
                <p className="font-semibold text-verde-800">{item.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-cinza-700">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <PlansSection plans={plans} showComparison />

      <Testimonials items={testimonials.filter((t) => t.plan)} limit={3} />

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div>
            <p className="eyebrow">Assinatura sem pegadinha</p>
            <h2 className="mt-3 text-display font-semibold text-verde-800">Dúvidas sobre os planos</h2>
            <p className="mt-4 text-lg leading-relaxed text-cinza-700">
              Sem fidelidade, sem multa e sem cobrança escondida. Aqui está tudo o que costumam perguntar antes de assinar.
            </p>
          </div>
          <FaqAccordion items={planFaq} />
        </div>
      </section>

      <CtaBanner
        title="Comece pelo plano que faz sentido hoje"
        description="Você pode mudar de plano quantas vezes quiser. No upgrade, a diferença é proporcional e vale na hora."
        primary={{ href: "/simulador", label: "Descobrir meu plano" }}
        secondary={{ href: "/agendamento", label: "Agendar avulso primeiro" }}
      />

      <JsonLd
        data={[
          ...plans.map(planSchema),
          faqSchema(planFaq),
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Planos", path: "/planos" },
          ]),
        ]}
      />
    </>
  );
}
