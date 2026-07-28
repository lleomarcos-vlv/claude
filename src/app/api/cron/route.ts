import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";
import { getConfig, getNumber } from "@/lib/settings";
import { sendReminder24h, sendSatisfactionSurvey } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Automações agendadas. Rode a cada hora:
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://verdefixo.com.br/api/cron
 *
 * Na Vercel, configure em vercel.json:
 *   { "crons": [{ "path": "/api/cron", "schedule": "0 * * * *" }] }
 *
 * Duas rotinas idempotentes (as marcas `reminderSentAt` e `surveySentAt`
 * garantem que nada é enviado duas vezes):
 *  · lembrete 24h antes do serviço;
 *  · pesquisa de satisfação após a conclusão.
 */
export async function GET(request: Request) {
  try {
    const secret = await getConfig("CRON_SECRET");
    const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";

    // Sem segredo configurado, a rota fica bloqueada em produção.
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { ok: false, error: "Configure o segredo das automações em Admin → Integrações." },
          { status: 503 },
        );
      }
    } else if (provided !== secret) {
      return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
    }

    const [reminders, surveys] = await Promise.all([runReminders(), runSurveys()]);

    return ok({
      ranAt: new Date().toISOString(),
      reminders,
      surveys,
    });
  } catch (error) {
    return handleError(error, "cron");
  }
}

/** Lembretes para serviços que acontecem nas próximas 24 a 48 horas. */
async function runReminders() {
  const hours = await getNumber("reminderHours", 24);
  const from = new Date(Date.now() + (hours - 1) * 3_600_000);
  const to = new Date(Date.now() + (hours + 23) * 3_600_000);

  const bookings = await prisma.booking.findMany({
    where: {
      scheduledAt: { gte: from, lte: to },
      status: { in: ["PENDENTE", "CONFIRMADO"] },
      reminderSentAt: null,
    },
    take: 200,
    select: {
      id: true,
      protocol: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      contactWhatsapp: true,
      serviceName: true,
      scheduledAt: true,
      timeSlot: true,
      street: true,
      number: true,
      city: true,
      estimatedPrice: true,
      userId: true,
    },
  });

  let sent = 0;
  for (const booking of bookings) {
    await sendReminder24h(booking);
    await prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: new Date() } });
    sent++;
  }

  return { candidates: bookings.length, sent };
}

/** Pesquisa de satisfação para serviços concluídos há algumas horas. */
async function runSurveys() {
  const delayHours = await getNumber("surveyDelayHours", 3);
  const cutoff = new Date(Date.now() - delayHours * 3_600_000);

  const bookings = await prisma.booking.findMany({
    where: { status: "CONCLUIDO", completedAt: { lte: cutoff, not: null }, surveySentAt: null },
    take: 200,
    select: {
      id: true,
      protocol: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      contactWhatsapp: true,
      serviceName: true,
      scheduledAt: true,
      timeSlot: true,
      street: true,
      number: true,
      city: true,
      estimatedPrice: true,
      userId: true,
    },
  });

  let sent = 0;
  for (const booking of bookings) {
    await sendSatisfactionSurvey(booking);

    await prisma.$transaction([
      prisma.booking.update({ where: { id: booking.id }, data: { surveySentAt: new Date() } }),
      prisma.satisfactionSurvey.upsert({
        where: { bookingId: booking.id },
        create: { bookingId: booking.id, userId: booking.userId },
        update: {},
      }),
    ]);
    sent++;
  }

  return { candidates: bookings.length, sent };
}
