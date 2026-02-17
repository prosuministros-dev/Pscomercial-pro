import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

/**
 * POST /api/quotes/[id]/duplicate
 * Duplicate a quote creating a new version
 * Permission required: quotes:create
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para crear cotizaciones' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch original quote
    const { data: original, error: fetchError } = await client
      .from('quotes')
      .select('*, quote_items:quote_items(*)')
      .eq('id', id)
      .eq('organization_id', user.organization_id)
      .single();

    if (fetchError || !original) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Generate new consecutive number
    const { data: quoteNumber, error: rpcError } = await client.rpc(
      'generate_consecutive',
      { org_uuid: user.organization_id, entity_type: 'quote' }
    );

    if (rpcError) {
      return NextResponse.json({ error: 'Error al generar número' }, { status: 500 });
    }

    const validityDays = original.validity_days || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    // Create duplicated quote
    const { data: newQuote, error: insertError } = await client
      .from('quotes')
      .insert({
        organization_id: user.organization_id,
        quote_number: quoteNumber,
        customer_id: original.customer_id,
        contact_id: original.contact_id,
        lead_id: original.lead_id,
        advisor_id: user.id,
        quote_date: new Date().toISOString(),
        validity_days: validityDays,
        expires_at: expiresAt.toISOString(),
        status: 'draft',
        currency: original.currency,
        trm_applied: original.trm_applied,
        payment_terms: original.payment_terms,
        transport_cost: original.transport_cost,
        transport_included: original.transport_included,
        notes: `[Duplicada de #${original.quote_number}] ${original.notes || ''}`.trim(),
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Error al duplicar cotización' }, { status: 500 });
    }

    // Duplicate items
    if (original.quote_items && original.quote_items.length > 0) {
      const newItems = original.quote_items.map((item: Record<string, unknown>) => ({
        quote_id: newQuote.id,
        product_id: item.product_id,
        sort_order: item.sort_order,
        sku: item.sku,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_pct: item.discount_pct,
        tax_pct: item.tax_pct,
        cost_price: item.cost_price,
        notes: item.notes,
      }));

      await client.from('quote_items').insert(newItems);

      // Recalculate totals
      await client.rpc('calculate_quote_totals', { quote_uuid: newQuote.id });
    }

    // Fetch complete quote
    const { data: completeQuote } = await client
      .from('quotes')
      .select(`
        *,
        customer:customers(id, business_name, nit),
        advisor:profiles!quotes_advisor_id_fkey(id, full_name, email)
      `)
      .eq('id', newQuote.id)
      .single();

    return NextResponse.json(completeQuote || newQuote, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quotes/[id]/duplicate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
