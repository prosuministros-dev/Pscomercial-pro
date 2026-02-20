import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { checkPermission } from '@kit/rbac/check-permission';
import { requireUser } from '~/lib/require-auth';
import { handleApiError } from '~/lib/api-error-handler';

/**
 * GET /api/reports?type=leads&from=...&to=...&advisor_id=...&status=...
 * Returns report data by type with aggregated chart_data, table_data, summary
 * Permission: reports:read
 */
export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const user = await requireUser(client);

    const allowed = await checkPermission(user.id, 'reports:read');
    if (!allowed) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'leads';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const advisorId = searchParams.get('advisor_id');
    const status = searchParams.get('status');

    const orgId = user.organization_id;

    switch (type) {
      case 'leads':
        return await getLeadsReport(client, orgId, { from, to, advisorId, status });
      case 'quotes':
        return await getQuotesReport(client, orgId, { from, to, advisorId, status });
      case 'orders':
        return await getOrdersReport(client, orgId, { from, to });
      case 'revenue':
        return await getRevenueReport(client, orgId, { from, to });
      case 'performance':
        return await getPerformanceReport(client, orgId, { from, to });
      default:
        return NextResponse.json({ error: 'Tipo de reporte no válido' }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error, 'GET /api/reports');
  }
}

type Client = ReturnType<typeof getSupabaseServerClient>;
interface Filters {
  from: string | null;
  to: string | null;
  advisorId?: string | null;
  status?: string | null;
}

async function getLeadsReport(client: Client, orgId: string, f: Filters) {
  let query = client
    .from('leads')
    .select('status', { count: 'exact' })
    .eq('organization_id', orgId);
  if (f.from) query = query.gte('created_at', f.from);
  if (f.to) query = query.lte('created_at', `${f.to}T23:59:59`);
  if (f.advisorId) query = query.eq('assigned_to', f.advisorId);

  // Get all leads with status for grouping
  const { data: leads, error } = await client
    .from('leads')
    .select('id, status, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', f.from || '2020-01-01')
    .lte('created_at', f.to ? `${f.to}T23:59:59` : '2099-12-31');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const grouped: Record<string, number> = {};
  for (const lead of leads || []) {
    grouped[lead.status] = (grouped[lead.status] || 0) + 1;
  }

  const STATUS_LABELS: Record<string, string> = {
    new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado',
    proposal: 'Propuesta', won: 'Ganado', lost: 'Perdido',
  };

  const chart_data = Object.entries(grouped).map(([status, count]) => ({
    label: STATUS_LABELS[status] || status,
    value: count,
  }));

  return NextResponse.json({
    chart_data,
    table_data: leads || [],
    summary: { total: (leads || []).length },
  });
}

async function getQuotesReport(client: Client, orgId: string, f: Filters) {
  const { data: quotes, error } = await client
    .from('quotes')
    .select('id, status, total, advisor:profiles!quotes_advisor_id_fkey(full_name)')
    .eq('organization_id', orgId)
    .gte('quote_date', f.from || '2020-01-01')
    .lte('quote_date', f.to || '2099-12-31');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const byAdvisor: Record<string, { total: number; won: number; value: number }> = {};
  for (const q of quotes || []) {
    const name = (q.advisor as any)?.full_name || 'Sin asignar';
    if (!byAdvisor[name]) byAdvisor[name] = { total: 0, won: 0, value: 0 };
    byAdvisor[name].total++;
    if (q.status === 'approved' || q.status === 'converted') {
      byAdvisor[name].won++;
      byAdvisor[name].value += q.total || 0;
    }
  }

  const chart_data = Object.entries(byAdvisor).map(([name, data]) => ({
    label: name,
    value: data.total,
    secondary_value: data.won,
  }));

  return NextResponse.json({
    chart_data,
    table_data: quotes || [],
    summary: {
      total: (quotes || []).length,
      total_value: (quotes || []).reduce((sum, q) => sum + (q.total || 0), 0),
    },
  });
}

