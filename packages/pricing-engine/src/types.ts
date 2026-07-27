import type { GardenAnalysis, ServiceType, UrgencyLevel } from '@jardimja/shared';

/** Everything the engine needs to price a single job. */
export interface PricingInput {
  /** The reconciled AI analysis (features + work estimate + confidence). */
  analysis: GardenAnalysis;
  /** Services the client selected (may differ from AI recommendation). */
  services: ServiceType[];
  urgency: UrgencyLevel;

  /** Location context. */
  city?: string;
  /** One-way distance from gardener base to the job, in km (nullable if unknown). */
  travelDistanceKm?: number;

  /** Live marketplace signal for surge pricing. */
  market?: {
    /** Gardeners available within radius right now. */
    availableGardeners: number;
    /** Open jobs competing for them right now. */
    openJobs: number;
  };

  /**
   * ML calibration multiplier learned from completed jobs of the same
   * (city, serviceType) cohort. 1.0 = no adjustment. See `calibration.ts`.
   */
  calibrationFactor?: number;
}

export interface PricingDebugTrace {
  laborBase: number;
  laborAfterMultipliers: number;
  equipment: number;
  travel: number;
  disposal: number;
  difficultyMultiplier: number;
  urgencyMultiplier: number;
  cityIndex: number;
  supplyDemandMultiplier: number;
  calibrationFactor: number;
}
