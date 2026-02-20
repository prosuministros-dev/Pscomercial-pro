import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';
import { PurchaseOrderPdfTemplate } from '~/lib/pdf/purchase-order-pdf-template';
import type { PurchaseOrderForPdf, OrgForPdf } from '~/lib/pdf/pdf-types';

/**
 * GET /api/pdf/purchase-order/[id]
 * Generate PDF for a purchase order
 * Permission: orders:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: poId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    // Fetch purchase order with supplier
    const { data: poData, error: poError } = await client
      .from('purchase_orders')
      .select(`
        id, po_number, created_at, currency, subtotal, tax_amount, total,
        expected_delivery_date, notes, organization_id, order_id,
        supplier:suppliers(id, name, nit, address, city, phone, email),
        order:orders(order_number)
      `)
      .eq('id', poId)
      .eq('organization_id', user.organization_id)
      .single();

    if (poError || !poData) {
      return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 });
    }

    // Fetch PO items
    const { data: items, error: itemsError } = await client
      .from('purchase_order_items')
      .select('sku, description, quantity_ordered, unit_cost, subtotal')
      .eq('purchase_order_id', poId)
      .order('id');

    if (itemsError) {
      console.error('Error fetching PO items:', itemsError);
      return NextResponse.json({ error: 'Error al obtener los items' }, { status: 500 });
    }

    // Fetch organization
    const { data: orgData, error: orgError } = await client
      .from('organizations')
      .select('name, tax_id, address, city, phone, email, logo_url')
      .eq('id', poData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 500 });
    }

    const supplier = poData.supplier as unknown as PurchaseOrderForPdf['supplier'];
    const order = poData.order as unknown as { order_number: number };

    const po: PurchaseOrderForPdf = {
      id: poData.id,
      po_number: poData.po_number,
      created_at: poData.created_at,
      currency: poData.currency as 'COP' | 'USD',
      subtotal: poData.subtotal,
      tax_amount: poData.tax_amount,
      total: poData.total,
      expected_delivery_date: poData.expected_delivery_date,
      notes: poData.notes,
      items: items || [],
      supplier,
      order_number: order?.order_number || 0,
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
      PurchaseOrderPdfTemplate({ po, org }) as React.ReactElement,
    );

    const fileName = `oc-${poData.po_number}.pdf`;
    const storagePath = `${poData.organization_id}/purchase-orders/${fileName}`;

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
    return handleApiError(error, 'GET /api/pdf/purchase-order/[id]');
  }
}
