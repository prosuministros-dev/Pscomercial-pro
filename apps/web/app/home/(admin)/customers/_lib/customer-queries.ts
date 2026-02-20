'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  Customer,
  CustomerContact,
  CustomerFilters,
  CustomersResponse,
  CustomerContactsResponse,
  CustomerVisitsResponse,
  CustomerHistoryResponse,
} from './types';
import type { CustomerFormData, ContactFormData, VisitFormData } from './schemas';

// Query Keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters: CustomerFilters) => [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
  contacts: (customerId: string) => [...customerKeys.detail(customerId), 'contacts'] as const,
  visits: (customerId: string) => [...customerKeys.detail(customerId), 'visits'] as const,
  history: (customerId: string, type?: string) => [...customerKeys.detail(customerId), 'history', type] as const,
};

// Fetch customers with filters and pagination
export function useCustomers(filters: CustomerFilters = {}) {
  return useQuery<CustomersResponse>({
    queryKey: customerKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.business_name) params.set('business_name', filters.business_name);
      if (filters.nit) params.set('nit', filters.nit);
      if (filters.city) params.set('city', filters.city);
      if (filters.status) params.set('status', filters.status);
      if (filters.assigned_sales_rep_id) params.set('assigned_sales_rep_id', filters.assigned_sales_rep_id);
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());

      const response = await fetch(`/api/customers?${params.toString()}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cargar clientes');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
}

// Fetch customer contacts
export function useCustomerContacts(customerId: string | null) {
  return useQuery<CustomerContactsResponse>({
    queryKey: customerKeys.contacts(customerId || ''),
    queryFn: async () => {
      if (!customerId) {
        return { data: [] };
      }

      const response = await fetch(`/api/customers/${customerId}/contacts`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cargar contactos');
      }

      return response.json();
    },
    enabled: !!customerId,
  });
}

// Create customer mutation
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear cliente');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update customer mutation
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CustomerFormData> }) => {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar cliente');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Create contact mutation
export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, data }: { customerId: string; data: ContactFormData }) => {
      const response = await fetch(`/api/customers/${customerId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear contacto');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.contacts(variables.customerId) });
      toast.success('Contacto creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Update contact mutation
export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      customerId,
      contactId,
      data
    }: {
      customerId: string;
      contactId: string;
      data: Partial<ContactFormData>
    }) => {
      const response = await fetch(`/api/customers/${customerId}/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: contactId, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar contacto');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.contacts(variables.customerId) });
      toast.success('Contacto actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Fetch single customer detail
export function useCustomerDetail(customerId: string | null) {
  return useQuery<{ data: Customer }>({
    queryKey: customerKeys.detail(customerId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/customers?nit=&business_name=&page=1&limit=1`);
      // We use the list endpoint with the customer loaded via RLS
      // Actually, let's fetch all and find; better to just use the list
      const params = new URLSearchParams({ page: '1', limit: '1000' });
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al cargar cliente');
      }
      const result = await res.json();
      const customer = result.data?.find((c: Customer) => c.id === customerId);
      if (!customer) throw new Error('Cliente no encontrado');
      return { data: customer };
    },
    enabled: !!customerId,
    staleTime: 30000,
  });
}

// Fetch customer history (quotes, orders, purchase_orders)
export function useCustomerHistory(customerId: string | null, type?: string) {
  return useQuery<CustomerHistoryResponse>({
    queryKey: customerKeys.history(customerId || '', type),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) params.set('type', type);

      const response = await fetch(`/api/customers/${customerId}/history?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cargar historial');
      }
      return response.json();
    },
    enabled: !!customerId,
    staleTime: 60000, // 1 min - dynamic data
  });
}

// Fetch customer visits
export function useCustomerVisits(customerId: string | null) {
  return useQuery<CustomerVisitsResponse>({
    queryKey: customerKeys.visits(customerId || ''),
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}/visits`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cargar visitas');
      }
      return response.json();
    },
    enabled: !!customerId,
    staleTime: 30000,
  });
}

// Create visit mutation
export function useCreateVisit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, data }: { customerId: string; data: VisitFormData }) => {
      const response = await fetch(`/api/customers/${customerId}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al registrar visita');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.visits(variables.customerId) });
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
      toast.success('Visita registrada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

// Delete contact mutation
export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, contactId }: { customerId: string; contactId: string }) => {
      const response = await fetch(`/api/customers/${customerId}/contacts?contactId=${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar contacto');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.contacts(variables.customerId) });
      toast.success('Contacto eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
