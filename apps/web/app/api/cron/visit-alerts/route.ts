import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * GET /api/cron/visit-alerts
 * Cron job: Notify advisors about customers who haven't been visited in 30+ days
 * Runs daily at 13 UTC (8am Colombia)
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

    // Get all active customers with an assigned sales rep
    const { data: customers, error: custError } = await client
      .from('customers')
      .select('id, business_name, assigned_sales_rep_id, organization_id')
      .eq('status', 'active')
      .is('deleted_at', null)
      .not('assigned_sales_rep_id', 'is', null);

    if (custError) {
      console.error('Error fetching customers:', custError);
      return NextResponse.json({ error: 'Error al buscar clientes' }, { status: 500 });
    }

    if (!customers?.length) {
      return NextResponse.json({ processed: 0, notified: 0 });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // For each customer, check the last visit date
    const customerIds = customers.map((c) => c.id);

    const { data: recentVisits, error: visitError } = await client
      .from('customer_visits')
      .select('customer_id, visit_date')
      .in('customer_id', customerIds)
      .eq('status', 'realizada')
      .gte('visit_date', thirtyDaysAgo.toISOString())
      .order('visit_date', { ascending: false });

    if (visitError) {
      console.error('Error fetching visits:', visitError);
      return NextResponse.json({ error: 'Error al buscar visitas' }, { status: 500 });
    }

    // Set of customers that HAVE been visited recently
    const visitedCustomerIds = new Set(
      (recentVisits || []).map((v) => v.customer_id),
    );

    // Customers NOT visited in 30 days
    const unvisitedCustomers = customers.filter(
      (c) => !visitedCustomerIds.has(c.id),
    );

    if (!unvisitedCustomers.length) {
      return NextResponse.json({ processed: customers.length, notified: 0 });
    }

    // Group by sales rep
    const byAdvisor: Record<
      string,
      { orgId: string; customers: typeof unvisitedCustomers }
    > = {};

    for (const customer of unvisitedCustomers) {
      const advisorId = customer.assigned_sales_rep_id!;
      if (!byAdvisor[advisorId]) {
        byAdvisor[advisorId] = { orgId: customer.organization_id, customers: [] };
      }
      byAdvisor[advisorId].customers.push(customer);
    }

    let notified = 0;
    for (const [advisorId, group] of Object.entries(byAdvisor)) {
      const count = group.customers.length;
      const customerNames = group.customers
        .slice(0, 3)
        .map((c) => c.business_name)
        .join(', ');
      const suffix = count > 3 ? ` y ${count - 3} más` : '';

      const { error: notifError } = await client
        .from('notifications')
        .insert({
          organization_id: group.orgId,
          user_id: advisorId,
          type: 'alert',
          title: `${count} cliente${count > 1 ? 's' : ''} sin visita en 30 días`,
          message: `Tienes clientes pendientes de visita: ${customerNames}${suffix}. Programa tus visitas para mantener la relación comercial.`,
          action_url: '/home/customers',
        });

      if (!notifError) notified++;
    }

    return NextResponse.json({
      processed: customers.length,
      unvisited: unvisitedCustomers.length,
      advisors_notified: notified,
    });
  } catch (error) {
    console.error('Error in cron/visit-alerts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error en cron' },
      { status: 500 },
    );
  }
}
