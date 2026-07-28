import { prisma, safeQuery } from "@/lib/db";
import { plans as staticPlans, type PlanContent } from "@/content/plans";
import { services as staticServices, type ServiceContent } from "@/content/services";
import { cities as staticCities } from "@/content/cities";

/**
 * Catálogo lido do banco (o painel administrativo altera preços e ativa/desativa itens),
 * com o conteúdo estático de `src/content` como fallback.
 *
 * Isso garante que as páginas públicas continuem renderizando — e o build continue
 * passando — mesmo sem banco disponível.
 */

export type CatalogPlan = PlanContent & { id?: string };
export type CatalogService = ServiceContent & { id?: string };

export async function getPlans(): Promise<CatalogPlan[]> {
  return safeQuery(async () => {
    const rows = await prisma.plan.findMany({ where: { active: true }, orderBy: { order: "asc" } });
    if (!rows.length) return staticPlans;

    return rows.map((row) => {
      const base = staticPlans.find((p) => p.slug === row.slug);
      const features = parseJson<string[]>(row.features, base?.features ?? []);
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        tagline: row.tagline,
        priceMonthly: row.priceMonthly,
        priceYearly: row.priceYearly,
        visitsPerMonth: row.visitsPerMonth,
        maxAreaM2: row.maxAreaM2,
        features,
        highlight: row.highlight,
        badge: row.badge ?? undefined,
        // As faixas por porte de terreno vivem no conteúdo; o admin ajusta o valor base.
        areaTiers: scaleTiers(base?.areaTiers ?? [], base?.priceMonthly ?? row.priceMonthly, row.priceMonthly),
        catalogPriced: base?.catalogPriced ?? false,
      } satisfies CatalogPlan;
    });
  }, staticPlans);
}

/** Reajusta proporcionalmente as faixas de área quando o admin muda o preço base. */
function scaleTiers(tiers: PlanContent["areaTiers"], oldBase: number, newBase: number) {
  if (!tiers.length || oldBase === newBase || oldBase <= 0) return tiers;
  const factor = newBase / oldBase;
  return tiers.map((tier) => ({
    ...tier,
    price: tier.price > 0 ? Math.round((tier.price * factor) / 1000) * 1000 : 0,
  }));
}

export async function getServices(): Promise<CatalogService[]> {
  return safeQuery(async () => {
    const rows = await prisma.service.findMany({ where: { active: true }, orderBy: { order: "asc" } });
    if (!rows.length) return staticServices;

    return rows
      .flatMap<CatalogService>((row) => {
        const base = staticServices.find((s) => s.slug === row.slug);
        if (!base) return [];
        return {
          ...base,
          id: row.id,
          name: row.name,
          shortDesc: row.shortDesc,
          description: row.description,
          durationMin: row.durationMin,
          featured: row.featured,
          // O preço por m² é editável no admin; `basePrice` guarda o mínimo por visita.
          pricing:
            row.pricePerM2 > 0
              ? { kind: "m2" as const, minPerM2: row.pricePerM2, maxPerM2: Math.round(row.pricePerM2 * 1.8), band: base.pricing.kind === "m2" ? base.pricing.band : "Corte de Grama Padrão" }
              : base.pricing,
          seoTitle: row.seoTitle ?? base.seoTitle,
          seoDescription: row.seoDescription ?? base.seoDescription,
        } satisfies CatalogService;
      });
  }, staticServices);
}

export async function getServiceAreas() {
  return safeQuery(async () => {
    const rows = await prisma.serviceArea.findMany({ where: { active: true }, orderBy: { order: "asc" } });
    if (!rows.length) return staticCities;
    return rows.map((row) => {
      const base = staticCities.find((c) => c.slug === row.slug);
      return {
        slug: row.slug,
        city: row.city,
        state: row.state,
        x: base?.x ?? 50,
        y: base?.y ?? 50,
        hub: base?.hub ?? false,
        neighborhoods: base?.neighborhoods ?? [],
        responseTime: base?.responseTime ?? "72h",
      };
    });
  }, staticCities);
}

/** Depoimentos publicados a partir das pesquisas de satisfação, com fallback no conteúdo. */
export async function getPublishedReviews(limit = 12) {
  return safeQuery(async () => {
    const rows = await prisma.satisfactionSurvey.findMany({
      where: { publish: true, comment: { not: null }, rating: { gte: 4 } },
      orderBy: { answeredAt: "desc" },
      take: limit,
      include: { booking: { select: { contactName: true, city: true, serviceName: true } } },
    });
    return rows.map((row) => ({
      name: row.booking.contactName,
      city: row.booking.city,
      role: row.booking.serviceName,
      rating: (row.rating ?? 5) as 1 | 2 | 3 | 4 | 5,
      text: row.comment ?? "",
    }));
  }, []);
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
