import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

const createPOSchema = z.object({
  order_id: z.string().uuid('Pedido es requerido'),
  supplier_id: z.string().uuid('Proveedor es requerido'),
  currency: z.enum(['COP', 'USD']).default('COP'),
  trm_applied: z.number().optional(),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    order_item_id: z.string().uuid(),
    quantity_ordered: z.number().positive('Cantidad debe ser mayor a 0'),
    unit_cost: z.number().positive('Costo unitario debe ser mayor a 0'),
  })).min(1, 'Debe seleccionar al menos un item'),
});

/**
 * GET /api/purchase-orders?order_id=xxx
 * List purchase orders for an order
 * Permission: purchase_orders:read
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'purchase_orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver órdenes de compra' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 });
    }

    const { data, error } = await client
      .from('purchase_orders')
      .select(`
        *,
        supplier:suppliers(id, name, nit, contact_name, email, phone),
        items:purchase_order_items(*)
      `)
      .eq('organization_id', user.organization_id)
      .eq('order_id', orderId)
      .order('po_number', { ascending: false });

    if (error) {
      console.error('Error fetching purchase orders:', error);
      return NextResponse.json({ error: 'Error al obtener órdenes de compra' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return handleApiError(error, 'GET /api/purchase-orders');
  }
}

/**
 * POST /api/purchase-orders
 * Create a new purchase order
 * Permission: purchase_orders:create
 */
export async function POST(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'purchase_orders:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear órdenes de compra' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createPOSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify order belongs to org
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id, organization_id, payment_terms, payment_status')
      .eq('id', parsed.data.order_id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // T21.6.5: Block PO creation if payment not confirmed for anticipado orders
    if (order.payment_terms === 'anticipado' && order.payment_status !== 'confirmed') {
      return NextResponse.json(
        { error: 'No se puede generar OC: el pago anticipado no ha sido confirmado' },
        { status: 400 },
      );
    }

    // Fetch order items to validate quantities
    const orderItemIds = parsed.data.items.map(i => i.order_item_id);
    const { data: orderItems, error: oiError } = await client
      .from('order_items')
      .select('id, sku, description, product_id, quantity, quantity_purchased')
      .eq('order_id', parsed.data.order_id)
      .in('id', orderItemIds);

    if (oiError || !orderItems) {
      return NextResponse.json({ error: 'Error al verificar items del pedido' }, { status: 500 });
    }

    // Validate: qty ordered <= (quantity - quantity_purchased)
    const itemMap = new Map(orderItems.map(oi => [oi.id, oi]));
    for (const item of parsed.data.items) {
      const oi = itemMap.get(item.order_item_id);
      if (!oi) {
        return NextResponse.json({ error: `Item ${item.order_item_id} no encontrado en el pedido` }, { status: 400 });
      }
      const available = oi.quantity - (oi.quantity_purchased || 0);
      if (item.quantity_ordered > available) {
        return NextResponse.json(
          { error: `${oi.sku}: cantidad solicitada (${item.quantity_ordered}) excede disponible (${available})` },
          { status: 400 },
        );
      }
    }

    // Get next consecutive
    const { data: nextNum, error: consError } = await client.rpc('get_next_consecutive', {
      p_org_id: user.organization_id,
      p_entity_type: 'purchase_order',
    });

    if (consError) {
      console.error('Error getting consecutive:', consError);
      return NextResponse.json({ error: 'Error al generar número de OC' }, { status: 500 });
    }

    // Parse number from e.g. "OC-5"
    const poNumber = parseInt(String(nextNum).replace(/\D/g, ''), 10) || 1;

    // Calculate totals
    let subtotal = 0;
    for (const item of parsed.data.items) {
      subtotal += item.quantity_ordered * item.unit_cost;
    }
    const taxAmount = subtotal * 0.19; // 19% IVA
    const total = subtotal + taxAmount;

    // Insert PO
    const { data: po, error: poError } = await client
      .from('purchase_orders')
      .insert({
        organization_id: user.organization_id,
        po_number: poNumber,
        order_id: parsed.data.order_id,
        supplier_id: parsed.data.supplier_id,
        status: 'draft',
        currency: parsed.data.currency,
        trm_applied: parsed.data.trm_applied || null,
        subtotal,
        tax_amount: taxAmount,
        total,
        expected_delivery_date: parsed.data.expected_delivery_date || null,
        notes: parsed.data.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (poError) {
      console.error('Error creating purchase order:', poError);
      return NextResponse.json({ error: 'Error al crear la orden de compra' }, { status: 500 });
    }

    // Insert PO items
    const poItems = parsed.data.items.map(item => {
      const oi = itemMap.get(item.order_item_id)!;
      return {
        purchase_order_id: po.id,
        order_item_id: item.order_item_id,
        product_id: oi.product_id || null,
        sku: oi.sku,
        description: oi.description,
        quantity_ordered: item.quantity_ordered,
        quantity_received: 0,
        unit_cost: item.unit_cost,
        subtotal: item.quantity_ordered * item.unit_cost,
        status: 'pending',
      };
    });

    const { error: itemsError } = await client
      .from('purchase_order_items')
      .insert(poItems);

    if (itemsError) {
      console.error('Error inserting PO items:', itemsError);
    }

    // Update order_items.quantity_purchased
    for (const item of parsed.data.items) {
      const oi = itemMap.get(item.order_item_id)!;
      await client
        .from('order_items')
        .update({ quantity_purchased: (oi.quantity_purchased || 0) + item.quantity_ordered })
        .eq('id', item.order_item_id);
    }

    return NextResponse.json(po, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/purchase-orders');
  }
}
