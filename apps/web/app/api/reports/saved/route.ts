import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { z } from 'zod';

const saveReportSchema = z.object({
  name: z.string().min(1).max(255),
  report_type: z.enum(['leads', 'quotes', 'orders', 'revenue', 'performance']),
  filters: z.record(z.unknown()).default({}),
  is_shared: z.boolean().default(false),
});

/**
 * GET /api/reports/saved
 * List saved reports for the current user + shared ones
 * Permission: reports:read
 */
export async function GET() {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'reports:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { data, error } = await client
      .from('saved_reports')
      .select('*')
      .eq('organization_id', user.organization_id)
      .or(`user_id.eq.${user.id},is_shared.eq.true`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/reports/saved:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/reports/saved
 * Save a new report configuration
 * Permission: reports:create
 */
export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'reports:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = saveReportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { data, error } = await client
      .from('saved_reports')
      .insert({
        organization_id: user.organization_id,
        user_id: user.id,
        name: parsed.data.name,
        report_type: parsed.data.report_type,
        filters: parsed.data.filters,
        is_shared: parsed.data.is_shared,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/reports/saved:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/reports/saved?id=xxx
 * Delete a saved report (only owner)
 * Permission: reports:create
 */
export async function DELETE(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'reports:create');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 });
    }

    const { error } = await client
      .from('saved_reports')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/reports/saved:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error' },
      { status: 500 },
    );
  }
}
