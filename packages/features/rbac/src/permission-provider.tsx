'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import { useQuery } from '@tanstack/react-query';

import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';

interface PermissionContextValue {
  permissions: string[];
  isLoading: boolean;
  can: (slug: string) => boolean;
  canAny: (slugs: string[]) => boolean;
  canAll: (slugs: string[]) => boolean;
}

const PermissionContext = createContext<PermissionContextValue | undefined>(
  undefined,
);

/**
 * @name PermissionProvider
 * @description Provider that fetches user permissions on mount and caches them
 * Wraps the dashboard layout to provide permission checking capabilities
 */
export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const client = getSupabaseBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await client.auth.getUser();

      setUserId(user?.id ?? null);
    };

    void fetchUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', userId],
    queryFn: async () => {
      if (!userId) {
        return [];
      }

      const { data, error } = await client.rpc('get_user_permissions', {
        p_user_id: userId,
      });

      if (error) {
        console.error('Error fetching permissions:', error);
        return [];
      }

      return (data ?? []).map(
        (p: { permission_slug: string }) => p.permission_slug,
      );
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const can = useCallback(
    (slug: string) => {
      return permissions.includes(slug);
    },
    [permissions],
  );

  const canAny = useCallback(
    (slugs: string[]) => {
      return slugs.some((slug) => permissions.includes(slug));
    },
    [permissions],
  );

  const canAll = useCallback(
    (slugs: string[]) => {
      return slugs.every((slug) => permissions.includes(slug));
    },
    [permissions],
  );

  const value: PermissionContextValue = {
    permissions,
    isLoading,
    can,
    canAny,
    canAll,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * @name usePermissions
 * @description Hook to access permission checking functions
 * @throws Error if used outside of PermissionProvider
 */
export function usePermissions() {
  const context = useContext(PermissionContext);

  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }

  return context;
}
