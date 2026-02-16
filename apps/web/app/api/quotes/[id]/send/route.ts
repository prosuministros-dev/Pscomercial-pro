import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { sendEmail } from '~/lib/email/send-email';

const sendQuoteSchema = z.object({
  recipientEmail: z.string().email('Email del destinatario es requerido'),
  recipientName: z.string().optional(),
  message: z.string().optional(),
});

/**
 * POST /api/quotes/[id]/send
 * Send quote (as Cotización or Proforma) to client via email
 * Logic: customer.credit_status = 'approved' AND credit_limit > 0 → Cotización
 *        Otherwise → Proforma
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
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = sendQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    // Fetch quote with customer info
    const { data: quote, error: quoteError } = await client
      .from('quotes')
      .select(`
        id, quote_number, organization_id, customer_id, status,
        customer:customers(id, business_name, credit_status, credit_limit)
      `)
      .eq('id', quoteId)
      .eq('organization_id', user.organization_id)
      .is('deleted_at', null)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 });
    }

    // Determine doc type based on customer credit
    const customer = quote.customer as unknown as {
      id: string;
      business_name: string;
      credit_status: string | null;
      credit_limit: number | null;
    };

    const isApprovedCredit =
      customer.credit_status === 'approved' &&
      (customer.credit_limit ?? 0) > 0;
    const docType = isApprovedCredit ? 'cotizacion' : 'proforma';
    const docLabel = isApprovedCredit ? 'Cotización' : 'Proforma';

    // Generate the PDF (call internal API)
    const pdfApiPath = docType === 'proforma'
      ? `/api/pdf/proforma/${quoteId}`
      : `/api/pdf/quote/${quoteId}`;

    // Use fetch to our own API (server-to-server)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    const pdfResponse = await fetch(`${baseUrl}${pdfApiPath}`, {
      headers: {
        Cookie: request.headers.get('cookie') || '',
      },
    });

    let pdfUrl: string | null = null;
    if (pdfResponse.ok) {
      const pdfResult = await pdfResponse.json();
      pdfUrl = pdfResult.url;
    }

    // Build email HTML
    const html = buildEmailHtml({
      docLabel,
      quoteNumber: quote.quote_number,
      customerName: customer.business_name,
      recipientName: parsed.data.recipientName,
      message: parsed.data.message,
      pdfUrl,
    });

    // Send email
    const emailResult = await sendEmail({
      to: parsed.data.recipientEmail,
      toName: parsed.data.recipientName,
      subject: `${docLabel} #${quote.quote_number} - Prosuministros`,
      html,
      organizationId: quote.organization_id,
      entityType: docType === 'proforma' ? 'proforma' : 'quote',
      entityId: quoteId,
    });

    // Update quote: mark as sent
    await client
      .from('quotes')
      .update({
        sent_to_client: true,
        sent_at: new Date().toISOString(),
        sent_via: 'email',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId);

    return NextResponse.json({
      success: emailResult.success,
      docType,
      emailLogId: emailResult.emailLogId,
      error: emailResult.error,
    });
  } catch (error) {
    console.error('Error in POST /api/quotes/[id]/send:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al enviar' },
      { status: 500 },
    );
  }
}

function buildEmailHtml(opts: {
  docLabel: string;
  quoteNumber: number;
  customerName: string;
  recipientName?: string;
  message?: string;
  pdfUrl: string | null;
}): string {
  const greeting = opts.recipientName
    ? `Estimado/a ${opts.recipientName}`
    : 'Estimado/a cliente';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #00C8CF; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">Prosuministros</h1>
      </div>
      <div style="padding: 24px; background: #f8f8f8;">
        <p>${greeting},</p>
        <p>Adjuntamos la <strong>${opts.docLabel} #${opts.quoteNumber}</strong> para su revisión.</p>
        ${opts.message ? `<p>${opts.message}</p>` : ''}
        ${opts.pdfUrl ? `<p><a href="${opts.pdfUrl}" style="display: inline-block; background: #00C8CF; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver ${opts.docLabel}</a></p>` : ''}
        <p style="color: #666; font-size: 14px;">Este enlace es válido por 7 días. Si tiene alguna pregunta, no dude en contactarnos.</p>
      </div>
      <div style="padding: 12px 24px; background: #1a1a2e; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">Prosuministros - ${opts.customerName}</p>
      </div>
    </div>
  `;
}
