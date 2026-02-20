import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

/**
 * GET /api/cron/refresh-views
 * Cron job: refresh all materialized views (mv_commercial_dashboard,
 * mv_operational_dashboard, mv_monthly_kpis) by calling the
 * refresh_materialized_views() RPC function.
 * Runs every 15 minutes.
 * Protected by CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client since cron jobs do not have a user session
    const client = getSupabaseServerAdminClient();

    const startTime = Date.now();

    const { error } = await client.rpc('refresh_materialized_views');

    const durationMs = Date.now() - startTime;

    if (error) {
      console.error('Failed to refresh materialized views:', error);
      return NextResponse.json(
        {
          error: 'Error al refrescar vistas materializadas',
          details: error.message,
        },
        { status: 500 },
      );
    }

    console.log(`Materialized views refreshed in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      duration_ms: durationMs,
      refreshed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cron/refresh-views:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en cron' },
      { status: 500 },
    );
  }
}
