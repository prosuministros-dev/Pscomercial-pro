'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { useOrders } from '../_lib/order-queries';
import { STATUS_LABELS } from '../_lib/schemas';
import type { Order } from '../_lib/types';

// Order of columns for kanban
const KANBAN_STATUSES = [
  'created',
  'payment_pending',
  'payment_confirmed',
  'available_for_purchase',
  'in_purchase',
  'partial_delivery',
  'in_logistics',
  'delivered',
  'invoiced',
  'completed',
];

const STATUS_BG: Record<string, string> = {
  created: 'bg-gray-100 dark:bg-gray-800',
  payment_pending: 'bg-amber-50 dark:bg-amber-900/20',
  payment_confirmed: 'bg-emerald-50 dark:bg-emerald-900/20',
  available_for_purchase: 'bg-blue-50 dark:bg-blue-900/20',
  in_purchase: 'bg-violet-50 dark:bg-violet-900/20',
  partial_delivery: 'bg-orange-50 dark:bg-orange-900/20',
  in_logistics: 'bg-cyan-50 dark:bg-cyan-900/20',
  delivered: 'bg-green-50 dark:bg-green-900/20',
  invoiced: 'bg-teal-50 dark:bg-teal-900/20',
  completed: 'bg-emerald-100 dark:bg-emerald-900/30',
};

interface OrdersKanbanProps {
  onOrderClick: (orderId: string) => void;
  onStatusChange: (order: Order) => void;
}

export function OrdersKanban({ onOrderClick, onStatusChange }: OrdersKanbanProps) {
  const { data, isLoading } = useOrders({ limit: 200 });
  const orders: Order[] = data?.data || [];

  const columns = useMemo(() => {
    const grouped: Record<string, Order[]> = {};
    for (const status of KANBAN_STATUSES) {
      grouped[status] = [];
    }
    for (const order of orders) {
      if (grouped[order.status]) {
        grouped[order.status].push(order);
      }
    }
    return grouped;
  }, [orders]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  const daysSince = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
    return days;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max">
        {KANBAN_STATUSES.map((status) => {
          const statusOrders = columns[status] || [];
          return (
            <div
              key={status}
              className={`w-64 shrink-0 rounded-lg p-3 ${STATUS_BG[status] || 'bg-gray-50 dark:bg-gray-800'}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold truncate">
                  {STATUS_LABELS[status] || status}
                </h3>
                <Badge variant="secondary" className="text-[10px]">
                  {statusOrders.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {statusOrders.map((order) => (
                  <Card
                    key={order.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onOrderClick(order.id)}
                  >
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold">#{order.order_number}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {daysSince(order.updated_at || order.created_at)}d
                        </span>
                      </div>
                      <p className="text-xs font-medium truncate">
                        {order.customer?.business_name || 'N/A'}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {order.advisor?.display_name || order.advisor?.full_name || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs">{fmt(order.total)}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange(order);
                          }}
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {statusOrders.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">Sin pedidos</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
