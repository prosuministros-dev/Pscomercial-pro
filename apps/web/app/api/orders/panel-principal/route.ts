import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/orders/panel-principal
 * Returns main panel data for orders
 * Permission: orders:read
 */
export async function GET() {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data, error } = await client.rpc('get_panel_principal', {
      p_org_id: user.organization_id,
    });

    if (error) {
      console.error('Error in get_panel_principal:', error);
      return NextResponse.json({ error: 'Error al cargar panel principal' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return handleApiError(error, 'GET /api/orders/panel-principal');
  }
}
