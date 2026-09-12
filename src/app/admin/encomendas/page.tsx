import { CustomOrdersBoard } from "@/components/admin/custom-orders-board";
import { prisma } from "@/lib/db";
import { mediaUrls } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function AdminCustomOrdersPage() {
  const orders = await prisma.customOrder.findMany({
    include: { referenceMedia: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Atendimento</p>
        <h1 className="mt-1 font-display text-3xl">Encomendas</h1>
        <p className="mt-1 text-sm text-muted">Solicitações de orçamento enviadas pelo site.</p>
      </header>

      <CustomOrdersBoard
        orders={orders.map((order) => ({
          id: order.id,
          code: order.code,
          name: order.name,
          phone: order.phone,
          desiredDate: order.desiredDate ? order.desiredDate.toISOString().slice(0, 10) : null,
          desiredTime: order.desiredTime,
          peopleCount: order.peopleCount,
          categoryName: order.categoryName,
          productName: order.productName,
          description: order.description,
          notes: order.notes,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          referenceUrl: mediaUrls(order.referenceMedia)?.desktop ?? null,
        }))}
      />
    </div>
  );
}
