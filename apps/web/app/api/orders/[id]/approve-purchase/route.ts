import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

// Helper para tabla nueva (pendiente regeneración de tipos Supabase)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const opa = (client: any) => client.from('order_purchase_approvals');

// --- Zod Schemas ---
const requestApprovalSchema = z.object({
  justification: z.string().optional(),
});

const resolveApprovalSchema = z.object({
  action: z.enum(['approve', 'reject'], {
    required_error: 'Acción requerida (approve/reject)',
  }),
  review_notes: z.string().optional(),
});

/**
 * GET /api/orders/[id]/approve-purchase
 * Obtiene las aprobaciones de compra para un pedido.
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
      return NextResponse.json(
        { error: 'No tienes permiso para ver aprobaciones de pedidos' },
        { status: 403 },
      );
    }

    // Verificar que el pedido pertenece a la organización
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { data: approvals, error } = await opa(client)
      .select(
        `*, requester:profiles!order_purchase_approvals_requested_by_fkey(id, full_name, email),
         reviewer:profiles!order_purchase_approvals_reviewed_by_fkey(id, full_name, email)`,
      )
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchase approvals:', error);
      return NextResponse.json(
        { error: 'Error al obtener las aprobaciones' },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: approvals || [] });
  } catch (error) {
    return handleApiError(error, 'GET /api/orders/[id]/approve-purchase');
  }
}

/**
 * POST /api/orders/[id]/approve-purchase
 * Solicita aprobación de compra. Llama RPC request_purchase_approval.
 * Permission: orders:update
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:update');
    if (!allowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para solicitar aprobación de compra' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = requestApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verificar que el pedido pertenece a la organización
    const { data: order, error: fetchError } = await client
      .from('orders')
      .select('id, organization_id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Verificar que no haya aprobación pendiente
    const { data: existing } = await opa(client)
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud de aprobación pendiente para este pedido' },
        { status: 400 },
      );
    }

    // Llamar RPC (crea registro + notifica gerentes)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: rpcError } = await (client as any).rpc('request_purchase_approval', {
      p_order_id: orderId,
    });

    if (rpcError) {
      console.error('Error requesting purchase approval:', rpcError);
      return NextResponse.json(
        { error: rpcError.message || 'Error al solicitar aprobación de compra' },
        { status: 500 },
      );
    }

    // Si se proporcionó justificación, actualizarla en el registro creado
    const { justification } = parsed.data;
    if (justification) {
      await opa(client)
        .update({ justification })
        .eq('order_id', orderId)
        .eq('status', 'pending');
    }

    // Retornar el registro creado
    const { data: approval } = await opa(client)
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({ success: true, approval }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/orders/[id]/approve-purchase');
  }
}

/**
 * PATCH /api/orders/[id]/approve-purchase
 * Aprueba o rechaza la solicitud pendiente.
 * Permission: orders:approve
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:approve');
    if (!allowed) {
      return NextResponse.json(
        { error: 'No tienes permiso para aprobar o rechazar compras' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = resolveApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verificar que el pedido pertenece a la organización
    const { data: order, error: fetchError } = await client
      .from('orders')
      .select('id, organization_id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Obtener aprobación pendiente
    const { data: approval } = await opa(client)
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!approval) {
      return NextResponse.json(
        { error: 'No hay aprobación pendiente para este pedido' },
        { status: 404 },
      );
    }

    const { action, review_notes } = parsed.data;
    const isApproved = action === 'approve';

    // Actualizar el registro de aprobación
    const { error: updateError } = await opa(client)
      .update({
        status: isApproved ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
      })
      .eq('id', approval.id);

    if (updateError) {
      console.error('Error updating purchase approval:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la aprobación' },
        { status: 500 },
      );
    }

    // Notificar al solicitante
    await client.from('notifications').insert({
      organization_id: user.organization_id,
      user_id: approval.requested_by,
      type: isApproved ? 'purchase_approved' : 'purchase_rejected',
      title: isApproved ? 'Compra aprobada' : 'Compra rechazada',
      message: isApproved
        ? `Tu solicitud de aprobación de compra fue aprobada${review_notes ? ': ' + review_notes : ''}`
        : `Tu solicitud de aprobación de compra fue rechazada${review_notes ? ': ' + review_notes : ''}`,
      action_url: '/home/orders',
      entity_type: 'order',
      entity_id: orderId,
      priority: 'high',
    });

    return NextResponse.json({ success: true, action });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/orders/[id]/approve-purchase');
  }
}
