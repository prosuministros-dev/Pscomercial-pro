import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/team
 * Returns active team members (profiles) in the current organization.
 * Used for @mention autocomplete in comments.
 */
export async function GET() {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const { data, error } = await client
      .from('profiles')
      .select('id, full_name')
      .eq('organization_id', user.organization_id)
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    return handleApiError(error, 'GET /api/team');
  }
}
