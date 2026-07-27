import { describe, expect, it } from 'vitest';
import {
  AccessDifficulty,
  AiProviderId,
  DifficultyLevel,
  Equipment,
  RiskLevel,
  ServiceType,
  TerrainSlope,
  type ProviderAnalysis,
} from '@jardimja/shared';
import { reconcile } from '../src/consensus.js';
import type { ProviderAttempt } from '../src/types.js';

function pa(overrides: Partial<ProviderAnalysis['features']> = {}, work: Partial<ProviderAnalysis['work']> = {}): ProviderAnalysis {
  return {
    features: {
      grassAreaM2: 200,
      totalAreaM2: 260,
      grassHeightCm: 30,
      vegetationTypes: ['grama'],
      treeCount: 3,
      shrubCount: 5,
      leafLitterLevel: 2,
      hasTallWeeds: true,
      hasRocks: false,
      hasPool: false,
      hasSidewalks: true,
      hasWalls: true,
      terrainSlope: TerrainSlope.GENTLE,
      accessDifficulty: AccessDifficulty.EASY,
      greenWasteM3: 2,
      ...overrides,
    },
    work: {
      recommendedServices: [ServiceType.CORTE_GRAMA],
      requiredEquipment: [Equipment.ROCADEIRA],
      needsSpecialEquipment: false,
      estimatedHours: 4,
      estimatedCrewSize: 2,
      difficulty: DifficultyLevel.HIGH,
      risk: RiskLevel.LOW,
      ...work,
    },
    summary: 'laudo',
    fieldConfidence: { grassAreaM2: 0.85 },
  };
}

function attempt(id: AiProviderId, result: ProviderAnalysis): ProviderAttempt {
  return { id, ok: true, result, latencyMs: 100 };
}

describe('reconcile', () => {
  it('takes the weighted median of numeric fields (outlier-resistant)', () => {
    const a = reconcile(
      [
        attempt(AiProviderId.OPENAI, pa({ grassAreaM2: 200 })),
        attempt(AiProviderId.GEMINI, pa({ grassAreaM2: 210 })),
        attempt(AiProviderId.ANTHROPIC, pa({ grassAreaM2: 900 })), // outlier
      ],
      { imagesCount: 10 },
    );
    // median ~ 210, not dragged to ~437 by the outlier
    expect(a.features.grassAreaM2).toBeLessThan(300);
  });

  it('resolves booleans by majority', () => {
    const a = reconcile(
      [
        attempt(AiProviderId.OPENAI, pa({ hasPool: true })),
        attempt(AiProviderId.GEMINI, pa({ hasPool: false })),
        attempt(AiProviderId.ANTHROPIC, pa({ hasPool: false })),
      ],
      { imagesCount: 8 },
    );
    expect(a.features.hasPool).toBe(false);
    expect(a.fieldAgreement.hasPool).toBeCloseTo(2 / 3, 5);
  });

  it('resolves enums by weighted mode', () => {
    const a = reconcile(
      [
        attempt(AiProviderId.OPENAI, pa({}, { difficulty: DifficultyLevel.HIGH })),
        attempt(AiProviderId.GEMINI, pa({}, { difficulty: DifficultyLevel.HIGH })),
        attempt(AiProviderId.ANTHROPIC, pa({}, { difficulty: DifficultyLevel.MEDIUM })),
      ],
      { imagesCount: 8 },
    );
    expect(a.work.difficulty).toBe(DifficultyLevel.HIGH);
  });

  it('keeps equipment supported by a plurality and drops rare picks', () => {
    const a = reconcile(
      [
        attempt(AiProviderId.OPENAI, pa({}, { requiredEquipment: [Equipment.ROCADEIRA, Equipment.SOPRADOR] })),
        attempt(AiProviderId.GEMINI, pa({}, { requiredEquipment: [Equipment.ROCADEIRA] })),
        attempt(AiProviderId.ANTHROPIC, pa({}, { requiredEquipment: [Equipment.MOTOSSERRA] })),
      ],
      { imagesCount: 8 },
    );
    expect(a.work.requiredEquipment).toContain(Equipment.ROCADEIRA); // 2/3
    expect(a.work.requiredEquipment).not.toContain(Equipment.MOTOSSERRA); // 1/3 < 0.4
  });

  it('reports high confidence when providers agree and images are plentiful', () => {
    const a = reconcile(
      [
        attempt(AiProviderId.OPENAI, pa()),
        attempt(AiProviderId.GEMINI, pa()),
        attempt(AiProviderId.ANTHROPIC, pa()),
      ],
      { imagesCount: 12 },
    );
    expect(a.confidence).toBeGreaterThan(0.8);
    expect(a.warnings).toHaveLength(0);
  });

  it('lowers confidence and warns when providers disagree wildly', () => {
    const a = reconcile(
      [
        attempt(AiProviderId.OPENAI, pa({ grassAreaM2: 50 }, { estimatedHours: 1, estimatedCrewSize: 1 })),
        attempt(AiProviderId.GEMINI, pa({ grassAreaM2: 800 }, { estimatedHours: 12, estimatedCrewSize: 4 })),
      ],
      { imagesCount: 4 },
    );
    expect(a.confidence).toBeLessThan(0.75);
    expect(a.warnings.length).toBeGreaterThan(0);
  });

  it('warns when too few photos were provided', () => {
    const a = reconcile([attempt(AiProviderId.OPENAI, pa())], { imagesCount: 2 });
    expect(a.warnings.some((w) => w.includes('Poucas fotos'))).toBe(true);
  });

  it('records provider provenance including failures', () => {
    const a = reconcile(
      [
        attempt(AiProviderId.OPENAI, pa()),
        attempt(AiProviderId.GEMINI, pa()),
        { id: AiProviderId.ANTHROPIC, ok: false, error: 'HTTP 500', latencyMs: 40 },
      ],
      { imagesCount: 8 },
    );
    expect(a.providers).toHaveLength(3);
    expect(a.providers.find((p) => p.id === AiProviderId.ANTHROPIC)?.ok).toBe(false);
    expect(a.warnings.some((w) => w.includes('falharam'))).toBe(true);
  });
});
