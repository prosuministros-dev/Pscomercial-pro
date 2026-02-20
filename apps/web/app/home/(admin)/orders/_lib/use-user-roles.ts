'use client';

import { useQuery } from '@tanstack/react-query';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';

/**
 * Client-side hook to get the current user's role slugs.
 * Calls the get_user_roles RPC. Cached for 5 minutes.
 */
export function useUserRoles() {
  const client = useSupabase();

  return useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data: { user } } = await client.auth.getUser();
      if (!user) return [];

      const { data, error } = await client.rpc('get_user_roles', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching user roles:', error);
        return [];
      }

      return (data ?? []).map((r: { role_slug: string }) => r.role_slug) as string[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
