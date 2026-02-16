import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderFilters } from './types';
import type { CreateOrderFormData } from './schemas';

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters: OrderFilters & { page?: number }) =>
    [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const,
  destinations: (id: string) => [...orderKeys.all, 'destinations', id] as const,
  billingSteps: (id: string) => [...orderKeys.all, 'billing-steps', id] as const,
};

async function fetchOrders(filters: OrderFilters & { page?: number; limit?: number }) {
  const params = new URLSearchParams();
  params.set('page', (filters.page || 1).toString());
  params.set('limit', (filters.limit || 20).toString());

  if (filters.status) params.set('status', filters.status);
  if (filters.customer_id) params.set('customer_id', filters.customer_id);
  if (filters.advisor_id) params.set('advisor_id', filters.advisor_id);
  if (filters.payment_status) params.set('payment_status', filters.payment_status);
  if (filters.search) params.set('search', filters.search);
  if (filters.from_date) params.set('from_date', filters.from_date);
  if (filters.to_date) params.set('to_date', filters.to_date);

  const response = await fetch(`/api/orders?${params.toString()}`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error al cargar los pedidos');
  }
  return response.json();
}

async function fetchOrderDetail(orderId: string) {
  const response = await fetch(`/api/orders/${orderId}/status`);
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Error al cargar el pedido');
  }
  return response.json();
}

export function useOrders(filters: OrderFilters & { page?: number }, initialData?: unknown) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => fetchOrders(filters),
    initialData,
  });
}

export function useOrderDetail(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(orderId || ''),
    queryFn: () => fetchOrderDetail(orderId!),
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrderFormData) => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al crear el pedido');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar el estado');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, notes }: { orderId: string; notes?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al confirmar el pago');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

export function useUpdateBillingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, step, value }: { orderId: string; step: string; value: string }) => {
      const response = await fetch(`/api/orders/${orderId}/billing-step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, value }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al actualizar facturación');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.billingSteps(variables.orderId) });
    },
  });
}

export function useBillingSteps(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.billingSteps(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/billing-step`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar facturación');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useOrderDestinations(orderId: string | null) {
  return useQuery({
    queryKey: orderKeys.destinations(orderId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/orders/${orderId}/destinations`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al cargar destinos');
      }
      return response.json();
    },
    enabled: !!orderId,
  });
}

export function useAddDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, ...data }: { orderId: string; delivery_address: string; delivery_city?: string; delivery_contact?: string; delivery_phone?: string; delivery_schedule?: string; dispatch_type?: string; notes?: string }) => {
      const response = await fetch(`/api/orders/${orderId}/destinations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al agregar destino');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.destinations(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}

export function useRemoveDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, destinationId }: { orderId: string; destinationId: string }) => {
      const response = await fetch(`/api/orders/${orderId}/destinations?destination_id=${destinationId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al eliminar destino');
      }
      return response.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.destinations(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) });
    },
  });
}
