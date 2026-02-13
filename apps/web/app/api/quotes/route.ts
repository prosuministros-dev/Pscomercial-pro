import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/quotes
 * List quotes with pagination and filters
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const { searchParams } = new URL(request.url);

    // Pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;

    // Filters
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');
    const advisorId = searchParams.get('advisor_id');
    const search = searchParams.get('search');
    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');

    // Build query
    let query = client
      .from('quotes')
      .select(
        `
        *,
        customer:customers(
          id,
          business_name,
          nit,
          city
        ),
        advisor:profiles!quotes_advisor_id_fkey(
          id,
          display_name,
          email
        ),
        lead:leads(
          id,
          lead_number,
          business_name
        )
      `,
        { count: 'exact' }
      )
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .order('quote_number', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (advisorId) {
      query = query.eq('advisor_id', advisorId);
    }
    if (search) {
      query = query.or(
        `quote_number.eq.${search},customer.business_name.ilike.%${search}%,customer.nit.ilike.%${search}%`
      );
    }
    if (fromDate) {
      query = query.gte('quote_date', fromDate);
    }
    if (toDate) {
      query = query.lte('quote_date', toDate);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json(
        { error: 'Error al obtener las cotizaciones' },
        { status: 500 }
      );
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
    console.error('Error in GET /api/quotes:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotes
 * Create a new quote (can be from a lead or standalone)
 */
export async function POST(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const body = await request.json();

    // If creating from lead, use the RPC function
    if (body.lead_id) {
      const { data: quoteId, error: rpcError } = await client.rpc(
        'create_quote_from_lead',
        {
          lead_uuid: body.lead_id,
        }
      );

      if (rpcError) {
        console.error('Error creating quote from lead:', rpcError);
        return NextResponse.json(
          { error: 'Error al crear la cotización desde el lead' },
          { status: 500 }
        );
      }

      // Fetch the created quote
      const { data: quote, error: fetchError } = await client
        .from('quotes')
        .select(
          `
          *,
          customer:customers(id, business_name, nit),
          advisor:profiles!quotes_advisor_id_fkey(id, display_name, email)
        `
        )
        .eq('id', quoteId)
        .single();

      if (fetchError) {
        console.error('Error fetching created quote:', fetchError);
        return NextResponse.json(
          { error: 'Cotización creada pero error al obtener los datos' },
          { status: 500 }
        );
      }

      return NextResponse.json(quote, { status: 201 });
    }

    // Generate quote number
    const { data: quoteNumber, error: rpcError } = await client.rpc(
      'generate_consecutive',
      {
        org_uuid: user.organization_id,
        entity_type: 'quote',
      }
    );

    if (rpcError) {
      console.error('Error generating quote number:', rpcError);
      return NextResponse.json(
        { error: 'Error al generar el número de cotización' },
        { status: 500 }
      );
    }

    // Calculate expires_at based on validity_days
    const validityDays = body.validity_days || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Create quote
    const { data: quote, error: insertError } = await client
      .from('quotes')
      .insert({
        organization_id: user.organization_id,
        quote_number: quoteNumber,
        customer_id: body.customer_id,
        contact_id: body.contact_id,
        advisor_id: body.advisor_id || user.id,
        quote_date: body.quote_date || new Date().toISOString(),
        validity_days: validityDays,
        expires_at: expiresAt.toISOString(),
        status: body.status || 'draft',
        currency: body.currency || 'COP',
        payment_terms: body.payment_terms || 'ANTICIPADO',
        trm_applied: body.trm_applied,
        transport_cost: body.transport_cost || 0,
        transport_included: body.transport_included || false,
        notes: body.notes,
        created_by: user.id,
      })
      .select(
        `
        *,
        customer:customers(id, business_name, nit),
        advisor:profiles!quotes_advisor_id_fkey(id, display_name, email)
      `
      )
      .single();

    if (insertError) {
      console.error('Error creating quote:', insertError);
      return NextResponse.json(
        { error: 'Error al crear la cotización' },
        { status: 500 }
      );
    }

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quotes:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/quotes
 * Update an existing quote
 */
export async function PUT(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'ID de cotización es requerido' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existingQuote, error: fetchError } = await client
      .from('quotes')
      .select('id, organization_id, status, quote_date')
      .eq('id', body.id)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Allow updating specific fields
    const allowedFields = [
      'customer_id',
      'contact_id',
      'advisor_id',
      'quote_date',
      'validity_days',
      'status',
      'currency',
      'trm_applied',
      'payment_terms',
      'transport_cost',
      'transport_included',
      'margin_approved',
      'credit_validated',
      'credit_blocked',
      'credit_block_reason',
      'estimated_close_month',
      'estimated_close_week',
      'estimated_billing_date',
      'rejection_reason',
      'sent_to_client',
      'sent_via',
      'loss_reason',
      'notes',
    ];

    allowedFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Track who blocked/unblocked credit - TAREA 1.4.13/14
    if (body.credit_blocked !== undefined) {
      if (body.credit_blocked) {
        updateData.credit_blocked_by = user.id;
        updateData.credit_blocked_at = new Date().toISOString();
      } else {
        updateData.credit_blocked_by = null;
        updateData.credit_blocked_at = null;
        updateData.credit_block_reason = null;
      }
    }

    // If validity_days changed, update expires_at
    if (body.validity_days !== undefined) {
      const quoteDate = body.quote_date || existingQuote.quote_date;
      const expiresAt = new Date(quoteDate);
      expiresAt.setDate(expiresAt.getDate() + body.validity_days);
      updateData.expires_at = expiresAt.toISOString();
    }

    // Update quote
    const { data: quote, error: updateError } = await client
      .from('quotes')
      .update(updateData)
      .eq('id', body.id)
      .select(
        `
        *,
        customer:customers(id, business_name, nit),
        advisor:profiles!quotes_advisor_id_fkey(id, display_name, email)
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating quote:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar la cotización' },
        { status: 500 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error in PUT /api/quotes:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/quotes
 * Soft delete a quote
 */
export async function DELETE(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);
    const { searchParams } = new URL(request.url);
    const quoteId = searchParams.get('id');

    if (!quoteId) {
      return NextResponse.json(
        { error: 'ID de cotización es requerido' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existingQuote, error: fetchError } = await client
      .from('quotes')
      .select('id, organization_id')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete
    const { error: deleteError } = await client
      .from('quotes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', quoteId);

    if (deleteError) {
      console.error('Error deleting quote:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar la cotización' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/quotes:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}
