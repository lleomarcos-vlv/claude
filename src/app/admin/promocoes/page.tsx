import { PromotionsManager } from "@/components/admin/promotions-manager";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPromotionsPage() {
  const [promotions, products] = await Promise.all([
    prisma.promotion.findMany({
      include: { product: { select: { name: true, priceCents: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, priceCents: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Vendas</p>
        <h1 className="mt-1 font-display text-3xl">Promoções</h1>
        <p className="mt-1 text-sm text-muted">
          Enquanto a promoção estiver ativa e dentro do periodo, o preço novo vale no site inteiro.
        </p>
      </header>

      <PromotionsManager
        products={products}
        initial={promotions.map((promotion) => ({
          id: promotion.id,
          productName: promotion.product.name,
          oldPriceCents: promotion.oldPriceCents,
          newPriceCents: promotion.newPriceCents,
          discountPct: promotion.discountPct,
          active: promotion.active,
          startsAt: promotion.startsAt ? promotion.startsAt.toISOString().slice(0, 10) : "",
          endsAt: promotion.endsAt ? promotion.endsAt.toISOString().slice(0, 10) : "",
        }))}
      />
    </div>
  );
}
