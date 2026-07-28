/**
 * Configuração central da marca. Tudo que aparece em múltiplas páginas
 * (NAP, redes sociais, horários, links de conversão) vive aqui.
 */

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://verdefixo.com.br").replace(/\/$/, "");

export const site = {
  name: "Verde Fixo",
  legalName: "Verde Fixo Jardinagem e Paisagismo LTDA",
  slogan: "Seu jardim sempre impecável.",
  description:
    "Corte de grama, paisagismo, poda e manutenção de jardins com equipe própria. Agende online ou assine um plano mensal e tenha um jardim impecável o ano inteiro.",
  url: siteUrl,
  cnpj: "48.912.334/0001-07",
  founded: "2018",

  phone: "+55 11 92685-7062",
  phoneHref: "tel:+5511926857062",
  /** Número no formato aceito pela API do WhatsApp (país + DDD + número). */
  whatsapp: "5511926857062",
  whatsappLabel: "(11) 92685-7062",
  email: "contato@verdefixo.com.br",
  supportEmail: "atendimento@verdefixo.com.br",

  address: {
    street: "Av. das Palmeiras, 1240",
    district: "Jardim Botânico",
    city: "Campinas",
    state: "SP",
    zip: "13092-120",
    country: "BR",
    lat: -22.8613,
    lng: -47.0426,
  },

  hours: [
    { days: "Segunda a sexta", time: "07h às 19h" },
    { days: "Sábado", time: "07h às 15h" },
    { days: "Domingo e feriados", time: "Plantão para planos Premium" },
  ],
  /** Formato Schema.org openingHours */
  openingHoursSpec: [
    { days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "19:00" },
    { days: ["Saturday"], opens: "07:00", closes: "15:00" },
  ],

  social: {
    instagram: "https://instagram.com/verdefixo",
    facebook: "https://facebook.com/verdefixo",
    youtube: "https://youtube.com/@verdefixo",
    linkedin: "https://linkedin.com/company/verdefixo",
  },

  stats: {
    clients: "2.400+",
    gardens: "18 mil+",
    rating: 4.9,
    reviews: 612,
    cities: 14,
    years: 8,
  },

  /** Horários oferecidos no agendamento online. */
  timeSlots: ["07:00", "08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"],

  /** Capacidade de atendimentos por horário (usado no cálculo de disponibilidade). */
  slotCapacity: 3,
} as const;

export function whatsappLink(message?: string) {
  const text = message ?? `Olá! Vim pelo site da ${site.name} e gostaria de um orçamento.`;
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const nav = [
  { href: "/servicos", label: "Serviços" },
  { href: "/planos", label: "Planos" },
  { href: "/antes-e-depois", label: "Antes e Depois" },
  { href: "/atendemos", label: "Atendemos" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
] as const;

export const propertyTypes = [
  { value: "residencia", label: "Residência" },
  { value: "condominio", label: "Condomínio" },
  { value: "empresa", label: "Empresa" },
  { value: "comercio", label: "Comércio" },
  { value: "escola", label: "Escola" },
  { value: "fazenda", label: "Fazenda" },
  { value: "sitio", label: "Sítio" },
  { value: "hotel", label: "Hotel" },
  { value: "pousada", label: "Pousada" },
] as const;

export const frequencies = [
  { value: "unica", label: "Visita única", hint: "Serviço pontual", perMonth: 1 },
  { value: "mensal", label: "Mensal", hint: "1 visita por mês", perMonth: 1 },
  { value: "quinzenal", label: "Quinzenal", hint: "2 visitas por mês", perMonth: 2 },
  { value: "semanal", label: "Semanal", hint: "4 visitas por mês", perMonth: 4 },
] as const;

export type FrequencyValue = (typeof frequencies)[number]["value"];
