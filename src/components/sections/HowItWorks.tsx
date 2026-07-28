import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { howItWorks } from "@/content/sections";

export function HowItWorks() {
  return (
    <section id="como-funciona" className="section bg-verde-50">
      <div className="container-page">
        <SectionHeading
          eyebrow="Como funciona"
          title="Do pedido ao jardim pronto em cinco passos"
          description="Três toques e um especialista a caminho. Você acompanha cada etapa pelo site e recebe aviso no WhatsApp."
          align="center"
        />

        <ol className="mt-16 grid gap-4 lg:grid-cols-5">
          {howItWorks.map((step, index) => (
            <Reveal as="li" key={step.step} delay={index * 90} className="relative">
              <div className="card card-hover h-full p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-verde-600 text-lg font-semibold text-white">
                    {step.step}
                  </span>
                  <Icon name={step.icon} size={22} className="text-verde-400" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-verde-800">{step.title}</h3>
                <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-cinza-700">{step.text}</p>
              </div>

              {/* Conector entre etapas: seta para baixo no mobile, para o lado no desktop */}
              {index < howItWorks.length - 1 ? (
                <>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-3 left-1/2 flex h-6 -translate-x-1/2 items-center text-verde-400 lg:hidden"
                  >
                    <Icon name="arrow-down" size={20} />
                  </span>
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 -right-3 hidden h-6 -translate-y-1/2 items-center text-verde-400 lg:flex"
                  >
                    <Icon name="chevron-right" size={20} />
                  </span>
                </>
              ) : null}
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link href="/agendamento" className="btn btn-primary btn-lg w-full sm:w-auto">
            Começar agora
            <Icon name="arrow-right" size={18} />
          </Link>
          <Link href="/orcamento" className="btn btn-outline btn-lg w-full sm:w-auto">
            Prefiro um orçamento primeiro
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
