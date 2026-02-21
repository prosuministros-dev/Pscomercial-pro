import { CustomersPageClient } from './_components/customers-page-client';

export const metadata = {
  title: 'Clientes | PROSUMINISTROS CRM',
  description: 'Gestione los clientes de su organización',
};

export default async function CustomersPage() {
  // Auth is handled by the parent layout (requireUserInServerComponent)
  return <CustomersPageClient />;
}
