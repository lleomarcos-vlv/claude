import { AiProviderId, ProviderAnalysisSchema, type ProviderAnalysis } from '@jardimja/shared';
import type { VisionAnalyzeInput, VisionProvider } from '../types.js';
import { buildUserText, extractJson, SYSTEM_PROMPT } from '../prompt.js';
import { postJson, type BaseProviderConfig, type FetchLike } from './http.js';

/**
 * Anthropic Claude Vision provider (Messages API). Images are passed as `image`
 * content blocks, either as a URL source or base64 source.
 */
export class AnthropicVisionProvider implements VisionProvider {
  readonly id = AiProviderId.ANTHROPIC;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly cfg: BaseProviderConfig) {
    this.fetchImpl = cfg.fetchImpl ?? fetch;
  }

  async analyze(input: VisionAnalyzeInput): Promise<ProviderAnalysis> {
    const content: unknown[] = [{ type: 'text', text: buildUserText(input) }];
    for (const img of input.images) {
      if (img.url) {
        content.push({ type: 'image', source: { type: 'url', url: img.url } });
      } else if (img.base64) {
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mimeType, data: img.base64 },
        });
      }
    }

    const data = (await postJson(
      this.fetchImpl,
      'https://api.anthropic.com/v1/messages',
      { 'x-api-key': this.cfg.apiKey, 'anthropic-version': '2023-06-01' },
      {
        model: this.cfg.model,
        max_tokens: 1500,
        temperature: 0.2,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content }],
      },
    )) as { content?: { type: string; text?: string }[] };

    const text = data.content?.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('') ?? '';
    return ProviderAnalysisSchema.parse(extractJson(text));
  }
}
