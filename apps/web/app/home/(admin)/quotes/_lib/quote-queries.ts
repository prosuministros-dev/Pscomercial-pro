import { useQuery } from '@tanstack/react-query';
import type { Quote, QuoteItem, QuoteFilters } from './types';

export const quoteKeys = {
  all: ['quotes'] as const,
  lists: () => [...quoteKeys.all, 'list'] as const,
  list: (filters: QuoteFilters & { page?: number }) =>
    [...quoteKeys.lists(), filters] as const,
  kanban: () => [...quoteKeys.all, 'kanban'] as const,
  detail: (id: string) => [...quoteKeys.all, 'detail', id] as const,
  items: (quoteId: string) => [...quoteKeys.all, 'items', quoteId] as const,
  trm: () => ['trm'] as const,
};

export function useQuotesKanban() {
  return useQuery({
    queryKey: quoteKeys.kanban(),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '500' });
      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al cargar cotizaciones');
      }
      const result = await res.json();
      return (result.data || []) as Quote[];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useQuotes(filters: QuoteFilters & { page?: number; limit?: number }) {
  return useQuery({
    queryKey: quoteKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', (filters.page || 1).toString());
      params.set('limit', (filters.limit || 20).toString());

      if (filters.status) params.set('status', filters.status);
      if (filters.customer_id) params.set('customer_id', filters.customer_id);
      if (filters.advisor_id) params.set('advisor_id', filters.advisor_id);
      if (filters.search) params.set('search', filters.search);
      if (filters.from_date) params.set('from_date', filters.from_date);
      if (filters.to_date) params.set('to_date', filters.to_date);

      const res = await fetch(`/api/quotes?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al cargar cotizaciones');
      }
      return res.json() as Promise<{ data: Quote[]; pagination: { totalPages: number; total: number } }>;
    },
  });
}

export function useQuoteItems(quoteId: string | null) {
  return useQuery({
    queryKey: quoteKeys.items(quoteId || ''),
    queryFn: async () => {
      const res = await fetch(`/api/quotes/${quoteId}/items`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al cargar items');
      }
      return res.json() as Promise<QuoteItem[]>;
    },
    enabled: !!quoteId,
  });
}

export function useTRM() {
  return useQuery({
    queryKey: quoteKeys.trm(),
    queryFn: async () => {
      const res = await fetch('/api/trm');
      if (!res.ok) {
        return null;
      }
      const result = await res.json();
      return result.data as { rate: number; date: string; source: string };
    },
    staleTime: 5 * 60_000,
  });
}
