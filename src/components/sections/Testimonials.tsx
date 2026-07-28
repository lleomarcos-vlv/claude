import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { StarRating } from "@/components/ui/StarRating";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { initials } from "@/lib/format";
import { site } from "@/lib/site";
import { ratingDistribution, type Testimonial } from "@/content/testimonials";

export function TestimonialCard({ item }: { item: Testimonial }) {
  return (
    <figure className="card card-hover flex h-full flex-col p-6 sm:p-7">
      <Icon name="quote" size={26} className="text-verde-200" />
      <blockquote className="mt-4 flex-1 text-[0.9375rem] leading-relaxed text-cinza-800">{item.text}</blockquote>

      <figcaption className="mt-6 flex items-center gap-3.5 border-t border-cinza-200 pt-5">
        <span
          aria-hidden
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-verde-600 text-sm font-semibold text-white"
        >
          {initials(item.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-verde-800">{item.name}</p>
          <p className="truncate text-sm text-cinza-600">
            {item.role} · {item.city}
          </p>
        </div>
        <StarRating value={item.rating} size={14} className="ml-auto shrink-0" />
      </figcaption>

      {item.plan || item.since ? (
        <p className="mt-3.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-cinza-600">
          {item.plan ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-verde-50 px-2.5 py-1 font-medium text-verde-700">
              <Icon name="leaf" size={11} />
              {item.plan}
            </span>
          ) : null}
          {item.since ? <span>{item.since}</span> : null}
        </p>
      ) : null}
    </figure>
  );
}

export function Testimonials({ items, limit = 6 }: { items: Testimonial[]; limit?: number }) {
  return (
    <section id="avaliacoes" className="section bg-cinza-50">
      <div className="container-page">
        <SectionHeading
          eyebrow="Avaliações"
          title="Quem assina, fica"
          description={`Média de ${site.stats.rating.toString().replace(".", ",")} em ${site.stats.reviews} avaliações de clientes reais — residências, condomínios, escolas, hotéis e sítios.`}
          action={
            <Link href="/avaliacoes" className="btn btn-outline btn-md">
              Ver todas
              <Icon name="arrow-right" size={17} />
            </Link>
          }
        />

        {/* Resumo da reputação */}
        <Reveal className="mt-12">
          <div className="card flex flex-col gap-8 p-6 sm:flex-row sm:items-center sm:gap-14 sm:p-8">
            <div className="text-center sm:text-left">
              <p className="text-6xl font-semibold tracking-[-0.03em] text-verde-800">
                {site.stats.rating.toString().replace(".", ",")}
              </p>
              <StarRating value={site.stats.rating} size={18} className="mt-2" />
              <p className="mt-2 text-sm text-cinza-600">{site.stats.reviews} avaliações</p>
            </div>

            <div className="flex-1 space-y-2">
              {ratingDistribution.map((row) => (
                <div key={row.stars} className="flex items-center gap-3">
                  <span className="w-12 shrink-0 text-sm text-cinza-700">{row.stars} ★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-cinza-200">
                    <span
                      className="block h-full rounded-full bg-verde-500"
                      style={{ width: `${row.percent}%` }}
                      role="presentation"
                    />
                  </span>
                  <span className="w-10 shrink-0 text-right text-sm text-cinza-600">{row.percent}%</span>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-cinza-200 sm:border-l sm:pl-14">
              <p className="flex items-center gap-2 text-[0.9375rem] font-medium text-verde-800">
                <Icon name="shield-check" size={18} className="text-verde-600" />
                Garantia de satisfação
              </p>
              <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-cinza-700">
                Não ficou bom? Avise em até 72h e refazemos sem cobrar nada.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.slice(0, limit).map((item, i) => (
            <Reveal key={item.name} delay={(i % 3) * 90}>
              <TestimonialCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
