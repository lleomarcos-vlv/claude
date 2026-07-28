import { MIN_VISIT_PRICE, serviceBySlug, type ServiceContent } from "@/content/services";
import { planBySlug, planPriceForArea, plans, type PlanContent, type AreaTier } from "@/content/plans";
import type { FrequencyValue } from "@/lib/site";

export const visitsPerMonthByFrequency: Record<FrequencyValue, number> = {
  unica: 1,
  mensal: 1,
  quinzenal: 2,
  semanal: 4,
};

export type Range = { min: number; max: number };

export type Estimate = {
  service: ServiceContent;
  areaM2: number;
  frequency: FrequencyValue;
  visitsPerMonth: number;
  /** Faixa por visita, em centavos. `null` quando o serviço exige orçamento. */
  perVisit: Range | null;
  /** Faixa mensal considerando a frequência, em centavos. */
  monthly: Range | null;
  /** `true` quando o valor mínimo de visita de R$ 200 prevaleceu sobre o cálculo por m². */
  minVisitApplied: boolean;
  /** `true` quando a precificação depende de projeto (paisagismo, poda, plantio, irrigação). */
  quoteOnly: boolean;
  /** `true` quando a área ultrapassa as faixas tabeladas do catálogo. */
  aboveTable: boolean;
  recommended: PlanRecommendation | null;
  alternatives: PlanRecommendation[];
};

export type PlanRecommendation = {
  plan: PlanContent;
  tier: AreaTier | null;
  /** Mensalidade do plano na faixa de área, em centavos. `null` = sob orçamento. */
  price: number | null;
  /** Economia mensal frente ao avulso equivalente, em centavos. */
  savings: Range | null;
  reason: string;
};

/** Serviços que o plano em questão já cobre, para justificar a recomendação. */
const planCoverage: Record<string, string[]> = {
  essencial: ["corte-de-grama", "jardinagem"],
  verde: ["corte-de-grama", "jardinagem", "poda", "adubacao", "controle-de-pragas"],
  premium: [
    "corte-de-grama",
    "jardinagem",
    "poda",
    "adubacao",
    "controle-de-pragas",
    "paisagismo",
    "irrigacao",
    "plantio",
    "revitalizacao-de-jardins",
  ],
};

function clampArea(areaM2: number) {
  return Math.max(1, Math.min(100_000, Math.round(areaM2)));
}

/** Faixa por visita para um serviço tarifado por m², já aplicando o valor mínimo de visita. */
export function perVisitRange(service: ServiceContent, areaM2: number): { range: Range; minApplied: boolean } | null {
  if (service.pricing.kind !== "m2") return null;
  const raw = {
    min: Math.round(areaM2 * service.pricing.minPerM2),
    max: Math.round(areaM2 * service.pricing.maxPerM2),
  };
  const minApplied = raw.min < MIN_VISIT_PRICE;
  return {
    range: { min: Math.max(raw.min, MIN_VISIT_PRICE), max: Math.max(raw.max, MIN_VISIT_PRICE) },
    minApplied,
  };
}

/**
 * Simulador de valores: estima o avulso e aponta o pacote do Clube Verde Fixo
 * mais vantajoso para a combinação informada.
 */
export function estimate(input: { serviceSlug: string; areaM2: number; frequency: FrequencyValue }): Estimate | null {
  const service = serviceBySlug(input.serviceSlug);
  if (!service) return null;

  const areaM2 = clampArea(input.areaM2);
  const visitsPerMonth = visitsPerMonthByFrequency[input.frequency] ?? 1;
  const visit = perVisitRange(service, areaM2);

  const perVisit = visit?.range ?? null;
  const monthly = perVisit
    ? { min: perVisit.min * visitsPerMonth, max: perVisit.max * visitsPerMonth }
    : null;

  const ranked = plans
    .map((plan) => buildRecommendation(plan, service, areaM2, visitsPerMonth, monthly))
    .filter((r): r is PlanRecommendation => r !== null);

  const recommended = pickBest(ranked, service, visitsPerMonth);

  return {
    service,
    areaM2,
    frequency: input.frequency,
    visitsPerMonth,
    perVisit,
    monthly,
    minVisitApplied: visit?.minApplied ?? false,
    quoteOnly: service.pricing.kind === "quote",
    aboveTable: areaM2 > 300,
    recommended,
    alternatives: ranked.filter((r) => r.plan.slug !== recommended?.plan.slug),
  };
}

