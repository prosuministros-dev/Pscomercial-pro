import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

// Valid state transitions for quote pipeline
// Pipeline: draft → offer_created → negotiation → risk → pending_oc
// Terminal exits: any pipeline state → converted, rejected, lost
// Auto: any → expired (via cron)
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['offer_created', 'rejected', 'lost'],
  offer_created: ['negotiation', 'risk', 'pending_oc', 'rejected', 'lost'],
  negotiation: ['offer_created', 'risk', 'pending_oc', 'rejected', 'lost'],
  risk: ['offer_created', 'negotiation', 'pending_oc', 'rejected', 'lost'],
  pending_oc: ['offer_created', 'negotiation', 'risk', 'converted', 'rejected', 'lost'],
};

// --- Zod Schemas ---
const createQuoteSchema = z.object({
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().nullish(),
  advisor_id: z.string().uuid().optional(),
  quote_date: z.string().optional(),
  validity_days: z.number().int().min(1).optional().default(5),
  status: z.string().optional().default('draft'),
  currency: z.string().optional().default('COP'),
  payment_terms: z.string().optional().default('ANTICIPADO'),
  trm_applied: z.number().nullish(),
  transport_cost: z.number().optional().default(0),
  transport_included: z.boolean().optional().default(false),
  notes: z.string().nullish(),
});

const updateQuoteSchema = z.object({
  id: z.string().uuid('ID de cotización es requerido'),
  customer_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().nullish(),
  advisor_id: z.string().uuid().optional(),
  quote_date: z.string().optional(),
  validity_days: z.number().int().min(1).optional(),
  status: z.string().optional(),
  currency: z.string().optional(),
  trm_applied: z.number().nullish(),
  payment_terms: z.string().optional(),
  transport_cost: z.number().optional(),
  transport_included: z.boolean().optional(),
  margin_approved: z.boolean().optional(),
  credit_validated: z.boolean().optional(),
  credit_blocked: z.boolean().optional(),
  credit_block_reason: z.string().nullish(),
  estimated_close_month: z.string().nullish(),
  estimated_close_week: z.string().nullish(),
  estimated_billing_date: z.string().nullish(),
  rejection_reason: z.string().nullish(),
  sent_to_client: z.boolean().optional(),
  sent_via: z.string().nullish(),
  loss_reason: z.string().nullish(),
  notes: z.string().nullish(),
});

/**
 * GET /api/quotes
 * List quotes with pagination and filters
 * Permission required: quotes:read
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver cotizaciones' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');
    const advisorId = searchParams.get('advisor_id');
    const search = searchParams.get('search');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    let query = client
      .from('quotes')
      .select(
        `
        *,
        customer:customers(id, business_name, nit, city, is_blocked, block_reason),
        advisor:profiles!quotes_advisor_id_fkey(id, full_name, email),
        lead:leads(id, lead_number, business_name)
      `,
        { count: 'exact' }
      )
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('quote_number', { ascending: false });

    if (status) query = query.eq('status', status);
    if (customerId) query = query.eq('customer_id', customerId);
    if (advisorId) query = query.eq('advisor_id', advisorId);
    if (search) {
      query = query.or(
        `quote_number.eq.${search},customer.business_name.ilike.%${search}%,customer.nit.ilike.%${search}%`
      );
    }
    if (fromDate) query = query.gte('quote_date', fromDate);
    if (toDate) query = query.lte('quote_date', toDate);

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json({ error: 'Error al obtener las cotizaciones' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/quotes');
  }
}

/**
 * POST /api/quotes
 * Create a new quote (can be from a lead or standalone)
 * Permission required: quotes:create
 */
