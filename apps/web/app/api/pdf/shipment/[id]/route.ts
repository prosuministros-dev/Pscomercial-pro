import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';
import { ShipmentPdfTemplate } from '~/lib/pdf/shipment-pdf-template';
import type { ShipmentForPdf, OrgForPdf } from '~/lib/pdf/pdf-types';

/**
 * GET /api/pdf/shipment/[id]
 * Generate PDF remission document for a shipment
 * Permission: orders:read
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: shipmentId } = await params;
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'orders:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    // Fetch shipment with order and customer
    const { data: shipmentData, error: shipmentError } = await client
      .from('shipments')
      .select(`
        id, shipment_number, created_at, status, dispatch_type,
        carrier, tracking_number, delivery_address, delivery_city,
        delivery_contact, delivery_phone, estimated_delivery, notes,
        organization_id,
        order:orders(
          order_number,
          customer:customers(id, business_name, nit, address, city, phone)
        )
      `)
      .eq('id', shipmentId)
      .eq('organization_id', user.organization_id)
      .single();

    if (shipmentError || !shipmentData) {
      return NextResponse.json({ error: 'Despacho no encontrado' }, { status: 404 });
    }

    // Fetch shipment items with order_item details
    const { data: items, error: itemsError } = await client
      .from('shipment_items')
      .select(`
        quantity_shipped, serial_numbers, notes,
        order_item:order_items(sku, description)
      `)
      .eq('shipment_id', shipmentId)
      .order('id');

    if (itemsError) {
      console.error('Error fetching shipment items:', itemsError);
      return NextResponse.json({ error: 'Error al obtener los items' }, { status: 500 });
    }

    // Fetch organization
    const { data: orgData, error: orgError } = await client
      .from('organizations')
      .select('name, tax_id, address, city, phone, email, logo_url')
      .eq('id', shipmentData.organization_id)
      .single();

    if (orgError || !orgData) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 500 });
    }

    const order = shipmentData.order as unknown as {
      order_number: number;
      customer: {
        id: string;
        business_name: string;
        nit: string;
        address: string | null;
        city: string | null;
        phone: string | null;
      };
    };

    const shipment: ShipmentForPdf = {
      id: shipmentData.id,
      shipment_number: shipmentData.shipment_number,
      created_at: shipmentData.created_at,
      status: shipmentData.status,
      dispatch_type: shipmentData.dispatch_type,
      carrier: shipmentData.carrier,
      tracking_number: shipmentData.tracking_number,
      delivery_address: shipmentData.delivery_address,
      delivery_city: shipmentData.delivery_city,
      delivery_contact: shipmentData.delivery_contact,
      delivery_phone: shipmentData.delivery_phone,
      estimated_delivery: shipmentData.estimated_delivery,
      notes: shipmentData.notes,
      order_number: order?.order_number || 0,
      customer: {
        business_name: order?.customer?.business_name || 'N/A',
        nit: order?.customer?.nit || 'N/A',
        address: order?.customer?.address || null,
        city: order?.customer?.city || null,
        phone: order?.customer?.phone || null,
      },
      items: (items || []).map((item) => {
        const orderItem = item.order_item as unknown as {
          sku: string;
          description: string;
        };
        return {
          sku: orderItem?.sku || '',
          description: orderItem?.description || '',
          quantity_shipped: item.quantity_shipped,
          serial_numbers: item.serial_numbers,
          notes: item.notes,
        };
      }),
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
      ShipmentPdfTemplate({ shipment, org }) as React.ReactElement,
    );

    const fileName = `rem-${shipmentData.shipment_number}.pdf`;
    const storagePath = `${shipmentData.organization_id}/shipments/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await client.storage
      .from('generated-pdfs')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      // Fallback: return PDF directly
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
    return handleApiError(error, 'GET /api/pdf/shipment/[id]');
  }
}
