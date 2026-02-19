import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';
import { createNotification } from '~/lib/notifications/create-notification';

const registerInvoiceSchema = z.object({
  order_id: z.string().uuid('Pedido es requerido'),
  invoice_number: z.string().min(1, 'Número de factura es requerido'),
  invoice_date: z.string().min(1, 'Fecha de factura es requerida'),
  due_date: z.string().optional(),
  currency: z.enum(['COP', 'USD']).default('COP'),
  subtotal: z.number().min(0),
  tax_amount: z.number().min(0),
  total: z.number().positive('Total debe ser mayor a 0'),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    order_item_id: z.string().uuid().optional(),
    sku: z.string().min(1),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    subtotal: z.number().min(0),
    tax_amount: z.number().min(0),
    total: z.number().positive(),
  })).optional(),
});

/**
 * GET /api/invoices?order_id=xxx
 * List invoices for an order
 * Permission: billing:read
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'billing:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver facturas' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 });
    }

    const { data, error } = await client
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('organization_id', user.organization_id)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return handleApiError(error, 'GET /api/invoices');
  }
}

/**
 * POST /api/invoices
 * Register an external invoice
 * Permission: billing:create
 */
export async function POST(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'billing:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para registrar facturas' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = registerInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify order belongs to org, get customer_id, and validate delivery status
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id, organization_id, customer_id, status, advisor_id, order_number, requires_acta, acta_uploaded')
      .eq('id', parsed.data.order_id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Validate: order must be delivered or later to invoice
    const invoiceableStatuses = ['delivered', 'invoiced', 'completed'];
    if (!invoiceableStatuses.includes(order.status)) {
      return NextResponse.json(
        { error: 'Solo se puede facturar un pedido entregado. Estado actual: ' + order.status },
        { status: 400 },
      );
    }

    // T21.20: Validate acta para facturar if required
    if (order.requires_acta && !order.acta_uploaded) {
      return NextResponse.json(
        { error: 'Este pedido requiere acta para facturar. Suba el acta antes de registrar la factura.' },
        { status: 400 },
      );
    }

    // Insert invoice
    const { data: invoice, error: invError } = await client
      .from('invoices')
      .insert({
        organization_id: user.organization_id,
        invoice_number: parsed.data.invoice_number,
        order_id: parsed.data.order_id,
        customer_id: order.customer_id,
        invoice_date: parsed.data.invoice_date,
        due_date: parsed.data.due_date || null,
        currency: parsed.data.currency,
        subtotal: parsed.data.subtotal,
        tax_amount: parsed.data.tax_amount,
        total: parsed.data.total,
        status: 'pending',
        payment_method: parsed.data.payment_method || null,
        notes: parsed.data.notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (invError) {
      console.error('Error creating invoice:', invError);
      return NextResponse.json({ error: 'Error al registrar la factura' }, { status: 500 });
    }

    // Insert invoice items if provided
    if (parsed.data.items && parsed.data.items.length > 0) {
      const invItems = parsed.data.items.map(item => ({
        invoice_id: invoice.id,
        order_item_id: item.order_item_id || null,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal,
        tax_amount: item.tax_amount,
        total: item.total,
      }));

      const { error: itemsError } = await client
        .from('invoice_items')
        .insert(invItems);

      if (itemsError) {
        console.error('Error inserting invoice items:', itemsError);
      }
    }

    // T21.11: Notify advisor that invoice was registered
    if (order.advisor_id) {
      await createNotification({
        organizationId: user.organization_id,
        userId: order.advisor_id,
        type: 'invoice_created',
        title: 'Factura registrada',
        message: `Factura ${parsed.data.invoice_number} registrada para pedido #${order.order_number}`,
        entityType: 'invoice',
        entityId: invoice.id,
        actionUrl: `/home/orders/${order.id}`,
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/invoices');
  }
}
