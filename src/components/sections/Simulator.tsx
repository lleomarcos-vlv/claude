"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { money, moneyShort } from "@/lib/format";
import { estimate } from "@/lib/pricing";
import { frequencies, type FrequencyValue } from "@/lib/site";
import { services } from "@/content/services";
import { MIN_VISIT_PRICE } from "@/content/services";

const AREA_PRESETS = [30, 100, 300, 600, 1200];

/**
 * Simulador de valores.
 *
 * Roda inteiramente no cliente com as mesmas regras do servidor (`@/lib/pricing`),
 * o que dá resultado instantâneo sem custo de rede — e mantém uma única fonte de
 * verdade para as faixas do catálogo e o mínimo de visita de R$ 200.
 */
export function Simulator({ compact = false }: { compact?: boolean }) {
  const [areaM2, setAreaM2] = useState(180);
  const [serviceSlug, setServiceSlug] = useState("corte-de-grama");
  const [frequency, setFrequency] = useState<FrequencyValue>("quinzenal");

  const result = useMemo(() => estimate({ serviceSlug, areaM2, frequency }), [serviceSlug, areaM2, frequency]);
  const recommended = result?.recommended;

  return (
    <div className={`grid gap-6 ${compact ? "" : "lg:grid-cols-[1fr_1fr] lg:gap-8"}`}>
      {/* Entradas */}
      <div className="card p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-verde-800">Seu jardim</h3>
        <p className="mt-1.5 text-sm text-cinza-700">Três informações e você já tem uma faixa de valor.</p>

        {/* Área */}
        <div className="mt-7">
          <div className="flex items-end justify-between gap-4">
            <label htmlFor="sim-area" className="label mb-0">
              Tamanho aproximado do terreno
            </label>
            <output htmlFor="sim-area" className="text-2xl font-semibold tracking-[-0.02em] text-verde-700">
              {areaM2.toLocaleString("pt-BR")} m²
            </output>
          </div>

          <input
            id="sim-area"
            type="range"
            min={10}
            max={2000}
            step={10}
            value={areaM2}
            onChange={(e) => setAreaM2(Number(e.target.value))}
            className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-cinza-200 accent-verde-600"
            style={{
              background: `linear-gradient(to right, var(--color-verde-500) ${((areaM2 - 10) / 1990) * 100}%, var(--color-cinza-200) ${((areaM2 - 10) / 1990) * 100}%)`,
            }}
            aria-describedby="sim-area-hint"
          />
          <p id="sim-area-hint" className="mt-2 text-xs text-cinza-600">
            Não sabe a metragem? Multiplique o comprimento pela largura da área com grama.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {AREA_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAreaM2(preset)}
                aria-pressed={areaM2 === preset}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  areaM2 === preset
                    ? "border-verde-500 bg-verde-50 text-verde-700"
                    : "border-cinza-300 text-cinza-700 hover:border-verde-400 hover:bg-verde-50"
                }`}
              >
                {preset} m²
              </button>
            ))}
          </div>
        </div>

        {/* Serviço */}
        <div className="mt-7">
          <label htmlFor="sim-servico" className="label">
            Tipo de serviço
          </label>
          <select
            id="sim-servico"
            value={serviceSlug}
            onChange={(e) => setServiceSlug(e.target.value)}
            className="field-select"
          >
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Frequência */}
        <fieldset className="mt-7">
          <legend className="label">Frequência desejada</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {frequencies.map((f) => {
              const active = frequency === f.value;
              return (
                <label
                  key={f.value}
                  className={`cursor-pointer rounded-xl border p-3 text-center transition-all duration-200 ${
                    active
                      ? "border-verde-500 bg-verde-50 ring-2 ring-verde-500/20"
                      : "border-cinza-300 hover:border-verde-400 hover:bg-verde-50/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="sim-frequencia"
                    value={f.value}
                    checked={active}
                    onChange={() => setFrequency(f.value)}
                    className="sr-only"
                  />
                  <span className="block text-[0.9375rem] font-medium text-verde-800">{f.label}</span>
                  <span className="mt-0.5 block text-xs text-cinza-600">{f.hint}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Resultado */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl bg-verde-800 p-6 text-white sm:p-8">
          <p className="eyebrow text-verde-300">Estimativa</p>

          {result?.quoteOnly ? (
            <>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-white">Orçamento personalizado</p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-verde-200">
                {result.service.name} depende de projeto, espécies e material — por isso não trabalhamos com preço por m²
                aqui. A visita técnica de avaliação é gratuita e o orçamento sai em até 2 horas úteis.
              </p>
              <Link href={`/orcamento?servico=${serviceSlug}&area=${areaM2}`} className="btn btn-accent btn-lg mt-6 w-full">
                Pedir orçamento gratuito
              </Link>
            </>
          ) : result ? (
            <>
              <p className="mt-4 flex flex-wrap items-baseline gap-x-2 text-white">
                <span className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                  {moneyShort(result.perVisit!.min)}
                </span>
                <span className="text-verde-200">a</span>
                <span className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
                  {moneyShort(result.perVisit!.max)}
                </span>
              </p>
              <p className="mt-1.5 text-sm text-verde-200">
                por visita · {result.service.name} em {areaM2.toLocaleString("pt-BR")} m²
              </p>

              {result.visitsPerMonth > 1 ? (
                <p className="mt-5 rounded-xl bg-white/8 px-4 py-3 text-[0.9375rem] text-verde-100">
                  <strong className="font-semibold text-white">
                    {moneyShort(result.monthly!.min)} a {moneyShort(result.monthly!.max)}
                  </strong>{" "}
                  por mês no avulso, com {result.visitsPerMonth} visitas.
                </p>
              ) : null}

              {result.minVisitApplied ? (
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-verde-300">
                  <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                  Nesta metragem vale o valor mínimo de visita de {money(MIN_VISIT_PRICE)} para serviços avulsos.
                </p>
              ) : null}

              {result.aboveTable ? (
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-verde-300">
                  <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                  Acima de 300 m² fazemos uma avaliação para fechar o valor — normalmente sai proporcionalmente melhor.
                </p>
              ) : null}
            </>
          ) : null}
        </div>

        {/* Plano recomendado */}
        {recommended ? (
          <div className="card border-verde-300 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">Mais vantajoso para você</p>
                <h3 className="mt-2.5 text-xl font-semibold text-verde-800">{recommended.plan.name}</h3>
              </div>
              <span className="badge-accent shrink-0">Recomendado</span>
            </div>

            <p className="mt-3 text-[0.9375rem] leading-relaxed text-cinza-700">{recommended.reason}</p>

            <p className="mt-5 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tracking-[-0.02em] text-verde-800">
                {recommended.price !== null ? moneyShort(recommended.price) : "Sob orçamento"}
              </span>
              {recommended.price !== null ? <span className="text-cinza-600">/mês</span> : null}
            </p>
            {recommended.tier ? <p className="mt-1 text-sm text-cinza-600">{recommended.tier.label}</p> : null}

            {recommended.savings && recommended.savings.min > 0 ? (
              <p className="mt-4 flex items-start gap-2 rounded-xl bg-verde-50 px-4 py-3 text-sm text-verde-700">
                <Icon name="trending-up" size={17} className="mt-0.5 shrink-0" />
                <span>
                  Economia de <strong className="font-semibold">{moneyShort(recommended.savings.min)}</strong> a{" "}
                  <strong className="font-semibold">{moneyShort(recommended.savings.max)}</strong> por mês frente ao
                  avulso equivalente — e com vaga fixa na agenda.
                </span>
              </p>
            ) : null}

            <ul className="mt-5 space-y-2">
              {recommended.plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[0.9375rem] text-cinza-800">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-verde-100 text-verde-700">
                    <Icon name="check" size={13} strokeWidth={2.6} />
                  </span>
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <Link href={`/assinar/${recommended.plan.slug}?area=${areaM2}`} className="btn btn-primary btn-md">
                Assinar plano
              </Link>
              <Link href={`/agendamento?servico=${serviceSlug}&area=${areaM2}`} className="btn btn-outline btn-md">
                Agendar avulso
              </Link>
            </div>
          </div>
        ) : null}

        {/* Alternativas */}
        {result?.alternatives.length ? (
          <div className="card p-5">
            <p className="text-sm font-medium text-verde-800">Outros planos que atendem</p>
            <ul className="mt-3 space-y-2.5">
              {result.alternatives.map((alt) => (
                <li key={alt.plan.slug}>
                  <Link
                    href={`/planos#${alt.plan.slug}`}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-verde-50"
                  >
                    <span className="min-w-0">
                      <span className="block text-[0.9375rem] font-medium text-verde-800">{alt.plan.name}</span>
                      <span className="block text-xs text-cinza-600">
                        {alt.plan.visitsPerMonth === -1 ? "Visitas ilimitadas" : `${alt.plan.visitsPerMonth} visitas/mês`}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-verde-700">
                      {alt.price !== null ? `${moneyShort(alt.price)}/mês` : "Sob orçamento"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-xs leading-relaxed text-cinza-600">
          Valores de referência baseados no catálogo da Verde Fixo. O preço final é confirmado após avaliarmos a área,
          o acesso ao local e o volume de resíduo — e nunca sobe sem sua aprovação.
        </p>
      </div>
    </div>
  );
}

/** Bloco do simulador para a home, com título e faixa de fundo. */
export function SimulatorSection() {
  return (
    <section id="simulador" className="section">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Simulador</p>
          <h2 className="mt-3 text-display font-semibold text-verde-800">Quanto custa cuidar do seu jardim?</h2>
          <p className="mt-4 text-lg leading-relaxed text-cinza-700">
            Informe a metragem, o serviço e a frequência. Mostramos a faixa de valor e qual plano sai mais vantajoso —
            sem precisar falar com ninguém.
          </p>
        </div>

        <div className="mt-14">
          <Simulator />
        </div>
      </div>
    </section>
  );
}
