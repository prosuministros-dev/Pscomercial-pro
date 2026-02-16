'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Button } from '@kit/ui/button';
import { PermissionGate } from '@kit/rbac/permission-gate';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table';
import { RefreshCw, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { createOrdersTableColumns, type OrderAction } from './order-table-columns';
import { OrderFilters } from './order-filters';
import { OrderFormDialog } from './order-form-dialog';
import { OrderDetailDialog } from './order-detail-dialog';
import { OrderStatusDialog } from './order-status-dialog';
import type { Order, OrderFilters as OrderFiltersType } from '../_lib/types';

export function OrdersPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<OrderFiltersType>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'order_number', desc: true },
  ]);

  // Dialogs
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [statusOrder, setStatusOrder] = useState<Order | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const fetchOrders = useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const params = new URLSearchParams();
        params.set('page', currentPage.toString());
        params.set('limit', '20');

        if (filters.status) params.set('status', filters.status);
        if (filters.customer_id) params.set('customer_id', filters.customer_id);
        if (filters.advisor_id) params.set('advisor_id', filters.advisor_id);
        if (filters.payment_status) params.set('payment_status', filters.payment_status);
        if (filters.search) params.set('search', filters.search);
        if (filters.from_date) params.set('from_date', filters.from_date);
        if (filters.to_date) params.set('to_date', filters.to_date);

        const response = await fetch(`/api/orders?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Error al cargar los pedidos');
        }

        const data = await response.json();
        setOrders(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Error', {
          description: 'No se pudieron cargar los pedidos',
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentPage, filters],
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = () => {
    fetchOrders(true);
  };

  const handleAction = useCallback((action: OrderAction) => {
    switch (action.type) {
      case 'view':
        setDetailOrderId(action.order.id);
        setIsDetailOpen(true);
        break;
      case 'change-status':
        setStatusOrder(action.order);
        setIsStatusOpen(true);
        break;
    }
  }, []);

  const columns = useMemo(() => createOrdersTableColumns(handleAction), [handleAction]);

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
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

      {/* Filters */}
      <OrderFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No se encontraron pedidos
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Crea tu primer pedido desde una cotización aprobada
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => {
                        setDetailOrderId(row.original.id);
                        setIsDetailOpen(true);
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

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
