import {
  AccessDifficulty,
  DifficultyLevel,
  GardenAnalysisSchema,
  RiskLevel,
  TerrainSlope,
  type AiProviderId,
  type GardenAnalysis,
  type GardenFeatures,
  type ProviderAnalysis,
  type WorkEstimate,
} from '@jardimja/shared';
import type { ProviderAttempt } from './types.js';

/** Fields that most drive the price get extra weight in the overall confidence. */
const HIGH_IMPACT_FIELDS = new Set(['grassAreaM2', 'estimatedHours', 'estimatedCrewSize']);

interface Weighted<T> {
  v: T;
  w: number;
}

/**
 * Reconcile several providers' analyses into one consensus `GardenAnalysis`.
 *
 * Strategy per field type:
 *   - numeric  → weighted median (robust to one wild outlier); agreement = 1−CV
 *   - boolean  → weighted majority; agreement = winning weight fraction
 *   - enum     → weighted mode; agreement = mode weight fraction
 *   - list     → weighted majority per element (services/equipment), union for
 *                informational lists (vegetation)
 *
 * Overall confidence blends field agreement, providers' self-reported confidence
 * and coverage (how many models answered, how many photos we had).
 */
export function reconcile(
  attempts: ProviderAttempt[],
  ctx: { weights?: Partial<Record<AiProviderId, number>>; imagesCount: number },
): GardenAnalysis {
  const ok = attempts.filter((a) => a.ok && a.result);
  if (ok.length === 0) {
    throw new Error('reconcile() requires at least one successful provider attempt');
  }

  const weightOf = (id: AiProviderId) => ctx.weights?.[id] ?? 1;
  const results: Weighted<ProviderAnalysis>[] = ok.map((a) => ({ v: a.result!, w: weightOf(a.id) }));

  const agreement: Record<string, number> = {};

  const num = (pick: (r: ProviderAnalysis) => number, key: string, opts: { int?: boolean } = {}) => {
    const vals = results.map((r) => ({ v: pick(r.v), w: r.w }));
    const value = weightedMedian(vals);
    agreement[key] = numericAgreement(vals.map((x) => x.v));
    return opts.int ? Math.round(value) : round1(value);
  };

  const bool = (pick: (r: ProviderAnalysis) => boolean, key: string) => {
    const vals = results.map((r) => ({ v: pick(r.v), w: r.w }));
    const { value, agree } = weightedMajorityBool(vals);
    agreement[key] = agree;
    return value;
  };

  const enumField = <T extends string>(pick: (r: ProviderAnalysis) => T, key: string): T => {
    const vals = results.map((r) => ({ v: pick(r.v), w: r.w }));
    const { value, agree } = weightedMode(vals);
    agreement[key] = agree;
    return value;
  };

  const features: GardenFeatures = {
    grassAreaM2: num((r) => r.features.grassAreaM2, 'grassAreaM2'),
    totalAreaM2: num((r) => r.features.totalAreaM2, 'totalAreaM2'),
    grassHeightCm: num((r) => r.features.grassHeightCm, 'grassHeightCm'),
    vegetationTypes: unionList(results.map((r) => ({ v: r.v.features.vegetationTypes, w: r.w }))),
    treeCount: num((r) => r.features.treeCount, 'treeCount', { int: true }),
    shrubCount: num((r) => r.features.shrubCount, 'shrubCount', { int: true }),
    leafLitterLevel: num((r) => r.features.leafLitterLevel, 'leafLitterLevel', { int: true }),
    hasTallWeeds: bool((r) => r.features.hasTallWeeds, 'hasTallWeeds'),
    hasRocks: bool((r) => r.features.hasRocks, 'hasRocks'),
    hasPool: bool((r) => r.features.hasPool, 'hasPool'),
    hasSidewalks: bool((r) => r.features.hasSidewalks, 'hasSidewalks'),
    hasWalls: bool((r) => r.features.hasWalls, 'hasWalls'),
    terrainSlope: enumField((r) => r.features.terrainSlope as TerrainSlope, 'terrainSlope'),
    accessDifficulty: enumField((r) => r.features.accessDifficulty as AccessDifficulty, 'accessDifficulty'),
    greenWasteM3: num((r) => r.features.greenWasteM3, 'greenWasteM3'),
  };

  const work: WorkEstimate = {
    recommendedServices: majorityList(
      results.map((r) => ({ v: r.v.work.recommendedServices as string[], w: r.w })),
      0.4,
    ) as WorkEstimate['recommendedServices'],
    requiredEquipment: majorityList(
      results.map((r) => ({ v: r.v.work.requiredEquipment as string[], w: r.w })),
      0.4,
    ) as WorkEstimate['requiredEquipment'],
    needsSpecialEquipment: bool((r) => r.work.needsSpecialEquipment, 'needsSpecialEquipment'),
    estimatedHours: num((r) => r.work.estimatedHours, 'estimatedHours'),
    estimatedCrewSize: Math.max(1, num((r) => r.work.estimatedCrewSize, 'estimatedCrewSize', { int: true })),
    difficulty: enumField((r) => r.work.difficulty as DifficultyLevel, 'difficulty'),
    risk: enumField((r) => r.work.risk as RiskLevel, 'risk'),
  };

  const summary = pickSummary(results);
  const confidence = overallConfidence(agreement, results, ctx.imagesCount, ok.length);
  const warnings = buildWarnings(agreement, ctx.imagesCount, attempts);

  const analysis: GardenAnalysis = {
    features,
    work,
    summary,
    confidence,
    fieldAgreement: agreement,
    providers: attempts.map((a) => ({ id: a.id, ok: a.ok, latencyMs: a.latencyMs, error: a.error })),
    warnings,
  };

  // Validate our own output against the shared contract before returning.
  return GardenAnalysisSchema.parse(analysis);
}

