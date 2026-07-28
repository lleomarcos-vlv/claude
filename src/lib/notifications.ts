import { prisma } from "@/lib/db";
import { site, whatsappLink } from "@/lib/site";
import { date, money } from "@/lib/format";
import { getConfig, getConfigMany } from "@/lib/settings";

/**
 * Camada de automações da Verde Fixo.
 *
 * Cada envio é registrado em `NotificationLog`, o que dá rastreabilidade e permite
 * reprocessar falhas. Sem credenciais configuradas o envio é marcado como
 * `SIMULADO` — o site funciona de ponta a ponta em desenvolvimento e o painel
 * administrativo mostra exatamente o que seria disparado em produção.
 *
 * Credenciais vêm de `@/lib/settings` — o painel administrativo (cifrado no banco)
 * tem precedência sobre as variáveis de ambiente.
 *
 * Provedores suportados por HTTP (sem SDK):
 *  · WhatsApp — Meta Cloud API (WHATSAPP_TOKEN + WHATSAPP_PHONE_ID)
 *  · E-mail   — Resend (RESEND_API_KEY) ou webhook genérico (EMAIL_WEBHOOK_URL)
 *  · Equipe   — webhook interno (TEAM_WEBHOOK_URL), ex.: Slack, Discord ou n8n
 */

export type Channel = "WHATSAPP" | "EMAIL" | "INTERNO";

export type TemplateName =
  | "booking_confirmed"
  | "booking_status"
  | "reminder_24h"
  | "satisfaction_survey"
  | "team_new_booking"
  | "quote_received"
  | "team_new_quote"
  | "subscription_created"
  | "subscription_changed"
  | "welcome"
  | "newsletter_welcome"
  | "contact_received";

type Dispatch = {
  channel: Channel;
  to: string;
  template: TemplateName;
  subject?: string;
  body: string;
  userId?: string | null;
  refType?: "booking" | "quote" | "subscription" | "invoice" | "message";
  refId?: string;
  payload?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

export async function dispatch(message: Dispatch) {
  const log = await createLog(message, "ENFILEIRADO");

  try {
    const result = await send(message);
    await updateLog(log?.id, result.simulated ? "SIMULADO" : "ENVIADO");
    return result;
  } catch (error) {
    await updateLog(log?.id, "ERRO", (error as Error).message);
    // Automação nunca deve derrubar o fluxo do cliente.
    console.error(`[notificações] falha em ${message.template} (${message.channel}):`, error);
    return { simulated: false, error: (error as Error).message };
  }
}

async function send(message: Dispatch): Promise<{ simulated: boolean }> {
  switch (message.channel) {
    case "WHATSAPP":
      return sendWhatsapp(message);
    case "EMAIL":
      return sendEmail(message);
    case "INTERNO":
      return sendInternal(message);
  }
}

async function sendWhatsapp(message: Dispatch) {
  const { WHATSAPP_TOKEN: token, WHATSAPP_PHONE_ID: phoneId } = await getConfigMany([
    "WHATSAPP_TOKEN",
    "WHATSAPP_PHONE_ID",
  ] as const);
  if (!token || !phoneId) return { simulated: true };

  const to = message.to.replace(/\D/g, "");
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.startsWith("55") ? to : `55${to}`,
      type: "text",
      text: { preview_url: false, body: message.body },
    }),
  });
  if (!res.ok) throw new Error(`WhatsApp API ${res.status}: ${await res.text()}`);
  return { simulated: false };
}

async function sendEmail(message: Dispatch) {
  const { RESEND_API_KEY: resendKey, EMAIL_FROM } = await getConfigMany(["RESEND_API_KEY", "EMAIL_FROM"] as const);
  const from = EMAIL_FROM || `Verde Fixo <${site.email}>`;

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject ?? site.name,
        text: message.body,
        html: emailHtml(message.subject ?? site.name, message.body),
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
    return { simulated: false };
  }

  const webhook = process.env.EMAIL_WEBHOOK_URL ?? "";
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from, to: message.to, subject: message.subject, text: message.body }),
    });
    if (!res.ok) throw new Error(`Webhook de e-mail ${res.status}`);
    return { simulated: false };
  }

  return { simulated: true };
}

