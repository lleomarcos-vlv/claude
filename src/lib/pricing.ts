import { discountPercent } from "./money";

type PromotionLike = {
  active: boolean;
  newPriceCents: number;
  oldPriceCents: number;
  startsAt: Date | null;
  endsAt: Date | null;
};

export type ResolvedPrice = {
  priceCents: number;
  oldPriceCents: number | null;
  discountPct: number;
  onSale: boolean;
};

export function isPromotionLive(promo: PromotionLike, now = new Date()): boolean {
  if (!promo.active) return false;
  if (promo.startsAt && promo.startsAt > now) return false;
  if (promo.endsAt && promo.endsAt < now) return false;
  return promo.newPriceCents > 0 && promo.newPriceCents < promo.oldPriceCents;
}

/** Regra única de preço: a promoção vigente mais barata vence. */
export function resolvePrice(
  product: { priceCents: number; promotions?: PromotionLike[] },
  now = new Date(),
): ResolvedPrice {
  const live = (product.promotions ?? []).filter((promo) => isPromotionLive(promo, now));
  if (live.length === 0) {
    return { priceCents: product.priceCents, oldPriceCents: null, discountPct: 0, onSale: false };
  }
  const best = live.reduce((a, b) => (a.newPriceCents <= b.newPriceCents ? a : b));
  return {
    priceCents: best.newPriceCents,
    oldPriceCents: product.priceCents,
    discountPct: discountPercent(product.priceCents, best.newPriceCents),
    onSale: true,
  };
}
