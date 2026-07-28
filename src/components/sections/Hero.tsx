import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StarRating } from "@/components/ui/StarRating";
import { site } from "@/lib/site";
import { trustPoints } from "@/content/sections";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-verde-900 pt-28 pb-16 sm:pt-36 sm:pb-24">
      {/* Imagem de fundo: prioridade de carregamento, é o LCP da página */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/img/hero/jardim.svg"
          alt="Jardim residencial com gramado recém-cortado em listras, canteiros floridos e cerca-viva aparada"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[center_35%]"
        />
        {/* Gradiente para o texto ter contraste garantido (AA) sobre a foto */}
        <div className="absolute inset-0 bg-gradient-to-b from-verde-950/85 via-verde-900/70 to-verde-900/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-verde-950/80 via-transparent to-transparent" />
      </div>

      <div className="container-page">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[0.8125rem] font-medium text-verde-200 backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 rounded-full bg-verde-300" />
            Clube Verde Fixo · vaga garantida na agenda
          </p>

          <h1 className="mt-6 text-hero font-semibold text-white">
            Cuidamos do seu jardim
            <br className="hidden sm:block" /> o ano inteiro.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-verde-100 sm:text-xl">
            Agende um serviço ou assine um plano de manutenção e nunca mais se preocupe com seu gramado.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href="/agendamento" className="btn btn-primary btn-lg">
              Agendar serviço
              <Icon name="arrow-right" size={18} />
            </Link>
            <Link href="/planos" className="btn btn-onDark btn-lg">
              Conhecer planos
            </Link>
          </div>

          {/* Prova social imediata */}
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <div className="flex items-center gap-3">
              <StarRating value={site.stats.rating} size={17} />
              <span className="text-sm text-verde-100">
                <strong className="font-semibold text-white">{site.stats.rating.toString().replace(".", ",")}</strong> em{" "}
                {site.stats.reviews} avaliações
              </span>
            </div>
            <div className="h-5 w-px bg-white/20" aria-hidden />
            <p className="flex items-center gap-2 text-sm text-verde-100">
              <Icon name="shield-check" size={17} className="text-verde-300" />
              Garantia de satisfação
            </p>
            <p className="flex items-center gap-2 text-sm text-verde-100">
              <Icon name="badge" size={17} className="text-verde-300" />
              Equipe própria, sem terceirização
            </p>
          </div>
        </div>

        {/* Números — fecha o hero com credibilidade */}
        <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-white/15 pt-10 sm:mt-20 lg:grid-cols-4">
          {trustPoints.map((point) => (
            <div key={point.label}>
              <dt className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">{point.value}</dt>
              <dd className="mt-1.5 text-sm text-verde-200">{point.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
