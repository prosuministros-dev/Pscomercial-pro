'use client';

import { usePermissions } from './permission-provider';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * @name PermissionGate
 * @description Component wrapper that conditionally renders children based on user permissions
 *
 * @example
 * // Single permission
 * <PermissionGate permission="quotes:create">
 *   <CreateQuoteButton />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (any)
 * <PermissionGate permissions={["quotes:create", "quotes:read"]} requireAll={false}>
 *   <QuoteSection />
 * </PermissionGate>
 *
 * @example
 * // Multiple permissions (all required)
 * <PermissionGate permissions={["quotes:create", "quotes:edit"]} requireAll={true}>
 *   <AdvancedQuoteEditor />
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate permission="admin:access" fallback={<AccessDenied />}>
 *   <AdminPanel />
 * </PermissionGate>
 */
export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAny, canAll, isLoading } = usePermissions();

  // Don't render anything while loading permissions
  if (isLoading) {
    return null;
  }

  let hasPermission = false;

  if (permission) {
    hasPermission = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
