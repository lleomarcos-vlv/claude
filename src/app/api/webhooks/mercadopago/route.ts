import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

/**
 * Webhook do Mercado Pago.
 *
 * Reconciliação: quando o pagamento é aprovado, marcamos a fatura como PAGA e
 * reativamos a assinatura se ela estava inadimplente. Sempre respondemos 200 para
 * o Mercado Pago não reenfileirar o evento indefinidamente — falhas ficam no log.
 */
export async function POST(request: Request) {
  try {
    const secret = await getConfig("MERCADOPAGO_WEBHOOK_SECRET");
    // O Mercado Pago envia a assinatura em x-signature; sem segredo configurado,
    // seguimos apenas em desenvolvimento.
    if (secret) {
      const signature = request.headers.get("x-signature") ?? "";
      if (!signature.includes(secret) && !signature.includes("v1=")) {
        return NextResponse.json({ ok: false, error: "Assinatura inválida." }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Webhook não configurado." }, { status: 503 });
    }

    const event = (await request.json().catch(() => ({}))) as {
      type?: string;
      action?: string;
      data?: { id?: string };
    };

    const paymentId = event.data?.id;
    if (!paymentId) return NextResponse.json({ ok: true, ignored: "sem id" });

    // Consulta o pagamento na origem — nunca confiamos no corpo do webhook.
    const token = await getConfig("MERCADOPAGO_ACCESS_TOKEN");
    if (!token) return NextResponse.json({ ok: true, ignored: "sem credencial" });

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      console.error(`[webhook:mercadopago] consulta falhou ${res.status}`);
      return NextResponse.json({ ok: true, ignored: "consulta falhou" });
    }

    const payment = (await res.json()) as {
      status?: string;
      external_reference?: string;
      transaction_amount?: number;
      payment_method_id?: string;
    };

    if (payment.status !== "approved") {
      return NextResponse.json({ ok: true, status: payment.status });
    }

    const reference = payment.external_reference ?? "";
    const userIdPrefix = /^sub_([^_]+)_/.exec(reference)?.[1];

    if (userIdPrefix) {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: { startsWith: userIdPrefix }, status: { in: ["ATIVA", "INADIMPLENTE"] } },
        orderBy: { createdAt: "desc" },
        select: { id: true, userId: true },
      });

      if (subscription) {
        await prisma.$transaction([
          prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ATIVA" } }),
          prisma.invoice.updateMany({
            where: { subscriptionId: subscription.id, status: { in: ["PENDENTE", "ATRASADA"] } },
            data: { status: "PAGA", paidAt: new Date(), method: payment.payment_method_id ?? "pix" },
          }),
        ]);
      }
    } else {
      // Pagamento de serviço avulso: o protocolo vai no external_reference.
      await prisma.booking.updateMany({
        where: { protocol: reference },
        data: { paymentStatus: "PAGO", paymentMethod: payment.payment_method_id ?? "pix" },
      });
    }

    return NextResponse.json({ ok: true, processed: true });
  } catch (error) {
    console.error("[webhook:mercadopago]", error);
    return NextResponse.json({ ok: true, error: "erro registrado" });
  }
}
