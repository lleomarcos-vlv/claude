import { describe, expect, it, vi } from 'vitest';
import { AiProviderId, DomainError, ErrorCode, type ProviderAnalysis } from '@jardimja/shared';
import { VisionOrchestrator } from '../src/orchestrator.js';
import { MockVisionProvider } from '../src/providers/mock.js';
import { OpenAIVisionProvider } from '../src/providers/openai.js';
import { createOrchestrator } from '../src/factory.js';
import type { VisionAnalyzeInput, VisionProvider } from '../src/types.js';

const input: VisionAnalyzeInput = {
  images: Array.from({ length: 6 }, (_, i) => ({ url: `https://cdn/img${i}.jpg`, mimeType: 'image/jpeg' })),
  drawnAreaM2: 235,
};

class FailingProvider implements VisionProvider {
  constructor(readonly id: AiProviderId) {}
  async analyze(): Promise<ProviderAnalysis> {
    throw new Error('boom');
  }
}

class SlowProvider implements VisionProvider {
  readonly id = AiProviderId.GEMINI;
  async analyze(): Promise<ProviderAnalysis> {
    await new Promise((r) => setTimeout(r, 1000));
    return new MockVisionProvider().analyze(input);
  }
}

describe('VisionOrchestrator', () => {
  it('produces consensus from two mock providers', async () => {
    const orch = new VisionOrchestrator([new MockVisionProvider(0), new MockVisionProvider(30)], { minQuorum: 2 });
    const analysis = await orch.analyze(input);
    expect(analysis.features.grassAreaM2).toBeGreaterThan(0);
    expect(analysis.providers).toHaveLength(2);
    expect(analysis.confidence).toBeGreaterThan(0);
  });

  it('throws AI_QUORUM_NOT_MET when too few providers succeed', async () => {
    const orch = new VisionOrchestrator(
      [new MockVisionProvider(0), new FailingProvider(AiProviderId.OPENAI)],
      { minQuorum: 2 },
    );
    await expect(orch.analyze(input)).rejects.toMatchObject({ code: ErrorCode.AI_QUORUM_NOT_MET });
  });

  it('does not let a failing provider block a met quorum', async () => {
    const orch = new VisionOrchestrator(
      [new MockVisionProvider(0), new MockVisionProvider(10), new FailingProvider(AiProviderId.ANTHROPIC)],
      { minQuorum: 2 },
    );
    const analysis = await orch.analyze(input);
    expect(analysis.providers.filter((p) => p.ok)).toHaveLength(2);
  });

  it('times out a slow provider instead of hanging', async () => {
    const orch = new VisionOrchestrator([new MockVisionProvider(0), new MockVisionProvider(5), new SlowProvider()], {
      minQuorum: 2,
      timeoutMs: 50,
    });
    const analysis = await orch.analyze(input);
    expect(analysis.providers.find((p) => p.id === AiProviderId.GEMINI)?.ok).toBe(false);
  });
});

describe('createOrchestrator', () => {
  it('falls back to mock providers when no API keys are present', async () => {
    const orch = createOrchestrator({ providers: 'openai,gemini,anthropic' });
    const analysis = await orch.analyze(input);
    expect(analysis.providers.every((p) => p.id === AiProviderId.MOCK)).toBe(true);
  });
});

describe('OpenAIVisionProvider (injected fetch)', () => {
  it('parses a well-formed API response into a ProviderAnalysis', async () => {
    const body: ProviderAnalysis = await new MockVisionProvider().analyze(input);
    const fakeFetch = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(body) } }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const provider = new OpenAIVisionProvider({ apiKey: 'sk-test', model: 'gpt-4o', fetchImpl: fakeFetch as unknown as typeof fetch });
    const result = await provider.analyze(input);
    expect(result.features.grassAreaM2).toBe(body.features.grassAreaM2);
    expect(fakeFetch).toHaveBeenCalledOnce();
  });

  it('surfaces API errors', async () => {
    const fakeFetch = vi.fn(async () => new Response('rate limited', { status: 429 }));
    const provider = new OpenAIVisionProvider({ apiKey: 'sk-test', model: 'gpt-4o', fetchImpl: fakeFetch as unknown as typeof fetch });
    await expect(provider.analyze(input)).rejects.toThrow(/429/);
  });
});
