import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

// --- Zod Schemas ---
const createOrderSchema = z.object({
  quote_id: z.string().uuid('ID de cotización es requerido'),
  delivery_address: z.string().optional(),
  delivery_city: z.string().optional(),
  delivery_contact: z.string().optional(),
  delivery_phone: z.string().optional(),
  delivery_notes: z.string().optional(),
  expected_delivery_date: z.string().optional(),
});

/**
 * GET /api/orders
 * List orders with pagination and filters
 * Permission: orders:read
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver pedidos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');
    const advisorId = searchParams.get('advisor_id');
    const search = searchParams.get('search');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const paymentStatus = searchParams.get('payment_status');

    let query = client
      .from('orders')
      .select(
        `
        *,
        customer:customers(id, business_name, nit, city),
        advisor:profiles!orders_advisor_id_fkey(id, display_name, email),
        quote:quotes!orders_quote_id_fkey(id, quote_number)
      `,
        { count: 'exact' },
      )
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('order_number', { ascending: false });

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);
    if (advisorId) query = query.eq('advisor_id', advisorId);
    if (paymentStatus) query = query.eq('payment_status', paymentStatus);
    if (search) {
      query = query.or(
        `order_number.eq.${search},customer.business_name.ilike.%${search}%`,
      );
    }
    if (fromDate) query = query.gte('created_at', fromDate);
    if (toDate) query = query.lte('created_at', toDate);

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Error al obtener los pedidos' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders
 * Create order from an approved quote (calls create_order_from_quote RPC)
 * Permission: orders:create
 */
export async function POST(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear pedidos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Call the RPC to create order from quote
    const { data: orderId, error: rpcError } = await client.rpc('create_order_from_quote', {
      p_quote_id: parsed.data.quote_id,
    });

    if (rpcError) {
      console.error('Error creating order from quote:', rpcError);
      return NextResponse.json(
        { error: rpcError.message || 'Error al crear el pedido desde la cotización' },
        { status: 500 },
      );
    }

    // Update delivery info if provided
    const deliveryFields: Record<string, unknown> = {};
    if (parsed.data.delivery_address) deliveryFields.delivery_address = parsed.data.delivery_address;
    if (parsed.data.delivery_city) deliveryFields.delivery_city = parsed.data.delivery_city;
    if (parsed.data.delivery_contact) deliveryFields.delivery_contact = parsed.data.delivery_contact;
    if (parsed.data.delivery_phone) deliveryFields.delivery_phone = parsed.data.delivery_phone;
    if (parsed.data.delivery_notes) deliveryFields.delivery_notes = parsed.data.delivery_notes;
    if (parsed.data.expected_delivery_date) deliveryFields.expected_delivery_date = parsed.data.expected_delivery_date;

    if (Object.keys(deliveryFields).length > 0) {
      const { error: updateError } = await client
        .from('orders')
        .update(deliveryFields)
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating delivery info:', updateError);
        // Order was created, just delivery info failed — don't fail the whole request
      }
    }

    // Fetch the created order with relations
    const { data: order, error: fetchError } = await client
      .from('orders')
      .select(`
        *,
        customer:customers(id, business_name, nit, city),
        advisor:profiles!orders_advisor_id_fkey(id, display_name, email),
        quote:quotes!orders_quote_id_fkey(id, quote_number)
      `)
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Error fetching created order:', fetchError);
      return NextResponse.json({ error: 'Pedido creado pero error al obtener los datos' }, { status: 500 });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/orders
 * Soft delete an order
 * Permission: orders:delete
 */
export async function DELETE(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:delete');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar pedidos' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json({ error: 'ID de pedido es requerido' }, { status: 400 });
    }

    const { data: existingOrder, error: fetchError } = await client
      .from('orders')
      .select('id, organization_id, status')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingOrder) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (['completed', 'invoiced'].includes(existingOrder.status)) {
      return NextResponse.json(
        { error: 'No se puede eliminar un pedido completado o facturado' },
        { status: 400 },
      );
    }

    const { error: deleteError } = await client
      .from('orders')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', orderId);

    if (deleteError) {
      console.error('Error deleting order:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar el pedido' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/orders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