export async function POST(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear cotizaciones' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // If creating from lead, use the RPC function
    if (parsed.data.lead_id) {
      const { data: quoteId, error: rpcError } = await client.rpc(
        'create_quote_from_lead',
        { lead_uuid: parsed.data.lead_id }
      );

      if (rpcError) {
        console.error('Error creating quote from lead:', rpcError);
        return NextResponse.json({ error: 'Error al crear la cotización desde el lead' }, { status: 500 });
      }

      const { data: quote, error: fetchError } = await client
        .from('quotes')
        .select(`
          *,
          customer:customers(id, business_name, nit),
          advisor:profiles!quotes_advisor_id_fkey(id, full_name, email)
        `)
        .eq('id', quoteId)
        .single();

      if (fetchError) {
        console.error('Error fetching created quote:', fetchError);
        return NextResponse.json({ error: 'Cotización creada pero error al obtener los datos' }, { status: 500 });
      }

      return NextResponse.json(quote, { status: 201 });
    }

    // Generate quote number
    const { data: quoteNumber, error: rpcError } = await client.rpc(
      'generate_consecutive',
      { org_uuid: user.organization_id, entity_type: 'quote' }
    );

    if (rpcError) {
      console.error('Error generating quote number:', rpcError);
      return NextResponse.json({ error: 'Error al generar el número de cotización' }, { status: 500 });
    }

    const validityDays = parsed.data.validity_days;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const { data: quote, error: insertError } = await client
      .from('quotes')
      .insert({
        organization_id: user.organization_id,
        quote_number: quoteNumber,
        customer_id: parsed.data.customer_id,
        contact_id: parsed.data.contact_id,
        advisor_id: parsed.data.advisor_id || user.id,
        quote_date: parsed.data.quote_date || new Date().toISOString(),
        validity_days: validityDays,
        expires_at: expiresAt.toISOString(),
        status: parsed.data.status,
        currency: parsed.data.currency,
        payment_terms: parsed.data.payment_terms,
        trm_applied: parsed.data.trm_applied,
        transport_cost: parsed.data.transport_cost,
        transport_included: parsed.data.transport_included,
        notes: parsed.data.notes,
        created_by: user.id,
      })
      .select(`
        *,
        customer:customers(id, business_name, nit),
        advisor:profiles!quotes_advisor_id_fkey(id, full_name, email)
      `)
      .single();

    if (insertError) {
      console.error('Error creating quote:', insertError);
      return NextResponse.json({ error: 'Error al crear la cotización' }, { status: 500 });
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/quotes');
  }
}

/**
 * PUT /api/quotes
 * Update an existing quote
 * Permission required: quotes:update
 */
export async function PUT(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar cotizaciones' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { id, ...fields } = parsed.data;

    // Verify ownership
    const { data: existingQuote, error: fetchError } = await client
      .from('quotes')
      .select('id, organization_id, status, quote_date')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Validate state transition if status is being changed
    if (fields.status && fields.status !== existingQuote.status) {
      const allowedTransitions = VALID_TRANSITIONS[existingQuote.status];
      if (!allowedTransitions || !allowedTransitions.includes(fields.status)) {
        return NextResponse.json(
          { error: `Transición de estado no permitida: ${existingQuote.status} → ${fields.status}` },
          { status: 400 },
        );
      }

      // Terminal states require reason
      if (fields.status === 'rejected' && !fields.rejection_reason) {
        return NextResponse.json(
          { error: 'Motivo de rechazo es obligatorio' },
          { status: 400 },
        );
      }
      if (fields.status === 'lost' && !fields.loss_reason) {
        return NextResponse.json(
          { error: 'Motivo de pérdida es obligatorio' },
          { status: 400 },
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const allowedFields = [
      'customer_id', 'contact_id', 'advisor_id', 'quote_date', 'validity_days',
      'status', 'currency', 'trm_applied', 'payment_terms', 'transport_cost',
      'transport_included', 'margin_approved', 'credit_validated', 'credit_blocked',
      'credit_block_reason', 'estimated_close_month', 'estimated_close_week',
      'estimated_billing_date', 'rejection_reason', 'sent_to_client', 'sent_via',
      'loss_reason', 'notes',
    ];

    allowedFields.forEach((field) => {
      if ((fields as Record<string, unknown>)[field] !== undefined) {
        updateData[field] = (fields as Record<string, unknown>)[field];
      }
    });

    // Track who blocked/unblocked credit
    if (fields.credit_blocked !== undefined) {
      if (fields.credit_blocked) {
        updateData.credit_blocked_by = user.id;
        updateData.credit_blocked_at = new Date().toISOString();
      } else {
        updateData.credit_blocked_by = null;
        updateData.credit_blocked_at = null;
        updateData.credit_block_reason = null;
      }
    }

    // If validity_days changed, update expires_at
    if (fields.validity_days !== undefined) {
      const quoteDate = fields.quote_date || existingQuote.quote_date;
      const expiresAt = new Date(quoteDate);
      expiresAt.setDate(expiresAt.getDate() + fields.validity_days);
      updateData.expires_at = expiresAt.toISOString();
    }

    const { data: quote, error: updateError } = await client
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers(id, business_name, nit),
        advisor:profiles!quotes_advisor_id_fkey(id, full_name, email)
      `)
      .single();

    if (updateError) {
      console.error('Error updating quote:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la cotización' }, { status: 500 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    return handleApiError(error, 'PUT /api/quotes');
  }
}

/**
 * DELETE /api/quotes
 * Soft delete a quote
 * Permission required: quotes:delete
 */
export async function DELETE(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:delete');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para eliminar cotizaciones' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('id');

    if (!quoteId) {
      return NextResponse.json({ error: 'ID de cotización es requerido' }, { status: 400 });
    }

    const { data: existingQuote, error: fetchError } = await client
      .from('quotes')
      .select('id, organization_id')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    const { error: deleteError } = await client
      .from('quotes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', quoteId);

    if (deleteError) {
      console.error('Error deleting quote:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la cotización' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/quotes');
  }
}
