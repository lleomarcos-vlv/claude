import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { money } from "@/lib/format";
import type { CatalogService } from "@/lib/catalog";

/** Rótulo de preço por m² ou "orçamento gratuito", conforme a banda do catálogo. */
export function priceLabel(service: CatalogService) {
  if (service.pricing.kind === "quote") return { value: "Orçamento gratuito", hint: "valor conforme projeto" };
  return {
    value: `${money(service.pricing.minPerM2)} a ${money(service.pricing.maxPerM2)}`,
    hint: "por m²",
  };
}

export function ServiceCard({ service, priority = false }: { service: CatalogService; priority?: boolean }) {
  const price = priceLabel(service);

  return (
    <article className="card card-hover group flex h-full flex-col overflow-hidden">
      <Link href={`/servicos/${service.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-verde-100">
        <Image
          src={service.image}
          alt={`${service.name} — Verde Fixo`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
        />
        <span className="absolute top-3.5 left-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-verde-700 shadow-card backdrop-blur-sm">
          <Icon name={service.icon} size={18} />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-verde-800">
          <Link href={`/servicos/${service.slug}`} className="hover:text-verde-600">
            {service.name}
          </Link>
        </h3>
        <p className="mt-2 flex-1 text-[0.9375rem] leading-relaxed text-cinza-700">{service.shortDesc}</p>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-cinza-200 pt-4">
          <p>
            <span className="block text-[0.9375rem] font-semibold text-verde-800">{price.value}</span>
            <span className="block text-xs text-cinza-600">{price.hint}</span>
          </p>
          <Link
            href={`/agendamento?servico=${service.slug}`}
            className="btn btn-primary btn-sm shrink-0"
            aria-label={`Agendar ${service.name}`}
          >
            Agendar
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ServicesGrid({
  services,
  heading = true,
  limit,
}: {
  services: CatalogService[];
  heading?: boolean;
  limit?: number;
}) {
  const list = limit ? services.slice(0, limit) : services;

  return (
    <section id="servicos" className="section">
      <div className="container-page">
        {heading ? (
          <SectionHeading
            eyebrow="Serviços"
            title="Tudo que seu jardim precisa, com uma equipe só"
            description="Cobramos por m² com faixa de preço transparente, e o valor mínimo de visita é de R$ 200 para serviços avulsos. Assinantes pagam menos por visita."
            action={
              <Link href="/servicos" className="btn btn-outline btn-md">
                Ver todos os serviços
                <Icon name="arrow-right" size={17} />
              </Link>
            }
          />
        ) : null}

        <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${heading ? "mt-14" : ""}`}>
          {list.map((service, i) => (
            <Reveal key={service.slug} delay={(i % 3) * 90}>
              <ServiceCard service={service} priority={i < 3} />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-8 flex items-start gap-3 rounded-2xl border border-ambar-200 bg-ambar-50 p-5">
          <Icon name="info" size={20} className="mt-0.5 shrink-0 text-ambar-600" />
          <p className="text-[0.9375rem] leading-relaxed text-ambar-700">
            <strong className="font-semibold">Por que existe um valor mínimo de visita.</strong> Para manter nosso padrão
            de maquinário, equipe registrada e pontualidade, serviços avulsos têm mínimo de {money(20000)}. No{" "}
            <Link href="/planos" className="underline decoration-ambar-600/40 underline-offset-2 hover:text-ambar-600">
              Clube Verde Fixo
            </Link>{" "}
            esse mínimo não se aplica — o custo por visita cai bastante.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
