import { describe, expect, it } from 'vitest';
import { ServiceType } from '@jardimja/shared';
import { findSpecies, findPest, productivityFor, plausibilityOfHours, KNOWLEDGE_BASE_STATS } from '../src/index.js';

describe('knowledge-base', () => {
  it('finds species by common name (case-insensitive)', () => {
    expect(findSpecies('primavera')?.scientificName).toBe('Bougainvillea spectabilis');
    expect(findSpecies('IXORA')?.category).toBe('shrub');
  });

  it('finds pests by id or name', () => {
    expect(findPest('pulgao')?.severity).toBe('medium');
    expect(findPest('Cupim')?.id).toBe('brusone');
  });

  it('returns productivity for lawn services and null for count-based ones', () => {
    expect(productivityFor(ServiceType.CORTE_GRAMA)).toBeGreaterThan(0);
    expect(productivityFor(ServiceType.PODA)).toBeNull();
  });

  it('scores hour plausibility (≈1 when the AI estimate matches norms)', () => {
    // 250 m²/h/worker, 250 m², 1 worker => ~1h expected. AI said 1h => factor ~1.
    const f = plausibilityOfHours(ServiceType.CORTE_GRAMA, 250, 1, 1);
    expect(f).not.toBeNull();
    expect(f!).toBeGreaterThan(0.8);
    expect(f!).toBeLessThan(1.25);
  });

  it('exposes catalogue stats', () => {
    expect(KNOWLEDGE_BASE_STATS.species).toBeGreaterThan(0);
    expect(KNOWLEDGE_BASE_STATS.pests).toBeGreaterThan(0);
  });
});
