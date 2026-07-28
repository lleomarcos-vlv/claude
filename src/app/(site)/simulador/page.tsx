import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Simulator } from "@/components/sections/Simulator";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { avulsoVsAssinatura } from "@/content/plans";

export const metadata: Metadata = pageMetadata({
  title: "Simulador de Valores — Quanto Custa Cuidar do Seu Jardim",
  description:
    "Informe a metragem, o serviço e a frequência e veja na hora a faixa de preço e qual plano do Clube Verde Fixo sai mais vantajoso.",
  path: "/simulador",
  keywords: ["simulador corte de grama", "quanto custa jardinagem", "calculadora jardim"],
});

export default function SimuladorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Simulador"
        title="Quanto custa cuidar do seu jardim?"
        description="Três informações e você tem a faixa de valor na hora, sem esperar orçamento e sem falar com ninguém."
        breadcrumb={[{ label: "Simulador" }]}
      />

      <section className="section">
        <div className="container-page">
          <Simulator />
        </div>
      </section>

      {/* Referência do catálogo */}
      <section className="section-tight bg-cinza-50">
        <div className="container-page">
          <h2 className="text-title font-semibold text-verde-800">Referência por porte do terreno</h2>
          <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-cinza-700">
            Valores do nosso catálogo. Repare que uma única visita avulsa por mês custa quase o mesmo que a assinatura com
            duas visitas.
          </p>

          <div className="card mt-8 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left">
              <caption className="sr-only">Comparação de valores entre avulso e assinatura por porte do terreno</caption>
              <thead>
                <tr className="border-b border-cinza-200 bg-white">
                  <th scope="col" className="px-6 py-3.5 text-sm font-semibold text-verde-800">
                    Tamanho do jardim
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-sm font-semibold text-verde-800">
                    Corte avulso (1×)
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-sm font-semibold text-verde-800">
                    Assinatura Essencial
                  </th>
                </tr>
              </thead>
              <tbody>
                {avulsoVsAssinatura.map((row) => (
                  <tr key={row.size} className="border-b border-cinza-200 last:border-b-0">
                    <th scope="row" className="px-6 py-4 align-top">
                      <span className="block font-semibold text-verde-800">{row.size}</span>
                      <span className="block text-sm text-cinza-600">{row.hint}</span>
                    </th>
                    <td className="px-6 py-4 align-top text-cinza-800">
                      {row.avulso}
                      {row.avulsoNote ? <span className="block text-xs text-cinza-600">{row.avulsoNote}</span> : null}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="font-semibold text-verde-700">{row.assinatura}</span>
                      <span className="block text-xs text-cinza-600">por mês · 2 visitas</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-ambar-200 bg-ambar-50 p-5">
            <Icon name="info" size={20} className="mt-0.5 shrink-0 text-ambar-600" />
            <p className="text-[0.9375rem] leading-relaxed text-ambar-700">
              A simulação é uma referência. O valor final é confirmado depois que avaliamos a área, o acesso ao local e o
              volume de resíduo — e nunca sobe sem sua aprovação.
            </p>
          </div>
        </div>
      </section>

      <CtaBanner
        title="Gostou do número? Vamos começar"
        description="Agende a primeira visita ou assine direto o plano recomendado."
        primary={{ href: "/agendamento", label: "Agendar serviço" }}
        secondary={{ href: "/planos", label: "Ver planos" }}
      />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Simulador", path: "/simulador" },
        ])}
      />
    </>
  );
}
