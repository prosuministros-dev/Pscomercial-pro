import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { ProductsPageClient } from './_components/products-page-client';

export const metadata = {
  title: 'Productos | PROSUMINISTROS CRM',
  description: 'Gestione el catálogo de productos de su organización',
};

export default async function ProductsPage() {
  const client = getSupabaseServerClient();
  const user = await requireUser(client);

  // TODO: Implementar verificación de permisos
  // await checkPermission(user, 'products:read');

  return <ProductsPageClient />;
}
