import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyStripeSignature } from "@/lib/payments";

export const dynamic = "force-dynamic";

/**
 * Webhook da Stripe.
 *
 * A assinatura é verificada sobre o corpo **cru** (`request.text()`) — qualquer
 * reserialização quebraria o HMAC. Eventos tratados: checkout concluído,
 * fatura paga e falha de cobrança.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const verification = await verifyStripeSignature(rawBody, request.headers.get("stripe-signature"));
  if (!verification.ok) {
    return NextResponse.json({ ok: false, error: verification.reason }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody) as {
      type: string;
      data: { object: Record<string, unknown> };
    };

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as { client_reference_id?: string; subscription?: string };
        const userIdPrefix = /^sub_([^_]+)_/.exec(session.client_reference_id ?? "")?.[1];
        if (!userIdPrefix) break;

        const subscription = await prisma.subscription.findFirst({
          where: { userId: { startsWith: userIdPrefix } },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });
        if (!subscription) break;

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "ATIVA", providerSubId: session.subscription ?? null },
        });
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as { subscription?: string };
        if (!invoice.subscription) break;

        const subscription = await prisma.subscription.findFirst({
          where: { providerSubId: invoice.subscription },
          select: { id: true },
        });
        if (!subscription) break;

        await prisma.$transaction([
          prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ATIVA" } }),
          prisma.invoice.updateMany({
            where: { subscriptionId: subscription.id, status: { in: ["PENDENTE", "ATRASADA"] } },
            data: { status: "PAGA", paidAt: new Date(), method: "cartao" },
          }),
        ]);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as { subscription?: string };
        if (!invoice.subscription) break;

        await prisma.subscription.updateMany({
          where: { providerSubId: invoice.subscription },
          data: { status: "INADIMPLENTE" },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as { id?: string };
        if (!subscription.id) break;

        await prisma.subscription.updateMany({
          where: { providerSubId: subscription.id },
          data: { status: "CANCELADA", cancelledAt: new Date(), nextVisitAt: null },
        });
        break;
      }
    }

    return NextResponse.json({ ok: true, received: event.type });
  } catch (error) {
    console.error("[webhook:stripe]", error);
    return NextResponse.json({ ok: false, error: "erro ao processar evento" }, { status: 400 });
  }
}
