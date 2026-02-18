import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/reports/export?type=leads&from=...&to=...
 * Streams CSV data for the specified report type
 * Permission: reports:export
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'reports:export');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'leads';
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const orgId = user.organization_id;
    let rows: Record<string, unknown>[] = [];
    let filename = 'reporte';

    switch (type) {
      case 'leads': {
        filename = 'leads';
        const { data } = await client
          .from('leads')
          .select('id, company_name, contact_name, contact_email, status, source, created_at')
          .eq('organization_id', orgId)
          .gte('created_at', from || '2020-01-01')
          .lte('created_at', to ? `${to}T23:59:59` : '2099-12-31')
          .order('created_at', { ascending: false })
          .limit(5000);
        rows = data || [];
        break;
      }
      case 'quotes': {
        filename = 'cotizaciones';
        const { data } = await client
          .from('quotes')
          .select('id, quote_number, status, total, currency, quote_date, valid_until')
          .eq('organization_id', orgId)
          .gte('quote_date', from || '2020-01-01')
          .lte('quote_date', to || '2099-12-31')
          .order('quote_date', { ascending: false })
          .limit(5000);
        rows = data || [];
        break;
      }
      case 'orders': {
        filename = 'pedidos';
        const { data } = await client
          .from('orders')
          .select('id, order_number, status, total, currency, created_at, payment_status')
          .eq('organization_id', orgId)
          .gte('created_at', from || '2020-01-01')
          .lte('created_at', to ? `${to}T23:59:59` : '2099-12-31')
          .order('created_at', { ascending: false })
          .limit(5000);
        rows = data || [];
        break;
      }
      case 'revenue': {
        filename = 'ingresos';
        const { data } = await client
          .from('invoices')
          .select('id, invoice_number, total, currency, invoice_date, status, due_date')
          .eq('organization_id', orgId)
          .gte('invoice_date', from || '2020-01-01')
          .lte('invoice_date', to || '2099-12-31')
          .order('invoice_date', { ascending: false })
          .limit(5000);
        rows = data || [];
        break;
      }
      case 'performance': {
        filename = 'rendimiento';
        // Reuse the same logic from the main report
        const res = await fetch(
          `${request.nextUrl.origin}/api/reports?type=performance&from=${from || ''}&to=${to || ''}`,
          {
            headers: { cookie: request.headers.get('cookie') || '' },
          },
        );
        if (res.ok) {
          const data = await res.json();
          rows = data.table_data || [];
        }
        break;
      }
    }

    if (rows.length === 0) {
      return new Response('Sin datos para exportar', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Build CSV
    const headers = Object.keys(rows[0]!);
    const csvLines: string[] = [headers.join(',')];

    for (const row of rows) {
      const line = headers
        .map((h) => {
          const val = row[h];
          if (val == null) return '';
          const str = String(val);
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',');
      csvLines.push(line);
    }

    const csv = csvLines.join('\n');
    const today = new Date().toISOString().slice(0, 10);

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}_${today}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/reports/export');
  }
}
