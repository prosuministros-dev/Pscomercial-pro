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

const updateSupplierSchema = z.object({
  id: z.string().uuid('ID debe ser un UUID válido'),
  name: z.string().min(1, 'Nombre del proveedor es requerido').optional(),
  nit: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  payment_terms: z.string().optional(),
  lead_time_days: z.number().int().positive().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

/**
 * GET /api/suppliers
 * List suppliers for the org with optional pagination and filters
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
    const city = searchParams.get('city');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '0');

    let query = client
      .from('suppliers')
      .select('*', { count: page > 0 ? 'exact' : undefined })
      .eq('organization_id', user.organization_id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,nit.ilike.%${search}%`);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    // Paginated mode
    if (page > 0 && limit > 0) {
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ error: 'Error al obtener proveedores' }, { status: 500 });
    }

    // Return paginated format if page/limit were provided
    if (page > 0 && limit > 0) {
      return NextResponse.json({
        data: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      });
    }

    // Legacy format: return array directly (backwards compatible with supplier-select.tsx)
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

    // Check NIT uniqueness within org
    if (parsed.data.nit) {
      const { data: existing } = await client
        .from('suppliers')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('nit', parsed.data.nit)
        .is('deleted_at', null)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor con este NIT en la organización' },
          { status: 409 },
        );
      }
    }

    const { data, error } = await client
      .from('suppliers')
      .insert({
        organization_id: user.organization_id,
        ...parsed.data,
        email: parsed.data.email || null,
        created_by: user.id,
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

/**
 * PUT /api/suppliers
 * Update an existing supplier
 * Permission: purchase_orders:update
 */
export async function PUT(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'purchase_orders:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para editar proveedores' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSupplierSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { id, ...fields } = parsed.data;

    // Verify supplier belongs to org
    const { data: existing, error: fetchError } = await client
      .from('suppliers')
      .select('id, nit')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    // Check NIT uniqueness if changing
    if (fields.nit && fields.nit !== existing.nit) {
      const { data: duplicate } = await client
        .from('suppliers')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('nit', fields.nit)
        .is('deleted_at', null)
        .neq('id', id)
        .maybeSingle();

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe otro proveedor con este NIT en la organización' },
          { status: 409 },
        );
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (fields.name !== undefined) updateData.name = fields.name;
    if (fields.nit !== undefined) updateData.nit = fields.nit;
    if (fields.contact_name !== undefined) updateData.contact_name = fields.contact_name;
    if (fields.email !== undefined) updateData.email = fields.email || null;
    if (fields.phone !== undefined) updateData.phone = fields.phone;
    if (fields.address !== undefined) updateData.address = fields.address;
    if (fields.city !== undefined) updateData.city = fields.city;
    if (fields.country !== undefined) updateData.country = fields.country;
    if (fields.payment_terms !== undefined) updateData.payment_terms = fields.payment_terms;
    if (fields.lead_time_days !== undefined) updateData.lead_time_days = fields.lead_time_days;
    if (fields.notes !== undefined) updateData.notes = fields.notes;
    if (fields.is_active !== undefined) updateData.is_active = fields.is_active;

    const { data, error } = await client
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      return NextResponse.json({ error: 'Error al actualizar el proveedor' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'PUT /api/suppliers');
  }
}

/**
 * DELETE /api/suppliers
 * Soft delete a supplier (sets deleted_at + is_active=false)
 * Permission: purchase_orders:delete
 */
export async function DELETE(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'purchase_orders:delete');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar proveedores' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID del proveedor es requerido' }, { status: 400 });
    }

    const { data, error } = await client
      .from('suppliers')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .select('id')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Proveedor no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/suppliers');
  }
}
