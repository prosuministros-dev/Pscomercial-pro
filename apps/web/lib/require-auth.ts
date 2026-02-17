import type { SupabaseClient } from '@supabase/supabase-js';

import { requireUser as baseRequireUser } from '@kit/supabase/require-user';

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

/**
 * Wrapper around requireUser that:
 * 1. Validates the user is authenticated
 * 2. Fetches the user's profile to get organization_id
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
    throw new AuthError('Authentication required', 401);
  }

  const userId = result.data.sub ?? result.data.id;

  if (!userId) {
    throw new AuthError('User ID not found in token', 401);
  }

  // Fetch profile to get organization_id
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('organization_id, email')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    console.error('[requireUser] Profile not found for userId:', userId, profileError?.message);
    throw new AuthError('User profile not found', 403);
  }

  return {
    id: userId,
    organization_id: (profile as any).organization_id,
    email: (profile as any).email,
  };
}
