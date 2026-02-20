import { useQuery } from '@tanstack/react-query';
import type {
  CommercialDashboard,
  OperationalDashboard,
  SemaforoOrder,
  ProductJourneyEvent,
  DashboardFilters,
  SavedReport,
  ReportType,
} from './types';

// ─── Query Keys ──────────────────────────────────────────────
export const dashboardKeys = {
  all: ['dashboard'] as const,
  commercial: (filters?: DashboardFilters) => [...dashboardKeys.all, 'commercial', filters] as const,
  operational: (filters?: DashboardFilters) => [...dashboardKeys.all, 'operational', filters] as const,
  semaforo: () => [...dashboardKeys.all, 'semaforo'] as const,
  productJourney: (productId: string) => [...dashboardKeys.all, 'product-journey', productId] as const,
};

export const reportKeys = {
  all: ['reports'] as const,
  data: (type: ReportType, filters?: Record<string, unknown>) => [...reportKeys.all, 'data', type, filters] as const,
  saved: () => [...reportKeys.all, 'saved'] as const,
};

// ─── Dashboard Hooks ─────────────────────────────────────────
export function useCommercialDashboard(filters?: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.commercial(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);
      if (filters?.advisor_id) params.set('advisor_id', filters.advisor_id);
      const res = await fetch(`/api/dashboard/commercial?${params}`);
      if (!res.ok) throw new Error('Error al cargar dashboard comercial');
      return res.json() as Promise<CommercialDashboard>;
    },
    staleTime: 60_000, // 1 min
  });
}

export function useOperationalDashboard(filters?: DashboardFilters) {
  return useQuery({
    queryKey: dashboardKeys.operational(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);
      const res = await fetch(`/api/dashboard/operational?${params}`);
      if (!res.ok) throw new Error('Error al cargar dashboard operativo');
      return res.json() as Promise<OperationalDashboard>;
    },
    staleTime: 60_000,
  });
}

export function useSemaforoBoard() {
  return useQuery({
    queryKey: dashboardKeys.semaforo(),
    queryFn: async () => {
      const res = await fetch('/api/dashboard/semaforo');
      if (!res.ok) throw new Error('Error al cargar semáforo');
      return res.json() as Promise<SemaforoOrder[]>;
    },
    staleTime: 30_000, // 30s
    refetchInterval: 60_000, // auto-refresh every min
  });
}

export function useProductJourney(productId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.productJourney(productId || ''),
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/product-journey?product_id=${productId}`);
      if (!res.ok) throw new Error('Error al cargar trazabilidad');
      const data = await res.json();
      return (data.events || []) as ProductJourneyEvent[];
    },
    enabled: !!productId,
    staleTime: 60_000,
  });
}

// ─── Report Hooks ────────────────────────────────────────────
export function useReportData(type: ReportType, filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: reportKeys.data(type, filters),
    queryFn: async () => {
      const params = new URLSearchParams({ type });
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
        });
      }
      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error('Error al cargar reporte');
      return res.json();
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
