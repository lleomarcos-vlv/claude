import { money, type Quote, type QuoteLineItem } from '@jardimja/shared';
import { cityIndex, DEFAULT_PRICING_CONFIG, type PricingConfig } from './config.js';
import type { PricingInput, PricingDebugTrace } from './types.js';

export const BREAKDOWN_VERSION = 'pricing-1.0.0';

const WORK_DAY_HOURS = 8;

export interface PricingResult {
  quote: Quote;
  trace: PricingDebugTrace;
}

/**
 * Price a job deterministically from the AI analysis and market context.
 *
 * The formula, in order:
 *   labour   = crew × hours × baseRate × cityIndex × difficulty × urgency
 *   equipment= Σ dayRate × (hours / 8-h day)   over required equipment
 *   travel   = dispatchFee + km × (fuel/km + wear)   (×2 if round trip)
 *   disposal = greenWaste(m³) × dispose/m³
 *   subtotal = (labour + equipment + travel + disposal)
 *            × supplyDemandSurge × calibrationFactor,   floored at minimum
 *   total    = subtotal                         (what the client pays)
 *   platform = total × feePercent               (commission)
 *   gardener = total − platform
 *
 * Every step is captured in `trace` so a quote can be explained line-by-line and
 * reproduced from stored inputs.
 */
export function priceJob(input: PricingInput, cfg: PricingConfig = DEFAULT_PRICING_CONFIG): PricingResult {
  const { analysis, urgency } = input;
  const work = analysis.work;

  const idx = cityIndex(cfg, input.city);
  const difficultyMult = cfg.difficultyMultiplier[work.difficulty];
  const urgencyMult = cfg.urgencyMultiplier[urgency];
  const calibrationFactor = clampFactor(input.calibrationFactor ?? 1);

  // 1. Labour
  const laborBase = work.estimatedCrewSize * work.estimatedHours * cfg.baseHourlyRate;
  const laborAfter = laborBase * idx * difficultyMult * urgencyMult;

  // 2. Equipment (pro-rata to the working day)
  const usageFraction = Math.min(1, work.estimatedHours / WORK_DAY_HOURS);
  const equipment = work.requiredEquipment.reduce((sum, eq) => {
    const rate = cfg.equipmentDayRate[eq] ?? 0;
    return sum + rate * Math.max(usageFraction, 0.5); // half-day minimum per tool
  }, 0);

  // 3. Travel
  const distance = input.travelDistanceKm ?? 0;
  const legs = cfg.travel.roundTrip ? 2 : 1;
  const perKm = cfg.travel.fuelPricePerLiter / cfg.travel.kmPerLiter + cfg.travel.wearPerKm;
  const travel = distance > 0 ? cfg.travel.baseFee + distance * legs * perKm : cfg.travel.baseFee;

  // 4. Disposal
  const disposal = analysis.features.greenWasteM3 * cfg.disposalPricePerM3;

  // 5. Surge (supply/demand)
  const supplyDemandMult = surgeMultiplier(cfg, input);

  const rawSubtotal = (laborAfter + equipment + travel + disposal) * supplyDemandMult * calibrationFactor;
  const subtotal = Math.max(rawSubtotal, cfg.minimumJobPrice);

  // Line items (BRL → cents). We attribute surge/calibration proportionally so
  // the displayed lines always sum to the subtotal.
  const scale = subtotal / (laborAfter + equipment + travel + disposal || 1);
  const lineItems: QuoteLineItem[] = [
    line('labor', 'Mão de obra', laborAfter * scale, `${work.estimatedCrewSize} prof. × ${round1(work.estimatedHours)}h`),
    line('equipment', 'Equipamentos', equipment * scale, work.requiredEquipment.join(', ') || '—'),
    line('travel', 'Deslocamento', travel * scale, distance > 0 ? `${round1(distance)} km${cfg.travel.roundTrip ? ' (ida e volta)' : ''}` : 'taxa base'),
    line('disposal', 'Descarte', disposal * scale, `${round1(analysis.features.greenWasteM3)} m³ de resíduo verde`),
  ].filter((li) => li.amountCents > 0);

  const totalCents = money.toCents(subtotal);
  const platformFeeCents = Math.round(totalCents * cfg.platformFeePercent);
  const gardenerNetCents = totalCents - platformFeeCents;

  const confidence = quoteConfidence(input);
  const bandWidth = cfg.bandWidthFraction * (1 + (1 - confidence)); // wider when unsure
  const bandLowCents = Math.round(totalCents * (1 - bandWidth));
  const bandHighCents = Math.round(totalCents * (1 + bandWidth));

  const quote: Quote = {
    currency: 'BRL',
    lineItems,
    subtotalCents: totalCents,
    platformFeeCents,
    totalCents,
    gardenerNetCents,
    confidence,
    bandLowCents,
    bandHighCents,
    breakdownVersion: BREAKDOWN_VERSION,
  };

  const trace: PricingDebugTrace = {
    laborBase,
    laborAfterMultipliers: laborAfter,
    equipment,
    travel,
    disposal,
    difficultyMultiplier: difficultyMult,
    urgencyMultiplier: urgencyMult,
    cityIndex: idx,
    supplyDemandMultiplier: supplyDemandMult,
    calibrationFactor,
  };

  return { quote, trace };
}

/** Surge from live supply/demand, clamped to [minSurge, maxSurge]. */
function surgeMultiplier(cfg: PricingConfig, input: PricingInput): number {
  const m = input.market;
  if (!m || m.openJobs <= 0) return 1;
  const ratio = m.availableGardeners / m.openJobs; // >neutral => abundant supply
  const { neutralRatio, minSurge, maxSurge } = cfg.supplyDemand;
  if (ratio <= 0) return maxSurge;
  // Below neutral -> scarce -> surge up; above -> discount. Log keeps it gentle.
  const raw = 1 - 0.35 * Math.log(ratio / neutralRatio);
  return Math.max(minSurge, Math.min(maxSurge, raw));
}

/**
 * Quote confidence blends AI agreement with how much pricing context we had.
 * Missing city/distance/market widen uncertainty.
 */
function quoteConfidence(input: PricingInput): number {
  let coverage = 1;
  if (!input.city) coverage -= 0.05;
  if (input.travelDistanceKm == null) coverage -= 0.06;
  if (!input.market) coverage -= 0.03;
  const blended = input.analysis.confidence * Math.max(0.6, coverage);
  return clamp01(round2(blended));
}

function line(key: string, label: string, brl: number, explanation: string): QuoteLineItem {
  return { key, label, amountCents: money.toCents(Math.max(0, brl)), explanation };
}

const clampFactor = (v: number) => Math.max(0.5, Math.min(2, v));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;
