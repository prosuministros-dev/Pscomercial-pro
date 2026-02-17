import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { OrderPdfTemplate } from '~/lib/pdf/order-pdf-template';
import type { OrderForPdf, OrgForPdf } from '~/lib/pdf/pdf-types';

/**
 * GET /api/pdf/order/[id]
 * Generate PDF for an order, upload to storage, return signed URL
 * Permission: orders:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: orderId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    // Fetch order
    const { data: orderData, error: orderError } = await client
      .from('orders')
      .select(`
        id, order_number, created_at, currency, subtotal, tax_amount, total,
        payment_terms, billing_type, notes, organization_id,
        customer:customers(id, business_name, nit, address, city, phone, email),
        advisor:profiles!orders_advisor_id_fkey(id, full_name, email, phone)
      `)
      .eq('id', orderId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await client
      .from('order_items')
      .select('sku, description, quantity, unit_price, subtotal, tax_amount, total')
      .eq('order_id', orderId)
      .order('id');

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return NextResponse.json({ error: 'Error al obtener los items' }, { status: 500 });
    }

    // Fetch destinations
    const { data: destinations } = await client
      .from('order_destinations')
      .select('sort_order, delivery_address, delivery_city, delivery_contact, delivery_phone, delivery_schedule, dispatch_type, notes')
      .eq('order_id', orderId)
      .order('sort_order');

    // Fetch organization
    const { data: orgData, error: orgError } = await client
      .from('organizations')
      .select('name, tax_id, address, city, phone, email, logo_url')
      .eq('id', orderData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 500 });
    }

    const customer = orderData.customer as unknown as OrderForPdf['customer'];
    const advisor = orderData.advisor as unknown as OrderForPdf['advisor'];

    const order: OrderForPdf = {
      id: orderData.id,
      order_number: orderData.order_number,
      created_at: orderData.created_at,
      currency: orderData.currency as 'COP' | 'USD',
      subtotal: orderData.subtotal,
      tax_amount: orderData.tax_amount,
      total: orderData.total,
      payment_terms: orderData.payment_terms,
      billing_type: orderData.billing_type || 'total',
      notes: orderData.notes,
      items: items || [],
      destinations: destinations || [],
      customer,
      advisor,
    };

    const org: OrgForPdf = {
      name: orgData.name,
      tax_id: orgData.tax_id,
      address: orgData.address,
      city: orgData.city,
      phone: orgData.phone,
      email: orgData.email,
      logo_url: orgData.logo_url,
    };

    // Render PDF
    const pdfBuffer = await renderToBuffer(
      OrderPdfTemplate({ order, org }) as React.ReactElement,
    );

    const fileName = `pedido-${orderData.order_number}.pdf`;
    const storagePath = `${orderData.organization_id}/orders/${fileName}`;

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

    return NextResponse.json({
      url: signedUrlData?.signedUrl || null,
      fileName,
    });
  } catch (error) {
    console.error('Error in GET /api/pdf/order/[id]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al generar el PDF' },
      { status: 500 },
    );
  }
}
