import { randomUUID } from "node:crypto";
import { site, siteUrl } from "@/lib/site";
import { getConfig, getConfigMany } from "@/lib/settings";

/**
 * Camada de pagamentos com três provedores por HTTP puro (sem SDK, sem peso no bundle):
 *  · Stripe        — assinatura recorrente com cartão internacional
 *  · Mercado Pago  — PIX, cartão e boleto (padrão no Brasil)
 *  · PIX estático  — cobrança avulsa via QR Code/copia-e-cola (BR Code, EMV)
 *
 * Sem credenciais o provedor `demo` devolve um checkout interno, o que permite
 * percorrer todo o fluxo de assinatura em desenvolvimento e homologação.
 *
 * As credenciais vêm de `@/lib/settings`: primeiro o que foi salvo no painel
 * administrativo (cifrado no banco), depois as variáveis de ambiente.
 */

export type PaymentProvider = "stripe" | "mercadopago" | "pix" | "demo";
export type PaymentMethod = "pix" | "cartao" | "boleto";

export type CheckoutRequest = {
  method: PaymentMethod;
  /** Centavos. */
  amount: number;
  description: string;
  /** `true` para assinatura recorrente. */
  recurring: boolean;
  cycle?: "MENSAL" | "ANUAL";
  customer: { name: string; email: string; phone?: string | null; document?: string | null };
  reference: string;
};

export type CheckoutResult = {
  provider: PaymentProvider;
  /** URL para redirecionar o cliente, quando o provedor usa checkout hospedado. */
  url?: string;
  /** Payload copia-e-cola do PIX (BR Code). */
  pixCode?: string;
  /** ID da cobrança/assinatura no provedor. */
  providerId?: string;
  status: "pendente" | "aguardando_pagamento" | "ativo" | "simulado";
  message: string;
};

export async function activeProvider(method: PaymentMethod): Promise<PaymentProvider> {
  const config = await getConfigMany(["MERCADOPAGO_ACCESS_TOKEN", "STRIPE_SECRET_KEY", "PIX_KEY"] as const);
  if (config.MERCADOPAGO_ACCESS_TOKEN) return "mercadopago";
  if (method === "cartao" && config.STRIPE_SECRET_KEY) return "stripe";
  if (method === "pix" && config.PIX_KEY) return "pix";
  return "demo";
}

export async function createCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
  const provider = await activeProvider(request.method);

  try {
    switch (provider) {
      case "mercadopago":
        return await mercadoPagoCheckout(request);
      case "stripe":
        return await stripeCheckout(request);
      case "pix":
        return await pixCheckout(request);
      default:
        return demoCheckout(request);
    }
  } catch (error) {
    console.error("[pagamentos] falha ao criar checkout:", error);
    // Degrada para o fluxo interno em vez de bloquear a conversão.
    return { ...demoCheckout(request), message: "Não foi possível abrir o checkout agora. Nossa equipe entrará em contato para concluir o pagamento." };
  }
}

// ---------------------------------------------------------------------------
// Mercado Pago
// ---------------------------------------------------------------------------

