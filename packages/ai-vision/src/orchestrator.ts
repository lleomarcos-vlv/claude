import { DomainError, ErrorCode, type GardenAnalysis } from '@jardimja/shared';
import { reconcile } from './consensus.js';
import {
  DEFAULT_ORCHESTRATOR_OPTIONS,
  type OrchestratorOptions,
  type ProviderAttempt,
  type VisionAnalyzeInput,
  type VisionProvider,
} from './types.js';

/**
 * Fan-out orchestrator: runs every configured vision provider in parallel, with
 * per-provider timeouts, collects successes and failures, enforces a quorum, and
 * returns a single reconciled `GardenAnalysis` with a calibrated confidence.
 *
 * Design choices:
 *  - One slow/broken model never blocks the estimate (independent timeouts).
 *  - Quorum > 1 means an outlier can't single-handedly set the price.
 *  - The full provenance (who answered, latency, errors) is attached for audit.
 */
export class VisionOrchestrator {
  private readonly opts: OrchestratorOptions;

  constructor(
    private readonly providers: VisionProvider[],
    opts: Partial<OrchestratorOptions> = {},
  ) {
    if (providers.length === 0) {
      throw new Error('VisionOrchestrator needs at least one provider');
    }
    this.opts = { ...DEFAULT_ORCHESTRATOR_OPTIONS, ...opts };
  }

  async analyze(input: VisionAnalyzeInput): Promise<GardenAnalysis> {
    const attempts = await Promise.all(
      this.providers.map((p) => this.runOne(p, input)),
    );

    const okCount = attempts.filter((a) => a.ok).length;
    if (okCount < this.opts.minQuorum) {
      throw new DomainError(
        ErrorCode.AI_QUORUM_NOT_MET,
        `Only ${okCount}/${this.providers.length} vision providers succeeded; quorum is ${this.opts.minQuorum}.`,
        { attempts: attempts.map((a) => ({ id: a.id, ok: a.ok, error: a.error })) },
      );
    }

    return reconcile(attempts, { weights: this.opts.weights, imagesCount: input.images.length });
  }

  private async runOne(provider: VisionProvider, input: VisionAnalyzeInput): Promise<ProviderAttempt> {
    const started = performance.now();
    try {
      const result = await withTimeout(provider.analyze(input), this.opts.timeoutMs, provider.id);
      return { id: provider.id, ok: true, result, latencyMs: Math.round(performance.now() - started) };
    } catch (err) {
      return {
        id: provider.id,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        latencyMs: Math.round(performance.now() - started),
      };
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}
