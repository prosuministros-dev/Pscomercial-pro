import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/customers
 * Lista paginada de clientes con filtros opcionales
 * Permission required: customers:read
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('customers:read')
    
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

    // Aplicar filtros opcionales
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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    // TODO: Implementar checkPermission('customers:create')

    const body = await request.json();
    const {
      business_name,
      nit,
      address,
      city,
      phone,
      email,
      payment_terms,
      notes,
    } = body;

    // Validaciones básicas
    if (!business_name || !nit) {
      return NextResponse.json(
        { error: 'business_name y nit son campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar NIT único en la organización
    const { data: existing, error: checkError } = await client
      .from('customers')
      .select('id')
      .eq('organization_id', user.organization_id)
      .eq('nit', nit)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Error checking NIT uniqueness:', checkError);
      return NextResponse.json(
        { error: checkError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este NIT en la organización' },
        { status: 409 }
      );
    }

    // Crear el cliente
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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customers
 * Actualizar cliente existente
 * Permission required: customers:update (o customers:update_payment_terms para Financiera)
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('customers:update')
    // TODO: Para rol Financiera, solo permitir actualizar payment_terms

    const body = await request.json();
    const {
      id,
      business_name,
      nit,
      address,
      city,
      phone,
      email,
      payment_terms,
      notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido para actualizar' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece a la organización
    const { data: existing, error: checkError } = await client
      .from('customers')
      .select('id, nit')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
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
        return NextResponse.json(
          { error: nitCheckError.message },
          { status: 500 }
        );
      }

      if (nitExists) {
        return NextResponse.json(
          { error: 'Ya existe otro cliente con este NIT en la organización' },
          { status: 409 }
        );
      }
    }

    // Actualizar el cliente
    const updateData: any = { updated_at: new Date().toISOString() };
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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in PUT /api/customers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