async function sendInternal(message: Dispatch) {
  const webhook = await getConfig("TEAM_WEBHOOK_URL");
  if (!webhook) return { simulated: true };

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: message.body, template: message.template, ...message.payload }),
  });
  if (!res.ok) throw new Error(`Webhook da equipe ${res.status}`);
  return { simulated: false };
}

async function createLog(message: Dispatch, status: string) {
  try {
    return await prisma.notificationLog.create({
      data: {
        userId: message.userId ?? null,
        channel: message.channel,
        template: message.template,
        to: message.to,
        payload: JSON.stringify({ subject: message.subject, body: message.body, ...message.payload }),
        status,
        refType: message.refType ?? null,
        refId: message.refId ?? null,
      },
      select: { id: true },
    });
  } catch {
    return null;
  }
}

async function updateLog(id: string | undefined, status: string, error?: string) {
  if (!id) return;
  try {
    await prisma.notificationLog.update({
      where: { id },
      data: { status, error: error ?? null, sentAt: status === "ERRO" ? null : new Date() },
    });
  } catch {
    /* log é acessório: nunca interrompe o fluxo */
  }
}

function emailHtml(subject: string, body: string) {
  const paragraphs = body
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f5faf7;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d3a31">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;border:1px solid #e5eae8">
<div style="font-size:22px;font-weight:700;color:#2a7261;letter-spacing:-0.02em;margin-bottom:4px">verdefixo</div>
<div style="font-size:13px;color:#799a8f;margin-bottom:24px">${escapeHtml(site.slogan)}</div>
<h1 style="font-size:20px;margin:0 0 16px;color:#1d3a31">${escapeHtml(subject)}</h1>
${paragraphs}
<div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5eae8;font-size:13px;color:#799a8f">
${escapeHtml(site.legalName)} · ${escapeHtml(site.phone)} · <a href="${site.url}" style="color:#2a7261">${site.url.replace(/^https?:\/\//, "")}</a>
</div></div></body></html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// ---------------------------------------------------------------------------
// Automações de negócio
// ---------------------------------------------------------------------------

type BookingLike = {
  id: string;
  protocol: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp?: string | null;
  serviceName: string;
  scheduledAt: Date;
  timeSlot: string;
  street: string;
  number: string;
  city: string;
  estimatedPrice: number;
  userId?: string | null;
  notes?: string | null;
};

/** Confirmação para o cliente (WhatsApp + e-mail) e aviso para a equipe. */
export async function onBookingCreated(booking: BookingLike) {
  const when = `${date(booking.scheduledAt)} às ${booking.timeSlot}`;
  const priceLine =
    booking.estimatedPrice > 0
      ? `\nEstimativa: ${money(booking.estimatedPrice)} (o valor final é confirmado após a avaliação da área).`
      : "\nVamos confirmar o valor pelo WhatsApp em até 2 horas úteis.";

  const clientBody =
    `Olá, ${booking.contactName.split(" ")[0]}! Recebemos seu agendamento na Verde Fixo. ✅\n\n` +
    `Protocolo: ${booking.protocol}\n` +
    `Serviço: ${booking.serviceName}\n` +
    `Data: ${when}\n` +
    `Endereço: ${booking.street}, ${booking.number} — ${booking.city}` +
    priceLine +
    `\n\nAcompanhe tudo em ${site.url}/area-cliente\n` +
    `Precisa alterar algo? Responda esta mensagem.`;

  await Promise.all([
    dispatch({
      channel: "WHATSAPP",
      to: booking.contactWhatsapp || booking.contactPhone,
      template: "booking_confirmed",
      body: clientBody,
      userId: booking.userId,
      refType: "booking",
      refId: booking.id,
    }),
    dispatch({
      channel: "EMAIL",
      to: booking.contactEmail,
      template: "booking_confirmed",
      subject: `Agendamento confirmado — ${booking.protocol}`,
      body: clientBody,
      userId: booking.userId,
      refType: "booking",
      refId: booking.id,
    }),
    dispatch({
      channel: "INTERNO",
      to: site.supportEmail,
      template: "team_new_booking",
      subject: `Novo agendamento ${booking.protocol}`,
      body:
        `🌱 Novo agendamento — ${booking.protocol}\n` +
        `${booking.serviceName} · ${when}\n` +
        `${booking.contactName} · ${booking.contactPhone}\n` +
        `${booking.street}, ${booking.number} — ${booking.city}` +
        (booking.notes ? `\nObs.: ${booking.notes}` : ""),
      refType: "booking",
      refId: booking.id,
      payload: { protocol: booking.protocol, whatsapp: whatsappLink() },
    }),
  ]);
}

export async function onBookingStatusChanged(booking: BookingLike, status: string) {
  const labels: Record<string, string> = {
    CONFIRMADO: "confirmado ✅",
    EM_ANDAMENTO: "em andamento 🚜",
    CONCLUIDO: "concluído 🌿",
    CANCELADO: "cancelado",
  };
  const label = labels[status] ?? status.toLowerCase();

  await dispatch({
    channel: "WHATSAPP",
    to: booking.contactWhatsapp || booking.contactPhone,
    template: "booking_status",
    body:
      `Atualização do seu serviço ${booking.protocol}: ${label}.\n` +
      `${booking.serviceName} — ${date(booking.scheduledAt)} às ${booking.timeSlot}\n\n` +
      `Detalhes e fotos: ${site.url}/area-cliente`,
    userId: booking.userId,
    refType: "booking",
    refId: booking.id,
  });
}

/** Lembrete disparado pelo cron 24h antes do serviço. */
export async function sendReminder24h(booking: BookingLike) {
  const body =
    `Lembrete: seu serviço da Verde Fixo é amanhã! ⏰\n\n` +
    `${booking.serviceName}\n` +
    `${date(booking.scheduledAt)} às ${booking.timeSlot}\n` +
    `${booking.street}, ${booking.number} — ${booking.city}\n\n` +
    `Deixe o acesso ao jardim liberado. Precisa remarcar? Responda esta mensagem.`;

  await Promise.all([
    dispatch({
      channel: "WHATSAPP",
      to: booking.contactWhatsapp || booking.contactPhone,
      template: "reminder_24h",
      body,
      userId: booking.userId,
      refType: "booking",
      refId: booking.id,
    }),
    dispatch({
      channel: "EMAIL",
      to: booking.contactEmail,
      template: "reminder_24h",
      subject: `Seu serviço é amanhã — ${booking.protocol}`,
      body,
      userId: booking.userId,
      refType: "booking",
      refId: booking.id,
    }),
  ]);
}

/** Pesquisa de satisfação enviada após a conclusão do serviço. */
export async function sendSatisfactionSurvey(booking: BookingLike) {
  const url = `${site.url}/pesquisa/${booking.protocol}`;
  const body =
    `${booking.contactName.split(" ")[0]}, como ficou seu jardim? 🌿\n\n` +
    `Sua opinião sobre o serviço ${booking.protocol} leva 30 segundos e ajuda muito nossa equipe:\n${url}\n\n` +
    `Se algo não ficou bom, avise em até 72h: refazemos sem custo.`;

  await Promise.all([
    dispatch({
      channel: "WHATSAPP",
      to: booking.contactWhatsapp || booking.contactPhone,
      template: "satisfaction_survey",
      body,
      userId: booking.userId,
      refType: "booking",
      refId: booking.id,
    }),
    dispatch({
      channel: "EMAIL",
      to: booking.contactEmail,
      template: "satisfaction_survey",
      subject: "Como ficou seu jardim?",
      body,
      userId: booking.userId,
      refType: "booking",
      refId: booking.id,
    }),
  ]);
}

export async function onQuoteCreated(quote: {
  id: string;
  protocol: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string | null;
  serviceName: string;
  city: string;
  areaM2?: number | null;
  estimatedPrice: number;
  userId?: string | null;
}) {
  const estimate =
    quote.estimatedPrice > 0
      ? `\nEstimativa inicial: ${money(quote.estimatedPrice)} por visita, a confirmar na avaliação.`
      : "";

  const body =
    `Olá, ${quote.name.split(" ")[0]}! Recebemos seu pedido de orçamento. 🌿\n\n` +
    `Protocolo: ${quote.protocol}\n` +
    `Serviço: ${quote.serviceName}\n` +
    `Cidade: ${quote.city}` +
    (quote.areaM2 ? `\nÁrea informada: ${quote.areaM2} m²` : "") +
    estimate +
    `\n\nNossa equipe responde em até 2 horas úteis. Orçamento e visita de avaliação são gratuitos.`;

  await Promise.all([
    dispatch({
      channel: "WHATSAPP",
      to: quote.whatsapp || quote.phone,
      template: "quote_received",
      body,
      userId: quote.userId,
      refType: "quote",
      refId: quote.id,
    }),
    dispatch({
      channel: "EMAIL",
      to: quote.email,
      template: "quote_received",
      subject: `Orçamento em análise — ${quote.protocol}`,
      body,
      userId: quote.userId,
      refType: "quote",
      refId: quote.id,
    }),
    dispatch({
      channel: "INTERNO",
      to: site.supportEmail,
      template: "team_new_quote",
      subject: `Novo orçamento ${quote.protocol}`,
      body:
        `💰 Novo pedido de orçamento — ${quote.protocol}\n` +
        `${quote.serviceName} · ${quote.city}${quote.areaM2 ? ` · ${quote.areaM2} m²` : ""}\n` +
        `${quote.name} · ${quote.phone}`,
      refType: "quote",
      refId: quote.id,
    }),
  ]);
}

export async function onSubscriptionCreated(input: {
  userId: string;
  name: string;
  email: string;
  phone: string;
  planName: string;
  price: number;
  cycle: string;
  subscriptionId: string;
  nextVisitAt?: Date | null;
}) {
  const body =
    `Bem-vindo ao Clube Verde Fixo, ${input.name.split(" ")[0]}! 🌿\n\n` +
    `Plano: ${input.planName}\n` +
    `Valor: ${money(input.price)} / ${input.cycle === "ANUAL" ? "ano" : "mês"}\n` +
    (input.nextVisitAt ? `Primeira visita: ${date(input.nextVisitAt)}\n` : "") +
    `\nSua vaga na agenda está garantida. Sem fidelidade e sem multa — você altera ou cancela quando quiser em ${site.url}/area-cliente`;

  await Promise.all([
    dispatch({
      channel: "WHATSAPP",
      to: input.phone,
      template: "subscription_created",
      body,
      userId: input.userId,
      refType: "subscription",
      refId: input.subscriptionId,
    }),
    dispatch({
      channel: "EMAIL",
      to: input.email,
      template: "subscription_created",
      subject: `Assinatura ativa — ${input.planName}`,
      body,
      userId: input.userId,
      refType: "subscription",
      refId: input.subscriptionId,
    }),
    dispatch({
      channel: "INTERNO",
      to: site.supportEmail,
      template: "subscription_created",
      body: `🎉 Nova assinatura: ${input.planName} — ${input.name} (${money(input.price)}/${input.cycle.toLowerCase()})`,
      refType: "subscription",
      refId: input.subscriptionId,
    }),
  ]);
}
