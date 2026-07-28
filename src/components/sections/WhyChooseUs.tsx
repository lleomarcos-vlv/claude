import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { audiences, differentials } from "@/content/sections";

export function WhyChooseUs() {
  return (
    <section id="por-que-verde-fixo" className="section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Por que escolher a Verde Fixo?"
          title="O que muda quando a empresa é dona do próprio trabalho"
          description="Sem terceirização, sem improviso e sem surpresa na fatura. É isso que faz um cliente ficar anos com a gente."
          align="center"
        />

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {differentials.map((item, i) => (
            <Reveal key={item.title} delay={(i % 3) * 90}>
              <article className="card card-hover h-full p-6 sm:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verde-100 text-verde-700">
                  <Icon name={item.icon} size={23} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-verde-800">{item.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-cinza-700">{item.text}</p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-verde-50 px-3 py-1.5 text-xs font-semibold text-verde-700">
                  <Icon name="check" size={13} strokeWidth={2.6} />
                  {item.metric}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AudienceStrip() {
  return (
    <section className="border-y border-cinza-200 bg-verde-50 py-14">
      <div className="container-page">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-14">
          <div className="lg:max-w-xs">
            <h2 className="text-xl font-semibold text-verde-800">Atendemos todo tipo de área verde</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-cinza-700">
              De um quintal de 30 m² a uma fazenda com hectares — com equipe e equipamento dimensionados para cada porte.
            </p>
          </div>

          <ul className="grid flex-1 grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-5 lg:grid-cols-9">
            {audiences.map((a) => (
              <li key={a.label} className="flex flex-col items-center gap-2.5 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-verde-600 shadow-card">
                  <Icon name={a.icon} size={22} />
                </span>
                <span className="text-xs font-medium text-cinza-800">{a.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export function CtaBanner({
  title = "Seu jardim pode estar impecável já nesta semana",
  description = "Agende um serviço avulso ou assine o Clube Verde Fixo. Orçamento e visita de avaliação são gratuitos.",
  primary = { href: "/agendamento", label: "Agendar serviço" },
  secondary = { href: "/planos", label: "Ver planos" },
}: {
  title?: string;
  description?: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className="section-tight">
      <div className="container-page">
        <Reveal>
          <div className="bg-mesh-verde relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-14 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
              style={{ backgroundImage: "url(/img/textura/folhas.svg)", backgroundSize: "300px" }}
            />
            <h2 className="mx-auto max-w-2xl text-display font-semibold text-white">{title}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-verde-200">{description}</p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href={primary.href} className="btn btn-accent btn-lg">
                {primary.label}
                <Icon name="arrow-right" size={18} />
              </Link>
              <Link href={secondary.href} className="btn btn-onDark btn-lg">
                {secondary.label}
              </Link>
            </div>

            <p className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-verde-300">
              <span className="flex items-center gap-1.5">
                <Icon name="check" size={15} /> Sem fidelidade
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="check" size={15} /> Orçamento gratuito
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="check" size={15} /> Garantia de satisfação
              </span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
