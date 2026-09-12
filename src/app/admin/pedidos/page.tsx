import { OrdersBoard } from "@/components/admin/orders-board";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Atendimento</p>
        <h1 className="mt-1 font-display text-3xl">Pedidos</h1>
        <p className="mt-1 text-sm text-muted">
          Todo pedido enviado pelo site fica registrado aqui, mesmo que a conversa continue no
          WhatsApp.
        </p>
      </header>

      <OrdersBoard
        orders={orders.map((order) => ({
          id: order.id,
          code: order.code,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          fulfillment: order.fulfillment,
          address: order.address,
          notes: order.notes,
          totalCents: order.totalCents,
          status: order.status,
          createdAt: order.createdAt.toISOString(),
          items: order.items.map((item) => ({
            name: item.productName,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
          })),
        }))}
      />
    </div>
  );
}
