import { PageHeader } from '~/components/shared/page-header';
import { DashboardDemo } from '~/home/_components/dashboard-demo';
import { DashboardDemoEnhanced } from '~/home/_components/dashboard-demo-enhanced';

export default function HomePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Bienvenido a PROSUMINISTROS CRM"
      />

      <DashboardDemoEnhanced />

      <DashboardDemo />
    </div>
  );
}
