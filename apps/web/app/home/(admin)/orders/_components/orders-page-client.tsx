'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { createOrdersTableColumns, type OrderAction } from './order-table-columns';
import { OrderFilters } from './order-filters';
import { OrderFormDialog } from './order-form-dialog';
import { OrderDetailDialog } from './order-detail-dialog';
import { OrderStatusDialog } from './order-status-dialog';
import { useOrders } from '../_lib/order-queries';
import type { Order, OrderFilters as OrderFiltersType } from '../_lib/types';

interface OrdersPageClientProps {
  initialData?: {
    data: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export function OrdersPageClient({ initialData }: OrdersPageClientProps) {
  const [currentPage, setCurrentPage] = useState(1);
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

  // TanStack Query — use server-prefetched data for initial page load
  const isInitialPage = currentPage === 1 && Object.keys(filters).length === 0;
  const { data, isLoading, isFetching, refetch } = useOrders(
    { ...filters, page: currentPage },
    isInitialPage ? initialData : undefined,
  );

  const orders: Order[] = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

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
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
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
        onSuccess={() => refetch()}
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
        onSuccess={() => refetch()}
      />
    </div>
  );
}
