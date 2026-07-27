import { Injectable, Logger } from '@nestjs/common';
import { computeCalibrationFactor, type CohortSample } from '@jardimja/pricing-engine';
import { PrismaService } from '../../prisma/prisma.service.js';

/**
 * The "machine learning" that makes estimates converge on real prices. Runs
 * nightly (wire to BullMQ repeatable job / cron): for each cohort with enough
 * completed jobs, recompute the calibration factor from (estimate, actual) pairs
 * and persist it. `PricingService` reads it back on the next quote.
 */
@Injectable()
export class CalibrationService {
  private readonly logger = new Logger(CalibrationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Record the outcome of a completed job for future calibration. */
  async recordOutcome(jobId: string, cohortKey: string, estimatedCents: number, actualCents: number): Promise<void> {
    await this.prisma.pricingOutcome.upsert({
      where: { jobId },
      create: { jobId, cohortKey, estimatedCents, actualCents },
      update: { cohortKey, estimatedCents, actualCents },
    });
  }

  /** Recompute every cohort's factor. Returns how many cohorts were updated. */
  async recomputeAll(): Promise<number> {
    const cohorts = await this.prisma.pricingOutcome.groupBy({ by: ['cohortKey'] });
    let updated = 0;
    for (const { cohortKey } of cohorts) {
      const rows = await this.prisma.pricingOutcome.findMany({ where: { cohortKey } });
      const samples: CohortSample[] = rows.map((r) => ({
        estimatedCents: r.estimatedCents,
        actualCents: r.actualCents,
      }));
      const { factor, sampleSize } = computeCalibrationFactor(samples);
      await this.prisma.calibrationFactor.upsert({
        where: { cohortKey },
        create: { cohortKey, factor, sampleSize },
        update: { factor, sampleSize },
      });
      updated += 1;
    }
    this.logger.log(`Recomputed calibration for ${updated} cohort(s).`);
    return updated;
  }
}
