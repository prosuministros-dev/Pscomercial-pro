'use client';

import { Loader2, Package, Truck, FileText, Key, ClipboardList, ArrowRightLeft, CheckCircle2 } from 'lucide-react';
import { useOrderTraceability } from '../_lib/order-queries';
import type { TraceabilityEvent } from '../_lib/types';

interface OrderTimelineProps {
  orderId: string;
}

const EVENT_ICONS: Record<string, typeof Package> = {
  status_change: ArrowRightLeft,
  purchase_order: Package,
  reception: CheckCircle2,
  shipment: Truck,
  delivery: Truck,
  invoice: FileText,
  license: Key,
  task: ClipboardList,
};

const EVENT_COLORS: Record<string, string> = {
  status_change: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  purchase_order: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  reception: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  shipment: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  delivery: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
  invoice: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  license: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
  task: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
};

export function OrderTimeline({ orderId }: OrderTimelineProps) {
  const { data: events = [], isLoading } = useOrderTraceability(orderId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  if ((events as TraceabilityEvent[]).length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Sin eventos de trazabilidad</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold mb-3">Trazabilidad</h4>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-4">
          {(events as TraceabilityEvent[]).map((event, idx) => {
            const Icon = EVENT_ICONS[event.type] || ClipboardList;
            const colorClass = EVENT_COLORS[event.type] || EVENT_COLORS.task;

            return (
              <div key={idx} className="flex items-start gap-3 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{event.description}</p>
                  )}
                  <div className="flex gap-3 text-xs text-gray-400 mt-1">
                    <span>
                      {new Date(event.timestamp).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {event.user_name && <span>Por {event.user_name}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
