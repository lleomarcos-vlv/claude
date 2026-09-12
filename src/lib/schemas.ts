import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform((value) => value || null);

const optionalDate = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => (value ? new Date(value) : null));

export const productSchema = z.object({
  name: z.string().trim().min(2, "informe o nome do produto"),
  slug: optionalText(90),
  shortDesc: optionalText(200),
  description: optionalText(4000),
  ingredients: optionalText(2000),
  extraInfo: optionalText(2000),
  priceCents: z.coerce.number().int().min(0, "preço inválido"),
  unit: z.string().trim().max(20).default("un"),
  categoryId: z.string().min(1, "selecione a categoria"),
  mainImageId: optionalText(40),
  mediaIds: z.array(z.string().min(1)).max(40).default([]),
  available: z.boolean().default(true),
  featured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  artisanal: z.boolean().default(false),
  orderable: z.boolean().default(true),
  position: z.coerce.number().int().min(0).default(0),
});

export const productPatchSchema = productSchema.partial();

export const categorySchema = z.object({
  name: z.string().trim().min(2, "informe o nome da categoria"),
  slug: optionalText(90),
  description: optionalText(400),
  emoji: optionalText(8),
  imageId: optionalText(40),
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
  forOrders: z.boolean().default(false),
});

export const categoryPatchSchema = categorySchema.partial();

export const bannerSchema = z.object({
  title: optionalText(160),
  subtitle: optionalText(300),
  buttonLabel: optionalText(60),
  buttonLink: optionalText(300),
  mediaId: optionalText(40),
  placement: z.enum(["hero", "faixa"]).default("hero"),
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  startsAt: optionalDate,
  endsAt: optionalDate,
});

export const bannerPatchSchema = bannerSchema.partial();

export const promotionSchema = z.object({
  title: optionalText(160),
  productId: z.string().min(1, "selecione o produto"),
  newPriceCents: z.coerce.number().int().min(1, "informe o preço promocional"),
  oldPriceCents: z.coerce.number().int().min(1).optional(),
  startsAt: optionalDate,
  endsAt: optionalDate,
  active: z.boolean().default(true),
  mediaId: optionalText(40),
});

export const promotionPatchSchema = promotionSchema.partial().extend({
  productId: z.string().min(1).optional(),
});

export const gallerySchema = z.object({
  title: optionalText(160),
  caption: optionalText(300),
  mediaId: z.string().min(1, "selecione a foto ou o vídeo"),
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const galleryPatchSchema = gallerySchema.partial();

export const instagramSchema = z.object({
  caption: optionalText(300),
  link: optionalText(300),
  mediaId: z.string().min(1, "selecione a foto ou o vídeo"),
  position: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const instagramPatchSchema = instagramSchema.partial();

export const ORDER_STATUSES = [
  "novo",
  "confirmado",
  "preparacao",
  "pronto",
  "entregue",
  "cancelado",
] as const;

export const CUSTOM_ORDER_STATUSES = [
  "novo",
  "orcado",
  "confirmado",
  "concluido",
  "cancelado",
] as const;

export const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES) });
export const customOrderStatusSchema = z.object({ status: z.enum(CUSTOM_ORDER_STATUSES) });

export const ORDER_STATUS_LABEL: Record<(typeof ORDER_STATUSES)[number], string> = {
  novo: "Novo",
  confirmado: "Confirmado",
  preparacao: "Em preparacao",
  pronto: "Pronto",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const CUSTOM_ORDER_STATUS_LABEL: Record<(typeof CUSTOM_ORDER_STATUSES)[number], string> = {
  novo: "Novo",
  orcado: "Orçamento enviado",
  confirmado: "Confirmado",
  concluido: "Concluido",
  cancelado: "Cancelado",
};
