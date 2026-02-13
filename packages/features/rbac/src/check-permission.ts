import 'server-only';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * @name checkPermission
 * @description Server-side function to check if a user has a specific permission
 * Calls Supabase RPC function 'get_user_permissions' and checks for the permission slug
 *
 * @param userId - The ID of the user to check permissions for
 * @param permission - The permission slug to check (e.g., 'quotes:create')
 * @returns Promise<boolean> - True if the user has the permission, false otherwise
 *
 * @example
 * const hasPermission = await checkPermission(userId, 'quotes:create');
 * if (!hasPermission) {
 *   throw new Error('Unauthorized');
 * }
 */
export async function checkPermission(
  userId: string,
  permission: string,
): Promise<boolean> {
  const client = getSupabaseServerClient();

  try {
    const { data, error } = await client.rpc('get_user_permissions', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking permission:', error);
      return false;
    }

    if (!data) {
      return false;
    }

    const permissions = data.map((p: { slug: string }) => p.slug);

    return permissions.includes(permission);
  } catch (error) {
    console.error('Error in checkPermission:', error);
    return false;
  }
}
