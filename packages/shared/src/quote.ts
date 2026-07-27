import { z } from 'zod';

/**
 * Quote contract — the output of the pricing engine and the object the
 * marketplace passes around. All monetary amounts are integer **cents (BRL)** to
 * avoid floating-point drift; use the `money` helpers to format.
 */

export const QuoteLineItemSchema = z.object({
  /** Stable key for i18n / analytics, e.g. "labor", "equipment", "travel". */
  key: z.string(),
  label: z.string(),
  amountCents: z.number().int().nonnegative(),
  /** Optional human explanation of how this line was derived (auditability). */
  explanation: z.string().optional(),
});
export type QuoteLineItem = z.infer<typeof QuoteLineItemSchema>;

export const QuoteSchema = z.object({
  currency: z.literal('BRL'),
  lineItems: z.array(QuoteLineItemSchema),
  /** Sum of line items, in cents. */
  subtotalCents: z.number().int().nonnegative(),
  /** Platform commission, in cents (informational; charged to the client). */
  platformFeeCents: z.number().int().nonnegative(),
  /** Grand total charged to the client, in cents. */
  totalCents: z.number().int().nonnegative(),
  /** Amount the gardener nets after the platform split, in cents. */
  gardenerNetCents: z.number().int().nonnegative(),
  /**
   * Confidence band for the *estimate*, in [0,1]. Blends AI vision agreement
   * with pricing-model coverage. Shown to the client as a percentage.
   */
  confidence: z.number().min(0).max(1),
  /** Suggested price band the marketplace advertises to gardeners. */
  bandLowCents: z.number().int().nonnegative(),
  bandHighCents: z.number().int().nonnegative(),
  /** Opaque snapshot of every input used, so a quote is fully reproducible. */
  breakdownVersion: z.string(),
});
export type Quote = z.infer<typeof QuoteSchema>;

/** Money helpers (cents ⇄ display). */
export const money = {
  toCents(value: number): number {
    return Math.round(value * 100);
  },
  fromCents(cents: number): number {
    return cents / 100;
  },
  format(cents: number, locale = 'pt-BR'): string {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'BRL' }).format(
      cents / 100,
    );
  },
};
