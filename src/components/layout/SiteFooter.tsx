import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { site, whatsappLink } from "@/lib/site";
import { services } from "@/content/services";
import { plans } from "@/content/plans";
import { cities } from "@/content/cities";

const columns = [
  {
    title: "Serviços",
    links: services.slice(0, 6).map((s) => ({ href: `/servicos/${s.slug}`, label: s.name })),
    extra: { href: "/servicos", label: "Ver todos os serviços" },
  },
  {
    title: "Clube Verde Fixo",
    links: [
      ...plans.map((p) => ({ href: `/planos#${p.slug}`, label: p.name })),
      { href: "/planos", label: "Comparar planos" },
      { href: "/simulador", label: "Simulador de valores" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/sobre", label: "Sobre a Verde Fixo" },
      { href: "/antes-e-depois", label: "Antes e depois" },
      { href: "/avaliacoes", label: "Avaliações" },
      { href: "/atendemos", label: "Onde atendemos" },
      { href: "/blog", label: "Blog de jardinagem" },
      { href: "/faq", label: "Perguntas frequentes" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-mesh-verde text-white">
      {/* Faixa de newsletter */}
      <div className="border-b border-white/10">
        <div className="container-page grid gap-8 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <h2 className="text-title font-semibold text-white">
              Dicas de jardinagem que realmente funcionam
            </h2>
            <p className="mt-3 max-w-lg text-[0.9375rem] leading-relaxed text-verde-200">
              Um e-mail por mês com o que fazer no seu jardim naquela estação, escrito pelo nosso agrônomo.
              Sem promoção disfarçada de dica.
            </p>
          </div>
          <NewsletterForm source="footer" variant="dark" />
        </div>
      </div>

      {/* Colunas */}
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.3fr_repeat(3,1fr)]">
        <div>
          <Logo height={30} variant="light" />
          <p className="mt-5 max-w-xs text-[0.9375rem] leading-relaxed text-verde-200">{site.slogan}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-verde-300/80">
            Profissionalismo, comodidade e jardim impecável — com equipe própria, desde {site.founded}.
          </p>

          <div className="mt-7 flex gap-2.5">
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-verde-200 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
              >
                <Icon name={s.icon} size={18} />
              </a>
            ))}
          </div>

          <div className="mt-7 space-y-2.5 text-sm text-verde-200">
            <a href={whatsappLink()} target="_blank" rel="noopener" className="flex items-center gap-2.5 hover:text-white">
              <Icon name="whatsapp" size={16} className="text-verde-300" />
              {site.whatsappLabel}
            </a>
            <a href={site.phoneHref} className="flex items-center gap-2.5 hover:text-white">
              <Icon name="phone" size={16} className="text-verde-300" />
              {site.phone}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-2.5 hover:text-white">
              <Icon name="mail" size={16} className="text-verde-300" />
              {site.email}
            </a>
            <p className="flex items-start gap-2.5">
              <Icon name="map-pin" size={16} className="mt-0.5 shrink-0 text-verde-300" />
              <span>
                {site.address.street} — {site.address.district}
                <br />
                {site.address.city}/{site.address.state} · CEP {site.address.zip}
              </span>
            </p>
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold tracking-[0.1em] text-white uppercase">{col.title}</h3>
            <ul className="mt-5 space-y-3 text-[0.9375rem]">
              {col.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-verde-200 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
              {col.extra ? (
                <li>
                  <Link href={col.extra.href} className="inline-flex items-center gap-1.5 font-medium text-verde-300 hover:text-white">
                    {col.extra.label}
                    <Icon name="arrow-right" size={15} />
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>
        ))}
      </div>

      {/* Cidades atendidas — reforço de SEO local */}
      <div className="border-t border-white/10">
        <div className="container-page py-8">
          <h3 className="text-xs font-semibold tracking-[0.12em] text-verde-300 uppercase">
            Atendemos {cities.length} cidades na região de Campinas
          </h3>
          <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-1.5 text-sm text-verde-200">
            {cities.map((c, i) => (
              <li key={c.slug} className="flex items-center gap-2">
                <Link href={`/atendemos/${c.slug}`} className="transition-colors hover:text-white">
                  {c.city}
                </Link>
                {i < cities.length - 1 ? <span aria-hidden className="text-white/20">·</span> : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Base legal */}
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-7 text-sm text-verde-300/80 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.legalName} · CNPJ {site.cnpj}
          </p>
          <nav aria-label="Links legais" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacidade" className="hover:text-white">
              Política de Privacidade
            </Link>
            <Link href="/cookies" className="hover:text-white">
              Cookies
            </Link>
            <Link href="/termos" className="hover:text-white">
              Termos de Uso
            </Link>
            <Link href="/admin" className="hover:text-white">
              Área administrativa
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
