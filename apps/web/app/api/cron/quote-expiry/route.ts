import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/cron/quote-expiry
 * Cron job: Mark expired quotes (valid_until < today) and notify advisors
 * Runs daily at 11 UTC (6am Colombia)
 * Protected by CRON_SECRET header
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = getSupabaseServerClient();
    const today = new Date().toISOString().slice(0, 10);

    // Find quotes that are still active but past valid_until
    const { data: expiredQuotes, error: fetchError } = await client
      .from('quotes')
      .select('id, quote_number, advisor_id, organization_id, customer_id, total, currency')
      .in('status', ['draft', 'sent', 'pending_approval'])
      .not('valid_until', 'is', null)
      .lt('valid_until', today);

    if (fetchError) {
      console.error('Error fetching expired quotes:', fetchError);
      return NextResponse.json({ error: 'Error al buscar cotizaciones' }, { status: 500 });
    }

    if (!expiredQuotes?.length) {
      return NextResponse.json({ processed: 0, expired: 0 });
    }

    let expired = 0;
    let notified = 0;

    for (const quote of expiredQuotes) {
      // Update quote status to expired
      const { error: updateError } = await client
        .from('quotes')
        .update({ status: 'expired' })
        .eq('id', quote.id);

      if (!updateError) {
        expired++;

        // Notify the advisor
        if (quote.advisor_id) {
          const { error: notifError } = await client
            .from('notifications')
            .insert({
              organization_id: quote.organization_id,
              user_id: quote.advisor_id,
              type: 'alert',
              title: `Cotización #${quote.quote_number} expirada`,
              message: `La cotización ha superado su fecha de validez y fue marcada como expirada.`,
              action_url: `/home/quotes`,
            });

          if (!notifError) notified++;
        }
      }
    }

    return NextResponse.json({
      processed: expiredQuotes.length,
      expired,
      notified,
    });
  } catch (error) {
    console.error('Error in cron/quote-expiry:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en cron' },
      { status: 500 },
    );
  }
}
