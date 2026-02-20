import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/products/[id]/price-history
 * Get purchase price history for a product
 * Permission: products:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: productId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'products:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    // Get current product info
    const { data: product, error: prodError } = await client
      .from('products')
      .select('id, sku, name, last_purchase_price, last_purchase_date, unit_cost_usd, unit_cost_cop')
      .eq('id', productId)
      .eq('organization_id', user.organization_id)
      .single();

    if (prodError || !product) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    // Get price history (last 20 records)
    const { data: history, error: histError } = await client
      .from('product_price_history')
      .select(`
        id, unit_cost, currency, quantity, recorded_at,
        supplier:suppliers(id, name),
        purchase_order:purchase_orders(id, po_number)
      `)
      .eq('product_id', productId)
      .eq('organization_id', user.organization_id)
      .order('recorded_at', { ascending: false })
      .limit(20);

    if (histError) {
      console.error('Error fetching price history:', histError);
    }

    return NextResponse.json({
      product,
      history: history || [],
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/products/[id]/price-history');
  }
}
