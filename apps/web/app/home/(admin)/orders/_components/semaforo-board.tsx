'use client';

import { useState } from 'react';
import { Card, CardContent } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useSemaforoBoard } from '~/home/_lib/dashboard-queries';
import { SEMAFORO_COLORS } from '../_lib/schemas';
import { STATUS_LABELS } from '../_lib/schemas';
import type { SemaforoColor } from '~/home/_lib/types';

interface SemaforoBoardProps {
  onOrderClick: (orderId: string) => void;
}

const ALL_COLORS: (SemaforoColor | 'all')[] = ['all', 'dark_green', 'green', 'yellow', 'orange', 'red', 'fuchsia', 'black'];

export function SemaforoBoard({ onOrderClick }: SemaforoBoardProps) {
  const { data: orders = [], isLoading } = useSemaforoBoard();
  const [colorFilter, setColorFilter] = useState<SemaforoColor | 'all'>('all');

  const filtered = colorFilter === 'all'
    ? orders
    : orders.filter((o) => o.semaforo_color === colorFilter);

  // Summary counts
  const colorCounts: Record<string, number> = {};
  for (const o of orders) {
    colorCounts[o.semaforo_color] = (colorCounts[o.semaforo_color] || 0) + 1;
  }

  const fmt = (n: number, currency = 'COP') =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Color filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {ALL_COLORS.map((color) => {
          const isAll = color === 'all';
          const config = isAll ? null : SEMAFORO_COLORS[color];
          const count = isAll ? orders.length : (colorCounts[color] || 0);
          const isActive = colorFilter === color;

          return (
            <button
              key={color}
              onClick={() => setColorFilter(color)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {!isAll && (
                <span className={`w-2.5 h-2.5 rounded-full ${config?.bg}`} />
              )}
              <span>{isAll ? 'Todos' : config?.label}</span>
              <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grid of order cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay pedidos en este estado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((order) => {
            const config = SEMAFORO_COLORS[order.semaforo_color] || SEMAFORO_COLORS.green;
            return (
              <Card
                key={order.order_id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onOrderClick(order.order_id)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${config.bg}`} />
                      <span className="font-mono font-bold text-sm">#{order.order_number}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium truncate">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{order.advisor_name}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">{fmt(order.total, order.currency)}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.pending_task_count} tarea{order.pending_task_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {order.max_overdue_days > 0 && (
                    <p className={`text-xs font-medium ${config.text}`}>
                      {Math.round(order.max_overdue_days)} día{Math.round(order.max_overdue_days) !== 1 ? 's' : ''} vencido
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
