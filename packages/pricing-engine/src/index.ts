/**
 * @jardimja/pricing-engine — deterministic, auditable, self-calibrating quoting.
 *
 * The engine turns an AI garden analysis + market context into a `Quote`
 * (labour, equipment, travel, disposal, platform split, confidence band).
 * Determinism is a feature: same inputs → same quote, fully explainable via the
 * returned `trace`. Continuous learning lives in `calibration.ts` and enters the
 * formula as a single, clamped multiplier.
 */
export { priceJob, BREAKDOWN_VERSION, type PricingResult } from './engine.js';
export {
  DEFAULT_PRICING_CONFIG,
  cityIndex,
  type PricingConfig,
} from './config.js';
export type { PricingInput, PricingDebugTrace } from './types.js';
export {
  computeCalibrationFactor,
  updateFactorOnline,
  cohortKey,
  type CohortSample,
  type CalibrationResult,
} from './calibration.js';
