import type { PaymentMethod } from '@jardimja/shared';

export interface CreateIntentParams {
  jobId: string;
  amountCents: number;
  method: PaymentMethod;
  /** For split: the gardener's payout account id on the provider. */
  gardenerAccountId?: string;
  platformFeeCents: number;
}

export interface PaymentIntentResult {
  externalId: string;
  /** For PIX: the copy-paste code + QR image (base64 or URL). */
  pixCopyPaste?: string;
  pixQrCode?: string;
  /** For card: the client secret / preference id to complete on the client. */
  clientSecret?: string;
  raw: unknown;
}

/** Abstraction over Mercado Pago / Stripe so the app is provider-agnostic. */
export interface PaymentProvider {
  readonly id: string;
  createIntent(params: CreateIntentParams): Promise<PaymentIntentResult>;
  /** Verify + parse a webhook; returns the external id + new status. */
  parseWebhook(headers: Record<string, string>, body: unknown): Promise<{ externalId: string; status: string }>;
}
