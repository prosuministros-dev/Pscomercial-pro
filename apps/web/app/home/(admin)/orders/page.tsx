import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '~/lib/require-auth';
import { OrdersPageClient } from './_components/orders-page-client';

export const metadata = {
  title: 'Pedidos',
};

export default async function OrdersPage() {
  const client = getSupabaseServerClient();
  const user = await requireUser(client);

  const limit = 20;
  const { data, count } = await client
    .from('orders')
    .select(
      `
      *,
      customer:customers(id, business_name, nit, city),
      advisor:profiles!orders_advisor_id_fkey(id, full_name, email),
      quote:quotes!orders_quote_id_fkey(id, quote_number)
    `,
      { count: 'exact' },
    )
    .eq('organization_id', user.organization_id)
    .is('deleted_at', null)
    .order('order_number', { ascending: false })
    .range(0, limit - 1);

  return (
    <OrdersPageClient
      initialData={{
        data: data || [],
        pagination: {
          page: 1,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      }}
    />
  );
}
