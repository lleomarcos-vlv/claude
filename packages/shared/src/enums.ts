/**
 * Domain enums — the shared vocabulary of JardimJá.
 *
 * These are declared as `const` objects (plus a union type) rather than TS
 * `enum`s so they can be used interchangeably as runtime values, Zod enum
 * inputs, Prisma enum mirrors, and JSON payloads without transpilation quirks.
 */

/** Catalogue of bookable services. `OUTRO` is the free-text escape hatch. */
export const ServiceType = {
  CORTE_GRAMA: 'CORTE_GRAMA',
  PODA: 'PODA',
  PAISAGISMO: 'PAISAGISMO',
  LIMPEZA: 'LIMPEZA',
  RETIRADA_FOLHAS: 'RETIRADA_FOLHAS',
  ADUBACAO: 'ADUBACAO',
  PLANTIO: 'PLANTIO',
  CONTROLE_PRAGAS: 'CONTROLE_PRAGAS',
  IRRIGACAO: 'IRRIGACAO',
  JARDIM_COMPLETO: 'JARDIM_COMPLETO',
  OUTRO: 'OUTRO',
} as const;
export type ServiceType = (typeof ServiceType)[keyof typeof ServiceType];

/** Human-readable pt-BR labels for the service catalogue. */
export const ServiceTypeLabel: Record<ServiceType, string> = {
  CORTE_GRAMA: 'Cortar grama',
  PODA: 'Poda',
  PAISAGISMO: 'Paisagismo',
  LIMPEZA: 'Limpeza',
  RETIRADA_FOLHAS: 'Retirada de folhas',
  ADUBACAO: 'Adubação',
  PLANTIO: 'Plantio',
  CONTROLE_PRAGAS: 'Controle de pragas',
  IRRIGACAO: 'Sistema de irrigação',
  JARDIM_COMPLETO: 'Jardim completo',
  OUTRO: 'Outro',
};

/**
 * Lifecycle of a service request — an Uber-style state machine.
 * See `docs/14-functional-spec.md` for the allowed transitions.
 */
export const JobStatus = {
  DRAFT: 'DRAFT', // client is still uploading media
  ANALYZING: 'ANALYZING', // AI vision running
  QUOTED: 'QUOTED', // AI estimate ready, awaiting client publish
  MATCHING: 'MATCHING', // published to marketplace, gathering offers
  OFFERED: 'OFFERED', // one or more gardener offers received
  ACCEPTED: 'ACCEPTED', // client chose a gardener
  SCHEDULED: 'SCHEDULED', // date/time agreed
  ENROUTE: 'ENROUTE', // gardener on the way (live tracking)
  ARRIVED: 'ARRIVED', // gardener checked in on-site
  IN_PROGRESS: 'IN_PROGRESS', // work started
  COMPLETED: 'COMPLETED', // gardener checked out, awaiting client approval
  APPROVED: 'APPROVED', // client approved -> payment captured
  PAID: 'PAID', // funds captured and split
  REVIEWED: 'REVIEWED', // rated by client
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

/** Status of a gardener's offer against a marketplace job. */
export const OfferStatus = {
  PENDING: 'PENDING',
  ACCEPTED_BY_GARDENER: 'ACCEPTED_BY_GARDENER', // gardener accepted AI price as-is
  COUNTERED: 'COUNTERED', // gardener sent a different price
  DECLINED: 'DECLINED',
  CHOSEN: 'CHOSEN', // client selected this offer
  EXPIRED: 'EXPIRED',
  WITHDRAWN: 'WITHDRAWN',
} as const;
export type OfferStatus = (typeof OfferStatus)[keyof typeof OfferStatus];

/** Payment lifecycle (marketplace escrow with split). */
export const PaymentStatus = {
  PENDING: 'PENDING',
  AUTHORIZED: 'AUTHORIZED', // held (pre-auth / escrow)
  CAPTURED: 'CAPTURED',
  SPLIT: 'SPLIT', // funds distributed to gardener + platform
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  PIX: 'PIX',
  CREDIT_CARD: 'CREDIT_CARD',
  GOOGLE_PAY: 'GOOGLE_PAY',
  APPLE_PAY: 'APPLE_PAY',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const UserRole = {
  CLIENT: 'CLIENT',
  GARDENER: 'GARDENER',
  ADMIN: 'ADMIN',
  SUPPORT: 'SUPPORT',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Equipment a gardener may own / a job may require. */
export const Equipment = {
  ROCADEIRA: 'ROCADEIRA', // brush cutter
  CORTADOR_GRAMA: 'CORTADOR_GRAMA', // lawn mower
  MOTOSSERRA: 'MOTOSSERRA', // chainsaw
  SOPRADOR: 'SOPRADOR', // leaf blower
  TRITURADOR: 'TRITURADOR', // chipper/shredder
  ESCADA: 'ESCADA', // ladder
  CAMINHAO: 'CAMINHAO', // truck (for hauling)
  PULVERIZADOR: 'PULVERIZADOR', // sprayer
  PODADOR_ALTURA: 'PODADOR_ALTURA', // pole pruner
} as const;
export type Equipment = (typeof Equipment)[keyof typeof Equipment];

export const DifficultyLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  EXTREME: 'EXTREME',
} as const;
export type DifficultyLevel = (typeof DifficultyLevel)[keyof typeof DifficultyLevel];

export const UrgencyLevel = {
  FLEXIBLE: 'FLEXIBLE', // whenever
  NORMAL: 'NORMAL', // within a few days
  URGENT: 'URGENT', // today/tomorrow
  EMERGENCY: 'EMERGENCY', // ASAP
} as const;
export type UrgencyLevel = (typeof UrgencyLevel)[keyof typeof UrgencyLevel];

export const RiskLevel = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

export const TerrainSlope = {
  FLAT: 'FLAT',
  GENTLE: 'GENTLE',
  MODERATE: 'MODERATE',
  STEEP: 'STEEP',
} as const;
export type TerrainSlope = (typeof TerrainSlope)[keyof typeof TerrainSlope];

export const AccessDifficulty = {
  EASY: 'EASY', // street-level, wide gate
  MODERATE: 'MODERATE',
  HARD: 'HARD', // stairs, narrow, no vehicle access
} as const;
export type AccessDifficulty = (typeof AccessDifficulty)[keyof typeof AccessDifficulty];

/** Which vision model produced an analysis (for consensus auditing). */
export const AiProviderId = {
  OPENAI: 'openai',
  GEMINI: 'gemini',
  ANTHROPIC: 'anthropic',
  MOCK: 'mock',
} as const;
export type AiProviderId = (typeof AiProviderId)[keyof typeof AiProviderId];

export const MediaKind = {
  PHOTO: 'PHOTO',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  DOCUMENT: 'DOCUMENT',
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

/** Kinds of chat message (WhatsApp-style thread between client and gardener). */
export const MessageKind = {
  TEXT: 'TEXT',
  PHOTO: 'PHOTO',
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  LOCATION: 'LOCATION',
  DOCUMENT: 'DOCUMENT',
  SYSTEM: 'SYSTEM',
} as const;
export type MessageKind = (typeof MessageKind)[keyof typeof MessageKind];
