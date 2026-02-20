import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

const TRM_API_URL =
  'https://www.datos.gov.co/resource/32sa-8pi3.json?$order=vigenciadesde%20DESC&$limit=1';

interface DatosGovTrmRecord {
  valor: string;
  vigenciadesde: string;
  vigenciahasta: string;
  unidad: string;
}

/**
 * GET /api/cron/refresh-trm
 * Cron job: fetch the latest TRM (Tasa Representativa del Mercado) from datos.gov.co
 * and upsert it into the trm_history table.
 * Runs weekdays at 10:00 UTC (5:00 AM Colombia).
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

    // 1. Fetch latest TRM from datos.gov.co
    const response = await fetch(TRM_API_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      console.error(
        'Error fetching TRM from datos.gov.co:',
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: `datos.gov.co responded with ${response.status}` },
        { status: 502 },
      );
    }

    const data: DatosGovTrmRecord[] = await response.json();

    if (!data || data.length === 0) {
      console.error('No TRM data returned from datos.gov.co');
      return NextResponse.json(
        { error: 'No TRM data returned from API' },
        { status: 502 },
      );
    }

    const record = data[0]!;
    const trmValue = parseFloat(record.valor);

    if (isNaN(trmValue) || trmValue <= 0) {
      console.error('Invalid TRM value:', record.valor);
      return NextResponse.json(
        { error: `Invalid TRM value: ${record.valor}` },
        { status: 502 },
      );
    }

    // Extract date from vigenciadesde (ISO string from API)
    const vigenciaDate = record.vigenciadesde
      ? new Date(record.vigenciadesde).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    // 2. Upsert into trm_history using admin client (no user session in cron)
    const client = getSupabaseServerAdminClient();

    const { error: upsertError } = await client
      .from('trm_history')
      .upsert(
        {
          date: vigenciaDate,
          rate: trmValue,
          source: 'datos.gov.co',
        },
        { onConflict: 'date' },
      );

    if (upsertError) {
      console.error('Error upserting TRM into trm_history:', upsertError);
      return NextResponse.json(
        { error: 'Error al guardar TRM en base de datos' },
        { status: 500 },
      );
    }

    console.log(`TRM refreshed: ${trmValue} for date ${vigenciaDate}`);

    return NextResponse.json({
      success: true,
      trm: trmValue,
      date: vigenciaDate,
      source: 'datos.gov.co',
    });
  } catch (error) {
    console.error('Error in cron/refresh-trm:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en cron' },
      { status: 500 },
    );
  }
}
