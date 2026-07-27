import { describe, expect, it } from 'vitest';
import {
  AccessDifficulty,
  DifficultyLevel,
  DomainError,
  ErrorCode,
  GardenAnalysisSchema,
  QuoteSchema,
  RiskLevel,
  ServiceType,
  ServiceTypeLabel,
  TerrainSlope,
  haversineKm,
  httpStatusFor,
  money,
} from '../src/index.js';

describe('money', () => {
  it('round-trips reais ↔ cents', () => {
    expect(money.toCents(545)).toBe(54500);
    expect(money.fromCents(54500)).toBe(545);
  });
  it('formats BRL in pt-BR', () => {
    expect(money.format(54545)).toContain('545,45');
  });
});

describe('geo', () => {
  it('computes a sane haversine distance (SP centro → Guarulhos ~ 15-25km)', () => {
    const d = haversineKm({ lat: -23.55, lng: -46.63 }, { lat: -23.45, lng: -46.53 });
    expect(d).toBeGreaterThan(10);
    expect(d).toBeLessThan(25);
  });
  it('is zero for identical points', () => {
    expect(haversineKm({ lat: -23.5, lng: -46.6 }, { lat: -23.5, lng: -46.6 })).toBeCloseTo(0, 5);
  });
});

describe('errors', () => {
  it('maps every code to an HTTP status', () => {
    expect(httpStatusFor[ErrorCode.NOT_FOUND]).toBe(404);
    expect(httpStatusFor[ErrorCode.AI_QUORUM_NOT_MET]).toBe(422);
  });
  it('DomainError carries its code', () => {
    const e = new DomainError(ErrorCode.FORBIDDEN, 'nope');
    expect(e.code).toBe('FORBIDDEN');
    expect(e).toBeInstanceOf(Error);
  });
});

describe('labels', () => {
  it('has a pt-BR label for every service type', () => {
    for (const t of Object.values(ServiceType)) {
      expect(ServiceTypeLabel[t]).toBeTruthy();
    }
  });
});

describe('schemas', () => {
  const analysis = {
    features: {
      grassAreaM2: 235,
      totalAreaM2: 300,
      grassHeightCm: 35,
      vegetationTypes: ['grama'],
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
    },
    work: {
      recommendedServices: [ServiceType.CORTE_GRAMA],
      requiredEquipment: [],
      needsSpecialEquipment: false,
      estimatedHours: 5,
      estimatedCrewSize: 2,
      difficulty: DifficultyLevel.HIGH,
      risk: RiskLevel.MEDIUM,
    },
    summary: 'ok',
    confidence: 0.9,
    fieldAgreement: {},
    providers: [{ id: 'mock', ok: true }],
    warnings: [],
  };

  it('accepts a valid GardenAnalysis', () => {
    expect(() => GardenAnalysisSchema.parse(analysis)).not.toThrow();
  });

  it('rejects an out-of-range confidence', () => {
    expect(() => GardenAnalysisSchema.parse({ ...analysis, confidence: 2 })).toThrow();
  });

  it('rejects a Quote whose leafLitterLevel-style bound is violated', () => {
    expect(() =>
      QuoteSchema.parse({
        currency: 'BRL',
        lineItems: [],
        subtotalCents: -1,
        platformFeeCents: 0,
        totalCents: 0,
        gardenerNetCents: 0,
        confidence: 0.5,
        bandLowCents: 0,
        bandHighCents: 0,
        breakdownVersion: 'x',
      }),
    ).toThrow();
  });
});
