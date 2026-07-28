import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { changeSubscriptionSchema, subscriptionSchema } from "@/lib/validation";
import { createCheckout } from "@/lib/payments";
import { onSubscriptionCreated, dispatch } from "@/lib/notifications";
import { nextProtocol } from "@/lib/protocol";
import { planPriceForArea } from "@/content/plans";
import { getPlans } from "@/lib/catalog";
import { money } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Contrata um plano do Clube Verde Fixo. */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = subscriptionSchema.parse(await readJson(request));

    const plans = await getPlans();
    const plan = plans.find((p) => p.slug === input.planSlug);
    if (!plan) return fail("Plano não encontrado.", 404);

    const active = await prisma.subscription.findFirst({
      where: { userId: user.id, status: { in: ["ATIVA", "INADIMPLENTE"] } },
      select: { id: true },
    });
    if (active) {
      return fail("Você já tem uma assinatura ativa. Use a opção de alterar plano no seu painel.", 409);
    }

    const areaM2 = input.areaM2 ?? user.areaM2 ?? plan.areaTiers[0].maxM2 ?? 100;
    const tier = planPriceForArea(plan, areaM2);

    if (!tier || tier.price <= 0) {
      return fail(
        `Para ${areaM2} m² o valor é personalizado. Peça um orçamento e nossa equipe fecha o plano com você.`,
        422,
      );
    }

    const price = input.billingCycle === "ANUAL" ? tier.price * 10 : tier.price;
    const planRecord = await prisma.plan.findUnique({ where: { slug: plan.slug }, select: { id: true } });
    if (!planRecord) return fail("Plano indisponível no momento.", 503);

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + (input.billingCycle === "ANUAL" ? 12 : 1));

    const nextVisit = new Date();
    nextVisit.setDate(nextVisit.getDate() + 3);

    // Abre o checkout antes de gravar, para não deixar assinatura órfã se o gateway recusar.
    const checkout = await createCheckout({
      method: input.method,
      amount: price,
      description: `${plan.name} — ${site.name}`,
      recurring: true,
      cycle: input.billingCycle,
      customer: { name: user.name, email: user.email, phone: user.phone },
      reference: `sub_${user.id.slice(0, 8)}_${plan.slug}`,
    });

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: planRecord.id,
        status: checkout.status === "ativo" || checkout.status === "simulado" ? "ATIVA" : "ATIVA",
        billingCycle: input.billingCycle,
        price,
        currentPeriodEnd: periodEnd,
        nextVisitAt: nextVisit,
        provider: checkout.provider,
        providerSubId: checkout.providerId ?? null,
        couponCode: input.couponCode || null,
      },
      select: { id: true },
    });

    // Primeira fatura, já vinculada à assinatura.
    await prisma.invoice.create({
      data: {
        number: await nextProtocol("invoice"),
        userId: user.id,
        subscriptionId: subscription.id,
        amount: price,
        status: checkout.provider === "demo" ? "PAGA" : "PENDENTE",
        dueDate: new Date(),
        paidAt: checkout.provider === "demo" ? new Date() : null,
        method: input.method,
        description: `${plan.name} — primeira ${input.billingCycle === "ANUAL" ? "anuidade" : "mensalidade"}`,
      },
    });

    // Mantém a área do cliente atualizada para futuras estimativas.
    if (input.areaM2 && input.areaM2 !== user.areaM2) {
      await prisma.user.update({ where: { id: user.id }, data: { areaM2: input.areaM2 } });
    }

    await onSubscriptionCreated({
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.whatsapp ?? user.phone ?? "",
      planName: plan.name,
      price,
      cycle: input.billingCycle,
      subscriptionId: subscription.id,
      nextVisitAt: nextVisit,
    });

    return ok(
      {
        subscription: { id: subscription.id, plan: plan.slug, price, cycle: input.billingCycle },
        checkout: { provider: checkout.provider, url: checkout.url, pixCode: checkout.pixCode, message: checkout.message },
      },
      201,
    );
  } catch (error) {
    return handleError(error, "subscriptions:post");
  }
}