async function getOrdersReport(client: Client, orgId: string, f: Filters) {
  const { data: orders, error } = await client
    .from('orders')
    .select('id, order_number, status, total, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', f.from || '2020-01-01')
    .lte('created_at', f.to ? `${f.to}T23:59:59` : '2099-12-31')
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by week
  const byWeek: Record<string, number> = {};
  for (const o of orders || []) {
    const d = new Date(o.created_at);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    const weekKey = monday.toISOString().slice(0, 10);
    byWeek[weekKey] = (byWeek[weekKey] || 0) + 1;
  }

  const chart_data = Object.entries(byWeek).map(([week, count]) => ({
    label: new Date(week).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    value: count,
  }));

  return NextResponse.json({
    chart_data,
    table_data: orders || [],
    summary: {
      total: (orders || []).length,
      total_value: (orders || []).reduce((sum, o) => sum + (o.total || 0), 0),
    },
  });
}

async function getRevenueReport(client: Client, orgId: string, f: Filters) {
  const { data: invoices, error } = await client
    .from('invoices')
    .select('id, invoice_number, total, currency, invoice_date, status')
    .eq('organization_id', orgId)
    .gte('invoice_date', f.from || '2020-01-01')
    .lte('invoice_date', f.to || '2099-12-31')
    .order('invoice_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group by month
  const byMonth: Record<string, number> = {};
  for (const inv of invoices || []) {
    const monthKey = inv.invoice_date.slice(0, 7);
    byMonth[monthKey] = (byMonth[monthKey] || 0) + (inv.total || 0);
  }

  const chart_data = Object.entries(byMonth).map(([month, total]) => {
    const [y, m] = month.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return {
      label: d.toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }),
      value: total,
    };
  });

  return NextResponse.json({
    chart_data,
    table_data: invoices || [],
    summary: {
      total_invoices: (invoices || []).length,
      total_revenue: (invoices || []).reduce((sum, i) => sum + (i.total || 0), 0),
    },
  });
}

async function getPerformanceReport(client: Client, orgId: string, f: Filters) {
  // Get advisors with their leads and quotes performance
  const { data: leads } = await client
    .from('leads')
    .select('assigned_to, status')
    .eq('organization_id', orgId)
    .gte('created_at', f.from || '2020-01-01')
    .lte('created_at', f.to ? `${f.to}T23:59:59` : '2099-12-31');

  const { data: quotes } = await client
    .from('quotes')
    .select('advisor_id, status')
    .eq('organization_id', orgId)
    .gte('quote_date', f.from || '2020-01-01')
    .lte('quote_date', f.to || '2099-12-31');

  // Get advisor names
  const advisorIds = new Set<string>();
  (leads || []).forEach((l) => l.assigned_to && advisorIds.add(l.assigned_to));
  (quotes || []).forEach((q) => q.advisor_id && advisorIds.add(q.advisor_id));

  const { data: profiles } = await client
    .from('profiles')
    .select('id, full_name')
    .in('id', [...advisorIds]);

  const nameMap: Record<string, string> = {};
  (profiles || []).forEach((p) => (nameMap[p.id] = p.full_name));

  const perf: Record<string, { leads: number; converted: number; quotes: number; won: number }> = {};

  for (const lead of leads || []) {
    const id = lead.assigned_to;
    if (!id) continue;
    if (!perf[id]) perf[id] = { leads: 0, converted: 0, quotes: 0, won: 0 };
    perf[id].leads++;
    if (lead.status === 'won') perf[id].converted++;
  }

  for (const quote of quotes || []) {
    const id = quote.advisor_id;
    if (!id) continue;
    if (!perf[id]) perf[id] = { leads: 0, converted: 0, quotes: 0, won: 0 };
    perf[id].quotes++;
    if (quote.status === 'approved' || quote.status === 'converted') perf[id].won++;
  }

  const chart_data = Object.entries(perf).map(([id, data]) => ({
    label: nameMap[id] || id.slice(0, 8),
    value: data.leads,
    secondary_value: data.converted,
  }));

  const table_data = Object.entries(perf).map(([id, data]) => ({
    advisor: nameMap[id] || id,
    leads: data.leads,
    converted: data.converted,
    quotes: data.quotes,
    won: data.won,
    conversion_rate: data.leads > 0 ? Math.round((data.converted / data.leads) * 100) : 0,
  }));

  return NextResponse.json({
    chart_data,
    table_data,
    summary: {
      total_advisors: Object.keys(perf).length,
      total_leads: (leads || []).length,
      total_quotes: (quotes || []).length,
    },
  });
}
