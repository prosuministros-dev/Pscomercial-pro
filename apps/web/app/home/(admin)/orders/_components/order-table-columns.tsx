'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { PermissionGate } from '@kit/rbac/permission-gate';
import { MoreHorizontal, Eye, ArrowRightLeft } from 'lucide-react';
import type { Order } from '../_lib/types';

const STATUS_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-800',
  payment_pending: 'bg-yellow-100 text-yellow-800',
  payment_confirmed: 'bg-emerald-100 text-emerald-800',
  available_for_purchase: 'bg-indigo-100 text-indigo-800',
  in_purchase: 'bg-purple-100 text-purple-800',
  partial_delivery: 'bg-orange-100 text-orange-800',
  in_logistics: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-teal-100 text-teal-800',
  invoiced: 'bg-lime-100 text-lime-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  created: 'Creado',
  payment_pending: 'Pago Pendiente',
  payment_confirmed: 'Pago Confirmado',
  available_for_purchase: 'Disp. Compra',
  in_purchase: 'En Compra',
  partial_delivery: 'Entrega Parcial',
  in_logistics: 'En Logística',
  delivered: 'Entregado',
  invoiced: 'Facturado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export type OrderAction =
  | { type: 'view'; order: Order }
  | { type: 'change-status'; order: Order };

export function createOrdersTableColumns(
  onAction: (action: OrderAction) => void,
): ColumnDef<Order>[] {
  return [
    {
      accessorKey: 'order_number',
      header: '# Pedido',
      cell: ({ row }) => (
        <span className="font-mono font-medium">#{row.getValue('order_number')}</span>
      ),
    },
    {
      accessorKey: 'customer',
      header: 'Cliente',
      cell: ({ row }) => {
        const customer = row.original.customer;
        if (!customer) return <span className="text-gray-400">N/A</span>;
        return (
          <div>
            <div className="font-medium text-sm">{customer.business_name}</div>
            {customer.nit && <div className="text-xs text-gray-500">NIT: {customer.nit}</div>}
          </div>
        );
      },
    },
    {
      accessorKey: 'advisor',
      header: 'Asesor',
      cell: ({ row }) => {
        const advisor = row.original.advisor;
        if (!advisor) return <span className="text-gray-400">N/A</span>;
        return <div className="font-medium text-sm">{advisor.full_name}</div>;
      },
    },
    {
      accessorKey: 'quote',
      header: 'Cotización',
      cell: ({ row }) => {
        const quote = row.original.quote;
        if (!quote) return <span className="text-gray-400">—</span>;
        return (
          <span className="font-mono text-sm text-cyan-600">
            #{quote.quote_number}
          </span>
        );
      },
    },
    {
      accessorKey: 'total',
      header: 'Total',
      cell: ({ row }) => {
        const order = row.original;
        const formatted = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: order.currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(order.total);
        return <div className="font-mono font-semibold text-sm">{formatted}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Estado',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const colorClass = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
        const label = STATUS_LABELS[status] || status;
        return (
          <Badge className={`${colorClass} text-xs`}>
            {label}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Fecha',
      cell: ({ row }) => {
        const date = new Date(row.getValue('created_at'));
        return (
          <div className="text-sm">
            {format(date, 'd MMM yyyy', { locale: es })}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const order = row.original;
        const isTerminal = ['completed', 'cancelled'].includes(order.status);

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAction({ type: 'view', order });
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Ver Detalle
              </DropdownMenuItem>
              {!isTerminal && (
                <PermissionGate permission="orders:update">
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction({ type: 'change-status', order });
                    }}
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    Cambiar Estado
                  </DropdownMenuItem>
                </PermissionGate>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
