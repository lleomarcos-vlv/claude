import { Equipment, ServiceType } from '@jardimja/shared';
import type { CostReference, ProductivityReference } from '../types.js';

/**
 * Labour productivity references (m² per worker-hour). Used to sanity-check the
 * AI's `estimatedHours` against agronomic norms and to seed the pricing engine's
 * hour expectations. Numbers reflect typical residential jobs with standard tools.
 */
export const PRODUCTIVITY_REFERENCE: ProductivityReference[] = [
  {
    service: ServiceType.CORTE_GRAMA,
    m2PerHourPerWorker: 250,
    requiredEquipment: [Equipment.CORTADOR_GRAMA],
    notes: 'Grama em altura normal com cortador. Grama alta cai para ~120 m²/h com roçadeira.',
  },
  {
    service: ServiceType.RETIRADA_FOLHAS,
    m2PerHourPerWorker: 300,
    requiredEquipment: [Equipment.SOPRADOR],
    notes: 'Depende do volume de folhas (leafLitterLevel).',
  },
  {
    service: ServiceType.PODA,
    m2PerHourPerWorker: null,
    requiredEquipment: [Equipment.PODADOR_ALTURA, Equipment.MOTOSSERRA],
    notes: 'Trabalho por unidade/arbusto/árvore, não por m². ~20–40 min por arbusto.',
  },
  {
    service: ServiceType.LIMPEZA,
    m2PerHourPerWorker: 150,
    requiredEquipment: [Equipment.SOPRADOR],
    notes: 'Limpeza geral do jardim, incluindo canteiros.',
  },
  {
    service: ServiceType.ADUBACAO,
    m2PerHourPerWorker: 400,
    requiredEquipment: [],
    notes: 'Aplicação de adubo/corretivo em área preparada.',
  },
  {
    service: ServiceType.PLANTIO,
    m2PerHourPerWorker: 30,
    requiredEquipment: [],
    notes: 'Preparo de solo + plantio de forrações/mudas.',
  },
  {
    service: ServiceType.CONTROLE_PRAGAS,
    m2PerHourPerWorker: 500,
    requiredEquipment: [Equipment.PULVERIZADOR],
    notes: 'Pulverização; exclui diagnóstico.',
  },
];

/** Regional average cost references (informational; pricing-engine owns actuals). */
export const COST_REFERENCE: CostReference[] = [
  { key: 'labor_hour', label: 'Hora de jardineiro', unit: 'h', avgBrl: 45 },
  { key: 'green_waste', label: 'Descarte de resíduo verde', unit: 'm³', avgBrl: 45 },
  { key: 'grass_sqm_install', label: 'Instalação de grama (mão de obra)', unit: 'm²', avgBrl: 12 },
  { key: 'mulch_bag', label: 'Saco de substrato/mulch', unit: 'saco 20kg', avgBrl: 28 },
  { key: 'fuel_liter', label: 'Combustível', unit: 'L', avgBrl: 6.2 },
];
