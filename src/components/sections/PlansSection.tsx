import { Fragment } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { moneyShort } from "@/lib/format";
import { avulsoVsAssinatura, clubPitch, planComparison } from "@/content/plans";
import type { CatalogPlan } from "@/lib/catalog";

export function PlanCard({ plan, featured }: { plan: CatalogPlan; featured?: boolean }) {
  const highlight = featured ?? plan.highlight;
  const unlimited = plan.visitsPerMonth === -1;

  return (
    <article
      id={plan.slug}
      className={`relative flex h-full flex-col rounded-3xl border p-6 transition-all duration-300 sm:p-8 ${
        highlight
          ? "border-verde-600 bg-verde-800 text-white shadow-lift lg:-my-4 lg:py-12"
          : "border-cinza-200 bg-white shadow-card hover:-translate-y-1 hover:border-verde-300 hover:shadow-lift"
      }`}
      style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
    >
      {plan.badge ? (
        <span
          className={`absolute -top-3 left-6 rounded-full px-3.5 py-1.5 text-xs font-semibold sm:left-8 ${
            highlight ? "bg-verde-300 text-verde-800" : "bg-verde-100 text-verde-700"
          }`}
        >
          {plan.badge}
        </span>
      ) : null}

      <h3 className={`text-xl font-semibold ${highlight ? "text-white" : "text-verde-800"}`}>{plan.name}</h3>
      <p className={`mt-2 min-h-[3rem] text-[0.9375rem] leading-relaxed ${highlight ? "text-verde-200" : "text-cinza-700"}`}>
        {plan.tagline}
      </p>

      <div className={`mt-6 border-t pt-6 ${highlight ? "border-white/15" : "border-cinza-200"}`}>
        <p className={`text-xs font-medium tracking-[0.1em] uppercase ${highlight ? "text-verde-300" : "text-cinza-600"}`}>
          A partir de
        </p>
        <p className="mt-1.5 flex items-baseline gap-1.5">
          <span className={`text-5xl font-semibold tracking-[-0.03em] ${highlight ? "text-white" : "text-verde-800"}`}>
            {moneyShort(plan.priceMonthly)}
          </span>
          <span className={`text-base ${highlight ? "text-verde-200" : "text-cinza-600"}`}>/mês</span>
        </p>
        <p className={`mt-2 text-sm ${highlight ? "text-verde-200" : "text-cinza-600"}`}>
          {unlimited ? "Visitas ilimitadas" : `${plan.visitsPerMonth} visitas por mês`} · até {plan.areaTiers[0].maxM2} m²
        </p>
      </div>

      <ul className={`mt-6 flex-1 space-y-3 border-t pt-6 ${highlight ? "border-white/15" : "border-cinza-200"}`}>
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                highlight ? "bg-verde-300 text-verde-800" : "bg-verde-100 text-verde-700"
              }`}
            >
              <Icon name="check" size={13} strokeWidth={2.6} />
            </span>
            <span className={`text-[0.9375rem] leading-relaxed ${highlight ? "text-verde-100" : "text-cinza-800"}`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* Faixas de preço por porte do terreno */}
      <details className={`mt-6 rounded-xl px-4 py-3 ${highlight ? "bg-white/8" : "bg-verde-50"}`}>
        <summary
          className={`cursor-pointer list-none text-sm font-medium ${highlight ? "text-verde-200" : "text-verde-700"}`}
        >
          <span className="inline-flex items-center gap-1.5">
            Valor por porte do terreno
            <Icon name="chevron-down" size={15} />
          </span>
        </summary>
        <dl className="mt-3 space-y-2">
          {plan.areaTiers.map((tier) => (
            <div key={tier.label} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className={highlight ? "text-verde-200" : "text-cinza-700"}>{tier.label}</dt>
              <dd className={`font-semibold whitespace-nowrap ${highlight ? "text-white" : "text-verde-800"}`}>
                {tier.price > 0 ? `${moneyShort(tier.price)}${tier.from ? "+" : ""}` : "Sob orçamento"}
              </dd>
            </div>
          ))}
        </dl>
      </details>

      <div className="mt-6 grid gap-2.5">
        <Link
          href={`/assinar/${plan.slug}`}
          className={`btn btn-lg w-full ${highlight ? "btn-accent" : "btn-primary"}`}
        >
          Assinar {plan.name.replace("Plano ", "")}
        </Link>
        <Link
          href={`/orcamento?plano=${plan.slug}`}
          className={`btn btn-sm w-full ${highlight ? "text-verde-200 hover:bg-white/10" : "btn-ghost"}`}
        >
          Tirar dúvidas antes
        </Link>
      </div>

      <p className={`mt-4 text-center text-xs ${highlight ? "text-verde-300/80" : "text-cinza-600"}`}>
        Sem fidelidade · cancele quando quiser
      </p>
    </article>
  );
}

export function PlansSection({ plans, showComparison = true }: { plans: CatalogPlan[]; showComparison?: boolean }) {
  return (
    <section id="planos" className="section bg-cinza-50">
      <div className="container-page">
        <SectionHeading
          eyebrow="Clube Verde Fixo"
          title="Assine e esqueça o assunto"
          description={clubPitch}
          align="center"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:items-start">
          {plans.map((plan, i) => (
            <Reveal key={plan.slug} delay={i * 100}>
              <PlanCard plan={plan} />
            </Reveal>
          ))}
        </div>

        {/* Avulso x assinatura — a conta que vende o plano */}
        <Reveal className="mt-16">
          <div className="card overflow-hidden">
            <div className="border-b border-cinza-200 bg-white p-6 sm:p-8">
              <h3 className="text-title font-semibold text-verde-800">Avulso ou assinatura? Faça a conta</h3>
              <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-cinza-700">
                Estimativa por porte do terreno. Uma visita avulsa por mês custa quase o mesmo que uma assinatura com
                duas visitas — e a assinatura garante sua vaga na agenda.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left">
                <caption className="sr-only">
                  Comparação entre serviço avulso e assinatura por tamanho de jardim
                </caption>
                <thead>
                  <tr className="border-b border-cinza-200 bg-cinza-50">
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
                      <td className="px-6 py-4 align-top">
                        <span className="block text-cinza-800">{row.avulso}</span>
                        {row.avulsoNote ? <span className="block text-xs text-cinza-600">{row.avulsoNote}</span> : null}
                      </td>
                      <td className="px-6 py-4 align-top">
                        <span className="block font-semibold text-verde-700">{row.assinatura}</span>
                        <span className="block text-xs text-cinza-600">por mês · 2 visitas</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-cinza-200 bg-verde-50 p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.9375rem] text-cinza-700">
                Quer o número exato do seu caso? O simulador calcula em 30 segundos.
              </p>
              <Link href="/simulador" className="btn btn-primary btn-md shrink-0">
                Simular meu jardim
                <Icon name="arrow-right" size={17} />
              </Link>
            </div>
          </div>
        </Reveal>

        {showComparison ? <PlanComparison plans={plans} /> : null}
      </div>
    </section>
  );
}

export function PlanComparison({ plans }: { plans: CatalogPlan[] }) {
  return (
    <Reveal className="mt-16">
      <h3 className="text-title font-semibold text-verde-800">Comparação completa</h3>
      <p className="mt-2.5 text-[0.9375rem] text-cinza-700">Tudo que entra em cada plano, item por item.</p>

      <div className="mt-7 overflow-x-auto rounded-2xl border border-cinza-200 bg-white shadow-card">
        <table className="w-full min-w-[44rem] text-left">
          <caption className="sr-only">Comparação de recursos entre os planos do Clube Verde Fixo</caption>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-cinza-200 bg-white">
              <th scope="col" className="px-6 py-4 text-sm font-semibold text-verde-800">
                Recurso
              </th>
              {plans.map((plan) => (
                <th key={plan.slug} scope="col" className="px-5 py-4 text-center">
                  <span className={`block font-semibold ${plan.highlight ? "text-verde-600" : "text-verde-800"}`}>
                    {plan.name.replace("Plano ", "")}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-cinza-600">
                    {moneyShort(plan.priceMonthly)}/mês
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planComparison.map((group) => (
              <Fragment key={group.group}>
                <tr className="bg-verde-50">
                  <th
                    scope="colgroup"
                    colSpan={plans.length + 1}
                    className="px-6 py-2.5 text-xs font-semibold tracking-[0.1em] text-verde-700 uppercase"
                  >
                    {group.group}
                  </th>
                </tr>
                {group.rows.map((row) => (
                  <tr key={group.group + row.label} className="border-b border-cinza-200 last:border-b-0">
                    <th scope="row" className="px-6 py-3.5 align-top font-normal">
                      <span className="block text-[0.9375rem] text-cinza-800">{row.label}</span>
                      {row.hint ? <span className="mt-0.5 block text-xs text-cinza-600">{row.hint}</span> : null}
                    </th>
                    {row.values.map((value, i) => (
                      <td key={i} className="px-5 py-3.5 text-center align-middle">
                        <ComparisonValue value={value} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-cinza-200 bg-cinza-50">
              <td className="px-6 py-5" />
              {plans.map((plan) => (
                <td key={plan.slug} className="px-5 py-5 text-center">
                  <Link
                    href={`/assinar/${plan.slug}`}
                    className={`btn btn-sm w-full ${plan.highlight ? "btn-primary" : "btn-outline"}`}
                  >
                    Assinar
                  </Link>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </Reveal>
  );
}

function ComparisonValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <>
        <span className="sr-only">Incluído</span>
        <span className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-verde-100 text-verde-700">
          <Icon name="check" size={14} strokeWidth={2.6} />
        </span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <span className="sr-only">Não incluído</span>
        <span className="mx-auto flex h-6 w-6 items-center justify-center text-cinza-300">
          <Icon name="minus" size={16} />
        </span>
      </>
    );
  }
  return <span className="text-[0.9375rem] font-medium text-verde-800">{value}</span>;
}
