import type { Pest } from '../types.js';

/** Common pests/diseases in Brazilian gardens. Seed set — extensible. */
export const PEST_LIBRARY: Pest[] = [
  {
    id: 'lagarta-do-cartucho',
    name: 'Lagarta',
    scientificName: 'Spodoptera frugiperda',
    affects: ['grass', 'flower'],
    symptoms: ['folhas roídas', 'falhas no gramado', 'presença de lagartas ao entardecer'],
    treatment: ['inseticida biológico (Bacillus thuringiensis)', 'remoção manual', 'controle de umidade'],
    severity: 'medium',
  },
  {
    id: 'cochonilha',
    name: 'Cochonilha',
    scientificName: 'Coccoidea',
    affects: ['shrub', 'tree', 'succulent', 'palm'],
    symptoms: ['crostas brancas/marrons nos caules', 'fumagina (mofo preto)', 'amarelecimento'],
    treatment: ['óleo de neem', 'poda de partes infestadas', 'controle de formigas associadas'],
    severity: 'high',
  },
  {
    id: 'pulgao',
    name: 'Pulgão',
    scientificName: 'Aphidoidea',
    affects: ['flower', 'shrub', 'climber'],
    symptoms: ['brotos deformados', 'melado pegajoso', 'presença de formigas'],
    treatment: ['jato de água', 'sabão neutro diluído', 'joaninhas (controle biológico)'],
    severity: 'medium',
  },
  {
    id: 'formiga-cortadeira',
    name: 'Formiga Cortadeira (Saúva)',
    scientificName: 'Atta spp.',
    affects: ['tree', 'shrub', 'flower', 'groundcover'],
    symptoms: ['folhas cortadas em semicírculo', 'trilhas de formigas', 'olheiros no solo'],
    treatment: ['iscas granuladas', 'localização e tratamento do formigueiro', 'barreiras físicas'],
    severity: 'high',
  },
  {
    id: 'fungo-mancha-foliar',
    name: 'Mancha Foliar (fungo)',
    affects: ['grass', 'shrub'],
    symptoms: ['manchas circulares amareladas/marrons', 'áreas secas no gramado'],
    treatment: ['fungicida apropriado', 'redução da irrigação noturna', 'melhor drenagem'],
    severity: 'medium',
  },
  {
    id: 'brusone',
    name: 'Cupim',
    scientificName: 'Isoptera',
    affects: ['tree', 'grass'],
    symptoms: ['montículos de terra', 'madeira oca', 'túneis de barro'],
    treatment: ['controle localizado', 'iscas', 'remoção de madeira morta'],
    severity: 'high',
  },
];
