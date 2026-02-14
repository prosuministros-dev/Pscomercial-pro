import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

// --- Zod Schemas ---
const createCustomerSchema = z.object({
  business_name: z.string().min(1, 'business_name es requerido'),
  nit: z.string().min(1, 'nit es requerido'),
  address: z.string().nullish(),
  city: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().email('Email inválido').nullish(),
  payment_terms: z.string().nullish(),
  notes: z.string().nullish(),
});

const updateCustomerSchema = z.object({
  id: z.string().uuid('id debe ser un UUID válido'),
  business_name: z.string().min(1).optional(),
  nit: z.string().min(1).optional(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().email('Email inválido').nullish(),
  payment_terms: z.string().nullish(),
  notes: z.string().nullish(),
});

/**
 * GET /api/customers
 * Lista paginada de clientes con filtros opcionales
 * Permission required: customers:read
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'customers:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver clientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const business_name = searchParams.get('business_name');
    const nit = searchParams.get('nit');
    const city = searchParams.get('city');

    const offset = (page - 1) * limit;

    let query = client
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (business_name) {
      query = query.ilike('business_name', `%${business_name}%`);
    }
    if (nit) {
      query = query.ilike('nit', `%${nit}%`);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/customers
 * Crear nuevo cliente
 * Permission required: customers:create
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'customers:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear clientes' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { business_name, nit, address, city, phone, email, payment_terms, notes } = parsed.data;

    // Verificar NIT único en la organización
    const { data: existing, error: checkError } = await client
      .from('customers')
      .select('id')
      .eq('organization_id', user.organization_id)
      .eq('nit', nit)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking NIT uniqueness:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este NIT en la organización' },
        { status: 409 },
      );
    }

    const { data, error } = await client
      .from('customers')
      .insert({
        organization_id: user.organization_id,
        business_name,
        nit,
        address,
        city,
        phone,
        email,
        payment_terms,
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/customers
 * Actualizar cliente existente
 * Permission required: customers:update
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'customers:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar clientes' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { id, business_name, nit, address, city, phone, email, payment_terms, notes } = parsed.data;

    // Verificar que el cliente pertenece a la organización
    const { data: existing, error: checkError } = await client
      .from('customers')
      .select('id, nit')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    // Si se está cambiando el NIT, verificar que sea único
    if (nit && nit !== existing.nit) {
      const { data: nitExists, error: nitCheckError } = await client
        .from('customers')
        .select('id')
        .eq('organization_id', user.organization_id)
        .eq('nit', nit)
        .single();

      if (nitCheckError && nitCheckError.code !== 'PGRST116') {
        console.error('Error checking NIT uniqueness:', nitCheckError);
        return NextResponse.json({ error: nitCheckError.message }, { status: 500 });
      }

      if (nitExists) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con este NIT en la organización' },
          { status: 409 },
        );
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (business_name !== undefined) updateData.business_name = business_name;
    if (nit !== undefined) updateData.nit = nit;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (payment_terms !== undefined) updateData.payment_terms = payment_terms;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await client
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in PUT /api/customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
