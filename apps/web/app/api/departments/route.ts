import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/departments
 * List Colombian departments for delivery destination selector
 * Permission: any authenticated user
 */
export async function GET() {
  try {
    const client = getSupabaseServerClient();
    await requireUser(client);

    const { data, error } = await client
      .from('colombian_departments')
      .select('code, name')
      .order('name');

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json({ error: 'Error al obtener departamentos' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return handleApiError(error, 'GET /api/departments');
  }
}
