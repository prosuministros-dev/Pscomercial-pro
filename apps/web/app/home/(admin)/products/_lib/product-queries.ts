'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Product,
  ProductFilters,
  ProductsResponse,
  TRMResponse,
} from './types';
import type { ProductFormData } from './schemas';

// Query Keys
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  trm: () => ['trm'] as const,
};

// Fetch products with filters and pagination
export function useProducts(filters: ProductFilters = {}) {
  return useQuery<ProductsResponse>({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.search) params.set('search', filters.search);
      if (filters.category_id) params.set('category_id', filters.category_id);
      if (filters.is_active !== undefined && filters.is_active !== '') {
        params.set('is_active', filters.is_active);
      }
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());

      const response = await fetch(`/api/products?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cargar productos');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

// Fetch current TRM (USD to COP exchange rate)
export function useTRM() {
  return useQuery<TRMResponse>({
    queryKey: productKeys.trm(),
    queryFn: async () => {
      const response = await fetch('/api/trm');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener TRM');
      }

      return response.json();
    },
    staleTime: 3600000, // 1 hour
  });
}

// Create product mutation
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ProductFormData) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear producto');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update product mutation
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProductFormData> }) => {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar producto');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
