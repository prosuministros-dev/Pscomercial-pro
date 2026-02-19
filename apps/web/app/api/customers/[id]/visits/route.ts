import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

const createVisitSchema = z.object({
  visit_date: z.string().datetime({ message: 'Fecha de visita inválida' }),
  visit_type: z.enum(['presencial', 'virtual', 'telefonica'], {
    errorMap: () => ({ message: 'Tipo de visita inválido' }),
  }),
  status: z.enum(['programada', 'realizada', 'cancelada']).optional().default('realizada'),
  observations: z.string().max(2000).nullish(),
});

/**
 * GET /api/customers/[id]/visits
 * Lists visits for a specific customer
 * Permission required: visits:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'visits:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver visitas' }, { status: 403 });
    }

    const customerId = params.id;

    // Verify customer belongs to org
    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = client
      .from('customer_visits')
      .select('*, advisor:profiles!customer_visits_advisor_id_fkey(id, full_name)', { count: 'exact' })
      .eq('organization_id', user.organization_id)
      .eq('customer_id', customerId)
      .order('visit_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // If user doesn't have read_all permission, only show their own visits
    const canReadAll = await checkPermission(user.id, 'visits:read_all');
    if (!canReadAll) {
      query = query.eq('advisor_id', user.id);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching customer visits:', error);
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
    return handleApiError(error, 'GET /api/customers/[id]/visits');
  }
}

/**
 * POST /api/customers/[id]/visits
 * Register a new visit for a customer
 * Permission required: visits:create
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'visits:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para registrar visitas' }, { status: 403 });
    }

    const customerId = params.id;

    // Verify customer belongs to org
    const { data: customer, error: customerError } = await client
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('organization_id', user.organization_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createVisitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { visit_date, visit_type, status, observations } = parsed.data;

    const { data, error } = await client
      .from('customer_visits')
      .insert({
        organization_id: user.organization_id,
        customer_id: customerId,
        advisor_id: user.id,
        visit_date,
        visit_type,
        status,
        observations,
        created_by: user.id,
      })
      .select('*, advisor:profiles!customer_visits_advisor_id_fkey(id, full_name)')
      .single();

    if (error) {
      console.error('Error creating visit:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update last_interaction_at on the customer
    await client
      .from('customers')
      .update({ last_interaction_at: visit_date })
      .eq('id', customerId)
      .eq('organization_id', user.organization_id);

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/customers/[id]/visits');
  }
}
