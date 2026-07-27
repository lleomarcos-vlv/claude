/**
 * @jardimja/knowledge-base — the agronomic "brain": species, grass types, pests,
 * productivity and cost references. Consumed by the API (seeds the DB, sanity-
 * checks AI estimates, powers the conversational assistant) and documented in
 * `docs/04-ai-pipeline.md`.
 */
import type { ServiceType } from '@jardimja/shared';
import { PLANT_SPECIES } from './data/species.js';
import { GRASS_TYPES } from './data/grass.js';
import { PEST_LIBRARY } from './data/pests.js';
import { PRODUCTIVITY_REFERENCE, COST_REFERENCE } from './data/productivity.js';

export * from './types.js';
export { PLANT_SPECIES, GRASS_TYPES, PEST_LIBRARY, PRODUCTIVITY_REFERENCE, COST_REFERENCE };

/** Case-insensitive lookup by scientific or common name. */
export function findSpecies(name: string) {
  const q = name.trim().toLowerCase();
  return PLANT_SPECIES.find(
    (s) =>
      s.scientificName.toLowerCase() === q ||
      s.commonNames.some((c) => c.toLowerCase() === q || c.toLowerCase().includes(q)),
  );
}

export function findGrass(id: string) {
  const q = id.trim().toLowerCase();
  return GRASS_TYPES.find((g) => g.id === q || g.commonName.toLowerCase().includes(q));
}

export function findPest(id: string) {
  const q = id.trim().toLowerCase();
  return PEST_LIBRARY.find((p) => p.id === q || p.name.toLowerCase().includes(q));
}

/** Expected m² per worker-hour for a service, or null for count-based work. */
export function productivityFor(service: ServiceType): number | null {
  return PRODUCTIVITY_REFERENCE.find((p) => p.service === service)?.m2PerHourPerWorker ?? null;
}

/**
 * Sanity-check the AI's hour estimate for lawn-type work against agronomic norms.
 * Returns a factor: 1 = plausible, <1 = AI likely over-estimated, >1 = under.
 */
export function plausibilityOfHours(
  service: ServiceType,
  areaM2: number,
  estimatedHours: number,
  crewSize: number,
): number | null {
  const rate = productivityFor(service);
  if (!rate || estimatedHours <= 0 || crewSize <= 0) return null;
  const expectedHours = areaM2 / (rate * crewSize);
  return expectedHours / estimatedHours;
}

export const KNOWLEDGE_BASE_STATS = {
  species: PLANT_SPECIES.length,
  grassTypes: GRASS_TYPES.length,
  pests: PEST_LIBRARY.length,
  productivityRefs: PRODUCTIVITY_REFERENCE.length,
};
