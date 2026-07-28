import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { WhyChooseUs, AudienceStrip, CtaBanner } from "@/components/sections/WhyChooseUs";
import { Testimonials } from "@/components/sections/Testimonials";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { testimonials } from "@/content/testimonials";
import { trustPoints } from "@/content/sections";

export const metadata: Metadata = pageMetadata({
  title: "Sobre a Verde Fixo — Por Que Escolher a Gente",
  description:
    "Equipe própria registrada, equipamento profissional, pontualidade e garantia de satisfação. Conheça a Verde Fixo, empresa de jardinagem e paisagismo em Campinas desde 2018.",
  path: "/sobre",
});

const team = [
  { name: "Rafael Menezes", role: "Engenheiro agrônomo", detail: "Responsável técnico por solo, adubação e manejo de pragas." },
  { name: "Bianca Ferraz", role: "Paisagista", detail: "Projetos, escolha de espécies e execução de canteiros." },
  { name: "Josué Andrade", role: "Supervisor de campo", detail: "Coordena as equipes e o padrão de acabamento." },
  { name: "Letícia Barros", role: "Coordenadora de operações", detail: "Agenda, rotas e relacionamento com o cliente." },
];

export default function SobrePage() {
  return (
    <>
      <PageHeader
        eyebrow="Sobre nós"
        title="Profissionalismo, comodidade e jardim impecável"
        description={`Desde ${site.founded} cuidando de jardins na região de Campinas com equipe própria — sem terceirização, sem improviso e sem surpresa na fatura.`}
        breadcrumb={[{ label: "Sobre" }]}
        tone="dark"
      />

      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-16">
          <div className="prose-vf">
            <h2>Nasceu de um problema simples</h2>
            <p>
              Em {site.founded} a Verde Fixo começou porque encontrar alguém confiável para cortar a grama era mais difícil
              do que deveria. Quem aparecia não voltava. Quem voltava não avisava. E o jardim, entre um serviço e outro,
              sempre passava do ponto.
            </p>
            <p>
              A resposta foi construir o oposto disso: <strong>rota fixa, data reservada e equipe registrada</strong>. Em vez
              de vender visitas isoladas, criamos o Clube Verde Fixo — pacotes mensais que garantem sua vaga na agenda e
              custam menos que a soma dos avulsos.
            </p>
            <p>
              Hoje somos {site.stats.clients} clientes ativos e mais de {site.stats.gardens} jardins atendidos em{" "}
              {site.stats.cities} cidades. O que não mudou foi o jeito: preço por metro quadrado publicado, relatório com
              fotos depois de cada visita e nota fiscal sempre.
            </p>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-verde-100">
            <Image
              src="/img/servicos/paisagismo.svg"
              alt="Jardim projetado e mantido pela equipe da Verde Fixo"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="border-y border-cinza-200 bg-verde-50 py-14">
        <div className="container-page">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point.label}>
                <dt className="text-4xl font-semibold tracking-[-0.03em] text-verde-800">{point.value}</dt>
                <dd className="mt-1.5 text-sm text-cinza-700">{point.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <WhyChooseUs />

      {/* Equipe */}
      <section className="section-tight bg-cinza-50">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Quem cuida</p>
            <h2 className="mt-3 text-display font-semibold text-verde-800">Gente qualificada, não mão de obra avulsa</h2>
            <p className="mt-4 text-lg leading-relaxed text-cinza-700">
              Toda a equipe é registrada em CLT, treinada e supervisionada por profissionais técnicos.
            </p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((person, i) => (
              <Reveal key={person.name} delay={i * 90}>
                <article className="card card-hover h-full p-6">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verde-600 text-base font-semibold text-white">
                    {person.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <h3 className="mt-5 font-semibold text-verde-800">{person.name}</h3>
                  <p className="mt-0.5 text-sm font-medium text-verde-600">{person.role}</p>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-cinza-700">{person.detail}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <AudienceStrip />

      {/* Compromissos */}
      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Nossos compromissos</p>
            <h2 className="mt-3 text-display font-semibold text-verde-800">O que prometemos por escrito</h2>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            {[
              {
                icon: "clock",
                title: "Pontualidade com consequência",
                text: "Se atrasarmos mais de 30 minutos da janela combinada, a visita sai sem custo. Não é gentileza: está na nossa política.",
              },
              {
                icon: "shield-check",
                title: "Garantia de 72 horas",
                text: "Não ficou bom? Avise em até 72h e refazemos sem cobrar. Se ainda assim não resolver, devolvemos o valor da visita.",
              },
              {
                icon: "eye",
                title: "Preço sem letra miúda",
                text: "Faixa por m² publicada no site, mínimo de visita informado antes, e nenhum custo entra na fatura sem sua aprovação.",
              },
              {
                icon: "file-check",
                title: "Formalidade completa",
                text: "Nota fiscal para PF e PJ, equipe em CLT, seguro de responsabilidade civil e ART quando o serviço exige.",
              },
            ].map((item, i) => (
              <Reveal key={item.title} delay={(i % 2) * 90}>
                <article className="card h-full p-6 sm:p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-verde-100 text-verde-700">
                    <Icon name={item.icon} size={23} />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-verde-800">{item.title}</h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-cinza-700">{item.text}</p>
                </article>
              </Reveal>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/antes-e-depois" className="btn btn-outline btn-lg">
              Ver trabalhos realizados
            </Link>
            <Link href="/avaliacoes" className="btn btn-ghost btn-lg border border-cinza-200">
              Ler avaliações
            </Link>
          </div>
        </div>
      </section>

      <Testimonials items={testimonials} limit={3} />
      <CtaBanner />

      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Sobre", path: "/sobre" },
        ])}
      />
    </>
  );
}
