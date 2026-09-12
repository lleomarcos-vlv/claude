import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { SectionHeading } from "@/components/section-heading";
import { fullAddress, getSettings, parseOpeningHours } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Onde estamos",
  description: "Endereço, horários, telefone e WhatsApp da Padaria Villa Reis.",
};

export default async function ContactPage() {
  const settings = await getSettings();
  const hours = parseOpeningHours(settings.openingHours);

  return (
    <div className="container-vr py-12 sm:py-16">
      <SectionHeading
        kicker="Venha tomar um café"
        title="Onde estamos"
        description="Estamos a poucos minutos de você, com estacionamento na porta e atendimento no balcão."
      />

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div className="card overflow-hidden">
          {settings.mapEmbedUrl ? (
            <iframe
              src={settings.mapEmbedUrl}
              title="Mapa da Padaria Villa Reis"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[22rem] w-full border-0"
            />
          ) : (
            <div className="flex h-[22rem] w-full flex-col items-center justify-center gap-4 bg-[linear-gradient(140deg,#ecdcc6,#f5ebdd)] p-8 text-center">
              <p className="font-display text-2xl text-espresso">{fullAddress(settings)}</p>
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-primary"
              >
                Como chegar
              </a>
            </div>
          )}

          <div className="grid gap-6 p-8 sm:grid-cols-2">
            <div>
              <p className="kicker">Endereço</p>
              <p className="mt-2 leading-relaxed text-ink">{fullAddress(settings)}</p>
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-block text-sm font-semibold text-crust underline-offset-4 hover:underline"
              >
                Abrir no Google Maps →
              </a>
            </div>

            <div>
              <p className="kicker">Horários</p>
              <ul className="mt-2 space-y-1 text-sm text-ink">
                {hours.map((hour) => (
                  <li key={hour.label} className="flex justify-between gap-3">
                    <span className="text-muted">{hour.label}</span>
                    <span className="font-medium">{hour.hours}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="kicker">Telefone</p>
              <p className="mt-2 text-ink">{settings.phone}</p>
            </div>

            <div>
              <p className="kicker">Redes</p>
              <div className="mt-2 flex flex-col gap-1 text-sm">
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-crust underline-offset-4 hover:underline"
                >
                  {settings.instagramHandle}
                </a>
                <a
                  href={whatsappLink(settings.whatsapp, `Ola, ${settings.brandName}!`)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-crust underline-offset-4 hover:underline"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="font-display text-2xl">Fale conosco</h2>
          <p className="mt-2 text-sm text-muted">
            Sugestao, elogio ou dúvida: a gente responde no mesmo dia.
          </p>
          <ContactForm className="mt-6" />
          <a
            href={whatsappLink(settings.whatsapp, `Ola, ${settings.brandName}!`)}
            target="_blank"
            rel="noreferrer noopener"
            className="btn btn-whats mt-4 w-full"
          >
            Prefiro falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
