import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReportType, ReportResponse } from './types';
import type { SavedReport } from '~/home/_lib/types';

export const reportKeys = {
  all: ['reports'] as const,
  data: (type: ReportType, filters?: Record<string, string>) =>
    [...reportKeys.all, 'data', type, filters] as const,
  saved: () => [...reportKeys.all, 'saved'] as const,
};

export function useReportData(type: ReportType, filters?: Record<string, string>) {
  return useQuery({
    queryKey: reportKeys.data(type, filters),
    queryFn: async () => {
      const params = new URLSearchParams({ type });
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v) params.set(k, v);
        });
      }
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error('Error al cargar reporte');
      return res.json() as Promise<ReportResponse>;
    },
    staleTime: 60_000,
  });
}

export function useSavedReports() {
  return useQuery({
    queryKey: reportKeys.saved(),
    queryFn: async () => {
      const res = await fetch('/api/reports/saved');
      if (!res.ok) throw new Error('Error al cargar reportes guardados');
      return res.json() as Promise<SavedReport[]>;
    },
    staleTime: 5 * 60_000,
  });
}

export function useSaveReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      name: string;
      report_type: ReportType;
      filters: Record<string, unknown>;
      is_shared?: boolean;
    }) => {
      const res = await fetch('/api/reports/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al guardar reporte');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.saved() }),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/saved?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.saved() }),
  });
}
