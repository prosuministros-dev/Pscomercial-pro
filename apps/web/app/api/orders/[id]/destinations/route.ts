import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

const destinationSchema = z.object({
  delivery_address: z.string().min(1, 'Dirección de entrega es requerida'),
  delivery_city: z.string().optional(),
  delivery_contact: z.string().optional(),
  delivery_phone: z.string().optional(),
  delivery_schedule: z.string().optional(),
  dispatch_type: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/orders/[id]/destinations
 * List all destinations for an order
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

    // Verify order belongs to org
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { data, error } = await client
      .from('order_destinations')
      .select('*')
      .eq('order_id', orderId)
      .order('sort_order');

    if (error) {
      console.error('Error fetching destinations:', error);
      return NextResponse.json({ error: 'Error al obtener destinos' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/orders/[id]/destinations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders/[id]/destinations
 * Add a new destination to an order
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
      return NextResponse.json({ error: 'No tienes permiso para actualizar pedidos' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = destinationSchema.safeParse(body);
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
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Get next sort_order
    const { count } = await client
      .from('order_destinations')
      .select('*', { count: 'exact', head: true })
      .eq('order_id', orderId);

    const { data: dest, error: insertError } = await client
      .from('order_destinations')
      .insert({
        organization_id: order.organization_id,
        order_id: orderId,
        sort_order: (count || 0) + 1,
        delivery_address: parsed.data.delivery_address,
        delivery_city: parsed.data.delivery_city || null,
        delivery_contact: parsed.data.delivery_contact || null,
        delivery_phone: parsed.data.delivery_phone || null,
        delivery_schedule: parsed.data.delivery_schedule || null,
        dispatch_type: parsed.data.dispatch_type || null,
        notes: parsed.data.notes || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting destination:', insertError);
      return NextResponse.json({ error: 'Error al agregar destino' }, { status: 500 });
    }

    return NextResponse.json(dest, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/orders/[id]/destinations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/orders/[id]/destinations
 * Update a destination
 * Permission: orders:update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const body = await request.json();
    const destId = body.destination_id;

    const idValidation = z.string().uuid().safeParse(destId);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'ID de destino inválido' }, { status: 400 });
    }

    const parsed = destinationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify order + destination belong to org
    const { data: order } = await client
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { data: dest, error: updateError } = await client
      .from('order_destinations')
      .update({
        delivery_address: parsed.data.delivery_address,
        delivery_city: parsed.data.delivery_city || null,
        delivery_contact: parsed.data.delivery_contact || null,
        delivery_phone: parsed.data.delivery_phone || null,
        delivery_schedule: parsed.data.delivery_schedule || null,
        dispatch_type: parsed.data.dispatch_type || null,
        notes: parsed.data.notes || null,
      })
      .eq('id', destId)
      .eq('order_id', orderId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating destination:', updateError);
      return NextResponse.json({ error: 'Error al actualizar destino' }, { status: 500 });
    }

    return NextResponse.json(dest);
  } catch (error) {
    console.error('Error in PUT /api/orders/[id]/destinations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/orders/[id]/destinations
 * Remove a destination
 * Permission: orders:update
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const destId = searchParams.get('destination_id');

    const idValidation = z.string().uuid().safeParse(destId);
    if (!idValidation.success) {
      return NextResponse.json({ error: 'ID de destino inválido' }, { status: 400 });
    }

    // Verify order belongs to org
    const { data: order } = await client
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const { error: deleteError } = await client
      .from('order_destinations')
      .delete()
      .eq('id', destId)
      .eq('order_id', orderId);

    if (deleteError) {
      console.error('Error deleting destination:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar destino' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/orders/[id]/destinations:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
