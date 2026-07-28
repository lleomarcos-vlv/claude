import { z } from "zod";
import { propertyTypes } from "@/lib/site";
import { services } from "@/content/services";
import { plans } from "@/content/plans";

const serviceSlugs = services.map((s) => s.slug) as [string, ...string[]];
const planSlugs = plans.map((p) => p.slug) as [string, ...string[]];
const propertyValues = propertyTypes.map((p) => p.value) as [string, ...string[]];

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length >= 10 && v.length <= 11, "Informe um telefone com DDD.");

const optionalPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v === "" || (v.length >= 10 && v.length <= 11), "Informe um telefone com DDD.")
  .optional()
  .or(z.literal(""));

const zip = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 8, "CEP deve ter 8 dígitos.");

const name = z.string().trim().min(3, "Informe seu nome completo.").max(120);
const email = z.string().trim().toLowerCase().email("E-mail inválido.").max(160);
const notes = z.string().trim().max(2000).optional().or(z.literal(""));
const photos = z.array(z.string().max(400)).max(8).optional();

/** Campos anti-spam presentes em todos os formulários públicos. */
const antiSpam = {
  captchaToken: z.string().max(400).optional(),
  captchaAnswer: z.string().max(20).optional(),
  honeypot: z.string().max(200).optional(),
  renderedAt: z.union([z.number(), z.string()]).optional(),
};

export const bookingSchema = z.object({
  serviceSlug: z.enum(serviceSlugs),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Selecione uma data."),
  timeSlot: z.string().regex(/^\d{2}:\d{2}$/, "Selecione um horário."),
  frequency: z.enum(["unica", "semanal", "quinzenal", "mensal"]).default("unica"),

  name,
  email,
  phone,
  whatsapp: optionalPhone,

  zip,
  street: z.string().trim().min(3, "Informe a rua.").max(160),
  number: z.string().trim().min(1, "Informe o número.").max(20),
  complement: z.string().trim().max(80).optional().or(z.literal("")),
  district: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  state: z.string().trim().length(2, "UF inválida.").default("SP"),

  propertyType: z.enum(propertyValues).default("residencia"),
  areaM2: z.coerce.number().int().min(1).max(200_000).optional(),
  notes,
  photos,
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  lgpdConsent: z.literal(true, { message: "É necessário aceitar a Política de Privacidade." }),
  ...antiSpam,
});

export const quoteSchema = z.object({
  name,
  phone,
  whatsapp: optionalPhone,
  email,
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  address: z.string().trim().min(5, "Informe o endereço.").max(200),
  propertyType: z.enum(propertyValues),
  areaM2: z.coerce.number().int().min(1).max(200_000).optional(),
  serviceSlug: z.enum(serviceSlugs),
  frequency: z.enum(["unica", "semanal", "quinzenal", "mensal"]).default("unica"),
  notes,
  photos,
  lgpdConsent: z.literal(true, { message: "É necessário aceitar a Política de Privacidade." }),
  utmSource: z.string().max(80).optional(),
  utmCampaign: z.string().max(80).optional(),
  ...antiSpam,
});

export const contactSchema = z.object({
  name,
  email,
  phone: optionalPhone,
  subject: z.string().trim().min(3, "Informe o assunto.").max(120),
  message: z.string().trim().min(10, "Escreva sua mensagem.").max(2000),
  lgpdConsent: z.literal(true, { message: "É necessário aceitar a Política de Privacidade." }),
  ...antiSpam,
});

export const newsletterSchema = z.object({
  email,
  name: z.string().trim().max(120).optional().or(z.literal("")),
  source: z.string().max(60).optional(),
  ...antiSpam,
});

export const registerSchema = z.object({
  name,
  email,
  phone,
  whatsapp: optionalPhone,
  password: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres.")
    .max(200)
    .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Use letras e números na senha."),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  propertyType: z.enum(propertyValues).optional(),
  areaM2: z.coerce.number().int().min(1).max(200_000).optional(),
  marketingOptIn: z.boolean().optional().default(false),
  lgpdConsent: z.literal(true, { message: "É necessário aceitar a Política de Privacidade." }),
  ...antiSpam,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha.").max(200),
});

export const estimateSchema = z.object({
  serviceSlug: z.enum(serviceSlugs),
  areaM2: z.coerce.number().int().min(1).max(200_000),
  frequency: z.enum(["unica", "semanal", "quinzenal", "mensal"]),
});

export const subscriptionSchema = z.object({
  planSlug: z.enum(planSlugs),
  billingCycle: z.enum(["MENSAL", "ANUAL"]).default("MENSAL"),
  areaM2: z.coerce.number().int().min(1).max(200_000).optional(),
  method: z.enum(["pix", "cartao", "boleto"]).default("pix"),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});

export const changeSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
  action: z.enum(["upgrade", "downgrade", "pause", "resume", "cancel"]),
  planSlug: z.enum(planSlugs).optional(),
  reason: z.string().trim().max(500).optional(),
});

export const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "bot"]), text: z.string().max(1000) }))
    .max(30)
    .optional(),
  lead: z
    .object({
      name: z.string().trim().max(120).optional(),
      phone: z.string().trim().max(30).optional(),
      email: z.string().trim().max(160).optional(),
    })
    .optional(),
});

/** Normaliza erros do Zod para `{ campo: mensagem }`. */
export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    out[key] ??= issue.message;
  }
  return out;
}

export type BookingInput = z.infer<typeof bookingSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