async function mercadoPagoCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
  const token = await getConfig("MERCADOPAGO_ACCESS_TOKEN");
  const amount = request.amount / 100;

  if (request.recurring) {
    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({
        reason: request.description,
        external_reference: request.reference,
        payer_email: request.customer.email,
        back_url: `${siteUrl}/area-cliente?assinatura=ok`,
        auto_recurring: {
          frequency: request.cycle === "ANUAL" ? 12 : 1,
          frequency_type: "months",
          transaction_amount: amount,
          currency_id: "BRL",
        },
      }),
    });
    if (!res.ok) throw new Error(`Mercado Pago preapproval ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { id: string; init_point: string };
    return {
      provider: "mercadopago",
      url: data.init_point,
      providerId: data.id,
      status: "pendente",
      message: "Você será redirecionado para concluir a assinatura com segurança.",
    };
  }

  const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      items: [{ title: request.description, quantity: 1, currency_id: "BRL", unit_price: amount }],
      payer: { name: request.customer.name, email: request.customer.email },
      external_reference: request.reference,
      back_urls: {
        success: `${siteUrl}/agendamento/confirmado?ref=${request.reference}`,
        pending: `${siteUrl}/agendamento/confirmado?ref=${request.reference}`,
        failure: `${siteUrl}/agendamento?erro=pagamento`,
      },
      auto_return: "approved",
      payment_methods: request.method === "pix" ? { excluded_payment_types: [{ id: "credit_card" }] } : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Mercado Pago preference ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { id: string; init_point: string };
  return {
    provider: "mercadopago",
    url: data.init_point,
    providerId: data.id,
    status: "aguardando_pagamento",
    message: "Finalize o pagamento na página segura do Mercado Pago.",
  };
}

// ---------------------------------------------------------------------------
// Stripe (form-encoded, sem SDK)
// ---------------------------------------------------------------------------

async function stripeCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
  const key = await getConfig("STRIPE_SECRET_KEY");
  const body = new URLSearchParams({
    mode: request.recurring ? "subscription" : "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "brl",
    "line_items[0][price_data][unit_amount]": String(request.amount),
    "line_items[0][price_data][product_data][name]": request.description,
    customer_email: request.customer.email,
    client_reference_id: request.reference,
    success_url: `${siteUrl}/area-cliente?assinatura=ok&session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/planos?checkout=cancelado`,
    locale: "pt-BR",
  });
  if (request.recurring) {
    body.set("line_items[0][price_data][recurring][interval]", request.cycle === "ANUAL" ? "year" : "month");
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { id: string; url: string };
  return {
    provider: "stripe",
    url: data.url,
    providerId: data.id,
    status: "pendente",
    message: "Você será redirecionado para o checkout seguro da Stripe.",
  };
}

// ---------------------------------------------------------------------------
// PIX — BR Code (EMV) estático
// ---------------------------------------------------------------------------

async function pixCheckout(request: CheckoutRequest): Promise<CheckoutResult> {
  const config = await getConfigMany(["PIX_KEY", "PIX_MERCHANT_NAME", "PIX_MERCHANT_CITY"] as const);
  const key = config.PIX_KEY;
  const merchant = (config.PIX_MERCHANT_NAME || site.name).slice(0, 25);
  const city = (config.PIX_MERCHANT_CITY || site.address.city).slice(0, 15);

  return {
    provider: "pix",
    pixCode: buildPixPayload({ key, merchant, city, amount: request.amount, reference: request.reference }),
    status: "aguardando_pagamento",
    message: "Copie o código PIX e pague no app do seu banco. A confirmação é automática.",
  };
}

/** Monta o payload EMV do PIX (BR Code) com CRC16-CCITT. */
export function buildPixPayload(input: {
  key: string;
  merchant: string;
  city: string;
  amount: number;
  reference: string;
}) {
  const tag = (id: string, value: string) => `${id}${String(value.length).padStart(2, "0")}${value}`;
  const reference = input.reference.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "VERDEFIXO";

  const merchantAccount = tag("00", "br.gov.bcb.pix") + tag("01", input.key);
  const payload =
    tag("00", "01") +
    tag("26", merchantAccount) +
    tag("52", "0000") +
    tag("53", "986") +
    tag("54", (input.amount / 100).toFixed(2)) +
    tag("58", "BR") +
    tag("59", sanitize(input.merchant)) +
    tag("60", sanitize(input.city)) +
    tag("62", tag("05", reference)) +
    "6304";

  return payload + crc16(payload);
}

function sanitize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .toUpperCase();
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// ---------------------------------------------------------------------------
// Demo — nenhuma credencial configurada
// ---------------------------------------------------------------------------

function demoCheckout(request: CheckoutRequest): CheckoutResult {
  return {
    provider: "demo",
    providerId: `demo_${randomUUID().slice(0, 12)}`,
    status: "simulado",
    message: request.recurring
      ? "Assinatura registrada em modo demonstração. Configure MERCADOPAGO_ACCESS_TOKEN ou STRIPE_SECRET_KEY para cobrar de verdade."
      : "Pagamento registrado em modo demonstração. Nossa equipe confirma os detalhes pelo WhatsApp.",
  };
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

/** Verifica a assinatura `Stripe-Signature` (HMAC-SHA256 do payload com o segredo do webhook). */
export async function verifyStripeSignature(rawBody: string, header: string | null) {
  const secret = await getConfig("STRIPE_WEBHOOK_SECRET");
  if (!secret) return { ok: false, reason: "Segredo do webhook da Stripe não configurado" };
  if (!header) return { ok: false, reason: "cabeçalho de assinatura ausente" };

  const parts = Object.fromEntries(header.split(",").map((p) => p.split("=") as [string, string]));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return { ok: false, reason: "assinatura malformada" };

  // Rejeita eventos com mais de 5 minutos (proteção contra replay).
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return { ok: false, reason: "evento expirado" };
  }

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && timingSafeEqual(a, b);
  return ok ? { ok: true as const } : { ok: false as const, reason: "assinatura inválida" };
}
