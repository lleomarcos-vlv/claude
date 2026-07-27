/**
 * @jardimja/ai-vision — multimodal garden analysis with cross-model consensus.
 *
 * Runs OpenAI, Gemini and Claude vision in parallel over the same prompt/schema,
 * reconciles their answers field-by-field, and returns one `GardenAnalysis` with
 * a calibrated confidence and full provenance. Falls back to a deterministic mock
 * so the whole flow works with zero API keys.
 */
export { VisionOrchestrator } from './orchestrator.js';
export { createOrchestrator, type VisionEnv } from './factory.js';
export { reconcile } from './consensus.js';
export { SYSTEM_PROMPT, buildUserText, extractJson } from './prompt.js';

export { MockVisionProvider } from './providers/mock.js';
export { OpenAIVisionProvider } from './providers/openai.js';
export { GeminiVisionProvider } from './providers/gemini.js';
export { AnthropicVisionProvider } from './providers/anthropic.js';
export type { BaseProviderConfig } from './providers/http.js';

export {
  DEFAULT_ORCHESTRATOR_OPTIONS,
  type VisionProvider,
  type VisionAnalyzeInput,
  type MediaRef,
  type ProviderAttempt,
  type OrchestratorOptions,
} from './types.js';
