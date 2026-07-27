/**
 * TanStack Query hooks — the single place the UI talks to the API layer.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchGardeners,
  fetchJob,
  fetchJobs,
  fetchStats,
  login,
  verifyGardener,
} from './api';
import type { GardenersQuery, JobsQuery } from './types';

export const queryKeys = {
  stats: ['admin', 'stats'] as const,
  jobs: (query: JobsQuery) => ['admin', 'jobs', query] as const,
  job: (id: string) => ['admin', 'job', id] as const,
  gardeners: (query: GardenersQuery) => ['admin', 'gardeners', query] as const,
};

export function useStats() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: fetchStats,
    staleTime: 60_000,
  });
}

export function useJobs(query: JobsQuery) {
  return useQuery({
    queryKey: queryKeys.jobs(query),
    queryFn: () => fetchJobs(query),
    placeholderData: keepPreviousData,
  });
}

export function useJob(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.job(id ?? ''),
    queryFn: () => fetchJob(id as string),
    enabled: Boolean(id),
  });
}

export function useGardeners(query: GardenersQuery) {
  return useQuery({
    queryKey: queryKeys.gardeners(query),
    queryFn: () => fetchGardeners(query),
    placeholderData: keepPreviousData,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: (vars: { email: string; password: string }) => login(vars.email, vars.password),
  });
}

export function useVerifyGardener() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => verifyGardener(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'gardeners'] });
    },
  });
}
