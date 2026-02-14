import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

// --- Zod Schema ---
const createTrmSchema = z.object({
  rate_date: z.string().min(1, 'rate_date es requerido'),
  rate_value: z.number().positive('rate_value debe ser un número positivo'),
  source: z.string().optional().default('manual'),
});

/**
 * Fetch TRM from Banco de la Republica API (datos.gov.co)
 */
async function fetchTRMFromBanrep(date: string): Promise<number | null> {
  try {
    const url = `https://www.datos.gov.co/resource/32sa-8pi3.json?$where=vigenciadesde='${date}'&$limit=1`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.length > 0 && data[0].valor) {
      return parseFloat(data[0].valor.replace(',', '.'));
    }
    return null;
  } catch (error) {
    console.error('Error fetching TRM from Banrep:', error);
    return null;
  }
}

/**
 * GET /api/trm
 * Obtener TRM actual o consultar API de Banco de la Republica
 * Permission required: products:read (any authenticated user that can see products)
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'products:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para consultar TRM' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const shouldFetch = searchParams.get('fetch') === 'true';

    if (shouldFetch) {
      const today = new Date().toISOString().split('T')[0]!;
      const trmValue = await fetchTRMFromBanrep(today);

      if (!trmValue) {
        return NextResponse.json(
          { error: 'No se pudo obtener la TRM de la API de Banco de la República' },
          { status: 500 },
        );
      }

      const { error: saveError } = await client
        .from('trm_rates')
        .upsert({
          organization_id: user.organization_id,
          rate_date: today,
          rate_value: trmValue,
          source: 'api_banrep',
        }, {
          onConflict: 'organization_id,rate_date',
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving TRM:', saveError);
        return NextResponse.json({ error: saveError.message }, { status: 500 });
      }

      return NextResponse.json({
        data: { rate: trmValue, date: today, source: 'api_banrep', saved: true },
      });
    }

    // Obtener TRM actual usando el RPC
    const { data: currentTRM, error: rpcError } = await client
      .rpc('get_current_trm', { org_uuid: user.organization_id });

    if (rpcError) {
      console.error('Error calling get_current_trm RPC:', rpcError);
      return NextResponse.json({ error: rpcError.message }, { status: 500 });
    }

    if (!currentTRM) {
      return NextResponse.json(
        { error: 'No hay TRM configurada para esta organización' },
        { status: 404 },
      );
    }

    const { data: trmDetails, error: detailsError } = await client
      .from('trm_rates')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('rate_date', { ascending: false })
      .limit(1)
      .single();

    if (detailsError) {
      console.error('Error fetching TRM details:', detailsError);
      return NextResponse.json({ error: detailsError.message }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        rate: currentTRM,
        date: trmDetails.rate_date,
        source: trmDetails.source,
      },
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/trm:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/trm
 * Registrar/actualizar TRM manualmente
 * Permission required: products:manage_pricing (solo Gerencia)
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'products:manage_pricing');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para actualizar la TRM' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createTrmSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { rate_date, rate_value, source } = parsed.data;

    const { data, error } = await client
      .from('trm_rates')
      .upsert({
        organization_id: user.organization_id,
        rate_date,
        rate_value,
        source,
      }, {
        onConflict: 'organization_id,rate_date',
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting TRM rate:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/trm:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
