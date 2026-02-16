import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/cron/lead-followup
 * Cron job: Remind advisors about stale leads (3+ days no activity)
 * Runs daily at 12 UTC (7am Colombia)
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

    // 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Find active leads with no update in 3+ days
    const { data: staleLeads, error: fetchError } = await client
      .from('leads')
      .select('id, company_name, contact_name, assigned_to, organization_id, status, updated_at')
      .in('status', ['new', 'contacted', 'qualified'])
      .not('assigned_to', 'is', null)
      .lt('updated_at', threeDaysAgo.toISOString());

    if (fetchError) {
      console.error('Error fetching stale leads:', fetchError);
      return NextResponse.json({ error: 'Error al buscar leads' }, { status: 500 });
    }

    if (!staleLeads?.length) {
      return NextResponse.json({ processed: 0, notified: 0 });
    }

    // Group by advisor to send one notification per advisor
    const byAdvisor: Record<string, { orgId: string; leads: typeof staleLeads }> = {};
    for (const lead of staleLeads) {
      const advisorId = lead.assigned_to!;
      if (!byAdvisor[advisorId]) {
        byAdvisor[advisorId] = { orgId: lead.organization_id, leads: [] };
      }
      byAdvisor[advisorId].leads.push(lead);
    }

    let notified = 0;
    for (const [advisorId, group] of Object.entries(byAdvisor)) {
      const count = group.leads.length;
      const { error: notifError } = await client
        .from('notifications')
        .insert({
          organization_id: group.orgId,
          user_id: advisorId,
          type: 'info',
          title: `${count} lead${count > 1 ? 's' : ''} sin seguimiento`,
          message: `Tienes ${count} lead${count > 1 ? 's' : ''} sin actividad hace más de 3 días. Revisa y actualiza su estado.`,
          link: '/home/leads',
        });

      if (!notifError) notified++;
    }

    return NextResponse.json({
      processed: staleLeads.length,
      advisors_notified: notified,
    });
  } catch (error) {
    console.error('Error in cron/lead-followup:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en cron' },
      { status: 500 },
    );
  }
}
