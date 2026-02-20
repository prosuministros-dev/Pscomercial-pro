import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { CustomersPageClient } from './_components/customers-page-client';

export const metadata = {
  title: 'Clientes | PROSUMINISTROS CRM',
  description: 'Gestione los clientes de su organización',
};

export default async function CustomersPage() {
  const client = getSupabaseServerClient();
  const user = await requireUser(client);

  // TODO: Implementar verificación de permisos
  // await checkPermission(user, 'customers:read');

  return <CustomersPageClient />;
}
