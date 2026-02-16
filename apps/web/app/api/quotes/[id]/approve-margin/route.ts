import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

// --- Zod Schemas ---
const requestApprovalSchema = z.object({
  justification: z.string().optional(),
});

const resolveApprovalSchema = z.object({
  action: z.enum(['approve', 'reject'], { required_error: 'Acción requerida (approve/reject)' }),
  review_notes: z.string().optional(),
});

/**
 * POST /api/quotes/[id]/approve-margin
 * Request margin approval (calls request_margin_approval RPC)
 * Permission: quotes:update
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: quoteId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para solicitar aprobación de margen' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = requestApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify quote belongs to user's org
    const { data: quote, error: fetchError } = await client
      .from('quotes')
      .select('id, organization_id, margin_pct, margin_approved, status')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    if (quote.margin_approved) {
      return NextResponse.json({ error: 'El margen ya fue aprobado' }, { status: 400 });
    }

    // Call the RPC to request margin approval
    const { error: rpcError } = await client.rpc('request_margin_approval', {
      p_quote_id: quoteId,
    });

    if (rpcError) {
      console.error('Error requesting margin approval:', rpcError);
      return NextResponse.json({ error: rpcError.message || 'Error al solicitar aprobación de margen' }, { status: 500 });
    }

    // Fetch the created approval record
    const { data: approval } = await client
      .from('quote_approvals')
      .select('*')
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({ success: true, approval }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quotes/[id]/approve-margin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/quotes/[id]/approve-margin
 * Approve or reject a pending margin approval
 * Permission: quotes:approve
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: quoteId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:approve');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para aprobar/rechazar margen' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = resolveApprovalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Verify quote belongs to user's org
    const { data: quote, error: fetchError } = await client
      .from('quotes')
      .select('id, organization_id, status')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Find the pending approval
    const { data: approval, error: approvalError } = await client
      .from('quote_approvals')
      .select('*')
      .eq('quote_id', quoteId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (approvalError || !approval) {
      return NextResponse.json({ error: 'No hay aprobación pendiente para esta cotización' }, { status: 404 });
    }

    const { action, review_notes } = parsed.data;
    const isApproved = action === 'approve';

    // Update the approval record
    const { error: updateApprovalError } = await client
      .from('quote_approvals')
      .update({
        status: isApproved ? 'approved' : 'rejected',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: review_notes || null,
      })
      .eq('id', approval.id);

    if (updateApprovalError) {
      console.error('Error updating approval:', updateApprovalError);
      return NextResponse.json({ error: 'Error al actualizar la aprobación' }, { status: 500 });
    }

    // Update the quote
    const quoteUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (isApproved) {
      quoteUpdate.margin_approved = true;
      quoteUpdate.margin_approved_by = user.id;
      quoteUpdate.margin_approved_at = new Date().toISOString();
      // Move quote back to a workable status
      if (quote.status === 'pending_approval') {
        quoteUpdate.status = 'offer_created';
      }
    } else {
      quoteUpdate.margin_approved = false;
      if (quote.status === 'pending_approval') {
        quoteUpdate.status = 'draft';
      }
    }

    const { data: updatedQuote, error: updateQuoteError } = await client
      .from('quotes')
      .update(quoteUpdate)
      .eq('id', quoteId)
      .select('*')
      .single();

    if (updateQuoteError) {
      console.error('Error updating quote:', updateQuoteError);
      return NextResponse.json({ error: 'Error al actualizar la cotización' }, { status: 500 });
    }

    // Create notification for the requesting advisor
    const { error: notifError } = await client
      .from('notifications')
      .insert({
        organization_id: user.organization_id,
        user_id: approval.requested_by,
        type: isApproved ? 'margin_approved' : 'margin_rejected',
        title: isApproved ? 'Margen aprobado' : 'Margen rechazado',
        message: isApproved
          ? `Tu solicitud de aprobación de margen fue aprobada${review_notes ? ': ' + review_notes : ''}`
          : `Tu solicitud de aprobación de margen fue rechazada${review_notes ? ': ' + review_notes : ''}`,
        action_url: `/home/quotes`,
        entity_type: 'quote',
        entity_id: quoteId,
        priority: 'high',
      });

    if (notifError) {
      console.error('Error creating notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      action,
      quote: updatedQuote,
    });
  } catch (error) {
    console.error('Error in PATCH /api/quotes/[id]/approve-margin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/quotes/[id]/approve-margin
 * Get approval status for a quote
 * Permission: quotes:read
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: quoteId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data: approvals, error } = await client
      .from('quote_approvals')
      .select(`
        *,
        requester:profiles!quote_approvals_requested_by_fkey(id, display_name, email),
        reviewer:profiles!quote_approvals_reviewed_by_fkey(id, display_name, email)
      `)
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approvals:', error);
      return NextResponse.json({ error: 'Error al obtener las aprobaciones' }, { status: 500 });
    }

    return NextResponse.json({ data: approvals || [] });
  } catch (error) {
    console.error('Error in GET /api/quotes/[id]/approve-margin:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
