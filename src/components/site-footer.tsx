import Link from "next/link";
import { Logo } from "./logo";
import { NAV_ITEMS } from "./nav-items";
import { fullAddress, parseOpeningHours, type Settings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export function SiteFooter({ settings }: { settings: Settings }) {
  const hours = parseOpeningHours(settings.openingHours);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-espresso pb-28 pt-16 text-cream/80 lg:pb-16">
      <div className="container-vr grid gap-12 md:grid-cols-3">
        <div>
          <Logo tone="light" brandName={settings.brandName} />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream/70">{settings.tagline}</p>
          <div className="mt-6 flex gap-3">
            {settings.instagramUrl ? (
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 transition hover:border-gold-soft hover:text-gold-soft"
                aria-label="Instagram da padaria"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
                  <circle cx="12" cy="12" r="3.6" />
                  <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
            ) : null}
            <a
              href={whatsappLink(settings.whatsapp, `Ola, ${settings.brandName}!`)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream/25 transition hover:border-gold-soft hover:text-gold-soft"
              aria-label="WhatsApp da padaria"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-8.6 15.06L2 22l5.1-1.33A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.02.79.8-2.95-.19-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.15c-.25-.13-1.45-.71-1.67-.79-.22-.08-.39-.12-.55.13-.16.25-.63.79-.77.95-.14.16-.28.18-.53.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.71-1.32.08-.16.04-.3-.02-.42-.06-.13-.55-1.33-.76-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64 1.53.66 2.13.72 2.9.6.46-.06 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.11-.22-.17-.47-.3Z" />
              </svg>
            </a>
          </div>
        </div>

        <div>
          <h3 className="kicker">Navegue</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition hover:text-gold-soft">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="kicker">Onde estamos</h3>
          <address className="mt-4 space-y-1 text-sm not-italic leading-relaxed text-cream/75">
            <p>{fullAddress(settings)}</p>
            <p>{settings.phone}</p>
          </address>
          <ul className="mt-4 space-y-1 text-sm text-cream/70">
            {hours.map((hour) => (
              <li key={hour.label} className="flex justify-between gap-4">
                <span>{hour.label}</span>
                <span className="text-cream/90">{hour.hours}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="container-vr mt-12 flex flex-col gap-2 border-t border-cream/15 pt-6 text-xs text-cream/50 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {year} {settings.brandName}. Todos os direitos reservados.
        </p>
        <Link href="/admin" className="transition hover:text-gold-soft">
          Área do administrador
        </Link>
      </div>
    </footer>
  );
}
