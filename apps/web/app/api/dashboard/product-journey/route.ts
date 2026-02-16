import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/dashboard/product-journey?product_id=xxx
 * Returns product traceability: quote → order → PO → shipment → invoice
 * Permission: orders:read
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');

    if (!productId) {
      return NextResponse.json({ error: 'product_id es requerido' }, { status: 400 });
    }

    const { data, error } = await client.rpc('get_product_journey', {
      p_product_id: productId,
      p_org_id: user.organization_id,
    });

    if (error) {
      console.error('Error in get_product_journey:', error);
      return NextResponse.json({ error: 'Error al cargar trazabilidad' }, { status: 500 });
    }

    return NextResponse.json(data || { events: [] });
  } catch (error) {
    console.error('Error in GET /api/dashboard/product-journey:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
