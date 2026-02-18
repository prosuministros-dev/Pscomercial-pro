import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';
import { withRateLimit } from '~/lib/with-rate-limit';

// --- Zod Schemas ---
const createLeadSchema = z.object({
  business_name: z.string().min(1, 'business_name es requerido'),
  nit: z.string().nullish(),
  contact_name: z.string().min(1, 'contact_name es requerido'),
  phone: z.string().min(1, 'phone es requerido'),
  email: z.string().email('Email inválido'),
  requirement: z.string().min(1, 'requirement es requerido'),
  channel: z.enum(['whatsapp', 'web', 'manual'], { message: 'channel debe ser: whatsapp, web o manual' }),
});

const updateLeadSchema = z.object({
  id: z.string().uuid('id debe ser un UUID válido'),
  status: z.string().optional(),
  business_name: z.string().min(1).optional(),
  nit: z.string().nullish(),
  contact_name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  requirement: z.string().optional(),
  rejection_reason_id: z.string().uuid().nullish(),
  rejection_notes: z.string().nullish(),
});

/**
 * GET /api/leads
 * Lista paginada de leads con filtros opcionales
 * Permission required: leads:read
 */
export async function GET(request: NextRequest) {
  const limited = withRateLimit(request, { prefix: 'leads' });
  if (limited) return limited;

  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'leads:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver leads' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const assigned_to = searchParams.get('assigned_to') || '';
    const channel = searchParams.get('channel') || '';

    const offset = (page - 1) * limit;

    let query = client
      .from('leads')
      .select(
        `
        *,
        assigned_user:profiles!leads_assigned_to_fkey(id, full_name, email)
        `,
        { count: 'exact' }
      )
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
    return handleApiError(error, 'GET /api/leads');
  }
}

/**
 * POST /api/leads
 * Crear nuevo lead
 * Permission required: leads:create
 */
export async function POST(request: NextRequest) {
  const limited = withRateLimit(request, { prefix: 'leads' });
  if (limited) return limited;

  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'leads:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear leads' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { business_name, nit, contact_name, phone, email, requirement, channel } = parsed.data;

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
        return NextResponse.json({ error: duplicateError.message }, { status: 500 });
      }

      if (duplicates && duplicates.length > 0) {
        const activeDuplicates = duplicates.filter(
          (d) => !['converted', 'rejected'].includes(d.status)
        );
        if (activeDuplicates.length > 0) {
          return NextResponse.json(
            { error: 'Ya existe un lead activo con este NIT o email', duplicates: activeDuplicates },
            { status: 409 },
          );
        }
      }
    }

    // Generate consecutive number
    const { data: leadNumber, error: consecutiveError } = await client.rpc(
      'generate_consecutive',
      { org_uuid: user.organization_id, entity_type: 'lead' }
    );

    if (consecutiveError) {
      console.error('Error generating consecutive:', consecutiveError);
      return NextResponse.json({ error: consecutiveError.message }, { status: 500 });
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
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Auto-assign lead
    const { data: assignedAdvisorId, error: assignError } = await client.rpc(
      'auto_assign_lead',
      { lead_uuid: lead.id }
    );

    if (assignError) {
      console.error('Error auto-assigning lead:', assignError);
    }

    // Create notification for assigned advisor
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
      }
    }

    // Fetch updated lead with assignment
    const { data: updatedLead, error: fetchError } = await client
      .from('leads')
      .select(`
        *,
        assigned_user:profiles!leads_assigned_to_fkey(id, full_name, email)
      `)
      .eq('id', lead.id)
      .single();

    if (fetchError) {
      console.error('Error fetching updated lead:', fetchError);
      return NextResponse.json(
        { data: lead, warning: 'Lead creado pero no se pudo obtener información de asignación' },
        { status: 201 },
      );
    }

    return NextResponse.json(
      { data: updatedLead, assigned_to: assignedAdvisorId },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, 'POST /api/leads');
  }
}

/**
 * PUT /api/leads
 * Actualizar lead existente
 * Permission required: leads:update
 */
export async function PUT(request: NextRequest) {
  const limited = withRateLimit(request, { prefix: 'leads' });
  if (limited) return limited;

  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'leads:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar leads' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const {
      id, status, business_name, nit, contact_name,
      phone, email, requirement, rejection_reason_id, rejection_notes,
    } = parsed.data;

    // Verify lead belongs to organization
    const { data: existing, error: checkError } = await client
      .from('leads')
      .select('id, status, assigned_to, nit, email')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    if (existing.status === 'converted') {
      return NextResponse.json({ error: 'No se puede actualizar un lead convertido' }, { status: 400 });
    }

    // Validate status transition
    if (status && status !== existing.status) {
      const validTransitions: Record<string, string[]> = {
        created: ['pending_assignment', 'assigned', 'rejected'],
        pending_assignment: ['assigned', 'rejected'],
        assigned: ['pending_info', 'converted', 'rejected'],
        pending_info: ['assigned', 'converted', 'rejected'],
        rejected: [],
        converted: [],
      };

      if (!validTransitions[existing.status]?.includes(status)) {
        return NextResponse.json(
          { error: `Transición de estado inválida: ${existing.status} -> ${status}` },
          { status: 400 },
        );
      }

      if (status === 'rejected' && !rejection_reason_id) {
        return NextResponse.json(
          { error: 'rejection_reason_id es requerido cuando se rechaza un lead' },
          { status: 400 },
        );
      }
    }

    // Validate duplicates if changing NIT or email
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
          return NextResponse.json({ error: duplicateError.message }, { status: 500 });
        }

        if (duplicates && duplicates.length > 0) {
          return NextResponse.json({ error: 'Ya existe otro lead con este NIT o email' }, { status: 409 });
        }
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
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
    if (rejection_reason_id !== undefined) updateData.rejection_reason_id = rejection_reason_id;
    if (rejection_notes !== undefined) updateData.rejection_notes = rejection_notes;

    const { data, error } = await client
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        assigned_user:profiles!leads_assigned_to_fkey(id, full_name, email),
        rejection_reason:rejection_reasons(id, label)
      `)
      .single();

    if (error) {
      console.error('Error updating lead:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleApiError(error, 'PUT /api/leads');
  }
}

/**
 * DELETE /api/leads
 * Soft delete de un lead
 * Permission required: leads:delete
 */
export async function DELETE(request: NextRequest) {
  const limited = withRateLimit(request, { prefix: 'leads' });
  if (limited) return limited;

  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'leads:delete');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar leads' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const { data: existing, error: checkError } = await client
      .from('leads')
      .select('id, status')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: 'Lead no encontrado' }, { status: 404 });
    }

    if (existing.status === 'converted') {
      return NextResponse.json({ error: 'No se puede eliminar un lead convertido' }, { status: 400 });
    }

    const { error: deleteError } = await client
      .from('leads')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', user.organization_id);

    if (deleteError) {
      console.error('Error deleting lead:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/leads');
  }
}
