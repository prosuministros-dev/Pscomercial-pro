import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

const createLicenseSchema = z.object({
  order_id: z.string().uuid(),
  order_item_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  license_type: z.enum(['software', 'saas', 'hardware_warranty', 'support', 'subscription']),
  license_key: z.string().optional(),
  vendor: z.string().optional(),
  activation_date: z.string().optional(),
  expiry_date: z.string().optional(),
  seats: z.number().int().positive().optional(),
  end_user_name: z.string().optional(),
  end_user_email: z.string().email('Email inválido').optional().or(z.literal('')),
  activation_notes: z.string().optional(),
});

/**
 * GET /api/licenses?order_id=xxx
 * List licenses for an order
 * Permission: licenses:read
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'licenses:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver licencias' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (!orderId) {
      return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 });
    }

    const { data, error } = await client
      .from('license_records')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching licenses:', error);
      return NextResponse.json({ error: 'Error al obtener licencias' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/licenses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/licenses
 * Create a new license record
 * Permission: licenses:create
 */
export async function POST(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'licenses:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear licencias' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createLicenseSchema.safeParse(body);
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

    const { data, error } = await client
      .from('license_records')
      .insert({
        organization_id: user.organization_id,
        order_id: parsed.data.order_id,
        order_item_id: parsed.data.order_item_id,
        product_id: parsed.data.product_id || null,
        license_type: parsed.data.license_type,
        license_key: parsed.data.license_key || null,
        vendor: parsed.data.vendor || null,
        activation_date: parsed.data.activation_date || null,
        expiry_date: parsed.data.expiry_date || null,
        seats: parsed.data.seats || null,
        status: parsed.data.license_key ? 'active' : 'pending',
        end_user_name: parsed.data.end_user_name || null,
        end_user_email: parsed.data.end_user_email || null,
        activation_notes: parsed.data.activation_notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating license:', error);
      return NextResponse.json({ error: 'Error al crear licencia' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/licenses:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
