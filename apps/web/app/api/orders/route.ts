import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

// --- Zod Schemas ---
const destinationSchema = z.object({
  delivery_address: z.string().min(1, 'Dirección de entrega es requerida'),
  delivery_city: z.string().optional(),
  delivery_contact: z.string().optional(),
  delivery_phone: z.string().optional(),
  delivery_schedule: z.string().optional(),
  dispatch_type: z.string().optional(),
  notes: z.string().optional(),
});

const createOrderSchema = z.object({
  quote_id: z.string().uuid('ID de cotización es requerido'),
  billing_type: z.enum(['total', 'parcial']).default('total'),
  item_ids: z.array(z.string().uuid()).optional(),
  delivery_address: z.string().optional(),
  delivery_city: z.string().optional(),
  delivery_contact: z.string().optional(),
  delivery_phone: z.string().optional(),
  delivery_notes: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  destinations: z.array(destinationSchema).optional(),
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
        advisor:profiles!orders_advisor_id_fkey(id, full_name, email),
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
      const trimmed = search.trim();
      const asNumber = parseInt(trimmed, 10);
      if (!isNaN(asNumber)) {
        query = query.eq('order_number', asNumber);
      } else {
        // Search by customer name via a sub-query on customer_id
        const { data: matchingCustomers } = await client
          .from('customers')
          .select('id')
          .eq('organization_id', user.organization_id)
          .ilike('business_name', `%${trimmed}%`)
          .limit(50);

        const customerIds = (matchingCustomers || []).map((c) => c.id);
        if (customerIds.length > 0) {
          query = query.in('customer_id', customerIds);
        } else {
          // No matching customers — return empty
          return NextResponse.json({
            data: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
          });
        }
      }
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
    return handleApiError(error, 'GET /api/orders');
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

    // Fetch quote with customer info for all validations
    const { data: quoteForCredit } = await client
      .from('quotes')
      .select('customer_id, total, payment_terms, margin_pct, margin_approved, quote_date, validity_days, customer:customers!inner(email, is_blocked)')
      .eq('id', parsed.data.quote_id)
      .single();

    if (!quoteForCredit) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 },
      );
    }

    // T7.9: Validate quote has not expired
    if (quoteForCredit.quote_date && quoteForCredit.validity_days) {
      const quoteDate = new Date(quoteForCredit.quote_date);
      const expirationDate = new Date(quoteDate);
      expirationDate.setDate(expirationDate.getDate() + quoteForCredit.validity_days);
      if (new Date() > expirationDate) {
        return NextResponse.json(
          { error: `La cotización venció el ${expirationDate.toLocaleDateString('es-CO')}. Cree una nueva cotización o extienda la vigencia.` },
          { status: 400 },
        );
      }
    }

    // T7.9: Validate billing email (correo de facturación) is present on customer
    const customerEmail = (quoteForCredit.customer as unknown as { email: string | null })?.email;
    if (!customerEmail || !customerEmail.trim()) {
      return NextResponse.json(
        { error: 'El cliente no tiene correo de facturación. Actualice los datos del cliente antes de crear el pedido.' },
        { status: 400 },
      );
    }

    // T7.9: Validate margin approval for low-margin quotes
    if (quoteForCredit.margin_pct !== null && quoteForCredit.margin_pct < 7 && !quoteForCredit.margin_approved) {
      return NextResponse.json(
        { error: 'La cotización requiere aprobación de margen (< 7%). Solicite aprobación antes de crear el pedido.' },
        { status: 400 },
      );
    }

    if (quoteForCredit.payment_terms !== 'anticipado') {
      // Only validate credit for non-anticipado (credit-based) orders
      const { data: creditOk, error: creditError } = await client.rpc('validate_credit_limit', {
        p_customer_id: quoteForCredit.customer_id,
        p_amount: quoteForCredit.total || 0,
      });

      if (creditError) {
        console.error('Credit validation error:', creditError);
      } else if (creditOk === false) {
        const { data: custInfo } = await client
          .from('customers')
          .select('is_blocked, credit_status, credit_limit, outstanding_balance')
          .eq('id', quoteForCredit.customer_id)
          .single();

        if (custInfo?.is_blocked) {
          return NextResponse.json(
            { error: 'Cliente bloqueado por cartera. Solicite desbloqueo a Gerencia/Financiera.' },
            { status: 400 },
          );
        }
        if (custInfo?.credit_status !== 'approved') {
          return NextResponse.json(
            { error: `Crédito del cliente no aprobado (estado: ${custInfo?.credit_status}). Solicite aprobación.` },
            { status: 400 },
          );
        }
        const available = (custInfo?.credit_limit || 0) - (custInfo?.outstanding_balance || 0);
        return NextResponse.json(
          { error: `Pedido excede cupo disponible ($${available.toLocaleString()} de $${custInfo?.credit_limit?.toLocaleString()}). Solicite extra cupo a Gerencia.` },
          { status: 400 },
        );
      }
    }

    // Call the RPC to create order from quote (with billing_type + optional item_ids)
    const { data: orderId, error: rpcError } = await client.rpc('create_order_from_quote', {
      p_quote_id: parsed.data.quote_id,
      p_billing_type: parsed.data.billing_type,
      p_item_ids: parsed.data.item_ids || null,
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

    // Insert destinations if provided
    if (parsed.data.destinations && parsed.data.destinations.length > 0) {
      const destinationRows = parsed.data.destinations.map((dest, idx) => ({
        organization_id: user.organization_id,
        order_id: orderId,
        sort_order: idx + 1,
        delivery_address: dest.delivery_address,
        delivery_city: dest.delivery_city || null,
        delivery_contact: dest.delivery_contact || null,
        delivery_phone: dest.delivery_phone || null,
        delivery_schedule: dest.delivery_schedule || null,
        dispatch_type: dest.dispatch_type || null,
        notes: dest.notes || null,
      }));

      const { error: destError } = await client
        .from('order_destinations')
        .insert(destinationRows);

      if (destError) {
        console.error('Error inserting destinations:', destError);
      }
    }

    // Fetch the created order with relations
    const { data: order, error: fetchError } = await client
      .from('orders')
      .select(`
        *,
        customer:customers(id, business_name, nit, city),
        advisor:profiles!orders_advisor_id_fkey(id, full_name, email),
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
    return handleApiError(error, 'POST /api/orders');
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

    const idValidation = z.string().uuid('ID de pedido inválido').safeParse(orderId);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: idValidation.error.errors[0]?.message || 'ID de pedido es requerido' },
        { status: 400 },
      );
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
    return handleApiError(error, 'DELETE /api/orders');
  }
}
