import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOrchestrator, type MediaRef, type VisionAnalyzeInput } from '@jardimja/ai-vision';
import { plausibilityOfHours } from '@jardimja/knowledge-base';
import type { GardenAnalysis, ServiceType } from '@jardimja/shared';

export interface AnalyzeParams {
  photos: { url: string; mimeType: string }[];
  videoUrl?: string;
  audioTranscript?: string;
  clientNote?: string;
  location?: { city?: string; state?: string; lat?: number; lng?: number };
  weather?: string;
  drawnAreaM2?: number;
  services?: ServiceType[];
}

/**
 * Backend wrapper around `@jardimja/ai-vision`. Builds the multimodal input,
 * runs the multi-provider consensus, and applies a knowledge-base sanity check
 * on top (nudging warnings when the AI's hours look agronomically implausible).
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly orchestrator;

  constructor(config: ConfigService) {
    const ai = config.get('ai', { infer: true }) as {
      providers: string;
      minQuorum: number;
      timeoutMs: number;
      openai: { apiKey?: string; model: string };
      gemini: { apiKey?: string; model: string };
      anthropic: { apiKey?: string; model: string };
    };
    this.orchestrator = createOrchestrator(
      {
        providers: ai.providers,
        minQuorum: ai.minQuorum,
        timeoutMs: ai.timeoutMs,
        openai: ai.openai,
        gemini: ai.gemini,
        anthropic: ai.anthropic,
      },
      { minQuorum: ai.minQuorum, timeoutMs: ai.timeoutMs },
    );
  }

  async analyze(params: AnalyzeParams): Promise<GardenAnalysis> {
    const images: MediaRef[] = params.photos.map((p) => ({ url: p.url, mimeType: p.mimeType }));
    const input: VisionAnalyzeInput = {
      images,
      video: params.videoUrl ? { url: params.videoUrl, mimeType: 'video/mp4' } : undefined,
      audioTranscript: params.audioTranscript,
      clientNote: params.clientNote,
      location: params.location,
      weather: params.weather,
      drawnAreaM2: params.drawnAreaM2,
    };

    const analysis = await this.orchestrator.analyze(input);
    return this.applyKnowledgeChecks(analysis, params.services);
  }

  /** Cross-check AI hours vs agronomic productivity norms; warn on big drifts. */
  private applyKnowledgeChecks(analysis: GardenAnalysis, services?: ServiceType[]): GardenAnalysis {
    const svc = services?.[0] ?? analysis.work.recommendedServices[0];
    if (!svc) return analysis;
    const factor = plausibilityOfHours(
      svc,
      analysis.features.grassAreaM2,
      analysis.work.estimatedHours,
      analysis.work.estimatedCrewSize,
    );
    if (factor != null && (factor < 0.5 || factor > 2)) {
      this.logger.warn(`AI hour estimate off vs norms (factor ${factor.toFixed(2)}) for ${svc}`);
      return {
        ...analysis,
        warnings: [
          ...analysis.warnings,
          'Estimativa de horas divergente das normas de produtividade — revisar no orçamento.',
        ],
        confidence: Math.max(0.4, analysis.confidence - 0.05),
      };
    }
    return analysis;
  }
}
