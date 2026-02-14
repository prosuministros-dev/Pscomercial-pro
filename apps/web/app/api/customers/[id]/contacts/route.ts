import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

// --- Zod Schemas ---
const createContactSchema = z.object({
  full_name: z.string().min(1, 'full_name es requerido'),
  email: z.string().email('Email inválido').nullish(),
  phone: z.string().nullish(),
  position: z.string().nullish(),
  is_primary: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
});

const updateContactSchema = z.object({
  id: z.string().uuid('id del contacto es requerido'),
  full_name: z.string().min(1).optional(),
  email: z.string().email('Email inválido').nullish(),
  phone: z.string().nullish(),
  position: z.string().nullish(),
  is_primary: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

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

    const allowed = await checkPermission(user.id, 'customers:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver contactos' }, { status: 403 });
    }

    const customerId = params.id;

    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { data, error } = await client
      .from('customer_contacts')
      .select('*')
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer contacts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /api/customers/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/customers/[id]/contacts
 * Crear nuevo contacto para un cliente
 * Permission required: customers:manage_contacts
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'customers:manage_contacts');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar contactos' }, { status: 403 });
    }

    const customerId = params.id;
    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { full_name, email, phone, position, is_primary, is_active } = parsed.data;

    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    if (is_primary) {
      await client
        .from('customer_contacts')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('organization_id', user.organization_id);
    }

    const { data, error } = await client
      .from('customer_contacts')
      .insert({
        organization_id: user.organization_id,
        customer_id: customerId,
        full_name,
        email,
        phone,
        position,
        is_primary,
        is_active,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer contact:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/customers/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/customers/[id]/contacts
 * Actualizar contacto existente
 * Permission required: customers:manage_contacts
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'customers:manage_contacts');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar contactos' }, { status: 403 });
    }

    const customerId = params.id;
    const body = await request.json();
    const parsed = updateContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { id, full_name, email, phone, position, is_primary, is_active } = parsed.data;

    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { data: existingContact, error: contactCheckError } = await client
      .from('customer_contacts')
      .select('id')
      .eq('id', id)
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (contactCheckError || !existingContact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    if (is_primary) {
      await client
        .from('customer_contacts')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('organization_id', user.organization_id)
        .neq('id', id);
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in PUT /api/customers/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/customers/[id]/contacts
 * Eliminar contacto
 * Permission required: customers:manage_contacts
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'customers:manage_contacts');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar contactos' }, { status: 403 });
    }

    const customerId = params.id;
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');

    if (!contactId) {
      return NextResponse.json({ error: 'contactId es requerido en query params' }, { status: 400 });
    }

    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { data: existingContact, error: contactCheckError } = await client
      .from('customer_contacts')
      .select('id')
      .eq('id', contactId)
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (contactCheckError || !existingContact) {
      return NextResponse.json({ error: 'Contacto no encontrado' }, { status: 404 });
    }

    const { error } = await client
      .from('customer_contacts')
      .delete()
      .eq('id', contactId)
      .eq('customer_id', customerId)
      .eq('organization_id', user.organization_id);

    if (error) {
      console.error('Error deleting customer contact:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/customers/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
