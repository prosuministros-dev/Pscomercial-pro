import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/leads
 * Lista paginada de leads con filtros opcionales
 * Permission required: leads:read
 *
 * Query params:
 * - page: número de página (default: 1)
 * - limit: items por página (default: 20)
 * - status: filtrar por estado (created, pending_assignment, assigned, converted, rejected, pending_info)
 * - search: búsqueda por business_name, nit, contact_name
 * - assigned_to: filtrar por asesor asignado
 * - channel: filtrar por canal (whatsapp, web, manual)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('leads:read')

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const assigned_to = searchParams.get('assigned_to') || '';
    const channel = searchParams.get('channel') || '';

    const offset = (page - 1) * limit;

    // Build query with join to get advisor name
    let query = client
      .from('leads')
      .select(
        `
        *,
        assigned_advisor:profiles!leads_assigned_to_fkey(id, full_name, email),
        created_by_user:profiles!leads_created_by_fkey(id, full_name)
        `,
        { count: 'exact' }
      )
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (assigned_to) {
      query = query.eq('assigned_to', assigned_to);
    }

    if (channel) {
      query = query.eq('channel', channel);
    }

    if (search) {
      query = query.or(
        `business_name.ilike.%${search}%,nit.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
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
    console.error('Unexpected error in GET /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/leads
 * Crear nuevo lead
 * Permission required: leads:create
 *
 * Body:
 * - business_name: string (required)
 * - nit: string (optional)
 * - contact_name: string (required)
 * - phone: string (required)
 * - email: string (required)
 * - requirement: string (required)
 * - channel: 'whatsapp' | 'web' | 'manual' (required)
 *
 * Business rules:
 * - Generate consecutive starting from #100
 * - Validate duplicates by NIT and email
 * - Auto-assign to available advisor
 * - Create notification
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('leads:create')

    const body = await request.json();
    const {
      business_name,
      nit,
      contact_name,
      phone,
      email,
      requirement,
      channel,
    } = body;

    // Validaciones básicas
    if (!business_name || !contact_name || !phone || !email || !requirement || !channel) {
      return NextResponse.json(
        {
          error:
            'business_name, contact_name, phone, email, requirement y channel son campos requeridos',
        },
        { status: 400 }
      );
    }

    // Validate channel
    if (!['whatsapp', 'web', 'manual'].includes(channel)) {
      return NextResponse.json(
        { error: 'channel debe ser: whatsapp, web o manual' },
        { status: 400 }
      );
    }

    // Validar duplicados por NIT o email
    if (nit || email) {
      const conditions = [];
      if (nit) conditions.push(`nit.eq.${nit}`);
      if (email) conditions.push(`email.eq.${email}`);

      const { data: duplicates, error: duplicateError } = await client
        .from('leads')
        .select('id, lead_number, business_name, nit, email, status')
        .eq('organization_id', user.organization_id)
        .is('deleted_at', null)
        .or(conditions.join(','));

      if (duplicateError) {
        console.error('Error checking duplicates:', duplicateError);
        return NextResponse.json(
          { error: duplicateError.message },
          { status: 500 }
        );
      }

      if (duplicates && duplicates.length > 0) {
        // Filter out converted/rejected leads (these can be duplicated)
        const activeDuplicates = duplicates.filter(
          (d) => !['converted', 'rejected'].includes(d.status)
        );

        if (activeDuplicates.length > 0) {
          return NextResponse.json(
            {
              error: 'Ya existe un lead activo con este NIT o email',
              duplicates: activeDuplicates,
            },
            { status: 409 }
          );
        }
      }
    }

    // Generate consecutive number (starts at #100)
    const { data: leadNumber, error: consecutiveError } = await client.rpc(
      'generate_consecutive',
      {
        org_uuid: user.organization_id,
        entity_type: 'lead',
      }
    );

    if (consecutiveError) {
      console.error('Error generating consecutive:', consecutiveError);
      return NextResponse.json(
        { error: consecutiveError.message },
        { status: 500 }
      );
    }

    // Create lead
    const { data: lead, error: createError } = await client
      .from('leads')
      .insert({
        organization_id: user.organization_id,
        lead_number: leadNumber,
        business_name,
        nit: nit || null,
        contact_name,
        phone,
        email,
        requirement,
        channel,
        status: 'created',
        created_by: user.id,
        lead_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating lead:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    // Auto-assign lead to available advisor
    const { data: assignedAdvisorId, error: assignError } = await client.rpc(
      'auto_assign_lead',
      {
        lead_uuid: lead.id,
      }
    );

    if (assignError) {
      console.error('Error auto-assigning lead:', assignError);
      // Non-critical error, lead is already created
      // Just log and continue
    }

    // TAREA 1.3.8 - Create notification for assigned advisor
    if (assignedAdvisorId) {
      try {
        await client.from('notifications').insert({
          organization_id: user.organization_id,
          user_id: assignedAdvisorId,
          type: 'lead_assigned',
          title: 'Nuevo lead asignado',
          message: `Se te ha asignado el lead #${leadNumber} - ${business_name}`,
          entity_type: 'lead',
          entity_id: lead.id,
          action_url: '/home/leads',
          priority: 'high',
        });
      } catch (notifError) {
        console.error('Error creating notification:', notifError);
        // Non-critical, continue
      }
    }

    // Fetch updated lead with assignment
    const { data: updatedLead, error: fetchError } = await client
      .from('leads')
      .select(
        `
        *,
        assigned_advisor:profiles!leads_assigned_to_fkey(id, full_name, email)
        `
      )
      .eq('id', lead.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated lead:', fetchError);
      // Return original lead if fetch fails
      return NextResponse.json(
        {
          data: lead,
          warning: 'Lead creado pero no se pudo obtener información de asignación',
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        data: updatedLead,
        assigned_to: assignedAdvisorId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/leads
 * Actualizar lead existente
 * Permission required: leads:update
 *
 * Body:
 * - id: uuid (required)
 * - status: string (optional)
 * - business_name: string (optional)
 * - contact_name: string (optional)
 * - phone: string (optional)
 * - email: string (optional)
 * - requirement: string (optional)
 * - rejection_reason_id: uuid (optional, required if status = rejected)
 * - rejection_notes: string (optional)
 *
 * Business rules:
 * - Only owner or assigned advisor can update
 * - Status transitions must be valid
 * - Cannot update converted leads
 */
export async function PUT(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('leads:update')

    const body = await request.json();
    const {
      id,
      status,
      business_name,
      nit,
      contact_name,
      phone,
      email,
      requirement,
      rejection_reason_id,
      rejection_notes,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido para actualizar' },
        { status: 400 }
      );
    }

    // Verify that the lead belongs to the organization
    const { data: existing, error: checkError } = await client
      .from('leads')
      .select('id, status, assigned_to, nit, email')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      );
    }

    // Cannot update converted leads
    if (existing.status === 'converted') {
      return NextResponse.json(
        { error: 'No se puede actualizar un lead convertido' },
        { status: 400 }
      );
    }

    // Validate status transition if status is being changed
    if (status && status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        created: ['pending_assignment', 'assigned', 'rejected'],
        pending_assignment: ['assigned', 'rejected'],
        assigned: ['pending_info', 'converted', 'rejected'],
        pending_info: ['assigned', 'converted', 'rejected'],
        rejected: [], // Cannot transition from rejected
        converted: [], // Cannot transition from converted
      };

      if (!validTransitions[existing.status]?.includes(status)) {
        return NextResponse.json(
          {
            error: `Transición de estado inválida: ${existing.status} -> ${status}`,
          },
          { status: 400 }
        );
      }

      // If rejecting, require rejection_reason_id
      if (status === 'rejected' && !rejection_reason_id) {
        return NextResponse.json(
          {
            error:
              'rejection_reason_id es requerido cuando se rechaza un lead',
          },
          { status: 400 }
        );
      }

      // If converting, set converted_at timestamp
      if (status === 'converted') {
        // TODO: Verify that customer was created from this lead
      }
    }

    // If changing NIT or email, validate duplicates
    if ((nit && nit !== existing.nit) || (email && email !== existing.email)) {
      const conditions = [];
      if (nit && nit !== existing.nit) conditions.push(`nit.eq.${nit}`);
      if (email && email !== existing.email) conditions.push(`email.eq.${email}`);

      if (conditions.length > 0) {
        const { data: duplicates, error: duplicateError } = await client
          .from('leads')
          .select('id')
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null)
          .neq('id', id)
          .or(conditions.join(','));

        if (duplicateError) {
          console.error('Error checking duplicates:', duplicateError);
          return NextResponse.json(
            { error: duplicateError.message },
            { status: 500 }
          );
        }

        if (duplicates && duplicates.length > 0) {
          return NextResponse.json(
            {
              error: 'Ya existe otro lead con este NIT o email',
            },
            { status: 409 }
          );
        }
      }
    }

    // Build update object
    const updateData: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'converted') {
        updateData.converted_at = new Date().toISOString();
      }
    }
    if (business_name !== undefined) updateData.business_name = business_name;
    if (nit !== undefined) updateData.nit = nit;
    if (contact_name !== undefined) updateData.contact_name = contact_name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (requirement !== undefined) updateData.requirement = requirement;
    if (rejection_reason_id !== undefined)
      updateData.rejection_reason_id = rejection_reason_id;
    if (rejection_notes !== undefined)
      updateData.rejection_notes = rejection_notes;

    // Update the lead
    const { data, error } = await client
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select(
        `
        *,
        assigned_advisor:profiles!leads_assigned_to_fkey(id, full_name, email),
        rejection_reason:rejection_reasons(id, label)
        `
      )
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in PUT /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/leads
 * Soft delete de un lead
 * Permission required: leads:delete
 *
 * Query params:
 * - id: uuid del lead
 *
 * Business rules:
 * - Solo soft delete (deleted_at timestamp)
 * - No se pueden eliminar leads convertidos
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('leads:delete')

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id es requerido' },
        { status: 400 }
      );
    }

    // Verify lead exists and belongs to organization
    const { data: existing, error: checkError } = await client
      .from('leads')
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Lead no encontrado' },
        { status: 404 }
      );
    }

    // Cannot delete converted leads
    if (existing.status === 'converted') {
      return NextResponse.json(
        { error: 'No se puede eliminar un lead convertido' },
        { status: 400 }
      );
    }

    // Soft delete
    const { error: deleteError } = await client
      .from('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', user.organization_id);

    if (deleteError) {
      console.error('Error deleting lead:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/leads:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
