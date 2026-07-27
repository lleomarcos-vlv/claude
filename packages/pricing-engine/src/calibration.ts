import type { ServiceType } from '@jardimja/shared';

/**
 * Continuous-learning hook.
 *
 * The pricing engine is deterministic on purpose (auditable, explainable). The
 * "machine learning" the product promises is layered on top as a **calibration
 * multiplier** learned per cohort — not a black box that replaces the formula.
 *
 * A nightly job (see `apps/api` -> `pricing/calibration.processor.ts`) compares,
 * for each (city, serviceType) cohort, the *estimated* price against the price a
 * job actually **closed at** (accepted offer) and the price the gardener was
 * ultimately **paid**. The ratio, smoothed with exponential decay and clamped,
 * becomes the cohort's `calibrationFactor`. Over time estimates converge on
 * real market-clearing prices — exactly the "quanto mais serviços, mais preciso"
 * behaviour requested.
 */

export interface CohortSample {
  /** estimatedTotal / actualClosedTotal for one completed job. */
  estimatedCents: number;
  actualCents: number;
}

export interface CalibrationResult {
  factor: number;
  /** Number of samples backing this factor (drives how much we trust it). */
  sampleSize: number;
  /** How much the factor moved the raw estimate, e.g. +0.06 = +6%. */
  drift: number;
}

const CLAMP_MIN = 0.75;
const CLAMP_MAX = 1.3;
const MIN_SAMPLES = 8;

/**
 * Compute a cohort calibration factor from historical (estimate, actual) pairs.
 * Returns 1.0 (no-op) until we have enough evidence to trust an adjustment.
 */
export function computeCalibrationFactor(samples: CohortSample[]): CalibrationResult {
  const valid = samples.filter((s) => s.estimatedCents > 0 && s.actualCents > 0);
  if (valid.length < MIN_SAMPLES) {
    return { factor: 1, sampleSize: valid.length, drift: 0 };
  }

  // Geometric mean of actual/estimate ratios — robust to skew, symmetric for
  // over- and under-estimates.
  const logSum = valid.reduce((acc, s) => acc + Math.log(s.actualCents / s.estimatedCents), 0);
  const geoMean = Math.exp(logSum / valid.length);

  // Shrink toward 1.0 proportionally to how little data we have (empirical Bayes
  // flavour): more samples -> trust the signal more.
  const trust = Math.min(1, valid.length / (valid.length + MIN_SAMPLES));
  const shrunk = 1 + (geoMean - 1) * trust;

  const factor = clamp(shrunk, CLAMP_MIN, CLAMP_MAX);
  return { factor, sampleSize: valid.length, drift: factor - 1 };
}

/** Exponentially-weighted online update, for streaming rather than batch. */
export function updateFactorOnline(
  previous: number,
  newSample: CohortSample,
  alpha = 0.1,
): number {
  if (newSample.estimatedCents <= 0 || newSample.actualCents <= 0) return previous;
  const ratio = newSample.actualCents / newSample.estimatedCents;
  const next = previous * (1 - alpha) + ratio * alpha;
  return clamp(next, CLAMP_MIN, CLAMP_MAX);
}

export function cohortKey(city: string | undefined, service: ServiceType): string {
  return `${(city ?? '__default').toLowerCase()}::${service}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
