import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { ProformaPdfTemplate } from '~/lib/pdf/proforma-pdf-template';
import type { QuoteForPdf, OrgForPdf } from '~/lib/pdf/pdf-types';

/**
 * GET /api/pdf/proforma/[id]
 * Generate Proforma PDF (same as cotización but with banking data + "PROFORMA" header)
 * Permission: quotes:read
 */
export async function GET(
  _request: NextRequest,
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

    // Fetch quote
    const { data: quoteData, error: quoteError } = await client
      .from('quotes')
      .select(`
        id, quote_number, quote_date, expires_at, validity_days,
        currency, subtotal, discount_amount, tax_amount,
        transport_cost, transport_included, total,
        payment_terms, notes, organization_id,
        customer:customers(id, business_name, nit, address, city, phone, email),
        advisor:profiles!quotes_advisor_id_fkey(id, display_name, email, phone)
      `)
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (quoteError || !quoteData) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Fetch items
    const { data: items, error: itemsError } = await client
      .from('quote_items')
      .select('sort_order, sku, description, quantity, unit_price, subtotal, tax_amount, total')
      .eq('quote_id', quoteId)
      .order('sort_order');

    if (itemsError) {
      console.error('Error fetching quote items:', itemsError);
      return NextResponse.json({ error: 'Error al obtener los items' }, { status: 500 });
    }

    // Fetch organization with settings (for banking data)
    const { data: orgData, error: orgError } = await client
      .from('organizations')
      .select('name, tax_id, address, city, phone, email, logo_url, settings')
      .eq('id', quoteData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 500 });
    }

    const customer = quoteData.customer as unknown as QuoteForPdf['customer'];
    const advisor = quoteData.advisor as unknown as QuoteForPdf['advisor'];

    const quote: QuoteForPdf = {
      id: quoteData.id,
      quote_number: quoteData.quote_number,
      quote_date: quoteData.quote_date,
      expires_at: quoteData.expires_at,
      validity_days: quoteData.validity_days,
      currency: quoteData.currency as 'COP' | 'USD',
      subtotal: quoteData.subtotal,
      discount_amount: quoteData.discount_amount,
      tax_amount: quoteData.tax_amount,
      transport_cost: quoteData.transport_cost,
      transport_included: quoteData.transport_included,
      total: quoteData.total,
      payment_terms: quoteData.payment_terms,
      notes: quoteData.notes,
      items: items || [],
      customer,
      advisor,
    };

    // Extract banking from org settings
    const settings = (orgData.settings || {}) as Record<string, unknown>;
    const banking = settings.banking as OrgForPdf['banking'] | undefined;

    const org: OrgForPdf = {
      name: orgData.name,
      tax_id: orgData.tax_id,
      address: orgData.address,
      city: orgData.city,
      phone: orgData.phone,
      email: orgData.email,
      logo_url: orgData.logo_url,
      banking,
    };

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      ProformaPdfTemplate({ quote, org }) as React.ReactElement,
    );

    const fileName = `proforma-${quoteData.quote_number}.pdf`;
    const storagePath = `${quoteData.organization_id}/proformas/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await client.storage
      .from('generated-pdfs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Create signed URL (7 days)
    const { data: signedUrlData, error: signedUrlError } = await client.storage
      .from('generated-pdfs')
      .createSignedUrl(storagePath, 7 * 24 * 60 * 60);

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
    }

    const signedUrl = signedUrlData?.signedUrl || null;

    // Update quote with proforma URL
    if (signedUrl) {
      await client
        .from('quotes')
        .update({
          proforma_url: signedUrl,
          proforma_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', quoteId);
    }

    return NextResponse.json({
      url: signedUrl,
      fileName,
    });
  } catch (error) {
    console.error('Error in GET /api/pdf/proforma/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el PDF' },
      { status: 500 },
    );
  }
}
