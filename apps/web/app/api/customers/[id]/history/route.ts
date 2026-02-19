import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/customers/[id]/history
 * Returns commercial history for a customer: quotes, orders, purchase_orders
 * Permission required: customers:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'customers:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const customerId = params.id;

    // Verify customer belongs to org
    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id, business_name')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // quotes, orders, purchase_orders
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;

    const result: Record<string, unknown> = {};

    // Fetch quotes for this customer
    if (!type || type === 'quotes') {
      let quotesQuery = client
        .from('quotes')
        .select('id, consecutive, status, total_cop, total_usd, valid_until, created_at, advisor:profiles!quotes_advisor_id_fkey(full_name)', { count: 'exact' })
        .eq('organization_id', user.organization_id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        quotesQuery = quotesQuery.eq('status', status);
      }

      const { data: quotes, count: quotesCount, error: quotesError } = await quotesQuery;
      if (!quotesError) {
        result.quotes = { data: quotes, total: quotesCount || 0 };
      }
    }

    // Fetch orders for this customer
    if (!type || type === 'orders') {
      let ordersQuery = client
        .from('orders')
        .select('id, consecutive, status, total_cop, created_at, advisor:profiles!orders_advisor_id_fkey(full_name)', { count: 'exact' })
        .eq('organization_id', user.organization_id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        ordersQuery = ordersQuery.eq('status', status);
      }

      const { data: orders, count: ordersCount, error: ordersError } = await ordersQuery;
      if (!ordersError) {
        result.orders = { data: orders, total: ordersCount || 0 };
      }
    }

    // Fetch purchase orders related to this customer's orders
    if (!type || type === 'purchase_orders') {
      const purchaseQuery = client
        .from('purchase_orders')
        .select('id, consecutive, status, total_cop, supplier:suppliers(business_name), created_at', { count: 'exact' })
        .eq('organization_id', user.organization_id)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: purchaseOrders, count: poCount, error: poError } = await purchaseQuery;
      if (!poError) {
        result.purchase_orders = { data: purchaseOrders, total: poCount || 0 };
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error, 'GET /api/customers/[id]/history');
  }
}
