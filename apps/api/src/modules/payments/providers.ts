import { Injectable } from '@nestjs/common';
import type { CreateIntentParams, PaymentIntentResult, PaymentProvider } from './provider.js';

/**
 * Mock/sandbox provider used in dev and tests. Produces a deterministic PIX
 * payload so the whole payment flow (intent → webhook → split) runs offline.
 * Swap for `MercadoPagoProvider` / `StripeProvider` via `PAYMENTS_PROVIDER`.
 */
@Injectable()
export class SandboxPaymentProvider implements PaymentProvider {
  readonly id = 'sandbox';

  async createIntent(params: CreateIntentParams): Promise<PaymentIntentResult> {
    const externalId = `pay_${params.jobId}`;
    return {
      externalId,
      pixCopyPaste: `00020126BR.GOV.BCB.PIX...${params.amountCents}`,
      pixQrCode: `data:image/png;base64,QR(${params.amountCents})`,
      clientSecret: `cs_${externalId}`,
      raw: { simulated: true, ...params },
    };
  }

  async parseWebhook(_headers: Record<string, string>, body: unknown): Promise<{ externalId: string; status: string }> {
    const b = body as { externalId?: string; status?: string };
    return { externalId: b.externalId ?? 'unknown', status: b.status ?? 'CAPTURED' };
  }
}

/**
 * Mercado Pago outline. Real implementation: create a `payment` with
 * `application_fee` for the marketplace split and `marketplace` collector, using
 * the connected gardener account (OAuth). PIX returns a QR + copia-e-cola.
 */
@Injectable()
export class MercadoPagoProvider implements PaymentProvider {
  readonly id = 'mercadopago';

  async createIntent(_params: CreateIntentParams): Promise<PaymentIntentResult> {
    // TODO: call https://api.mercadopago.com/v1/payments with access token +
    // application_fee (platformFeeCents) + PIX/card payload. See docs/03-api.md.
    throw new Error('MercadoPagoProvider not configured — set MERCADOPAGO_ACCESS_TOKEN.');
  }

  async parseWebhook(): Promise<{ externalId: string; status: string }> {
    throw new Error('MercadoPagoProvider not configured.');
  }
}
