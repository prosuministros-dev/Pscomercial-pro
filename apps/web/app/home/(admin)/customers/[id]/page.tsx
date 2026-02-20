import { CustomerDetailClient } from './_components/customer-detail-client';

export const metadata = {
  title: 'Ficha del Cliente | PROSUMINISTROS CRM',
  description: 'Información detallada del cliente y su historial comercial',
};

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <CustomerDetailClient customerId={params.id} />;
}
