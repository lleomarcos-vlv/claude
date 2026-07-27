import { DifficultyLevel, Equipment, UrgencyLevel } from '@jardimja/shared';

/**
 * Pricing configuration — every knob the engine reads. Shipped with sane
 * Brazil-wide defaults; the API overrides per-city/per-region values from the
 * database (table `pricing_config`) and folds in ML calibration on top.
 *
 * All base rates are in **BRL** (not cents) for readability; the engine converts
 * to integer cents at the boundary.
 */
export interface PricingConfig {
  /** Base labour cost per gardener-hour, before city/difficulty multipliers. */
  baseHourlyRate: number;
  /** Minimum any job can cost (visit floor), regardless of size. */
  minimumJobPrice: number;
  /** Platform commission as a fraction (0.10 = 10%). */
  platformFeePercent: number;

  /** Multiplier applied to labour by city cost of living. Default 1.0. */
  cityCostIndex: Record<string, number>;

  /** Labour multiplier by difficulty. */
  difficultyMultiplier: Record<DifficultyLevel, number>;
  /** Labour multiplier by urgency (surge). */
  urgencyMultiplier: Record<UrgencyLevel, number>;

  /** Per-equipment day-rate; charged pro-rata to estimated hours (8h day). */
  equipmentDayRate: Record<Equipment, number>;

  /** Travel. */
  travel: {
    /** Fixed dispatch fee regardless of distance. */
    baseFee: number;
    /** Fuel price per litre (overridden from env / live feed). */
    fuelPricePerLiter: number;
    /** Vehicle consumption (km per litre). */
    kmPerLiter: number;
    /** Wear/amortisation added per km on top of fuel. */
    wearPerKm: number;
    /** Round-trip is charged, so distance is doubled unless told otherwise. */
    roundTrip: boolean;
  };

  /** Green-waste disposal cost per m³ hauled to a drop-off. */
  disposalPricePerM3: number;

  /**
   * Supply/demand surge. `neutralRatio` is gardeners-per-open-job at which the
   * multiplier is 1.0. Below it (scarce supply) prices rise up to `maxSurge`;
   * above it (abundant supply) they fall to `minSurge`.
   */
  supplyDemand: {
    neutralRatio: number;
    minSurge: number;
    maxSurge: number;
  };

  /** Width of the advertised price band as a fraction of the point estimate. */
  bandWidthFraction: number;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  baseHourlyRate: 45,
  minimumJobPrice: 80,
  platformFeePercent: 0.1,

  cityCostIndex: {
    'São Paulo': 1.25,
    'Rio de Janeiro': 1.2,
    'Brasília': 1.18,
    'Belo Horizonte': 1.05,
    'Curitiba': 1.05,
    'Porto Alegre': 1.05,
    Campinas: 1.1,
    Salvador: 0.95,
    Recife: 0.92,
    Fortaleza: 0.9,
    Goiânia: 0.95,
    Manaus: 0.98,
    __default: 1.0,
  },

  difficultyMultiplier: {
    [DifficultyLevel.LOW]: 0.9,
    [DifficultyLevel.MEDIUM]: 1.0,
    [DifficultyLevel.HIGH]: 1.25,
    [DifficultyLevel.EXTREME]: 1.55,
  },

  urgencyMultiplier: {
    [UrgencyLevel.FLEXIBLE]: 0.95,
    [UrgencyLevel.NORMAL]: 1.0,
    [UrgencyLevel.URGENT]: 1.2,
    [UrgencyLevel.EMERGENCY]: 1.45,
  },

  equipmentDayRate: {
    [Equipment.ROCADEIRA]: 60,
    [Equipment.CORTADOR_GRAMA]: 50,
    [Equipment.MOTOSSERRA]: 90,
    [Equipment.SOPRADOR]: 40,
    [Equipment.TRITURADOR]: 140,
    [Equipment.ESCADA]: 20,
    [Equipment.CAMINHAO]: 220,
    [Equipment.PULVERIZADOR]: 45,
    [Equipment.PODADOR_ALTURA]: 55,
  },

  travel: {
    baseFee: 15,
    fuelPricePerLiter: 6.2,
    kmPerLiter: 10,
    wearPerKm: 0.35,
    roundTrip: true,
  },

  disposalPricePerM3: 45,

  supplyDemand: {
    neutralRatio: 3, // 3 available gardeners per open job = balanced
    minSurge: 0.9,
    maxSurge: 1.35,
  },

  bandWidthFraction: 0.12,
};

/** Resolve a city's cost index, falling back to the neutral default. */
export function cityIndex(config: PricingConfig, city: string | undefined): number {
  if (!city) return config.cityCostIndex.__default ?? 1;
  return config.cityCostIndex[city] ?? config.cityCostIndex.__default ?? 1;
}
