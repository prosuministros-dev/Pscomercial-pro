import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

const updateInvoiceSchema = z.object({
  status: z.string().optional(),
  payment_date: z.string().optional(),
  payment_method: z.string().optional(),
  payment_reference: z.string().optional(),
});

/**
 * GET /api/invoices/[id]
 * Get invoice detail with items
 * Permission: billing:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: invoiceId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'billing:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data, error } = await client
      .from('invoices')
      .select(`
        *,
        items:invoice_items(*)
      `)
      .eq('id', invoiceId)
      .eq('organization_id', user.organization_id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error, 'GET /api/invoices/[id]');
  }
}

/**
 * PATCH /api/invoices/[id]
 * Update invoice status or record payment
 * Permission: billing:update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: invoiceId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'billing:update');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar facturas' }, { status: 403 });
    }

    // Verify invoice belongs to org
    const { data: existing, error: fetchError } = await client
      .from('invoices')
      .select('id, organization_id')
      .eq('id', invoiceId)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Datos inválidos' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (parsed.data.status) updates.status = parsed.data.status;
    if (parsed.data.payment_date) updates.payment_date = parsed.data.payment_date;
    if (parsed.data.payment_method) updates.payment_method = parsed.data.payment_method;
    if (parsed.data.payment_reference) updates.payment_reference = parsed.data.payment_reference;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    const { error: updateError } = await client
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice:', updateError);
      return NextResponse.json({ error: 'Error al actualizar factura' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/invoices/[id]');
  }
}
