import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';

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
 * Permission required: trm:read
 * 
 * Query params:
 * - fetch=true: Consulta la API de datos.gov.co y guarda en DB
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('trm:read')
    
    const { searchParams } = new URL(request.url);
    const shouldFetch = searchParams.get('fetch') === 'true';

    if (shouldFetch) {
      // Consultar API de Banco de la Republica
      const today = new Date().toISOString().split('T')[0]!;
      const trmValue = await fetchTRMFromBanrep(today);

      if (!trmValue) {
        return NextResponse.json(
          { error: 'No se pudo obtener la TRM de la API de Banco de la Republica' },
          { status: 500 }
        );
      }

      // Guardar en la base de datos (UPSERT)
      const { data: savedTRM, error: saveError } = await client
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
        return NextResponse.json(
          { error: saveError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: {
          rate: trmValue,
          date: today,
          source: 'api_banrep',
          saved: true,
        },
      });
    }

    // Obtener TRM actual usando el RPC
    const { data: currentTRM, error: rpcError } = await client
      .rpc('get_current_trm', {
        org_uuid: user.organization_id,
      });

    if (rpcError) {
      console.error('Error calling get_current_trm RPC:', rpcError);
      return NextResponse.json(
        { error: rpcError.message },
        { status: 500 }
      );
    }

    if (!currentTRM) {
      return NextResponse.json(
        { error: 'No hay TRM configurada para esta organizacion' },
        { status: 404 }
      );
    }

    // Obtener detalles de la TRM mas reciente
    const { data: trmDetails, error: detailsError } = await client
      .from('trm_rates')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('rate_date', { ascending: false })
      .limit(1)
      .single();

    if (detailsError) {
      console.error('Error fetching TRM details:', detailsError);
      return NextResponse.json(
        { error: detailsError.message },
        { status: 500 }
      );
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/trm
 * Registrar/actualizar TRM manualmente
 * Permission required: trm:update (solo Gerencia)
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    // TODO: Implementar checkPermission('trm:update')
    // Solo roles de Gerencia pueden actualizar la TRM

    const body = await request.json();
    const { rate_date, rate_value, source } = body;

    // Validaciones basicas
    if (!rate_date || !rate_value) {
      return NextResponse.json(
        { error: 'rate_date y rate_value son campos requeridos' },
        { status: 400 }
      );
    }

    // Validar que rate_value sea un numero positivo
    if (typeof rate_value !== 'number' || rate_value <= 0) {
      return NextResponse.json(
        { error: 'rate_value debe ser un numero positivo' },
        { status: 400 }
      );
    }

    // UPSERT: actualizar si ya existe para esa fecha, crear si no existe
    const { data, error } = await client
      .from('trm_rates')
      .upsert({
        organization_id: user.organization_id,
        rate_date,
        rate_value,
        source: source || 'manual',
      }, {
        onConflict: 'organization_id,rate_date',
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting TRM rate:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/trm:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
