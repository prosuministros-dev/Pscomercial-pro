import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/cron/license-alerts
 * Cron job: flag licenses expiring within 30 days as 'expiring_soon'
 * Runs weekly (Monday 9am UTC / 4am Colombia)
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

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Find active licenses expiring within 30 days
    const { data: expiringLicenses, error: fetchError } = await client
      .from('license_records')
      .select('id, order_id, license_type, vendor, expiry_date, end_user_name, organization_id')
      .eq('status', 'active')
      .not('expiry_date', 'is', null)
      .lte('expiry_date', thirtyDaysFromNow.toISOString());

    if (fetchError) {
      console.error('Error fetching expiring licenses:', fetchError);
      return NextResponse.json({ error: 'Error al buscar licencias' }, { status: 500 });
    }

    if (!expiringLicenses?.length) {
      return NextResponse.json({ processed: 0 });
    }

    let updated = 0;

    for (const license of expiringLicenses) {
      // Update status to expiring_soon
      const { error: updateError } = await client
        .from('license_records')
        .update({ status: 'expiring_soon' })
        .eq('id', license.id)
        .eq('status', 'active');

      if (!updateError) {
        updated++;

        // Create a pending task for the order
        if (license.order_id) {
          const daysLeft = Math.ceil(
            (new Date(license.expiry_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          await client
            .from('order_pending_tasks')
            .insert({
              organization_id: license.organization_id,
              order_id: license.order_id,
              task_type: 'license_activation',
              title: `Licencia ${license.vendor || license.license_type} vence en ${daysLeft} días`,
              description: license.end_user_name
                ? `Usuario final: ${license.end_user_name}. Vence: ${new Date(license.expiry_date!).toLocaleDateString('es-CO')}`
                : `Vence: ${new Date(license.expiry_date!).toLocaleDateString('es-CO')}`,
              priority: daysLeft <= 7 ? 'critical' : daysLeft <= 15 ? 'high' : 'medium',
              traffic_light: daysLeft <= 7 ? 'red' : daysLeft <= 15 ? 'yellow' : 'green',
              due_date: license.expiry_date,
              status: 'pending',
            });
        }
      }
    }

    // Also mark expired licenses
    const { data: expiredCount } = await client.rpc('get_next_consecutive', {
      p_org_id: '00000000-0000-0000-0000-000000000000',
      p_entity_type: '__noop__',
    }).then(() => ({ data: 0 })).catch(() => ({ data: 0 }));

    const { error: expireError } = await client
      .from('license_records')
      .update({ status: 'expired' })
      .in('status', ['active', 'expiring_soon'])
      .not('expiry_date', 'is', null)
      .lt('expiry_date', new Date().toISOString());

    if (expireError) {
      console.error('Error expiring licenses:', expireError);
    }

    return NextResponse.json({ updated, total_expiring: expiringLicenses.length });
  } catch (error) {
    console.error('Error in cron/license-alerts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en cron' },
      { status: 500 },
    );
  }
}
