import 'server-only';

import { NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { checkPermission } from './check-permission';

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
) => Promise<NextResponse>;

/**
 * @name withPermission
 * @description Higher-order function that wraps Next.js route handlers with permission checking
 * Returns 403 Forbidden if the user doesn't have the required permission
 * Returns 401 Unauthorized if the user is not authenticated
 *
 * @param permission - The permission slug required to access the route (e.g., 'quotes:create')
 * @param handler - The Next.js route handler function to wrap
 * @returns Wrapped route handler with permission checking
 *
 * @example
 * // In app/api/quotes/route.ts
 * export const POST = withPermission('quotes:create', async (request) => {
 *   // Your route logic here
 *   return NextResponse.json({ success: true });
 * });
 *
 * @example
 * // Multiple handlers with different permissions
 * export const GET = withPermission('quotes:read', async (request) => {
 *   // Read logic
 * });
 *
 * export const POST = withPermission('quotes:create', async (request) => {
 *   // Create logic
 * });
 */
export function withPermission(
  permission: string,
  handler: RouteHandler,
): RouteHandler {
  return async (request, context) => {
    const client = getSupabaseServerClient();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 },
      );
    }

    // Check if the user has the required permission
    const hasPermission = await checkPermission(user.id, permission);

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: 'Forbidden',
          message: `Permission '${permission}' is required to access this resource`,
        },
        { status: 403 },
      );
    }

    // User has permission, proceed with the original handler
    return handler(request, context);
  };
}
