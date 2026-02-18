import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

const receiveItemsSchema = z.object({
  action: z.literal('receive_items'),
  items: z.array(z.object({
    po_item_id: z.string().uuid(),
    quantity_received: z.number().min(0),
  })).min(1, 'Debe indicar cantidades recibidas'),
});

const updateStatusSchema = z.object({
  action: z.literal('update_status'),
  status: z.string().min(1),
});

/**
 * GET /api/purchase-orders/[id]
 * Get purchase order detail with items
 * Permission: purchase_orders:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: poId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'purchase_orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data, error } = await client
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(id, name, nit, contact_name, email, phone),
        items:purchase_order_items(*)
      `)
      .eq('id', poId)
      .eq('organization_id', user.organization_id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'GET /api/purchase-orders/[id]');
  }
}

/**
 * PATCH /api/purchase-orders/[id]
 * Update PO status or receive items
 * Permission: purchase_orders:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: poId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'purchase_orders:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar órdenes de compra' }, { status: 403 });
    }

    // Verify PO belongs to org
    const { data: po, error: poError } = await client
      .from('purchase_orders')
      .select('*, items:purchase_order_items(*)')
      .eq('id', poId)
      .eq('organization_id', user.organization_id)
      .single();

    if (poError || !po) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    const body = await request.json();

    // Route by action
    if (body.action === 'update_status') {
      const parsed = updateStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Datos inválidos' }, { status: 400 });
      }

      const { error: updateError } = await client
        .from('purchase_orders')
        .update({ status: parsed.data.status })
        .eq('id', poId);

      if (updateError) {
        console.error('Error updating PO status:', updateError);
        return NextResponse.json({ error: 'Error al actualizar estado' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === 'receive_items') {
      const parsed = receiveItemsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Datos inválidos' }, { status: 400 });
      }

      const poItems = (po as any).items || [];
      const poItemMap = new Map(poItems.map((i: any) => [i.id, i]));

      for (const item of parsed.data.items) {
        const poItem = poItemMap.get(item.po_item_id) as any;
        if (!poItem) continue;
        if (item.quantity_received <= 0) continue;

        const newReceived = (poItem.quantity_received || 0) + item.quantity_received;
        const itemStatus = newReceived >= poItem.quantity_ordered ? 'received' : 'partial';

        // Update PO item
        await client
          .from('purchase_order_items')
          .update({
            quantity_received: newReceived,
            status: itemStatus,
            received_at: new Date().toISOString(),
            received_by: user.id,
          })
          .eq('id', item.po_item_id);

        // Update order_items.quantity_received
        const { data: currentOI } = await client
          .from('order_items')
          .select('quantity_received')
          .eq('id', poItem.order_item_id)
          .single();

        if (currentOI) {
          await client
            .from('order_items')
            .update({ quantity_received: (currentOI.quantity_received || 0) + item.quantity_received })
            .eq('id', poItem.order_item_id);
        }
      }

      // Re-check PO status: if all items received → 'received', else 'partial_received'
      const { data: updatedItems } = await client
        .from('purchase_order_items')
        .select('quantity_ordered, quantity_received')
        .eq('purchase_order_id', poId);

      let poStatus = po.status;
      if (updatedItems && updatedItems.length > 0) {
        const allReceived = updatedItems.every((i: any) => i.quantity_received >= i.quantity_ordered);
        const anyReceived = updatedItems.some((i: any) => i.quantity_received > 0);
        if (allReceived) {
          poStatus = 'received';
        } else if (anyReceived) {
          poStatus = 'partial_received';
        }
      }

      if (poStatus !== po.status) {
        await client
          .from('purchase_orders')
          .update({
            status: poStatus,
            ...(poStatus === 'received' ? { actual_delivery_date: new Date().toISOString() } : {}),
          })
          .eq('id', poId);
      }

      return NextResponse.json({ success: true, status: poStatus });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/purchase-orders/[id]');
  }
}
