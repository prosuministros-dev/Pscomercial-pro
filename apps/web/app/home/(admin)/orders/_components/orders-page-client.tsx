'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@kit/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import { PermissionGate } from '@kit/rbac/permission-gate';
import {
  RefreshCw,
  Plus,
  ClipboardList,
  AlertTriangle,
  LayoutGrid,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PanelPrincipalTab } from './panel-principal-tab';
import { ControlPendientesTab } from './control-pendientes-tab';
import { TableroOperativoTab } from './tablero-operativo-tab';
import { OrderFormDialog } from './order-form-dialog';
import { OrderDetailDialog } from './order-detail-dialog';
import { OrderStatusDialog } from './order-status-dialog';
import type { Order } from '../_lib/types';

export function OrdersPageClient() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('panel');

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState<Order | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleViewDetail = (orderId: string) => {
    setDetailOrderId(orderId);
    setIsDetailOpen(true);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['orders'] });
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Pedidos
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gestiona y da seguimiento a los pedidos
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
            <PermissionGate permission="orders:create">
              <Button
                onClick={() => setIsFormOpen(true)}
                className="bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Pedido
              </Button>
            </PermissionGate>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <TabsList className="grid w-full grid-cols-3 mt-4">
          <TabsTrigger value="panel" className="gap-1.5">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Panel Principal</span>
            <span className="sm:hidden">Panel</span>
          </TabsTrigger>
          <TabsTrigger value="pendientes" className="gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden sm:inline">Control de Pendientes</span>
            <span className="sm:hidden">Pendientes</span>
          </TabsTrigger>
          <TabsTrigger value="tablero" className="gap-1.5">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Tablero Operativo</span>
            <span className="sm:hidden">Tablero</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="panel">
          <PanelPrincipalTab onViewDetail={handleViewDetail} />
        </TabsContent>

        <TabsContent value="pendientes">
          <ControlPendientesTab onViewDetail={handleViewDetail} />
        </TabsContent>

        <TabsContent value="tablero">
          <TableroOperativoTab onViewDetail={handleViewDetail} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <OrderFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleRefresh}
      />

      <OrderDetailDialog
        orderId={detailOrderId}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />

      <OrderStatusDialog
        order={statusOrder}
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
