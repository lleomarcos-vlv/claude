import type { AiProviderId, ProviderAnalysis } from '@jardimja/shared';

/** A single piece of media, referenced by URL (preferred) or inline base64. */
export interface MediaRef {
  /** Publicly reachable (signed) URL — providers fetch it directly. */
  url?: string;
  /** Base64 payload, used when a URL is not available (small images only). */
  base64?: string;
  mimeType: string;
}

/** The full multimodal context handed to every vision provider. */
export interface VisionAnalyzeInput {
  /** 4–30 photos of the garden. */
  images: MediaRef[];
  /** Optional walkthrough video (providers that can't take video ignore it). */
  video?: MediaRef;
  /** Transcript of the client's voice note, if any. */
  audioTranscript?: string;
  /** Free-text note ("quero deixar meu jardim bonito"). */
  clientNote?: string;
  /** Where the garden is — feeds local context and, later, the pricing engine. */
  location?: { city?: string; state?: string; lat?: number; lng?: number };
  /** Current weather summary (rain affects grass height / access). */
  weather?: string;
  /** Area the client drew on the map, in m² (a strong prior for grassAreaM2). */
  drawnAreaM2?: number;
}

/** Contract every vision provider implements. */
export interface VisionProvider {
  readonly id: AiProviderId;
  analyze(input: VisionAnalyzeInput): Promise<ProviderAnalysis>;
}

/** Result of one provider attempt inside the orchestrator (success or failure). */
export interface ProviderAttempt {
  id: AiProviderId;
  ok: boolean;
  result?: ProviderAnalysis;
  error?: string;
  latencyMs: number;
}

export interface OrchestratorOptions {
  /** Minimum providers that must succeed, else we throw AI_QUORUM_NOT_MET. */
  minQuorum: number;
  /** Per-provider timeout in ms. */
  timeoutMs: number;
  /** Relative trust weights per provider id (default 1 each). */
  weights?: Partial<Record<AiProviderId, number>>;
}

export const DEFAULT_ORCHESTRATOR_OPTIONS: OrchestratorOptions = {
  minQuorum: 2,
  timeoutMs: 30_000,
  weights: { openai: 1, gemini: 1, anthropic: 1, mock: 0.5 },
};
