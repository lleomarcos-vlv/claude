import { AiProviderId, ProviderAnalysisSchema, type ProviderAnalysis } from '@jardimja/shared';
import type { VisionAnalyzeInput, VisionProvider } from '../types.js';
import { buildUserText, extractJson, SYSTEM_PROMPT } from '../prompt.js';
import { postJson, type BaseProviderConfig, type FetchLike } from './http.js';

/**
 * OpenAI Vision provider (Chat Completions with image_url content parts).
 * Uses `response_format: json_object` to keep replies parseable. No SDK — a
 * single fetch keeps the dependency surface (and cold-start) minimal.
 */
export class OpenAIVisionProvider implements VisionProvider {
  readonly id = AiProviderId.OPENAI;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly cfg: BaseProviderConfig) {
    this.fetchImpl = cfg.fetchImpl ?? fetch;
  }

  async analyze(input: VisionAnalyzeInput): Promise<ProviderAnalysis> {
    const content: unknown[] = [{ type: 'text', text: buildUserText(input) }];
    for (const img of input.images) {
      content.push({ type: 'image_url', image_url: { url: imageUrl(img), detail: 'low' } });
    }

    const data = (await postJson(
      this.fetchImpl,
      'https://api.openai.com/v1/chat/completions',
      { authorization: `Bearer ${this.cfg.apiKey}` },
      {
        model: this.cfg.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content },
        ],
      },
    )) as { choices?: { message?: { content?: string } }[] };

    const text = data.choices?.[0]?.message?.content ?? '';
    return ProviderAnalysisSchema.parse(extractJson(text));
  }
}

function imageUrl(img: { url?: string; base64?: string; mimeType: string }): string {
  if (img.url) return img.url;
  if (img.base64) return `data:${img.mimeType};base64,${img.base64}`;
  throw new Error('MediaRef requires url or base64');
}
