import { ProductsPageClient } from './_components/products-page-client';

export const metadata = {
  title: 'Productos | PROSUMINISTROS CRM',
  description: 'Gestione el catálogo de productos de su organización',
};

export default async function ProductsPage() {
  // Auth is handled by the parent layout (requireUserInServerComponent)
  return <ProductsPageClient />;
}
