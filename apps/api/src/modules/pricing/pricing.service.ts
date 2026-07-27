import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  cohortKey,
  DEFAULT_PRICING_CONFIG,
  priceJob,
  type PricingConfig,
  type PricingInput,
} from '@jardimja/pricing-engine';
import type { GardenAnalysis, Quote, ServiceType, UrgencyLevel } from '@jardimja/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface QuoteContext {
  services: ServiceType[];
  urgency: UrgencyLevel;
  city?: string;
  state?: string;
  travelDistanceKm?: number;
  market?: { availableGardeners: number; openJobs: number };
}

/**
 * Backend wrapper around `@jardimja/pricing-engine`. Enriches the deterministic
 * engine with two DB-backed inputs: per-city config overrides and the learned
 * calibration factor for the (city, service) cohort. The result is a `Quote`
 * plus a reproducible trace.
 */
@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async generateQuote(analysis: GardenAnalysis, ctx: QuoteContext): Promise<Quote> {
    const service = ctx.services[0] ?? analysis.work.recommendedServices[0];
    const cfg = await this.resolveConfig(ctx.city, ctx.state);
    const calibrationFactor = service ? await this.loadCalibration(ctx.city, service) : 1;

    const input: PricingInput = {
      analysis,
      services: ctx.services,
      urgency: ctx.urgency,
      city: ctx.city,
      travelDistanceKm: ctx.travelDistanceKm,
      market: ctx.market,
      calibrationFactor,
    };
    return priceJob(input, cfg).quote;
  }

  /** Merge per-city overrides from the DB onto the default config. */
  private async resolveConfig(city?: string, state?: string): Promise<PricingConfig> {
    const feePercent = this.config.get<number>('payments.platformFeePercent');
    const base: PricingConfig = {
      ...DEFAULT_PRICING_CONFIG,
      platformFeePercent: feePercent ?? DEFAULT_PRICING_CONFIG.platformFeePercent,
    };
    if (!city || !state) return base;

    const row = await this.prisma.pricingConfig.findUnique({
      where: { city_state: { city, state } },
    });
    if (!row) return base;
    // Shallow-merge stored JSON overrides.
    return { ...base, ...(row.overrides as Partial<PricingConfig>) };
  }

  private async loadCalibration(city: string | undefined, service: ServiceType): Promise<number> {
    const key = cohortKey(city, service);
    const row = await this.prisma.calibrationFactor.findUnique({ where: { cohortKey: key } });
    return row?.factor ?? 1;
  }
}
