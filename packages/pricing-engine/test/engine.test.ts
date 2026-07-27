import { describe, expect, it } from 'vitest';
import {
  AccessDifficulty,
  DifficultyLevel,
  Equipment,
  RiskLevel,
  ServiceType,
  TerrainSlope,
  UrgencyLevel,
  type GardenAnalysis,
} from '@jardimja/shared';
import { priceJob } from '../src/engine.js';
import { DEFAULT_PRICING_CONFIG } from '../src/config.js';
import { computeCalibrationFactor, updateFactorOnline } from '../src/calibration.js';

function analysis(overrides: Partial<GardenAnalysis> = {}): GardenAnalysis {
  return {
    features: {
      grassAreaM2: 235,
      totalAreaM2: 300,
      grassHeightCm: 35,
      vegetationTypes: ['grama-esmeralda'],
      treeCount: 3,
      shrubCount: 6,
      leafLitterLevel: 3,
      hasTallWeeds: true,
      hasRocks: false,
      hasPool: false,
      hasSidewalks: true,
      hasWalls: true,
      terrainSlope: TerrainSlope.GENTLE,
      accessDifficulty: AccessDifficulty.EASY,
      greenWasteM3: 2,
      ...overrides.features,
    },
    work: {
      recommendedServices: [ServiceType.CORTE_GRAMA, ServiceType.RETIRADA_FOLHAS],
      requiredEquipment: [Equipment.ROCADEIRA, Equipment.SOPRADOR],
      needsSpecialEquipment: false,
      estimatedHours: 5,
      estimatedCrewSize: 2,
      difficulty: DifficultyLevel.HIGH,
      risk: RiskLevel.MEDIUM,
      ...overrides.work,
    },
    summary: 'Jardim de 235 m² com grama alta.',
    confidence: 0.92,
    fieldAgreement: {},
    providers: [{ id: 'mock', ok: true }],
    warnings: [],
    ...overrides,
  };
}

describe('priceJob', () => {
  it('produces a coherent quote whose lines sum to the total', () => {
    const { quote } = priceJob({
      analysis: analysis(),
      services: [ServiceType.CORTE_GRAMA],
      urgency: UrgencyLevel.NORMAL,
      city: 'São Paulo',
      travelDistanceKm: 8,
    });

    const sumLines = quote.lineItems.reduce((s, li) => s + li.amountCents, 0);
    // lines are scaled to sum to the subtotal (allow 1 cent rounding drift)
    expect(Math.abs(sumLines - quote.subtotalCents)).toBeLessThanOrEqual(quote.lineItems.length);
    expect(quote.totalCents).toBe(quote.subtotalCents);
  });

  it('splits the platform fee so gardener + platform = total', () => {
    const { quote } = priceJob({
      analysis: analysis(),
      services: [ServiceType.CORTE_GRAMA],
      urgency: UrgencyLevel.NORMAL,
      city: 'São Paulo',
      travelDistanceKm: 8,
    });
    expect(quote.gardenerNetCents + quote.platformFeeCents).toBe(quote.totalCents);
    // default fee is 10%
    expect(quote.platformFeeCents).toBe(Math.round(quote.totalCents * 0.1));
  });

  it('never quotes below the configured minimum', () => {
    const tiny = analysis({
      features: { ...analysis().features, greenWasteM3: 0 },
      work: { ...analysis().work, estimatedHours: 0.2, estimatedCrewSize: 1, requiredEquipment: [], difficulty: DifficultyLevel.LOW },
    });
    const { quote } = priceJob({
      analysis: tiny,
      services: [ServiceType.CORTE_GRAMA],
      urgency: UrgencyLevel.FLEXIBLE,
    });
    expect(quote.totalCents).toBeGreaterThanOrEqual(DEFAULT_PRICING_CONFIG.minimumJobPrice * 100);
  });

  it('charges more for higher urgency (surge)', () => {
    const base = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.NORMAL, city: 'São Paulo', travelDistanceKm: 5 });
    const urgent = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.EMERGENCY, city: 'São Paulo', travelDistanceKm: 5 });
    expect(urgent.quote.totalCents).toBeGreaterThan(base.quote.totalCents);
  });

  it('charges more in a high cost-of-living city', () => {
    const sp = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.NORMAL, city: 'São Paulo', travelDistanceKm: 5 });
    const interior = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.NORMAL, city: 'Fortaleza', travelDistanceKm: 5 });
    expect(sp.quote.totalCents).toBeGreaterThan(interior.quote.totalCents);
  });

  it('widens the confidence band when context is missing', () => {
    const rich = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.NORMAL, city: 'São Paulo', travelDistanceKm: 5, market: { availableGardeners: 3, openJobs: 1 } });
    const sparse = priceJob({ analysis: analysis({ confidence: 0.6 }), services: [], urgency: UrgencyLevel.NORMAL });
    const richWidth = rich.quote.bandHighCents - rich.quote.bandLowCents;
    const sparseWidth = sparse.quote.bandHighCents - sparse.quote.bandLowCents;
    // normalise by total to compare relative widths
    expect(sparseWidth / sparse.quote.totalCents).toBeGreaterThan(richWidth / rich.quote.totalCents);
  });

  it('surges up when supply is scarce and discounts when abundant', () => {
    const scarce = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.NORMAL, city: 'São Paulo', travelDistanceKm: 5, market: { availableGardeners: 1, openJobs: 5 } });
    const abundant = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.NORMAL, city: 'São Paulo', travelDistanceKm: 5, market: { availableGardeners: 20, openJobs: 1 } });
    expect(scarce.quote.totalCents).toBeGreaterThan(abundant.quote.totalCents);
  });

  it('is deterministic: same input -> identical quote', () => {
    const input = { analysis: analysis(), services: [ServiceType.PODA], urgency: UrgencyLevel.URGENT, city: 'Curitiba', travelDistanceKm: 12 };
    expect(priceJob(input).quote).toEqual(priceJob(input).quote);
  });

  it('applies a calibration factor multiplicatively', () => {
    const base = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.NORMAL, city: 'São Paulo', travelDistanceKm: 5 });
    const up = priceJob({ analysis: analysis(), services: [], urgency: UrgencyLevel.NORMAL, city: 'São Paulo', travelDistanceKm: 5, calibrationFactor: 1.2 });
    expect(up.quote.totalCents).toBeGreaterThan(base.quote.totalCents);
  });
});

describe('calibration', () => {
  it('is a no-op below the minimum sample size', () => {
    const r = computeCalibrationFactor([
      { estimatedCents: 100, actualCents: 130 },
      { estimatedCents: 100, actualCents: 140 },
    ]);
    expect(r.factor).toBe(1);
    expect(r.drift).toBe(0);
  });

  it('learns that estimates are systematically low', () => {
    const samples = Array.from({ length: 20 }, () => ({ estimatedCents: 10000, actualCents: 12000 }));
    const r = computeCalibrationFactor(samples);
    expect(r.factor).toBeGreaterThan(1);
    expect(r.factor).toBeLessThanOrEqual(1.3); // clamped
    expect(r.sampleSize).toBe(20);
  });

  it('online update moves toward the observed ratio and stays clamped', () => {
    let f = 1;
    for (let i = 0; i < 50; i++) f = updateFactorOnline(f, { estimatedCents: 100, actualCents: 200 });
    expect(f).toBeGreaterThan(1);
    expect(f).toBeLessThanOrEqual(1.3);
  });
});
