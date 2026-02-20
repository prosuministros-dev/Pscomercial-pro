'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { Package, LayoutGrid, RefreshCw } from 'lucide-react';
import { VistaOperativa } from './vista-operativa';
import { VistaEjecutivaKanban } from './vista-ejecutiva-kanban';
import { useTableroOperativo } from '../_lib/order-queries';

interface TableroOperativoTabProps {
  onViewDetail: (orderId: string) => void;
}

export function TableroOperativoTab({ onViewDetail }: TableroOperativoTabProps) {
  const { data, isLoading } = useTableroOperativo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const orders = data || [];

  return (
    <Tabs defaultValue="operativa" className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="operativa" className="gap-1">
          <Package className="h-4 w-4" />
          Vista Operativa
        </TabsTrigger>
        <TabsTrigger value="ejecutiva" className="gap-1">
          <LayoutGrid className="h-4 w-4" />
          Vista Ejecutiva
        </TabsTrigger>
      </TabsList>
      <TabsContent value="operativa">
        <VistaOperativa data={orders} onViewDetail={onViewDetail} />
      </TabsContent>
      <TabsContent value="ejecutiva">
        <VistaEjecutivaKanban data={orders} onViewDetail={onViewDetail} />
      </TabsContent>
    </Tabs>
  );
}
