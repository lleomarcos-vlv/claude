import { AiProviderId } from '@jardimja/shared';
import { VisionOrchestrator } from './orchestrator.js';
import { MockVisionProvider } from './providers/mock.js';
import { OpenAIVisionProvider } from './providers/openai.js';
import { GeminiVisionProvider } from './providers/gemini.js';
import { AnthropicVisionProvider } from './providers/anthropic.js';
import type { OrchestratorOptions, VisionProvider } from './types.js';

export interface VisionEnv {
  providers: string; // comma list, e.g. "openai,gemini,anthropic"
  minQuorum?: number;
  timeoutMs?: number;
  openai?: { apiKey?: string; model?: string };
  gemini?: { apiKey?: string; model?: string };
  anthropic?: { apiKey?: string; model?: string };
}

/**
 * Build an orchestrator from environment config. Any provider whose key is
 * missing is skipped. If nothing usable is configured we fall back to two
 * lightly-perturbed mock providers so the quorum logic (and the whole flow)
 * still exercises end-to-end in dev/CI.
 */
export function createOrchestrator(env: VisionEnv, opts: Partial<OrchestratorOptions> = {}): VisionOrchestrator {
  const wanted = env.providers.split(',').map((s) => s.trim().toLowerCase());
  const providers: VisionProvider[] = [];

  if (wanted.includes(AiProviderId.OPENAI) && env.openai?.apiKey) {
    providers.push(new OpenAIVisionProvider({ apiKey: env.openai.apiKey, model: env.openai.model ?? 'gpt-4o' }));
  }
  if (wanted.includes(AiProviderId.GEMINI) && env.gemini?.apiKey) {
    providers.push(new GeminiVisionProvider({ apiKey: env.gemini.apiKey, model: env.gemini.model ?? 'gemini-2.0-flash' }));
  }
  if (wanted.includes(AiProviderId.ANTHROPIC) && env.anthropic?.apiKey) {
    providers.push(new AnthropicVisionProvider({ apiKey: env.anthropic.apiKey, model: env.anthropic.model ?? 'claude-sonnet-5' }));
  }

  if (providers.length === 0) {
    providers.push(new MockVisionProvider(0), new MockVisionProvider(20));
  }

  const minQuorum = Math.min(opts.minQuorum ?? env.minQuorum ?? 2, providers.length);
  return new VisionOrchestrator(providers, { ...opts, minQuorum, timeoutMs: opts.timeoutMs ?? env.timeoutMs ?? 30_000 });
}
