import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

const clientResponseSchema = z.object({
  response: z.enum(['accepted', 'changes_requested', 'rejected']),
  notes: z.string().optional(),
});

/**
 * PATCH /api/quotes/[id]/client-response
 * Record the client's response to a sent quote
 * Permission: quotes:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: quoteId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = clientResponseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Fetch quote
    const { data: quote, error: quoteError } = await client
      .from('quotes')
      .select('id, organization_id, status, sent_to_client')
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Map client response to quote status
    const statusMap: Record<string, string> = {
      accepted: 'approved',
      changes_requested: 'negotiation',
      rejected: 'rejected',
    };

    const newStatus = statusMap[parsed.data.response] || quote.status;

    const updateData: Record<string, unknown> = {
      client_response: parsed.data.response,
      updated_at: new Date().toISOString(),
    };

    // Only update status if the response warrants it
    if (parsed.data.response === 'accepted' && !['approved', 'pending_oc'].includes(quote.status)) {
      updateData.status = newStatus;
    } else if (parsed.data.response === 'changes_requested') {
      updateData.status = newStatus;
    } else if (parsed.data.response === 'rejected') {
      updateData.status = newStatus;
    }

    if (parsed.data.notes) {
      updateData.notes = parsed.data.notes;
    }

    const { error: updateError } = await client
      .from('quotes')
      .update(updateData)
      .eq('id', quoteId);

    if (updateError) {
      console.error('Error updating client response:', updateError);
      return NextResponse.json(
        { error: 'Error al registrar la respuesta del cliente' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      response: parsed.data.response,
      newStatus: updateData.status || quote.status,
    });
  } catch (error) {
    console.error('Error in PATCH /api/quotes/[id]/client-response:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
