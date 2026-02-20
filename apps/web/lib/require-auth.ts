import type { SupabaseClient } from '@supabase/supabase-js';

import { requireUser as baseRequireUser } from '@kit/supabase/require-user';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

export interface AuthenticatedUser {
  id: string;
  organization_id: string;
  email?: string;
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number = 401) {
    super(message);
    this.status = status;
  }
}

interface ProfileRow {
  organization_id: string;
  email: string;
}

/**
 * Wrapper around requireUser that:
 * 1. Validates the user is authenticated
 * 2. Fetches the user's profile to get organization_id (using admin client to bypass RLS)
 * 3. Returns a flat object with id and organization_id
 *
 * Throws AuthError if the user is not authenticated.
 * Use in API route handlers.
 */
export async function requireUser(
  client: SupabaseClient,
): Promise<AuthenticatedUser> {
  const result = await baseRequireUser(client);

  if (result.error || !result.data) {
    console.error('[requireUser] Auth failed:', result.error?.message);
    throw new AuthError('Authentication required', 401);
  }

  const userId = result.data.sub ?? result.data.id;

  if (!userId) {
    console.error('[requireUser] No user ID in token. Claims:', JSON.stringify(result.data));
    throw new AuthError('User ID not found in token', 401);
  }

  // Use admin client to bypass RLS for internal profile lookup.
  // The user is already authenticated via getClaims() above.
  const profile = await fetchProfile(client, userId);

  if (!profile) {
    console.error('[requireUser] Profile not found for user:', userId);
    throw new AuthError('User profile not found', 403);
  }

  return {
    id: userId,
    organization_id: profile.organization_id,
    email: profile.email,
  };
}

async function fetchProfile(
  fallbackClient: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  try {
    const adminClient = getSupabaseServerAdminClient();
    const { data, error } = await adminClient
      .from('profiles')
      .select('organization_id, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[requireUser] Admin profile query error:', error.message);
      return null;
    }

    return data as unknown as ProfileRow;
  } catch {
    // Admin client may not be available (missing SUPABASE_SERVICE_ROLE_KEY).
    // Fall back to the regular client.
    console.warn('[requireUser] Admin client unavailable, falling back to regular client');

    const { data, error } = await fallbackClient
      .from('profiles')
      .select('organization_id, email')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[requireUser] Fallback profile query error:', error.message);
      return null;
    }

    return data as unknown as ProfileRow;
  }
}
