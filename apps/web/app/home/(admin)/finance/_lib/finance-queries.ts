'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { toast } from 'sonner';
import type { CustomerCartera, CarteraSummary } from './types';

export const financeKeys = {
  all: ['finance'] as const,
  cartera: () => [...financeKeys.all, 'cartera'] as const,
  summary: () => [...financeKeys.all, 'summary'] as const,
};

export function useCartera() {
  const supabase = useSupabase();

  return useQuery<CustomerCartera[]>({
    queryKey: financeKeys.cartera(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(`
          id, business_name, nit, city,
          credit_limit, credit_used, credit_available,
          is_blocked, block_reason, payment_terms,
          assigned_sales_rep:profiles!customers_assigned_sales_rep_id_fkey(id, full_name)
        `)
        .eq('status', 'active')
        .is('deleted_at', null)
        .order('business_name');

      if (error) throw error;
      return (data || []) as unknown as CustomerCartera[];
    },
    staleTime: 30000,
  });
}

export function useCarteraSummary() {
  const supabase = useSupabase();

  return useQuery<CarteraSummary>({
    queryKey: financeKeys.summary(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, credit_limit, credit_used, is_blocked')
        .eq('status', 'active')
        .is('deleted_at', null);

      if (error) throw error;

      const customers = data || [];
      return {
        total_customers: customers.length,
        total_credit_limit: customers.reduce((sum, c) => sum + (c.credit_limit || 0), 0),
        total_credit_used: customers.reduce((sum, c) => sum + (c.credit_used || 0), 0),
        blocked_customers: customers.filter((c) => c.is_blocked).length,
      };
    },
    staleTime: 30000,
  });
}

export function useBlockCustomer() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ customerId, block_reason }: { customerId: string; block_reason: string }) => {
      const { error } = await supabase
        .from('customers')
        .update({
          is_blocked: true,
          block_reason,
        })
        .eq('id', customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      toast.success('Cliente bloqueado por cartera');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al bloquear cliente');
    },
  });
}

export function useUnblockCustomer() {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .update({
          is_blocked: false,
          block_reason: null,
        })
        .eq('id', customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      toast.success('Cliente desbloqueado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al desbloquear cliente');
    },
  });
}
