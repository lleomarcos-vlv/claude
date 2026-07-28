"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/lib/site";
import type { City } from "@/content/cities";

/**
 * Mapa estilizado da área de cobertura.
 *
 * É um SVG próprio, não um iframe do Google Maps: carrega instantâneo, não
 * bloqueia render, não instala cookie de terceiro (LGPD) e funciona sem chave de
 * API. O mapa interativo do Google entra apenas na página de contato, sob demanda.
 */
export function CoverageMap({ cities }: { cities: City[] }) {
  const [active, setActive] = useState<string | null>(null);
  const selected = cities.find((c) => c.slug === active);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-start lg:gap-12">
      {/* Mapa */}
      <div className="relative overflow-hidden rounded-3xl border border-cinza-200 bg-verde-50 p-4 sm:p-6">
        <svg viewBox="0 0 100 100" className="h-auto w-full" role="img" aria-label={`Mapa das ${cities.length} cidades atendidas na região de Campinas`}>
          {/* Malha de fundo */}
          <defs>
            <pattern id="malha" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M8 0H0v8" fill="none" stroke="#d1ebe0" strokeWidth="0.4" />
            </pattern>
            <radialGradient id="area" cx="0.46" cy="0.5" r="0.55">
              <stop offset="0" stopColor="#9fdfb9" stopOpacity="0.55" />
              <stop offset="1" stopColor="#9fdfb9" stopOpacity="0.05" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="url(#malha)" />

          {/* Área de cobertura */}
          <ellipse cx="46" cy="48" rx="44" ry="42" fill="url(#area)" />
          <ellipse cx="46" cy="48" rx="44" ry="42" fill="none" stroke="#63b795" strokeWidth="0.5" strokeDasharray="2 1.5" />

          {/* Ligações do hub para cada cidade */}
          {cities
            .filter((c) => !c.hub)
            .map((c) => {
              const hub = cities.find((h) => h.hub) ?? cities[0];
              return (
                <line
                  key={`linha-${c.slug}`}
                  x1={hub.x}
                  y1={hub.y}
                  x2={c.x}
                  y2={c.y}
                  stroke="#63b795"
                  strokeWidth={active === c.slug ? 0.7 : 0.3}
                  opacity={active === c.slug ? 0.9 : 0.35}
                />
              );
            })}

          {/* Cidades */}
          {cities.map((c) => {
            const isActive = active === c.slug;
            return (
              <g
                key={c.slug}
                onMouseEnter={() => setActive(c.slug)}
                onFocus={() => setActive(c.slug)}
                onMouseLeave={() => setActive(null)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                role="button"
                aria-label={`${c.city} — resposta em até ${c.responseTime}`}
                className="cursor-pointer outline-none"
              >
                {isActive || c.hub ? (
                  <circle cx={c.x} cy={c.y} r={c.hub ? 5 : 4} fill="#2a7261" opacity="0.16" />
                ) : null}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={c.hub ? 2.4 : 1.7}
                  fill={c.hub ? "#20574a" : isActive ? "#2a7261" : "#38907a"}
                  stroke="#ffffff"
                  strokeWidth="0.6"
                />
                <text
                  x={c.x}
                  y={c.y - (c.hub ? 4 : 3.2)}
                  textAnchor="middle"
                  fontSize={c.hub ? 3.4 : 2.7}
                  fontWeight={c.hub ? 700 : 500}
                  fill={isActive || c.hub ? "#1d3a31" : "#4a6b5f"}
                  style={{ pointerEvents: "none" }}
                >
                  {c.city}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legenda */}
        <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 px-2 text-xs text-cinza-700">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-verde-700" />
            Base operacional
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-verde-500" />
            Cidade atendida
          </span>
          <span className="ml-auto">Passe o mouse para ver detalhes</span>
        </div>
      </div>

      {/* Painel lateral */}
      <div>
        {selected ? (
          <div className="card p-6" aria-live="polite">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-verde-800">
                  {selected.city}
                  {selected.hub ? <span className="ml-2 badge-accent align-middle">Base</span> : null}
                </h3>
                <p className="mt-1 text-sm text-cinza-600">{selected.state}</p>
              </div>
              <span className="chip shrink-0">
                <Icon name="clock" size={13} />
                até {selected.responseTime}
              </span>
            </div>

            {selected.neighborhoods.length ? (
              <>
                <p className="mt-5 text-sm font-medium text-verde-800">Bairros e regiões atendidas</p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {selected.neighborhoods.map((n) => (
                    <li key={n} className="rounded-full bg-verde-50 px-2.5 py-1 text-xs text-verde-700">
                      {n}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            <Link href={`/atendemos/${selected.slug}`} className="btn btn-outline btn-sm mt-6 w-full">
              Ver página de {selected.city}
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        ) : (
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-verde-800">
              {cities.length} cidades na região de Campinas
            </h3>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-cinza-700">
              Atendimento em até 24h nas cidades próximas à base e até 72h nas demais. Orçamento e visita de avaliação
              gratuitos em toda a área de cobertura.
            </p>

            <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/atendemos/${c.slug}`}
                    onMouseEnter={() => setActive(c.slug)}
                    onMouseLeave={() => setActive(null)}
                    className="flex items-center gap-1.5 text-[0.9375rem] text-cinza-800 hover:text-verde-600"
                  >
                    <Icon name="map-pin" size={14} className="shrink-0 text-verde-400" />
                    <span className="truncate">{c.city}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-cinza-200 bg-white p-5">
          <Icon name="info" size={19} className="mt-0.5 shrink-0 text-verde-600" />
          <p className="text-[0.9375rem] leading-relaxed text-cinza-700">
            Sua cidade não está na lista? Estamos expandindo todo mês —{" "}
            <a
              href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Olá! Vocês atendem na minha cidade?")}`}
              target="_blank"
              rel="noopener"
              className="font-medium text-verde-600 underline decoration-verde-300 underline-offset-2 hover:text-verde-700"
            >
              chame no WhatsApp
            </a>{" "}
            que verificamos na hora.
          </p>
        </div>
      </div>
    </div>
  );
}

export function CoverageSection({ cities }: { cities: City[] }) {
  return (
    <section id="atendemos" className="section">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Atendemos</p>
          <h2 className="mt-3 text-display font-semibold text-verde-800">Onde a Verde Fixo já está</h2>
          <p className="mt-4 text-lg leading-relaxed text-cinza-700">
            Equipe própria circulando por {cities.length} cidades da região metropolitana de Campinas.
          </p>
        </div>

        <div className="mt-14">
          <CoverageMap cities={cities} />
        </div>
      </div>
    </section>
  );
}
