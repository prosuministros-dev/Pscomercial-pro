import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/customers/[id]/contacts
 * Lista todos los contactos de un cliente
 * Permission required: customers:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('customers:read')

    const customerId = params.id;

    // Verificar que el cliente pertenece a la organización
    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Obtener contactos del cliente
    const { data, error } = await client
      .from('customer_contacts')
      .select('*')
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer contacts:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /api/customers/[id]/contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers/[id]/contacts
 * Crear nuevo contacto para un cliente
 * Permission required: customers:create
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('customers:create')

    const customerId = params.id;
    const body = await request.json();
    const { full_name, email, phone, position, is_primary, is_active } = body;

    // Validaciones básicas
    if (!full_name) {
      return NextResponse.json(
        { error: 'full_name es un campo requerido' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece a la organización
    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Si is_primary es true, desmarcar otros contactos primarios
    if (is_primary) {
      await client
        .from('customer_contacts')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('organization_id', user.organization_id);
    }

    // Crear el contacto
    const { data, error } = await client
      .from('customer_contacts')
      .insert({
        organization_id: user.organization_id,
        customer_id: customerId,
        full_name,
        email,
        phone,
        position,
        is_primary: is_primary || false,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer contact:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/customers/[id]/contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customers/[id]/contacts
 * Actualizar contacto existente
 * Permission required: customers:update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('customers:update')

    const customerId = params.id;
    const body = await request.json();
    const { id, full_name, email, phone, position, is_primary, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id del contacto es requerido para actualizar' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece a la organización
    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el contacto existe y pertenece al cliente
    const { data: existingContact, error: contactCheckError } = await client
      .from('customer_contacts')
      .select('id')
      .eq('id', id)
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (contactCheckError || !existingContact) {
      return NextResponse.json(
        { error: 'Contacto no encontrado' },
        { status: 404 }
      );
    }

    // Si is_primary es true, desmarcar otros contactos primarios
    if (is_primary) {
      await client
        .from('customer_contacts')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('organization_id', user.organization_id)
        .neq('id', id);
    }

    // Actualizar el contacto
    const updateData: any = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (position !== undefined) updateData.position = position;
    if (is_primary !== undefined) updateData.is_primary = is_primary;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await client
      .from('customer_contacts')
      .update(updateData)
      .eq('id', id)
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer contact:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in PUT /api/customers/[id]/contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]/contacts
 * Eliminar contacto
 * Permission required: customers:update
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('customers:update')

    const customerId = params.id;
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId es requerido en query params' },
        { status: 400 }
      );
    }

    // Verificar que el cliente pertenece a la organización
    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar que el contacto existe y pertenece al cliente
    const { data: existingContact, error: contactCheckError } = await client
      .from('customer_contacts')
      .select('id')
      .eq('id', contactId)
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (contactCheckError || !existingContact) {
      return NextResponse.json(
        { error: 'Contacto no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar el contacto
    const { error } = await client
      .from('customer_contacts')
      .delete()
      .eq('id', contactId)
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id);

    if (error) {
      console.error('Error deleting customer contact:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/customers/[id]/contacts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
