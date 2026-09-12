import { cache } from "react";
import { prisma } from "./db";

export type OpeningHour = { label: string; hours: string };

export const DEFAULT_SETTINGS = {
  brandName: "Padaria Villa Reis",
  tagline: "Pão quente, café fresco e confeitaria artesanal todos os dias.",
  heroTitle: "O sabor de padaria de verdade,\nfeito todo dia na Villa Reis",
  heroSubtitle:
    "Fornada saindo do forno de hora em hora, confeitaria artesanal e um café que vale a caminhada.",
  heroButtonLabel: "Conheça nossos produtos",
  aboutTitle: "Feito na Villa Reis",
  aboutText:
    "Massa madre de fermentação lenta, manteiga de verdade e receitas que a gente repete há anos até acertar o ponto. Nada aqui chega pronto: sai do nosso forno para a sua mesa.",
  phone: "(16) 3000-0000",
  whatsapp: "5516900000000",
  email: "contato@villareis.com.br",
  addressLine: "Rua das Acácias, 120",
  addressDistrict: "Villa Reis",
  addressCity: "Ribeirão Preto - SP",
  addressZip: "14000-000",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Padaria+Villa+Reis",
  mapEmbedUrl: "",
  instagramUrl: "https://instagram.com/padariavillareis",
  instagramHandle: "@padariavillareis",
  facebookUrl: "",
  openingHours: JSON.stringify([
    { label: "Segunda a sexta", hours: "05h30 às 20h00" },
    { label: "Sábado", hours: "05h30 às 19h00" },
    { label: "Domingo e feriados", hours: "06h00 às 13h00" },
  ] satisfies OpeningHour[]),
  orderingEnabled: "true",
  deliveryEnabled: "true",
  deliveryNote: "Entrega em até 3 km da loja. Taxa combinada pelo WhatsApp.",
  minOrderCents: "0",
  instagramSectionTitle: "Siga a Villa Reis",
  instagramSectionText: "Confira nossas novidades, produtos e momentos especiais.",
  seoTitle: "Padaria Villa Reis | Pães artesanais, confeitaria e café",
  seoDescription:
    "Pães de fermentação natural, bolos, tortas, salgados e cafeteria em Ribeirão Preto. Peça pelo WhatsApp ou retire na loja.",
  logoMediaId: "",
  ogImageMediaId: "",
};

export type SettingsKey = keyof typeof DEFAULT_SETTINGS;
export type Settings = Record<SettingsKey, string>;

/** Lido uma vez por requisição (React cache) e mesclado com os padrões. */
export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await prisma.setting.findMany().catch(() => []);
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...DEFAULT_SETTINGS, ...stored } as Settings;
});

export async function saveSettings(values: Partial<Settings>): Promise<void> {
  const entries = Object.entries(values).filter(([key]) => key in DEFAULT_SETTINGS);
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(value ?? "") },
        create: { key, value: String(value ?? "") },
      }),
    ),
  );
}

export function parseOpeningHours(raw: string): OpeningHour[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((item) => item?.label);
  } catch {
    /* valor inválido: cai no padrão */
  }
  return JSON.parse(DEFAULT_SETTINGS.openingHours);
}

export function fullAddress(settings: Settings): string {
  return [settings.addressLine, settings.addressDistrict, settings.addressCity, settings.addressZip]
    .filter(Boolean)
    .join(", ");
}
