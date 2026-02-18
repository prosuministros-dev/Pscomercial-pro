import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nombre del proveedor es requerido'),
  nit: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Colombia'),
  payment_terms: z.string().optional(),
  lead_time_days: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/suppliers
 * List suppliers for the org
 * Permission: purchase_orders:read
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'purchase_orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver proveedores' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query = client
      .from('suppliers')
      .select('*')
      .eq('organization_id', user.organization_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,nit.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return handleApiError(error, 'GET /api/suppliers');
  }
}

/**
 * POST /api/suppliers
 * Create a new supplier
 * Permission: purchase_orders:create
 */
export async function POST(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'purchase_orders:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear proveedores' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { data, error } = await client
      .from('suppliers')
      .insert({
        organization_id: user.organization_id,
        ...parsed.data,
        email: parsed.data.email || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json({ error: 'Error al crear el proveedor' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/suppliers');
  }
}
