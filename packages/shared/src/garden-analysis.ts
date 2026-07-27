import { z } from 'zod';
import {
  AccessDifficulty,
  DifficultyLevel,
  Equipment,
  RiskLevel,
  ServiceType,
  TerrainSlope,
} from './enums.js';

/**
 * Garden analysis — the structured technical report the AI vision pipeline must
 * produce for a set of photos/video. This schema is the *contract every vision
 * provider is forced to conform to* (each provider is prompted to return exactly
 * this JSON, then validated here). Consensus is computed field-by-field across
 * providers — see `packages/ai-vision`.
 *
 * Every measured/inferred field carries the value AND is accompanied, at the
 * envelope level, by a per-field confidence so the pricing engine and the UI can
 * reason about uncertainty rather than trusting a point estimate.
 */

/** Build a Zod enum from a `const` object while preserving the literal union. */
const zEnum = <T extends Record<string, string>>(e: T) =>
  z.enum(Object.values(e) as [T[keyof T], ...T[keyof T][]]);

/** Numeric measurement with an explicit unit, kept together for auditability. */
export const MeasurementSchema = z.object({
  value: z.number().nonnegative(),
  unit: z.string(),
});
export type Measurement = z.infer<typeof MeasurementSchema>;

export const GardenFeaturesSchema = z.object({
  /** Total lawn/grass area in square metres. The single most important driver. */
  grassAreaM2: z.number().nonnegative(),
  /** Total analysable garden area (lawn + beds + hardscape) in m². */
  totalAreaM2: z.number().nonnegative(),
  /** Estimated grass height in centimetres (drives brush-cutter vs mower). */
  grassHeightCm: z.number().nonnegative(),
  /** Free-text vegetation classification, ideally mapped to knowledge-base ids. */
  vegetationTypes: z.array(z.string()).default([]),
  treeCount: z.number().int().nonnegative(),
  shrubCount: z.number().int().nonnegative(),
  /** Leaf litter volume, qualitative 0–5 scale (0 none … 5 covered). */
  leafLitterLevel: z.number().int().min(0).max(5),
  hasTallWeeds: z.boolean(),
  hasRocks: z.boolean(),
  hasPool: z.boolean(),
  hasSidewalks: z.boolean(),
  hasWalls: z.boolean(),
  terrainSlope: zEnum(TerrainSlope),
  accessDifficulty: zEnum(AccessDifficulty),
  /** Estimated green-waste to haul away, in cubic metres. */
  greenWasteM3: z.number().nonnegative(),
});
export type GardenFeatures = z.infer<typeof GardenFeaturesSchema>;

export const WorkEstimateSchema = z.object({
  /** Recommended services detected from the imagery. */
  recommendedServices: z.array(zEnum(ServiceType)).default([]),
  requiredEquipment: z.array(zEnum(Equipment)).default([]),
  needsSpecialEquipment: z.boolean(),
  estimatedHours: z.number().positive(),
  estimatedCrewSize: z.number().int().positive(),
  difficulty: zEnum(DifficultyLevel),
  risk: zEnum(RiskLevel),
});
export type WorkEstimate = z.infer<typeof WorkEstimateSchema>;

/** One provider's answer, with per-field confidences in [0,1]. */
export const ProviderAnalysisSchema = z.object({
  features: GardenFeaturesSchema,
  work: WorkEstimateSchema,
  /** Short natural-language summary in pt-BR for the client-facing report. */
  summary: z.string(),
  /**
   * Confidence per top-level field name (e.g. "grassAreaM2": 0.88). Providers
   * that cannot self-report confidence get a neutral default applied downstream.
   */
  fieldConfidence: z.record(z.string(), z.number().min(0).max(1)).default({}),
});
export type ProviderAnalysis = z.infer<typeof ProviderAnalysisSchema>;

/**
 * The consensus analysis: the reconciled result across all providers plus the
 * provenance needed to audit *how* we got here.
 */
export const GardenAnalysisSchema = z.object({
  features: GardenFeaturesSchema,
  work: WorkEstimateSchema,
  summary: z.string(),
  /** Overall confidence in [0,1] — folded into the quote's confidence band. */
  confidence: z.number().min(0).max(1),
  /** Per-field agreement metrics across providers (0 = total disagreement). */
  fieldAgreement: z.record(z.string(), z.number().min(0).max(1)).default({}),
  /** Which providers contributed and whether each succeeded. */
  providers: z.array(
    z.object({
      id: z.string(),
      ok: z.boolean(),
      latencyMs: z.number().nonnegative().optional(),
      error: z.string().optional(),
    }),
  ),
  /** Flags the client/gardener should see (e.g. "poucas fotos", "área ambígua"). */
  warnings: z.array(z.string()).default([]),
});
export type GardenAnalysis = z.infer<typeof GardenAnalysisSchema>;
