import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

// --- Zod Schemas ---
const createLeadContactSchema = z.object({
  contact_name: z.string().min(1, 'contact_name es requerido'),
  position: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().email('Email inválido').nullish(),
  is_primary: z.boolean().optional().default(false),
});

const updateLeadContactSchema = z.object({
  contact_id: z.string().uuid('contact_id es requerido'),
  contact_name: z.string().min(1).optional(),
  position: z.string().nullish(),
  phone: z.string().nullish(),
  email: z.string().email('Email inválido').nullish(),
  is_primary: z.boolean().optional(),
});

/**
 * GET /api/leads/[id]/contacts
 * List contacts for a lead
 * Permission required: leads:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'leads:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver contactos de leads' }, { status: 403 });
    }

    const { id } = await params;

    // Verify lead belongs to organization
    const { data: lead, error: leadError } = await client
      .from('leads')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    const { data, error } = await client
      .from('lead_contacts')
      .select('*')
      .eq('lead_id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error) {
    console.error('Error in GET /api/leads/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/leads/[id]/contacts
 * Add a contact to a lead
 * Permission required: leads:update
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'leads:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar contactos de leads' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = createLeadContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify lead belongs to organization
    const { data: lead, error: leadError } = await client
      .from('leads')
      .select('id, organization_id')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    const { contact_name, position, phone, email, is_primary } = parsed.data;

    // If setting as primary, unset other primaries
    if (is_primary) {
      await client
        .from('lead_contacts')
        .update({ is_primary: false })
        .eq('lead_id', id)
        .eq('organization_id', user.organization_id);
    }

    const { data, error } = await client
      .from('lead_contacts')
      .insert({
        lead_id: id,
        organization_id: lead.organization_id,
        contact_name,
        position: position || null,
        phone: phone || null,
        email: email || null,
        is_primary,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/leads/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/leads/[id]/contacts
 * Update a lead contact
 * Permission required: leads:update
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'leads:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar contactos de leads' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateLeadContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify lead belongs to organization
    const { data: lead, error: leadError } = await client
      .from('leads')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    const { contact_id, contact_name, position, phone, email, is_primary } = parsed.data;

    // If setting as primary, unset other primaries
    if (is_primary) {
      await client
        .from('lead_contacts')
        .update({ is_primary: false })
        .eq('lead_id', id)
        .eq('organization_id', user.organization_id);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (contact_name !== undefined) updateData.contact_name = contact_name;
    if (position !== undefined) updateData.position = position;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (is_primary !== undefined) updateData.is_primary = is_primary;

    const { data, error } = await client
      .from('lead_contacts')
      .update(updateData)
      .eq('id', contact_id)
      .eq('lead_id', id)
      .eq('organization_id', user.organization_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PUT /api/leads/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/leads/[id]/contacts
 * Soft delete a lead contact
 * Permission required: leads:update
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'leads:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para gestionar contactos de leads' }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id');

    if (!contactId) {
      return NextResponse.json({ error: 'contact_id es requerido' }, { status: 400 });
    }

    // Verify lead belongs to organization
    const { data: lead, error: leadError } = await client
      .from('leads')
      .select('id')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    const { error } = await client
      .from('lead_contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('lead_id', id)
      .eq('organization_id', user.organization_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/leads/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
