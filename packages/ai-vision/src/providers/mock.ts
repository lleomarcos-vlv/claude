import {
  AccessDifficulty,
  AiProviderId,
  DifficultyLevel,
  Equipment,
  ProviderAnalysisSchema,
  RiskLevel,
  ServiceType,
  TerrainSlope,
  type ProviderAnalysis,
} from '@jardimja/shared';
import type { VisionAnalyzeInput, VisionProvider } from '../types.js';

/**
 * Deterministic offline provider. Lets the entire quoting flow run without any
 * API keys (dev, CI, demos). Derives plausible numbers from the drawn area /
 * photo count so the output is stable and testable — never random.
 */
export class MockVisionProvider implements VisionProvider {
  readonly id = AiProviderId.MOCK;

  constructor(private readonly seedNudge = 0) {}

  async analyze(input: VisionAnalyzeInput): Promise<ProviderAnalysis> {
    const area = input.drawnAreaM2 ?? 120 + input.images.length * 15 + this.seedNudge;
    const grassArea = Math.round(area * 0.8);
    const tall = area > 150;
    const hours = Math.max(1, Math.round((grassArea / 90 + input.images.length * 0.1) * 10) / 10);
    const crew = grassArea > 300 ? 3 : grassArea > 120 ? 2 : 1;

    const analysis: ProviderAnalysis = {
      features: {
        grassAreaM2: grassArea,
        totalAreaM2: Math.round(area),
        grassHeightCm: tall ? 32 : 12,
        vegetationTypes: ['grama', 'arbustos ornamentais'],
        treeCount: Math.round(area / 80),
        shrubCount: Math.round(area / 30),
        leafLitterLevel: Math.min(5, Math.round(input.images.length / 6)),
        hasTallWeeds: tall,
        hasRocks: false,
        hasPool: false,
        hasSidewalks: true,
        hasWalls: true,
        terrainSlope: TerrainSlope.GENTLE,
        accessDifficulty: AccessDifficulty.EASY,
        greenWasteM3: Math.round((grassArea / 120) * 10) / 10,
      },
      work: {
        recommendedServices: tall
          ? [ServiceType.CORTE_GRAMA, ServiceType.RETIRADA_FOLHAS]
          : [ServiceType.CORTE_GRAMA],
        requiredEquipment: tall
          ? [Equipment.ROCADEIRA, Equipment.SOPRADOR]
          : [Equipment.CORTADOR_GRAMA],
        needsSpecialEquipment: false,
        estimatedHours: hours,
        estimatedCrewSize: crew,
        difficulty: tall ? DifficultyLevel.HIGH : DifficultyLevel.MEDIUM,
        risk: RiskLevel.LOW,
      },
      summary: `Jardim de aproximadamente ${Math.round(area)} m² (~${grassArea} m² de grama). ${
        tall ? 'Grama alta, requer roçadeira.' : 'Grama em altura normal.'
      } Estimativa gerada em modo offline (mock).`,
      fieldConfidence: {
        grassAreaM2: input.drawnAreaM2 ? 0.9 : 0.7,
        estimatedHours: 0.75,
        estimatedCrewSize: 0.8,
      },
    };
    return ProviderAnalysisSchema.parse(analysis);
  }
}
