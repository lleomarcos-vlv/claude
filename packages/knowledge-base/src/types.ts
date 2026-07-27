import type { Equipment, ServiceType } from '@jardimja/shared';

export type PlantCategory =
  | 'grass'
  | 'tree'
  | 'shrub'
  | 'flower'
  | 'palm'
  | 'succulent'
  | 'groundcover'
  | 'hedge'
  | 'climber';

export interface PlantSpecies {
  scientificName: string;
  commonNames: string[];
  category: PlantCategory;
  care: {
    sunlight: 'full' | 'partial' | 'shade';
    wateringPerWeek: number;
    /** Ideal pruning months (1–12), empty if not applicable. */
    pruningMonths: number[];
    growthRate: 'slow' | 'medium' | 'fast';
    droughtTolerant: boolean;
  };
  /** Common pest ids (see PEST_LIBRARY). */
  pests: string[];
  notes?: string;
}

export interface GrassType {
  id: string;
  commonName: string;
  scientificName: string;
  idealMowHeightCm: [number, number];
  growthRate: 'slow' | 'medium' | 'fast';
  /** Days between mowings in growing season. */
  mowIntervalDays: number;
  shadeTolerant: boolean;
  climate: string[];
}

export interface Pest {
  id: string;
  name: string;
  scientificName?: string;
  affects: string[];
  symptoms: string[];
  treatment: string[];
  severity: 'low' | 'medium' | 'high';
}

/** Labour productivity references used to sanity-check AI hour estimates. */
export interface ProductivityReference {
  service: ServiceType;
  /** Square metres one worker covers per hour (null for count-based work). */
  m2PerHourPerWorker: number | null;
  requiredEquipment: Equipment[];
  notes: string;
}

/** Regional average cost references (informational; the engine owns real pricing). */
export interface CostReference {
  key: string;
  label: string;
  unit: string;
  avgBrl: number;
}
