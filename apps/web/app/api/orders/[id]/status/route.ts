import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

// --- Zod Schema ---
const updateStatusSchema = z.object({
  status: z.string().min(1, 'Estado es requerido'),
  notes: z.string().optional(),
});

/**
 * GET /api/orders/[id]/status
 * Get order detail with items + status history
 * Permission: orders:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver pedidos' }, { status: 403 });
    }

    // Fetch order with all relations
    const { data: order, error: orderError } = await client
      .from('orders')
      .select(`
        *,
        customer:customers(id, business_name, nit, city, address, phone, email),
        advisor:profiles!orders_advisor_id_fkey(id, full_name, email),
        quote:quotes!orders_quote_id_fkey(id, quote_number)
      `)
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await client
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('id');

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
    }

    // Fetch status history
    const { data: statusHistory, error: historyError } = await client
      .from('order_status_history')
      .select(`
        *,
        changed_by_user:profiles!order_status_history_changed_by_fkey(id, full_name, email)
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error fetching status history:', historyError);
    }

    // Fetch order destinations
    const { data: destinations, error: destError } = await client
      .from('order_destinations')
      .select('*')
      .eq('order_id', orderId)
      .order('sort_order');

    if (destError) {
      console.error('Error fetching order destinations:', destError);
    }

    return NextResponse.json({
      ...order,
      items: items || [],
      status_history: statusHistory || [],
      destinations: destinations || [],
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/orders/[id]/status');
  }
}

/**
 * PATCH /api/orders/[id]/status
 * Update order status (calls update_order_status RPC)
 * Permission: orders:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar pedidos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify order belongs to user's org
    const { data: order, error: fetchError } = await client
      .from('orders')
      .select('id, organization_id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Call the RPC to update order status
    const { error: rpcError } = await client.rpc('update_order_status', {
      p_order_id: orderId,
      p_new_status: parsed.data.status,
      p_notes: parsed.data.notes || null,
    });

    if (rpcError) {
      console.error('Error updating order status:', rpcError);
      return NextResponse.json(
        { error: rpcError.message || 'Error al actualizar el estado del pedido' },
        { status: 500 },
      );
    }

    // Fetch updated order
    const { data: updatedOrder, error: refetchError } = await client
      .from('orders')
      .select(`
        *,
        customer:customers(id, business_name, nit, city),
        advisor:profiles!orders_advisor_id_fkey(id, full_name, email),
        quote:quotes!orders_quote_id_fkey(id, quote_number)
      `)
      .eq('id', orderId)
      .single();

    if (refetchError) {
      console.error('Error refetching order:', refetchError);
      return NextResponse.json({ error: 'Estado actualizado pero error al obtener los datos' }, { status: 500 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return handleApiError(error, 'PATCH /api/orders/[id]/status');
  }
}
