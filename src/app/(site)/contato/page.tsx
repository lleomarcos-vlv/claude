import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ContactForm } from "@/components/forms/ContactForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon } from "@/components/ui/Icon";
import { CoverageMap } from "@/components/sections/CoverageMap";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { getConfig } from "@/lib/settings";
import { getServiceAreas } from "@/lib/catalog";
import { site, whatsappLink } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Contato — Fale com a Verde Fixo",
  description: `WhatsApp ${site.whatsappLabel}, e-mail ${site.email} e formulário de contato. Atendemos Campinas e região de segunda a sábado.`,
  path: "/contato",
});

export default async function ContatoPage() {
  const [mapsKey, areas] = await Promise.all([getConfig("GOOGLE_MAPS_API_KEY"), getServiceAreas()]);

  const address = `${site.address.street}, ${site.address.district}, ${site.address.city} - ${site.address.state}, ${site.address.zip}`;
  const mapsEmbed = mapsKey
    ? `https://www.google.com/maps/embed/v1/place?key=${mapsKey}&q=${encodeURIComponent(address)}&language=pt-BR&zoom=14`
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Contato"
        title="Fale com a gente"
        description="Escolha o canal que preferir. No WhatsApp respondemos na hora durante o horário comercial."
        breadcrumb={[{ label: "Contato" }]}
      />

      <section className="section">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          {/* Canais */}
          <div>
            <div className="grid gap-4">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener"
                className="card card-hover flex items-start gap-4 p-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]/12 text-[#1da851]">
                  <Icon name="whatsapp" size={23} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-verde-800">WhatsApp</span>
                  <span className="mt-0.5 block text-[0.9375rem] text-cinza-700">{site.whatsappLabel}</span>
                  <span className="mt-1 block text-sm text-verde-600">Resposta imediata no horário comercial</span>
                </span>
                <Icon name="arrow-up-right" size={17} className="shrink-0 text-cinza-400" />
              </a>

              <a href={site.phoneHref} className="card card-hover flex items-start gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-verde-100 text-verde-700">
                  <Icon name="phone" size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-verde-800">Telefone</span>
                  <span className="mt-0.5 block text-[0.9375rem] text-cinza-700">{site.phone}</span>
                </span>
              </a>

              <a href={`mailto:${site.email}`} className="card card-hover flex items-start gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-verde-100 text-verde-700">
                  <Icon name="mail" size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-verde-800">E-mail</span>
                  <span className="mt-0.5 block text-[0.9375rem] break-all text-cinza-700">{site.email}</span>
                  <span className="mt-1 block text-sm text-cinza-600">Resposta em até 1 dia útil</span>
                </span>
              </a>
            </div>

            {/* Horários */}
            <div className="card mt-5 p-6">
              <h2 className="flex items-center gap-2 font-semibold text-verde-800">
                <Icon name="clock" size={18} className="text-verde-600" />
                Horário de atendimento
              </h2>
              <dl className="mt-4 space-y-2.5">
                {site.hours.map((h) => (
                  <div key={h.days} className="flex items-baseline justify-between gap-4 text-[0.9375rem]">
                    <dt className="text-cinza-700">{h.days}</dt>
                    <dd className="font-medium text-verde-800">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Endereço */}
            <div className="card mt-5 p-6">
              <h2 className="flex items-center gap-2 font-semibold text-verde-800">
                <Icon name="map-pin" size={18} className="text-verde-600" />
                Nossa base
              </h2>
              <address className="mt-3 text-[0.9375rem] leading-relaxed text-cinza-700 not-italic">
                {site.address.street}
                <br />
                {site.address.district} · {site.address.city}/{site.address.state}
                <br />
                CEP {site.address.zip}
              </address>
              <p className="mt-3 text-sm text-cinza-600">
                Atendimento no local do cliente — não temos loja física para visitação.
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener"
                className="btn btn-outline btn-sm mt-4"
              >
                Abrir no Google Maps
                <Icon name="arrow-up-right" size={15} />
              </a>
            </div>

            {/* Redes */}
            <div className="mt-5 flex gap-2.5">
              {[
                { href: site.social.instagram, icon: "instagram", label: "Instagram" },
                { href: site.social.facebook, icon: "facebook", label: "Facebook" },
                { href: site.social.youtube, icon: "youtube", label: "YouTube" },
                { href: site.social.linkedin, icon: "linkedin", label: "LinkedIn" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={s.label}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-cinza-200 bg-white text-verde-700 transition-colors hover:border-verde-400 hover:bg-verde-50"
                >
                  <Icon name={s.icon} size={19} />
                </a>
              ))}
            </div>
          </div>

          {/* Formulário */}
          <div className="card p-6 sm:p-8">
            <h2 className="text-title font-semibold text-verde-800">Mande uma mensagem</h2>
            <p className="mt-2.5 text-[0.9375rem] text-cinza-700">
              Para orçamento,{" "}
              <Link href="/orcamento" className="font-medium text-verde-600 underline underline-offset-2">
                use o formulário específico
              </Link>{" "}
              — a resposta sai mais rápido.
            </p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Mapa */}
      <section className="section-tight bg-cinza-50">
        <div className="container-page">
          <h2 className="text-title font-semibold text-verde-800">Onde atendemos</h2>
          <p className="mt-2.5 max-w-2xl text-[0.9375rem] leading-relaxed text-cinza-700">
            {areas.length} cidades na região metropolitana de Campinas.
          </p>

          <div className="mt-8">
            {mapsEmbed ? (
              <div className="overflow-hidden rounded-3xl border border-cinza-200">
                <iframe
                  src={mapsEmbed}
                  title={`Localização da ${site.name} em ${site.address.city}`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-[24rem] w-full border-0"
                />
              </div>
            ) : (
              <CoverageMap cities={areas} />
            )}
          </div>
        </div>
      </section>

      <JsonLd
        data={breadcrumbSchema([
          { name: "Início", path: "/" },
          { name: "Contato", path: "/contato" },
        ])}
      />
    </>
  );
}
