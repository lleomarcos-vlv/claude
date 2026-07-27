import type { PlantSpecies } from '../types.js';

/**
 * Representative species dataset for the JardimJá knowledge base.
 *
 * This is a curated SEED covering the most common species in Brazilian gardens.
 * The production catalogue targets 2.000+ species; the same shape scales to that
 * size and is loaded into the `PlantSpecies` table via `apps/api/prisma/seed.ts`.
 * A build step can import open datasets (e.g. GBIF / Flora do Brasil) mapped onto
 * this interface. See `docs/04-ai-pipeline.md` on how species map to AI outputs.
 */
export const PLANT_SPECIES: PlantSpecies[] = [
  {
    scientificName: 'Ixora coccinea',
    commonNames: ['Ixora', 'Ixória'],
    category: 'shrub',
    care: { sunlight: 'full', wateringPerWeek: 3, pruningMonths: [8, 9], growthRate: 'medium', droughtTolerant: false },
    pests: ['cochonilha', 'pulgao'],
  },
  {
    scientificName: 'Murraya paniculata',
    commonNames: ['Murta', 'Murta-de-cheiro'],
    category: 'hedge',
    care: { sunlight: 'full', wateringPerWeek: 3, pruningMonths: [3, 9], growthRate: 'fast', droughtTolerant: true },
    pests: ['cochonilha'],
    notes: 'Cerca-viva muito comum; tolera podas frequentes de formação.',
  },
  {
    scientificName: 'Handroanthus impetiginosus',
    commonNames: ['Ipê-roxo'],
    category: 'tree',
    care: { sunlight: 'full', wateringPerWeek: 1, pruningMonths: [6, 7], growthRate: 'slow', droughtTolerant: true },
    pests: ['formiga-cortadeira'],
  },
  {
    scientificName: 'Bougainvillea spectabilis',
    commonNames: ['Primavera', 'Buganvília'],
    category: 'climber',
    care: { sunlight: 'full', wateringPerWeek: 2, pruningMonths: [2, 8], growthRate: 'fast', droughtTolerant: true },
    pests: ['pulgao', 'cochonilha'],
  },
  {
    scientificName: 'Dypsis lutescens',
    commonNames: ['Palmeira-areca', 'Areca-bambu'],
    category: 'palm',
    care: { sunlight: 'partial', wateringPerWeek: 4, pruningMonths: [], growthRate: 'medium', droughtTolerant: false },
    pests: ['cochonilha'],
  },
  {
    scientificName: 'Nematanthus wettsteinii',
    commonNames: ['Brinco-de-princesa'],
    category: 'flower',
    care: { sunlight: 'partial', wateringPerWeek: 3, pruningMonths: [9], growthRate: 'medium', droughtTolerant: false },
    pests: ['pulgao'],
  },
  {
    scientificName: 'Clusia fluminensis',
    commonNames: ['Clúsia'],
    category: 'hedge',
    care: { sunlight: 'full', wateringPerWeek: 2, pruningMonths: [3, 9], growthRate: 'medium', droughtTolerant: true },
    pests: [],
    notes: 'Excelente para cercas-vivas litorâneas; tolerante a salinidade.',
  },
  {
    scientificName: 'Agapanthus africanus',
    commonNames: ['Agapanto'],
    category: 'flower',
    care: { sunlight: 'full', wateringPerWeek: 2, pruningMonths: [4], growthRate: 'medium', droughtTolerant: true },
    pests: [],
  },
  {
    scientificName: 'Sansevieria trifasciata',
    commonNames: ['Espada-de-são-jorge'],
    category: 'succulent',
    care: { sunlight: 'partial', wateringPerWeek: 1, pruningMonths: [], growthRate: 'slow', droughtTolerant: true },
    pests: ['cochonilha'],
  },
  {
    scientificName: 'Wedelia trilobata',
    commonNames: ['Vedélia', 'Margaridão-rasteiro'],
    category: 'groundcover',
    care: { sunlight: 'full', wateringPerWeek: 2, pruningMonths: [3, 10], growthRate: 'fast', droughtTolerant: true },
    pests: [],
    notes: 'Forração agressiva; requer contenção.',
  },
  {
    scientificName: 'Licania tomentosa',
    commonNames: ['Oiti'],
    category: 'tree',
    care: { sunlight: 'full', wateringPerWeek: 1, pruningMonths: [6, 7], growthRate: 'medium', droughtTolerant: true },
    pests: ['formiga-cortadeira'],
    notes: 'Árvore de sombra urbana muito usada em calçadas.',
  },
  {
    scientificName: 'Rosa chinensis',
    commonNames: ['Roseira'],
    category: 'shrub',
    care: { sunlight: 'full', wateringPerWeek: 4, pruningMonths: [7, 8], growthRate: 'medium', droughtTolerant: false },
    pests: ['pulgao', 'fungo-mancha-foliar'],
  },
];