/** Altera, pausa, retoma ou cancela a assinatura. */
export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const input = changeSubscriptionSchema.parse(await readJson(request));

    const subscription = await prisma.subscription.findFirst({
      where: { id: input.subscriptionId, userId: user.id },
      include: { plan: true },
    });
    if (!subscription) return fail("Assinatura não encontrada.", 404);

    const plans = await getPlans();

    switch (input.action) {
      case "cancel": {
        if (subscription.status === "CANCELADA") return fail("Esta assinatura já está cancelada.", 409);

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "CANCELADA", cancelledAt: new Date(), cancelReason: input.reason || null, nextVisitAt: null },
        });

        void dispatch({
          channel: "EMAIL",
          to: user.email,
          template: "subscription_changed",
          subject: "Assinatura cancelada",
          body:
            `${user.name.split(" ")[0]}, sua assinatura do ${subscription.plan.name} foi cancelada.\n\n` +
            `Sem multa e sem pendências: os serviços já pagos seguem válidos até ${subscription.currentPeriodEnd.toLocaleDateString("pt-BR")}.\n\n` +
            `Se quiser voltar, seu histórico continua salvo em ${site.url}/area-cliente`,
          userId: user.id,
          refType: "subscription",
          refId: subscription.id,
        });

        return ok({
          message: `Assinatura cancelada. Seus serviços seguem válidos até ${subscription.currentPeriodEnd.toLocaleDateString("pt-BR")}.`,
        });
      }

      case "pause": {
        if (subscription.status !== "ATIVA") return fail("Só é possível pausar uma assinatura ativa.", 409);
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "PAUSADA", nextVisitAt: null, cancelReason: input.reason || null },
        });
        return ok({ message: "Assinatura pausada. Retome quando quiser — o preço contratado fica garantido por 60 dias." });
      }

      case "resume": {
        if (subscription.status !== "PAUSADA") return fail("Esta assinatura não está pausada.", 409);
        const nextVisit = new Date();
        nextVisit.setDate(nextVisit.getDate() + 3);
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "ATIVA", nextVisitAt: nextVisit, cancelReason: null },
        });
        return ok({ message: "Assinatura retomada. Sua próxima visita já está na agenda." });
      }

      case "upgrade":
      case "downgrade": {
        if (!input.planSlug) return fail("Escolha o novo plano.", 400, { planSlug: "Selecione um plano." });

        const target = plans.find((p) => p.slug === input.planSlug);
        const targetRecord = await prisma.plan.findUnique({ where: { slug: input.planSlug }, select: { id: true } });
        if (!target || !targetRecord) return fail("Plano não encontrado.", 404);
        if (target.slug === subscription.plan.slug) return fail("Você já está neste plano.", 409);

        const areaM2 = user.areaM2 ?? target.areaTiers[0].maxM2 ?? 100;
        const tier = planPriceForArea(target, areaM2);
        if (!tier || tier.price <= 0) {
          return fail("Para a sua metragem o valor é personalizado. Fale com nossa equipe para trocar de plano.", 422);
        }

        const newPrice = subscription.billingCycle === "ANUAL" ? tier.price * 10 : tier.price;
        const isUpgrade = newPrice > subscription.price;

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            planId: targetRecord.id,
            // Upgrade vale na hora; downgrade entra no próximo ciclo.
            price: isUpgrade ? newPrice : subscription.price,
          },
        });

        // No upgrade cobramos a diferença proporcional do período restante.
        if (isUpgrade) {
          const remainingDays = Math.max(
            0,
            Math.ceil((subscription.currentPeriodEnd.getTime() - Date.now()) / 86_400_000),
          );
          const cycleDays = subscription.billingCycle === "ANUAL" ? 365 : 30;
          const proRated = Math.round(((newPrice - subscription.price) * remainingDays) / cycleDays);

          if (proRated > 0) {
            await prisma.invoice.create({
              data: {
                number: await nextProtocol("invoice"),
                userId: user.id,
                subscriptionId: subscription.id,
                amount: proRated,
                status: "PENDENTE",
                dueDate: new Date(),
                description: `Diferença proporcional — upgrade para ${target.name}`,
              },
            });
          }

          return ok({
            message: `Plano alterado para ${target.name}. A diferença proporcional de ${money(proRated)} entrou como fatura.`,
          });
        }

        return ok({
          message: `Plano alterado para ${target.name}. O novo valor de ${money(newPrice)} passa a valer no próximo ciclo, em ${subscription.currentPeriodEnd.toLocaleDateString("pt-BR")}.`,
        });
      }
    }
  } catch (error) {
    return handleError(error, "subscriptions:patch");
  }
}