function buildRecommendation(
  plan: PlanContent,
  service: ServiceContent,
  areaM2: number,
  visitsPerMonth: number,
  monthlyAvulso: Range | null,
): PlanRecommendation | null {
  const tier = planPriceForArea(plan, areaM2);
  const price = tier && tier.price > 0 ? tier.price : null;

  // Se o plano entrega menos visitas do que a frequência pedida, ele não resolve.
  const planVisits = plan.visitsPerMonth === -1 ? Infinity : plan.visitsPerMonth;
  if (planVisits < visitsPerMonth) return null;

  const covers = planCoverage[plan.slug]?.includes(service.slug) ?? false;

  const savings =
    price !== null && monthlyAvulso && covers
      ? { min: monthlyAvulso.min - price, max: monthlyAvulso.max - price }
      : null;

  return { plan, tier, price, savings, reason: reasonFor(plan, service, visitsPerMonth, covers) };
}

function reasonFor(plan: PlanContent, service: ServiceContent, visitsPerMonth: number, covers: boolean) {
  if (!covers) return `Cobre a manutenção do jardim; ${service.name.toLowerCase()} entra como serviço extra com desconto.`;
  if (plan.visitsPerMonth === -1) return "Visitas ilimitadas, paisagismo e irrigação inclusos.";
  if (plan.visitsPerMonth === visitsPerMonth) return `Entrega exatamente as ${visitsPerMonth} visitas por mês que você precisa.`;
  return `Inclui ${plan.visitsPerMonth} visitas por mês — folga para a alta temporada.`;
}

function pickBest(ranked: PlanRecommendation[], service: ServiceContent, visitsPerMonth: number) {
  if (!ranked.length) return null;

  // Serviços de projeto puxam o Premium; poda/adubação/pragas puxam o Verde.
  const premiumOnly = ["paisagismo", "irrigacao"];
  const verdeOnly = ["poda", "adubacao", "controle-de-pragas"];

  if (premiumOnly.includes(service.slug)) {
    return ranked.find((r) => r.plan.slug === "premium") ?? ranked[ranked.length - 1];
  }
  if (verdeOnly.includes(service.slug)) {
    return ranked.find((r) => r.plan.slug === "verde") ?? ranked[ranked.length - 1];
  }

  // Caso geral: o plano mais barato que cubra a frequência pedida.
  const covering = ranked.filter((r) => {
    const v = r.plan.visitsPerMonth === -1 ? Infinity : r.plan.visitsPerMonth;
    return v >= visitsPerMonth;
  });
  const pool = covering.length ? covering : ranked;
  return pool.reduce((best, cur) => ((cur.price ?? Infinity) < (best.price ?? Infinity) ? cur : best), pool[0]);
}

/** Estimativa usada no formulário de orçamento (grava no lead o valor de referência). */
export function quickEstimateCents(serviceSlug: string, areaM2?: number | null) {
  if (!areaM2 || areaM2 <= 0) return 0;
  const service = serviceBySlug(serviceSlug);
  if (!service) return 0;
  const visit = perVisitRange(service, clampArea(areaM2));
  return visit ? Math.round((visit.range.min + visit.range.max) / 2) : 0;
}

export function planMonthlyForArea(planSlug: string, areaM2: number) {
  const plan = planBySlug(planSlug);
  if (!plan) return null;
  const tier = planPriceForArea(plan, clampArea(areaM2));
  return tier && tier.price > 0 ? tier.price : null;
}
