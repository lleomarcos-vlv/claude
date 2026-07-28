"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { whatsappLink } from "@/lib/site";
import { faqGroups, type FaqItem } from "@/content/faq";

/**
 * Acordeão de perguntas frequentes.
 *
 * Usa <details>/<summary> nativos: funciona sem JavaScript, é indexável pelo
 * Google (que casa o conteúdo com o FAQPage do JSON-LD) e já vem acessível.
 */
export function FaqAccordion({ items, defaultOpen = 0 }: { items: FaqItem[]; defaultOpen?: number }) {
  return (
    <div className="divide-y divide-cinza-200 overflow-hidden rounded-2xl border border-cinza-200 bg-white">
      {items.map((item, i) => (
        <details key={item.q} name="faq" open={i === defaultOpen} className="group">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-5 p-5 sm:p-6">
            <h3 className="text-[1.0625rem] font-medium text-verde-800 group-hover:text-verde-600">{item.q}</h3>
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-verde-50 text-verde-600 transition-transform duration-300 group-open:rotate-180">
              <Icon name="chevron-down" size={16} />
            </span>
          </summary>
          <div className="px-5 pb-6 sm:px-6">
            <p className="max-w-3xl text-[0.9375rem] leading-relaxed text-cinza-700">{item.a}</p>
          </div>
        </details>
      ))}
    </div>
  );
}

/** Versão com filtro por categoria, usada na página dedicada de FAQ. */
export function FaqFiltered({ items }: { items: FaqItem[] }) {
  const [group, setGroup] = useState<string>("todos");
  const filtered = group === "todos" ? items : items.filter((i) => i.group === group);

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar perguntas por tema">
        {["todos", ...faqGroups].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGroup(g)}
            aria-pressed={group === g}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              group === g
                ? "border-verde-600 bg-verde-600 text-white"
                : "border-cinza-300 bg-white text-cinza-700 hover:border-verde-400 hover:bg-verde-50"
            }`}
          >
            {g === "todos" ? "Todas" : g}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <FaqAccordion items={filtered} defaultOpen={-1} />
      </div>
    </div>
  );
}

export function FaqSection({ items }: { items: FaqItem[] }) {
  return (
    <section id="faq" className="section">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <p className="eyebrow">Perguntas frequentes</p>
            <h2 className="mt-3 text-display font-semibold text-verde-800">Dúvidas que todo mundo tem</h2>
            <p className="mt-4 text-lg leading-relaxed text-cinza-700">
              Reunimos o que mais perguntam antes de contratar. Se a sua não estiver aqui, fale com a gente — respondemos
              rápido.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href={whatsappLink()} target="_blank" rel="noopener" className="btn btn-primary btn-md">
                <Icon name="whatsapp" size={17} />
                Perguntar no WhatsApp
              </a>
              <Link href="/faq" className="btn btn-outline btn-md">
                Ver todas as perguntas
              </Link>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <FaqAccordion items={items} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
