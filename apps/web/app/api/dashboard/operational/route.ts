import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser, AuthError } from '~/lib/require-auth';

/**
 * GET /api/dashboard/operational
 * Returns operational dashboard data: orders by status, invoiced, deliveries
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

    const { data, error } = await client.rpc('get_operational_dashboard', {
      p_org_id: user.organization_id,
      p_from: from || null,
      p_to: to || null,
    });

    if (error) {
      console.error('Error in get_operational_dashboard:', error);
      return NextResponse.json({ error: 'Error al cargar dashboard operativo' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Error in GET /api/dashboard/operational:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
