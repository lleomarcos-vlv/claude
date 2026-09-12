import { env } from "@/lib/env";
import { parseOpeningHours, type Settings } from "@/lib/settings";

const DAY_MAP: Record<string, string[]> = {
  "segunda a sexta": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "segunda a sabado": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  sabado: ["Saturday"],
  domingo: ["Sunday"],
  "domingo e feriados": ["Sunday", "PublicHolidays"],
};

/** Compara sem acento: o administrador pode escrever "Sábado" ou "Sabado". */
function dayKey(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Schema.org Bakery: melhora a exibição no Google e no Maps. */
export function StructuredData({ settings }: { settings: Settings }) {
  const hours = parseOpeningHours(settings.openingHours);

  const data = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: settings.brandName,
    description: settings.seoDescription,
    url: env.siteUrl,
    telephone: settings.phone,
    image: `${env.siteUrl}/og.png`,
    priceRange: "$$",
    servesCuisine: ["Padaria", "Confeitaria", "Cafeteria"],
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.addressLine,
      addressLocality: settings.addressCity,
      postalCode: settings.addressZip,
      addressCountry: "BR",
    },
    sameAs: [settings.instagramUrl, settings.facebookUrl].filter(Boolean),
    openingHoursSpecification: hours.map((hour) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DAY_MAP[dayKey(hour.label)] ?? [hour.label],
      opens: hour.hours.split(/as|às|-/)[0]?.trim().replace("h", ":").replace(/:$/, ":00"),
      closes: hour.hours.split(/as|às|-/)[1]?.trim().replace("h", ":").replace(/:$/, ":00"),
    })),
    potentialAction: {
      "@type": "OrderAction",
      target: `${env.siteUrl}/carrinho`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
