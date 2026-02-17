/**
 * TanStack Query staleTime configuration based on FASE-11.
 *
 * 4 levels:
 * - STATIC:   1 hour  (roles, permissions, categories, lookups)
 * - MODERATE: 5 min   (products, suppliers, TRM, saved reports)
 * - DYNAMIC:  1 min   (leads, quotes, orders, invoices, dashboards)
 * - REALTIME: 0       (notifications, chat, websocket data)
 */
export const QUERY_STALE_TIMES = {
  STATIC: 60 * 60 * 1000,    // 1 hour
  MODERATE: 5 * 60 * 1000,   // 5 minutes
  DYNAMIC: 60 * 1000,        // 1 minute
  REALTIME: 0,                // Always fresh
} as const;

/**
 * Standard refetchOnWindowFocus settings by data type.
 */
export const QUERY_REFETCH_CONFIG = {
  STATIC: { refetchOnWindowFocus: false },
  MODERATE: { refetchOnWindowFocus: true },
  DYNAMIC: { refetchOnWindowFocus: true },
  REALTIME: { refetchOnWindowFocus: true },
} as const;
