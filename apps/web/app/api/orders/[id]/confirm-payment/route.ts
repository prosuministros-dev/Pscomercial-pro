import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { notifyAreaTeam } from '~/lib/notifications/create-notification';

const confirmPaymentSchema = z.object({
  notes: z.string().optional(),
});

/**
 * PATCH /api/orders/[id]/confirm-payment
 * Confirm payment received for an order with payment_pending status
 * Permission: orders:confirm_payment (finanzas, gerente_general, super_admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:confirm_payment');
    if (!allowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para confirmar pagos' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = confirmPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Fetch order
    const { data: order, error: fetchError } = await client
      .from('orders')
      .select('id, organization_id, order_number, status, payment_status, requires_advance_billing, advisor_id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.payment_status === 'confirmed') {
      return NextResponse.json(
        { error: 'El pago ya fue confirmado' },
        { status: 400 },
      );
    }

    // Update payment status + confirmed tracking
    const { error: updateError } = await client
      .from('orders')
      .update({
        payment_status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
        payment_confirmed_by: user.id,
        // If status was payment_pending, move to created
        ...(order.status === 'payment_pending' ? { status: 'created' } : {}),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error confirming payment:', updateError);
      return NextResponse.json(
        { error: 'Error al confirmar el pago' },
        { status: 500 },
      );
    }

    // Add status history record if status changed
    if (order.status === 'payment_pending') {
      await client.from('order_status_history').insert({
        order_id: orderId,
        from_status: 'payment_pending',
        to_status: 'created',
        changed_by: user.id,
        notes: parsed.data.notes || 'Pago confirmado - pedido procede',
      });
    }

    // Notify compras team
    await notifyAreaTeam(order.organization_id, 'compras', {
      type: 'payment_confirmed',
      title: 'Pago Confirmado',
      message: `El pago del pedido #${order.order_number} ha sido confirmado`,
      entityType: 'order',
      entityId: orderId,
      actionUrl: `/home/orders?id=${orderId}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/orders/[id]/confirm-payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
