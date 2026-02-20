import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/dashboard/commercial
 * Returns commercial pipeline data: leads, quotes, advisors, conversion
 * Permission: dashboard:read
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'dashboard:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || undefined;
    const to = searchParams.get('to') || undefined;
    const advisorId = searchParams.get('advisor_id') || undefined;

    const { data, error } = await client.rpc('get_commercial_pipeline', {
      p_org_id: user.organization_id,
      p_from: from || null,
      p_to: to || null,
      p_advisor_id: advisorId || null,
    });

    if (error) {
      console.error('Error in get_commercial_pipeline:', error);
      return NextResponse.json({ error: 'Error al cargar pipeline comercial' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'GET /api/dashboard/commercial');
  }
}
