import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { sendEmail } from '~/lib/email/send-email';

/**
 * GET /api/cron/quote-reminders
 * Cron job: process pending quote follow-ups
 * Sends reminder emails for quotes that haven't received a client response
 * Protected by CRON_SECRET header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseServerClient();

    // Find pending follow-ups where scheduled_at <= now and not completed
    const { data: followUps, error: fetchError } = await client
      .from('quote_follow_ups')
      .select(`
        id, quote_id, follow_up_type, scheduled_at, notes,
        quote:quotes(
          id, quote_number, organization_id, sent_to_client, client_response, status,
          customer:customers(id, business_name, email),
          advisor:profiles!quotes_advisor_id_fkey(id, full_name, email)
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(50);

    if (fetchError) {
      console.error('Error fetching follow-ups:', fetchError);
      return NextResponse.json({ error: 'Error al obtener seguimientos' }, { status: 500 });
    }

    if (!followUps?.length) {
      return NextResponse.json({ processed: 0 });
    }

    let processed = 0;
    let skipped = 0;

    for (const followUp of followUps) {
      const quote = followUp.quote as unknown as {
        id: string;
        quote_number: number;
        organization_id: string;
        sent_to_client: boolean;
        client_response: string | null;
        status: string;
        customer: { id: string; business_name: string; email: string | null };
        advisor: { id: string; full_name: string; email: string };
      };

      // Skip if client already responded or quote is no longer active
      if (
        quote.client_response ||
        ['rejected', 'approved', 'pending_oc', 'expired'].includes(quote.status)
      ) {
        // Mark follow-up as completed
        await client
          .from('quote_follow_ups')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', followUp.id);
        skipped++;
        continue;
      }

      // Skip if no customer email
      if (!quote.customer?.email) {
        await client
          .from('quote_follow_ups')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', followUp.id);
        skipped++;
        continue;
      }

      // Send reminder email
      const html = buildReminderHtml({
        customerName: quote.customer.business_name,
        quoteNumber: quote.quote_number,
        advisorName: quote.advisor.full_name,
        advisorEmail: quote.advisor.email,
      });

      await sendEmail({
        to: quote.customer.email,
        toName: quote.customer.business_name,
        subject: `Recordatorio: Cotización #${quote.quote_number} pendiente de respuesta`,
        html,
        organizationId: quote.organization_id,
        entityType: 'quote',
        entityId: quote.id,
      });

      // Mark follow-up as completed
      await client
        .from('quote_follow_ups')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', followUp.id);

      processed++;
    }

    return NextResponse.json({ processed, skipped });
  } catch (error) {
    console.error('Error in cron/quote-reminders:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en cron' },
      { status: 500 },
    );
  }
}

function buildReminderHtml(opts: {
  customerName: string;
  quoteNumber: number;
  advisorName: string;
  advisorEmail: string;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #00C8CF; padding: 20px; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 20px;">Prosuministros</h1>
      </div>
      <div style="padding: 24px; background: #f8f8f8;">
        <p>Estimado/a ${opts.customerName},</p>
        <p>Le recordamos que la <strong>Cotización #${opts.quoteNumber}</strong> se encuentra pendiente de respuesta.</p>
        <p>Si tiene alguna pregunta o necesita ajustes, no dude en contactar a su asesor comercial:</p>
        <p><strong>${opts.advisorName}</strong><br/>${opts.advisorEmail}</p>
        <p style="color: #666; font-size: 14px;">Si ya ha dado respuesta a esta cotización, por favor ignore este mensaje.</p>
      </div>
      <div style="padding: 12px 24px; background: #1a1a2e; text-align: center;">
        <p style="color: #999; font-size: 12px; margin: 0;">Prosuministros</p>
      </div>
    </div>
  `;
}
