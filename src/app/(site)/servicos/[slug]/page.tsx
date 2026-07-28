import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/ui/PageHeader";
import { FaqAccordion } from "@/components/sections/Faq";
import { ServiceCard } from "@/components/sections/ServicesGrid";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { getPlans, getServices } from "@/lib/catalog";
import { breadcrumbSchema, faqSchema, pageMetadata, serviceSchema } from "@/lib/seo";
import { money } from "@/lib/format";
import { MIN_VISIT_PRICE, serviceBySlug, services } from "@/content/services";
import { cities } from "@/content/cities";
import { gallery } from "@/content/gallery";

export const revalidate = 600;

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) return {};

  return pageMetadata({
    title: service.seoTitle,
    description: service.seoDescription,
    path: `/servicos/${service.slug}`,
    image: service.image,
  });
}

export default async function ServicoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = serviceBySlug(slug);
  if (!service) notFound();

  const [allServices, plans] = await Promise.all([getServices(), getPlans()]);
  const related = allServices.filter((s) => s.slug !== service.slug).slice(0, 3);
  const works = gallery.filter((g) => g.services.includes(service.name));

  const priced = service.pricing.kind === "m2";

  return (
    <>
      <PageHeader
        eyebrow={service.name}
        title={service.name}
        description={service.shortDesc}
        breadcrumb={[{ label: "Serviços", href: "/servicos" }, { label: service.name }]}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={`/agendamento?servico=${service.slug}`} className="btn btn-primary btn-lg">
              Agendar agora
            </Link>
            <Link href={`/orcamento?servico=${service.slug}`} className="btn btn-outline btn-lg">
              Pedir orçamento
            </Link>
          </div>
        }
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          <div>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-verde-100">
              <Image
                src={service.image}
                alt={`${service.name} executado pela equipe da Verde Fixo`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            </div>

            <div className="prose-vf mt-10">
              <h2>Como a Verde Fixo faz</h2>
              <p>{service.description}</p>
            </div>

            <h2 className="mt-12 text-title font-semibold text-verde-800">O que está incluído</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {service.includes.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-cinza-200 bg-white p-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-verde-100 text-verde-700">
                    <Icon name="check" size={14} strokeWidth={2.6} />
                  </span>
                  <span className="text-[0.9375rem] leading-relaxed text-cinza-800">{item}</span>
                </li>
              ))}
            </ul>

            {works.length ? (
              <>
                <h2 className="mt-14 text-title font-semibold text-verde-800">Trabalhos com {service.name.toLowerCase()}</h2>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {works.slice(0, 2).map((work) => (
                    <Link key={work.slug} href="/antes-e-depois" className="card card-hover group overflow-hidden">
                      <div className="relative aspect-[3/2] bg-verde-100">
                        <Image src={work.after} alt={work.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" />
                        <span className="absolute top-3 left-3 rounded-full bg-verde-600/90 px-2.5 py-1 text-xs font-semibold text-white">
                          Depois
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="font-medium text-verde-800 group-hover:text-verde-600">{work.title}</p>
                        <p className="mt-1 text-sm text-cinza-600">
                          {work.city} · {work.areaM2.toLocaleString("pt-BR")} m²
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : null}

            {service.faq.length ? (
              <>
                <h2 className="mt-14 text-title font-semibold text-verde-800">Perguntas sobre {service.name.toLowerCase()}</h2>
                <div className="mt-6">
                  <FaqAccordion items={service.faq.map((f) => ({ ...f, group: "Serviços" as const }))} />
                </div>
              </>
            ) : null}
          </div>

          {/* Coluna de conversão */}
          <aside className="lg:sticky lg:top-24">
            <div className="card overflow-hidden">
              <div className="bg-verde-800 p-6 text-white">
                <p className="text-xs font-semibold tracking-[0.1em] text-verde-300 uppercase">
                  {priced ? "Preço por m²" : "Investimento"}
                </p>
                {priced && service.pricing.kind === "m2" ? (
                  <>
                    <p className="mt-2.5 text-3xl font-semibold tracking-[-0.02em]">
                      {money(service.pricing.minPerM2)}
                      <span className="text-lg font-normal text-verde-200"> a {money(service.pricing.maxPerM2)}</span>
                    </p>
                    <p className="mt-1 text-sm text-verde-200">por metro quadrado · banda “{service.pricing.band}”</p>
                    <p className="mt-4 rounded-lg bg-white/8 px-3.5 py-2.5 text-sm text-verde-100">
                      Mínimo de visita: {money(MIN_VISIT_PRICE)} para serviços avulsos.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-2.5 text-2xl font-semibold">Orçamento personalizado</p>
                    <p className="mt-2 text-sm leading-relaxed text-verde-200">
                      Depende de projeto, espécies e material. Visita técnica de avaliação gratuita e orçamento em até 2
                      horas úteis.
                    </p>
                  </>
                )}
              </div>

              <div className="grid gap-2.5 p-6">
                <Link href={`/agendamento?servico=${service.slug}`} className="btn btn-primary btn-lg w-full">
                  Agendar {service.name.toLowerCase()}
                </Link>
                <Link href={`/orcamento?servico=${service.slug}`} className="btn btn-outline btn-md w-full">
                  Prefiro um orçamento
                </Link>
              </div>

              <dl className="grid grid-cols-2 gap-4 border-t border-cinza-200 p-6 text-sm">
                <div>
                  <dt className="text-cinza-600">Duração média</dt>
                  <dd className="mt-0.5 font-semibold text-verde-800">
                    {service.durationMin >= 60
                      ? `${Math.round(service.durationMin / 60)}h`
                      : `${service.durationMin} min`}
                  </dd>
                </div>
                <div>
                  <dt className="text-cinza-600">Cobertura</dt>
                  <dd className="mt-0.5 font-semibold text-verde-800">{cities.length} cidades</dd>
                </div>
              </dl>
            </div>

            {/* Upsell para o plano */}
            <div className="card mt-5 border-verde-300 p-6">
              <p className="eyebrow">Sai mais barato</p>
              <h2 className="mt-2.5 text-lg font-semibold text-verde-800">Assine em vez de chamar avulso</h2>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-cinza-700">
                No Clube Verde Fixo você tem vaga fixa na agenda, custo por visita menor e o mínimo de visita deixa de
                existir.
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-verde-700">
                {money(plans[0].priceMonthly)}
                <span className="text-sm font-normal text-cinza-600">/mês a partir de</span>
              </p>
              <Link href="/planos" className="btn btn-accent btn-md mt-5 w-full">
                Conhecer os planos
                <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* Outros serviços */}
      <section className="section-tight bg-cinza-50">
        <div className="container-page">
          <h2 className="text-title font-semibold text-verde-800">Outros serviços</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((s, i) => (
              <Reveal key={s.slug} delay={i * 90}>
                <ServiceCard service={s} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner
        title={`Precisa de ${service.name.toLowerCase()}?`}
        description="Agende online em 1 minuto ou peça um orçamento gratuito. Respondemos em até 2 horas úteis."
        primary={{ href: `/agendamento?servico=${service.slug}`, label: "Agendar agora" }}
        secondary={{ href: `/orcamento?servico=${service.slug}`, label: "Pedir orçamento" }}
      />

      <JsonLd
        data={[
          serviceSchema(service),
          faqSchema(service.faq),
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Serviços", path: "/servicos" },
            { name: service.name, path: `/servicos/${service.slug}` },
          ]),
        ]}
      />
    </>
  );
}
