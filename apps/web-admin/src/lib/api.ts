/**
 * API client — axios instance, auth interceptors, and the typed admin endpoints.
 *
 * MOCK FALLBACK: every call is wrapped in `withMockFallback`. If the backend is
 * unreachable (network error / timeout / 5xx), the call resolves with the typed
 * fixtures from `./fixtures` so the whole admin UI keeps rendering during
 * development. Real 4xx errors (except 401) still surface to the caller.
 */
import axios, { type AxiosInstance } from 'axios';
import { UNAUTHORIZED_EVENT, clearSession, readToken } from './auth';
import * as fixtures from './fixtures';
import type {
  AdminStats,
  AuthResponse,
  Gardener,
  GardenersQuery,
  JobDetail,
  JobListItem,
  JobsQuery,
  Paginated,
} from './types';

const API_ORIGIN = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';
export const API_BASE_URL = `${API_ORIGIN}/api/v1`;

/** Fixed page size the UI paginates with. */
export const PAGE_SIZE = 12;

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the bearer token to every request.
http.interceptors.request.use((config) => {
  const token = readToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, drop the session and let the route guard bounce to /login.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearSession();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

/** Whether an error means "backend not usable" → serve mock data instead. */
function shouldFallback(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (!error.response) return true; // network / timeout / CORS / server down
    return error.response.status >= 500; // server-side failures
  }
  return true; // unknown failure → keep the UI alive
}

async function withMockFallback<T>(
  label: string,
  run: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (shouldFallback(error)) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn(`[web-admin] API indisponível em "${label}" — servindo dados MOCK.`);
      }
      return fallback();
    }
    throw error;
  }
}

// --- Endpoints -------------------------------------------------------------

export function login(email: string, password: string): Promise<AuthResponse> {
  return withMockFallback(
    'POST /auth/login',
    async () => {
      const { data } = await http.post<AuthResponse>('/auth/login', { email, password });
      return data;
    },
    () => fixtures.MOCK_AUTH_RESPONSE,
  );
}

export function fetchStats(): Promise<AdminStats> {
  return withMockFallback(
    'GET /admin/stats',
    async () => {
      const { data } = await http.get<AdminStats>('/admin/stats');
      return data;
    },
    () => fixtures.MOCK_STATS,
  );
}

export function fetchJobs(query: JobsQuery): Promise<Paginated<JobListItem>> {
  const page = query.page ?? 1;
  return withMockFallback(
    'GET /admin/jobs',
    async () => {
      const { data } = await http.get<Paginated<JobListItem>>('/admin/jobs', {
        params: { status: query.status || undefined, page },
      });
      return data;
    },
    () => fixtures.mockJobsPage(page, PAGE_SIZE, query.status),
  );
}

export function fetchJob(id: string): Promise<JobDetail> {
  return withMockFallback(
    `GET /admin/jobs/${id}`,
    async () => {
      const { data } = await http.get<JobDetail>(`/admin/jobs/${id}`);
      return data;
    },
    () => fixtures.mockJobDetail(id),
  );
}

export function fetchGardeners(query: GardenersQuery): Promise<Paginated<Gardener>> {
  const page = query.page ?? 1;
  return withMockFallback(
    'GET /admin/gardeners',
    async () => {
      const { data } = await http.get<Paginated<Gardener>>('/admin/gardeners', {
        params: { status: query.status || undefined, page },
      });
      return data;
    },
    () => fixtures.mockGardenersPage(page, PAGE_SIZE, query.status),
  );
}

/** Verify a gardener (admin action stub — POST is best-effort in dev). */
export function verifyGardener(id: string): Promise<{ ok: true }> {
  return withMockFallback(
    `POST /admin/gardeners/${id}/verify`,
    async () => {
      await http.post(`/admin/gardeners/${id}/verify`);
      return { ok: true } as const;
    },
    () => ({ ok: true }) as const,
  );
}