// ── reconciliation primitives ────────────────────────────────────────────────

function weightedMedian(items: Weighted<number>[]): number {
  const sorted = [...items].sort((a, b) => a.v - b.v);
  const total = sorted.reduce((s, x) => s + x.w, 0);
  if (total === 0) return sorted[Math.floor(sorted.length / 2)]?.v ?? 0;
  let acc = 0;
  for (const item of sorted) {
    acc += item.w;
    if (acc >= total / 2) return item.v;
  }
  return sorted[sorted.length - 1]!.v;
}

/** 1 − coefficient of variation, clamped to [0,1]. All-equal → 1. */
function numericAgreement(values: number[]): number {
  if (values.length <= 1) return 1;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return values.every((v) => v === 0) ? 1 : 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const cv = Math.sqrt(variance) / Math.abs(mean);
  return clamp01(1 - cv);
}

function weightedMajorityBool(items: Weighted<boolean>[]): { value: boolean; agree: number } {
  const total = items.reduce((s, x) => s + x.w, 0) || 1;
  const trueW = items.filter((x) => x.v).reduce((s, x) => s + x.w, 0);
  const value = trueW >= total / 2;
  const agree = (value ? trueW : total - trueW) / total;
  return { value, agree };
}

function weightedMode<T extends string>(items: Weighted<T>[]): { value: T; agree: number } {
  const tally = new Map<T, number>();
  let total = 0;
  for (const { v, w } of items) {
    tally.set(v, (tally.get(v) ?? 0) + w);
    total += w;
  }
  let best: T = items[0]!.v;
  let bestW = -1;
  for (const [v, w] of tally) {
    if (w > bestW) {
      best = v;
      bestW = w;
    }
  }
  return { value: best, agree: total ? bestW / total : 1 };
}

/** Keep list elements supported by at least `threshold` of total weight. */
function majorityList(items: Weighted<string[]>[], threshold: number): string[] {
  const total = items.reduce((s, x) => s + x.w, 0) || 1;
  const support = new Map<string, number>();
  for (const { v, w } of items) {
    for (const el of new Set(v)) support.set(el, (support.get(el) ?? 0) + w);
  }
  return [...support.entries()]
    .filter(([, w]) => w / total >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([el]) => el);
}

function unionList(items: Weighted<string[]>[]): string[] {
  const set = new Set<string>();
  for (const { v } of items) for (const el of v) set.add(el);
  return [...set];
}

/** Pick the summary from the provider whose numbers are most central. */
function pickSummary(results: Weighted<ProviderAnalysis>[]): string {
  if (results.length === 1) return results[0]!.v.summary;
  const medianArea = weightedMedian(results.map((r) => ({ v: r.v.features.grassAreaM2, w: r.w })));
  let best = results[0]!;
  let bestDist = Infinity;
  for (const r of results) {
    const d = Math.abs(r.v.features.grassAreaM2 - medianArea);
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best.v.summary;
}

function overallConfidence(
  agreement: Record<string, number>,
  results: Weighted<ProviderAnalysis>[],
  imagesCount: number,
  okCount: number,
): number {
  // Weighted mean of field agreement. The price drivers (area, hours, crew)
  // dominate: if they disagree, the *estimate* is unreliable even when a dozen
  // minor flags happen to match.
  let aw = 0;
  let asum = 0;
  for (const [field, a] of Object.entries(agreement)) {
    const w = HIGH_IMPACT_FIELDS.has(field) ? 5 : 1;
    asum += a * w;
    aw += w;
  }
  const meanAgreement = aw ? asum / aw : 0.5;

  // Providers' self-reported confidence (mean of each provider's mean).
  const selfConf =
    results.reduce((s, r) => {
      const vals = Object.values(r.v.fieldConfidence);
      const m = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0.7;
      return s + m * r.w;
    }, 0) / (results.reduce((s, r) => s + r.w, 0) || 1);

  const coverage = Math.min(Math.min(1, okCount / 3), Math.min(1, imagesCount / 8));

  const confidence = 0.55 * meanAgreement + 0.3 * selfConf + 0.15 * coverage;
  return round2(clamp01(confidence));
}

function buildWarnings(
  agreement: Record<string, number>,
  imagesCount: number,
  attempts: ProviderAttempt[],
): string[] {
  const warnings: string[] = [];
  if (imagesCount < 4) {
    warnings.push('Poucas fotos enviadas (mínimo recomendado: 4) — estimativa menos confiável.');
  }
  const meanAgree =
    Object.values(agreement).reduce((s, a) => s + a, 0) / (Object.values(agreement).length || 1);
  if (meanAgree < 0.6) {
    warnings.push('Os modelos divergiram bastante — recomenda-se revisão do jardineiro.');
  }
  if ((agreement.grassAreaM2 ?? 1) < 0.7) {
    warnings.push('A área de grama ficou ambígua nas fotos.');
  }
  const failed = attempts.filter((a) => !a.ok);
  if (failed.length > 0) {
    warnings.push(`Provedores que falharam: ${failed.map((f) => f.id).join(', ')}.`);
  }
  return warnings;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const round1 = (v: number) => Math.round(v * 10) / 10;
const round2 = (v: number) => Math.round(v * 100) / 100;
