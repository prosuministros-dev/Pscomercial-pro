import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';

/**
 * GET /api/quotes/approvals
 * List pending margin approvals for the organization
 * Permission: quotes:approve
 */
export async function GET(request: Request) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'quotes:approve');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso para ver aprobaciones' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = (page - 1) * limit;
    const status = searchParams.get('status') || 'pending';

    let query = client
      .from('quote_approvals')
      .select(
        `
        *,
        quote:quotes!quote_approvals_quote_id_fkey(
          id, quote_number, customer_id, advisor_id, margin_pct, total, currency, status,
          customer:customers(id, business_name, nit),
          advisor:profiles!quotes_advisor_id_fkey(id, full_name, email)
        ),
        requester:profiles!quote_approvals_requested_by_fkey(id, full_name, email),
        reviewer:profiles!quote_approvals_reviewed_by_fkey(id, full_name, email)
      `,
        { count: 'exact' },
      )
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching approvals:', error);
      return NextResponse.json({ error: 'Error al obtener las aprobaciones' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/quotes/approvals:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar la solicitud' },
      { status: 500 },
    );
  }
}
