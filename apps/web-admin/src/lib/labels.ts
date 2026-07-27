/**
 * pt-BR labels and visual tones for domain enums that ship without a label map
 * in `@jardimja/shared`. `ServiceTypeLabel` already exists there and is reused
 * directly across the UI.
 */
import {
  AccessDifficulty,
  DifficultyLevel,
  Equipment,
  JobStatus,
  OfferStatus,
  RiskLevel,
  TerrainSlope,
  UserRole,
} from '@jardimja/shared';
import { GardenerStatus } from './types';

/** Badge color families used by <StatusBadge />. */
export type BadgeTone = 'green' | 'blue' | 'amber' | 'red' | 'gray' | 'purple' | 'teal';

export const jobStatusMeta: Record<JobStatus, { label: string; tone: BadgeTone }> = {
  [JobStatus.DRAFT]: { label: 'Rascunho', tone: 'gray' },
  [JobStatus.ANALYZING]: { label: 'Analisando', tone: 'purple' },
  [JobStatus.QUOTED]: { label: 'Orçado', tone: 'blue' },
  [JobStatus.MATCHING]: { label: 'Buscando profissionais', tone: 'blue' },
  [JobStatus.OFFERED]: { label: 'Com ofertas', tone: 'teal' },
  [JobStatus.ACCEPTED]: { label: 'Aceito', tone: 'teal' },
  [JobStatus.SCHEDULED]: { label: 'Agendado', tone: 'teal' },
  [JobStatus.ENROUTE]: { label: 'A caminho', tone: 'amber' },
  [JobStatus.ARRIVED]: { label: 'No local', tone: 'amber' },
  [JobStatus.IN_PROGRESS]: { label: 'Em andamento', tone: 'amber' },
  [JobStatus.COMPLETED]: { label: 'Concluído', tone: 'green' },
  [JobStatus.APPROVED]: { label: 'Aprovado', tone: 'green' },
  [JobStatus.PAID]: { label: 'Pago', tone: 'green' },
  [JobStatus.REVIEWED]: { label: 'Avaliado', tone: 'green' },
  [JobStatus.CANCELLED]: { label: 'Cancelado', tone: 'red' },
  [JobStatus.DISPUTED]: { label: 'Em disputa', tone: 'red' },
};

export const offerStatusMeta: Record<OfferStatus, { label: string; tone: BadgeTone }> = {
  [OfferStatus.PENDING]: { label: 'Pendente', tone: 'gray' },
  [OfferStatus.ACCEPTED_BY_GARDENER]: { label: 'Aceita pelo profissional', tone: 'teal' },
  [OfferStatus.COUNTERED]: { label: 'Contraproposta', tone: 'amber' },
  [OfferStatus.DECLINED]: { label: 'Recusada', tone: 'red' },
  [OfferStatus.CHOSEN]: { label: 'Escolhida', tone: 'green' },
  [OfferStatus.EXPIRED]: { label: 'Expirada', tone: 'gray' },
  [OfferStatus.WITHDRAWN]: { label: 'Retirada', tone: 'gray' },
};

export const gardenerStatusMeta: Record<GardenerStatus, { label: string; tone: BadgeTone }> = {
  [GardenerStatus.PENDING]: { label: 'Pendente', tone: 'amber' },
  [GardenerStatus.VERIFIED]: { label: 'Verificado', tone: 'green' },
  [GardenerStatus.SUSPENDED]: { label: 'Suspenso', tone: 'red' },
};

export const difficultyLabel: Record<DifficultyLevel, string> = {
  [DifficultyLevel.LOW]: 'Baixa',
  [DifficultyLevel.MEDIUM]: 'Média',
  [DifficultyLevel.HIGH]: 'Alta',
  [DifficultyLevel.EXTREME]: 'Extrema',
};

export const difficultyTone: Record<DifficultyLevel, BadgeTone> = {
  [DifficultyLevel.LOW]: 'green',
  [DifficultyLevel.MEDIUM]: 'blue',
  [DifficultyLevel.HIGH]: 'amber',
  [DifficultyLevel.EXTREME]: 'red',
};

export const riskLabel: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Baixo',
  [RiskLevel.MEDIUM]: 'Médio',
  [RiskLevel.HIGH]: 'Alto',
};

export const terrainSlopeLabel: Record<TerrainSlope, string> = {
  [TerrainSlope.FLAT]: 'Plano',
  [TerrainSlope.GENTLE]: 'Suave',
  [TerrainSlope.MODERATE]: 'Moderado',
  [TerrainSlope.STEEP]: 'Íngreme',
};

export const accessDifficultyLabel: Record<AccessDifficulty, string> = {
  [AccessDifficulty.EASY]: 'Fácil',
  [AccessDifficulty.MODERATE]: 'Moderado',
  [AccessDifficulty.HARD]: 'Difícil',
};

export const equipmentLabel: Record<Equipment, string> = {
  [Equipment.ROCADEIRA]: 'Roçadeira',
  [Equipment.CORTADOR_GRAMA]: 'Cortador de grama',
  [Equipment.MOTOSSERRA]: 'Motosserra',
  [Equipment.SOPRADOR]: 'Soprador',
  [Equipment.TRITURADOR]: 'Triturador',
  [Equipment.ESCADA]: 'Escada',
  [Equipment.CAMINHAO]: 'Caminhão',
  [Equipment.PULVERIZADOR]: 'Pulverizador',
  [Equipment.PODADOR_ALTURA]: 'Podador de altura',
};

export const userRoleLabel: Record<UserRole, string> = {
  [UserRole.CLIENT]: 'Cliente',
  [UserRole.GARDENER]: 'Jardineiro',
  [UserRole.ADMIN]: 'Administrador',
  [UserRole.SUPPORT]: 'Suporte',
};
