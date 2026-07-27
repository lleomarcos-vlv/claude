import { AiProviderId, ProviderAnalysisSchema, type ProviderAnalysis } from '@jardimja/shared';
import type { VisionAnalyzeInput, VisionProvider } from '../types.js';
import { buildUserText, extractJson, SYSTEM_PROMPT } from '../prompt.js';
import { postJson, type BaseProviderConfig, type FetchLike } from './http.js';

/**
 * Google Gemini Vision provider (generateContent). Inline images must be base64;
 * remote URLs are fetched and inlined by the caller/storage layer before this
 * runs (see the API's `AiService`), or passed as base64 directly.
 */
export class GeminiVisionProvider implements VisionProvider {
  readonly id = AiProviderId.GEMINI;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly cfg: BaseProviderConfig) {
    this.fetchImpl = cfg.fetchImpl ?? fetch;
  }

  async analyze(input: VisionAnalyzeInput): Promise<ProviderAnalysis> {
    const parts: unknown[] = [{ text: `${SYSTEM_PROMPT}\n\n${buildUserText(input)}` }];
    for (const img of input.images) {
      if (!img.base64) continue; // Gemini inline needs bytes
      parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.cfg.model}:generateContent?key=${this.cfg.apiKey}`;
    const data = (await postJson(this.fetchImpl, url, {}, {
      contents: [{ role: 'user', parts }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    })) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
    return ProviderAnalysisSchema.parse(extractJson(text));
  }
}
