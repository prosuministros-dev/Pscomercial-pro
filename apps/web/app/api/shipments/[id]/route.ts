import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

const dispatchSchema = z.object({
  action: z.literal('dispatch'),
});

const deliverSchema = z.object({
  action: z.literal('deliver'),
  received_by_name: z.string().min(1, 'Nombre de quien recibe es requerido'),
  reception_notes: z.string().optional(),
});

/**
 * GET /api/shipments/[id]
 * Get shipment detail with items
 * Permission: logistics:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: shipmentId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'logistics:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data, error } = await client
      .from('shipments')
      .select(`
        *,
        items:shipment_items(*)
      `)
      .eq('id', shipmentId)
      .eq('organization_id', user.organization_id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/shipments/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/shipments/[id]
 * Dispatch or deliver shipment
 * Permission: logistics:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: shipmentId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'logistics:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar despachos' }, { status: 403 });
    }

    // Verify shipment belongs to org
    const { data: shipment, error: shipError } = await client
      .from('shipments')
      .select('*, items:shipment_items(*)')
      .eq('id', shipmentId)
      .eq('organization_id', user.organization_id)
      .single();

    if (shipError || !shipment) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    const body = await request.json();

    if (body.action === 'dispatch') {
      const parsed = dispatchSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
      }

      if (shipment.status !== 'preparing') {
        return NextResponse.json({ error: 'Solo se puede despachar un envío en preparación' }, { status: 400 });
      }

      const { error: updateError } = await client
        .from('shipments')
        .update({
          status: 'dispatched',
          dispatched_at: new Date().toISOString(),
          dispatched_by: user.id,
        })
        .eq('id', shipmentId);

      if (updateError) {
        console.error('Error dispatching shipment:', updateError);
        return NextResponse.json({ error: 'Error al despachar' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === 'deliver') {
      const parsed = deliverSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Datos inválidos' }, { status: 400 });
      }

      if (!['dispatched', 'in_transit'].includes(shipment.status)) {
        return NextResponse.json({ error: 'Solo se puede entregar un envío despachado o en tránsito' }, { status: 400 });
      }

      const { error: updateError } = await client
        .from('shipments')
        .update({
          status: 'delivered',
          actual_delivery: new Date().toISOString(),
          received_by_name: parsed.data.received_by_name,
          reception_notes: parsed.data.reception_notes || null,
        })
        .eq('id', shipmentId);

      if (updateError) {
        console.error('Error delivering shipment:', updateError);
        return NextResponse.json({ error: 'Error al registrar entrega' }, { status: 500 });
      }

      // Update order_items.quantity_delivered
      const shipItems = (shipment as any).items || [];
      for (const si of shipItems) {
        const { data: currentOI } = await client
          .from('order_items')
          .select('quantity_delivered')
          .eq('id', si.order_item_id)
          .single();

        if (currentOI) {
          await client
            .from('order_items')
            .update({ quantity_delivered: (currentOI.quantity_delivered || 0) + si.quantity_shipped })
            .eq('id', si.order_item_id);
        }
      }

      return NextResponse.json({ success: true });
    }

    if (body.action === 'upload_evidence') {
      const { attachment_id, url, file_name } = body;
      if (!attachment_id) {
        return NextResponse.json({ error: 'attachment_id es requerido' }, { status: 400 });
      }

      // Store evidence reference in shipment metadata
      const currentMeta = (shipment as any).metadata || {};
      const evidences = currentMeta.evidences || [];
      evidences.push({ attachment_id, url, file_name, uploaded_at: new Date().toISOString(), uploaded_by: user.id });

      const { error: updateError } = await client
        .from('shipments')
        .update({ metadata: { ...currentMeta, evidences } })
        .eq('id', shipmentId);

      if (updateError) {
        console.error('Error saving evidence:', updateError);
        return NextResponse.json({ error: 'Error al guardar evidencia' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 });
  } catch (error) {
    console.error('Error in PATCH /api/shipments/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
