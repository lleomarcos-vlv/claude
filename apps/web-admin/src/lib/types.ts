/**
 * Admin API DTOs — the shapes the web-admin client consumes.
 *
 * Domain primitives (enums, GardenAnalysis, Quote) are imported from
 * `@jardimja/shared` so the front-end and back-end never drift.
 */
import type {
  GardenAnalysis,
  JobStatus,
  OfferStatus,
  Quote,
  ServiceType,
  UserRole,
} from '@jardimja/shared';

/** Gardener verification lifecycle (admin-facing; not part of the domain enums). */
export const GardenerStatus = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type GardenerStatus = (typeof GardenerStatus)[keyof typeof GardenerStatus];

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

export interface RevenuePoint {
  date: string; // ISO date
  cents: number;
}

export interface JobsByStatusPoint {
  status: JobStatus;
  count: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface AdminStats {
  users: { total: number; clients: number; gardeners: number };
  jobs: { total: number; completed: number; quoted: number };
  revenueCents: number;
  profitCents: number;
  /** Quote → paid conversion, in [0,1]. */
  conversionRate: number;
  seriesRevenue: RevenuePoint[];
  jobsByStatus: JobsByStatusPoint[];
  heatmap: HeatmapPoint[];
}

export interface JobListItem {
  id: string;
  client: { name: string };
  serviceTypes: ServiceType[];
  status: JobStatus;
  city: string;
  totalCents: number;
  /** Estimate confidence in [0,1]. */
  confidence: number;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface JobOffer {
  id: string;
  gardener: { name: string; ratingAvg: number };
  status: OfferStatus;
  priceCents: number;
  message?: string;
  createdAt: string;
}

export interface JobMedia {
  id: string;
  kind: string;
  url: string;
  thumbnailUrl?: string;
  label?: string;
}

export interface JobDetail extends JobListItem {
  analysis: GardenAnalysis;
  quote: Quote;
  offers: JobOffer[];
  media: JobMedia[];
}

export interface Gardener {
  id: string;
  user: { name: string };
  city: string;
  state: string;
  ratingAvg: number;
  ratingCount: number;
  jobsCompleted: number;
  status: GardenerStatus;
  specialties: ServiceType[];
}

export interface JobsQuery {
  status?: JobStatus | '';
  page?: number;
}

export interface GardenersQuery {
  status?: GardenerStatus | '';
  page?: number;
}
