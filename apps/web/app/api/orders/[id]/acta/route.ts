import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

const uploadActaSchema = z.object({
  acta_url: z.string().min(1, 'URL del acta es requerida'),
});

/**
 * GET /api/orders/[id]/acta
 * Get acta status for an order
 * Permission: orders:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data: order, error } = await client
      .from('orders')
      .select('id, requires_acta, acta_uploaded, acta_url, acta_uploaded_at, acta_uploaded_by')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error, 'GET /api/orders/[id]/acta');
  }
}

/**
 * PATCH /api/orders/[id]/acta
 * Upload acta para facturar
 * Permission: orders:manage_billing
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:manage_billing');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar facturación' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = uploadActaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify order belongs to org and requires acta
    const { data: order, error: fetchError } = await client
      .from('orders')
      .select('id, organization_id, requires_acta, order_number')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (!order.requires_acta) {
      return NextResponse.json({ error: 'Este pedido no requiere acta para facturar' }, { status: 400 });
    }

    const { error: updateError } = await client
      .from('orders')
      .update({
        acta_uploaded: true,
        acta_url: parsed.data.acta_url,
        acta_uploaded_at: new Date().toISOString(),
        acta_uploaded_by: user.id,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error uploading acta:', updateError);
      return NextResponse.json({ error: 'Error al registrar el acta' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/orders/[id]/acta');
  }
}
