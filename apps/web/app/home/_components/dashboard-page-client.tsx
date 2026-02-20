'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@kit/ui/tabs';
import { DashboardFilters } from './dashboard-filters';
import { CommercialDashboard } from './commercial-dashboard';
import { OperationalDashboard } from './operational-dashboard';
import type { DashboardFilters as Filters } from '../_lib/types';

// Default to current month range so dashboard loads with data
function getDefaultFilters(): Filters {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function DashboardPageClient() {
  const [filters, setFilters] = useState<Filters>(getDefaultFilters);
  const [activeTab, setActiveTab] = useState('commercial');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Bienvenido a PROSUMINISTROS CRM
          </p>
        </div>
        <DashboardFilters
          filters={filters}
          onFiltersChange={setFilters}
          showAdvisor={activeTab === 'commercial'}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="commercial">Comercial</TabsTrigger>
          <TabsTrigger value="operational">Operativo</TabsTrigger>
        </TabsList>

        <TabsContent value="commercial" className="mt-6">
          <CommercialDashboard filters={filters} />
        </TabsContent>

        <TabsContent value="operational" className="mt-6">
          <OperationalDashboard filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
