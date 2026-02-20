'use client';

import { createContext, useContext, useMemo } from 'react';

interface PermissionsContextValue {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({
  children,
  permissions = [],
}: {
  children: React.ReactNode;
  permissions?: string[];
}) {
  const value = useMemo(
    () => ({
      permissions,
      hasPermission: (permission: string) => permissions.includes(permission),
    }),
    [permissions],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);

  if (!context) {
    // If no provider, return permissive defaults for development
    return {
      permissions: [],
      hasPermission: () => true,
    };
  }

  return context;
}
