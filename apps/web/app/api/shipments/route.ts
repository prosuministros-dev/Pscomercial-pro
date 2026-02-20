import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

const createShipmentSchema = z.object({
  order_id: z.string().uuid('Pedido es requerido'),
  dispatch_type: z.enum(['envio', 'retiro', 'mensajeria'], { required_error: 'Tipo de despacho es requerido' }),
  carrier: z.string().optional(),
  tracking_number: z.string().optional(),
  tracking_url: z.string().optional(),
  delivery_address: z.string().min(1, 'Dirección de entrega es requerida'),
  delivery_city: z.string().min(1, 'Ciudad es requerida'),
  delivery_contact: z.string().min(1, 'Contacto de entrega es requerido'),
  delivery_phone: z.string().min(1, 'Teléfono de entrega es requerido'),
  estimated_delivery: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    order_item_id: z.string().uuid(),
    quantity_shipped: z.number().positive('Cantidad debe ser mayor a 0'),
    serial_numbers: z.array(z.string()).optional(),
  })).min(1, 'Debe seleccionar al menos un item'),
});

/**
 * GET /api/shipments?order_id=xxx
 * List shipments for an order
 * Permission: logistics:read
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'logistics:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver despachos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 });
    }

    const { data, error } = await client
      .from('shipments')
      .select(`
        *,
        items:shipment_items(*)
      `)
      .eq('organization_id', user.organization_id)
      .eq('order_id', orderId)
      .order('shipment_number', { ascending: false });

    if (error) {
      console.error('Error fetching shipments:', error);
      return NextResponse.json({ error: 'Error al obtener despachos' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return handleApiError(error, 'GET /api/shipments');
  }
}

/**
 * POST /api/shipments
 * Create a new shipment
 * Permission: logistics:create
 */
export async function POST(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'logistics:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear despachos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createShipmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify order belongs to org
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id, organization_id')
      .eq('id', parsed.data.order_id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Fetch order items to validate quantities
    const orderItemIds = parsed.data.items.map(i => i.order_item_id);
    const { data: orderItems, error: oiError } = await client
      .from('order_items')
      .select('id, sku, description, quantity_received, quantity_dispatched')
      .eq('order_id', parsed.data.order_id)
      .in('id', orderItemIds);

    if (oiError || !orderItems) {
      return NextResponse.json({ error: 'Error al verificar items del pedido' }, { status: 500 });
    }

    // Validate: qty shipped <= (received - dispatched)
    const itemMap = new Map(orderItems.map(oi => [oi.id, oi]));
    for (const item of parsed.data.items) {
      const oi = itemMap.get(item.order_item_id);
      if (!oi) {
        return NextResponse.json({ error: `Item ${item.order_item_id} no encontrado en el pedido` }, { status: 400 });
      }
      const available = (oi.quantity_received || 0) - (oi.quantity_dispatched || 0);
      if (item.quantity_shipped > available) {
        return NextResponse.json(
          { error: `${oi.sku}: cantidad a despachar (${item.quantity_shipped}) excede disponible (${available})` },
          { status: 400 },
        );
      }
    }

    // Get next consecutive
    const { data: nextNum, error: consError } = await client.rpc('get_next_consecutive', {
      p_org_id: user.organization_id,
      p_entity_type: 'shipment',
    });

    if (consError) {
      console.error('Error getting consecutive:', consError);
      return NextResponse.json({ error: 'Error al generar número de despacho' }, { status: 500 });
    }

    const shipmentNumber = parseInt(String(nextNum).replace(/\D/g, ''), 10) || 1;

    // Insert shipment
    const { data: shipment, error: shipError } = await client
      .from('shipments')
      .insert({
        organization_id: user.organization_id,
        shipment_number: shipmentNumber,
        order_id: parsed.data.order_id,
        status: 'preparing',
        dispatch_type: parsed.data.dispatch_type,
        carrier: parsed.data.carrier || null,
        tracking_number: parsed.data.tracking_number || null,
        tracking_url: parsed.data.tracking_url || null,
        delivery_address: parsed.data.delivery_address,
        delivery_city: parsed.data.delivery_city,
        delivery_contact: parsed.data.delivery_contact,
        delivery_phone: parsed.data.delivery_phone,
        estimated_delivery: parsed.data.estimated_delivery || null,
        notes: parsed.data.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (shipError) {
      console.error('Error creating shipment:', shipError);
      return NextResponse.json({ error: 'Error al crear el despacho' }, { status: 500 });
    }

    // Insert shipment items
    const shipItems = parsed.data.items.map(item => ({
      shipment_id: shipment.id,
      order_item_id: item.order_item_id,
      quantity_shipped: item.quantity_shipped,
      serial_numbers: item.serial_numbers || [],
      notes: null,
    }));

    const { error: itemsError } = await client
      .from('shipment_items')
      .insert(shipItems);

    if (itemsError) {
      console.error('Error inserting shipment items:', itemsError);
    }

    // Update order_items.quantity_dispatched
    for (const item of parsed.data.items) {
      const oi = itemMap.get(item.order_item_id)!;
      await client
        .from('order_items')
        .update({ quantity_dispatched: (oi.quantity_dispatched || 0) + item.quantity_shipped })
        .eq('id', item.order_item_id);
    }

    return NextResponse.json(shipment, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/shipments');
  }
}
