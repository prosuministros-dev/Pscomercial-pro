import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/leads/[id]/contacts
 * List contacts for a lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
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
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const { id } = await params;
    const body = await request.json();

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

    const { contact_name, position, phone, email, is_primary } = body;

    if (!contact_name) {
      return NextResponse.json(
        { error: 'contact_name es requerido' },
        { status: 400 }
      );
    }

    // If setting as primary, unset other primaries
    if (is_primary) {
      await client
        .from('lead_contacts')
        .update({ is_primary: false })
        .eq('lead_id', id);
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
        is_primary: is_primary || false,
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
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const { id } = await params;
    const body = await request.json();

    if (!body.contact_id) {
      return NextResponse.json({ error: 'contact_id es requerido' }, { status: 400 });
    }

    // If setting as primary, unset other primaries
    if (body.is_primary) {
      await client
        .from('lead_contacts')
        .update({ is_primary: false })
        .eq('lead_id', id);
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.contact_name !== undefined) updateData.contact_name = body.contact_name;
    if (body.position !== undefined) updateData.position = body.position;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.is_primary !== undefined) updateData.is_primary = body.is_primary;

    const { data, error } = await client
      .from('lead_contacts')
      .update(updateData)
      .eq('id', body.contact_id)
      .eq('lead_id', id)
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
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const { id } = await params;

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contact_id');

    if (!contactId) {
      return NextResponse.json({ error: 'contact_id es requerido' }, { status: 400 });
    }

    const { error } = await client
      .from('lead_contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', contactId)
      .eq('lead_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/leads/[id]/contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
