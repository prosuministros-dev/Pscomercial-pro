'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Badge } from '@kit/ui/badge';
import { Loader2, FileText, ShoppingCart, Truck, Package, Receipt } from 'lucide-react';
import { useProductJourney } from '~/home/_lib/dashboard-queries';
import type { ProductJourneyEvent } from '~/home/_lib/types';

interface ProductJourneyDialogProps {
  productId: string | null;
  productSku: string;
  productDescription: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EVENT_CONFIG: Record<
  ProductJourneyEvent['type'],
  { icon: typeof FileText; label: string; color: string; bgColor: string }
> = {
  quote: {
    icon: FileText,
    label: 'Cotización',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  order: {
    icon: ShoppingCart,
    label: 'Pedido',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
  },
  purchase_order: {
    icon: Package,
    label: 'Orden de Compra',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
  },
  shipment: {
    icon: Truck,
    label: 'Despacho',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  invoice: {
    icon: Receipt,
    label: 'Factura',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
};

export function ProductJourneyDialog({
  productId,
  productSku,
  productDescription,
  open,
  onOpenChange,
}: ProductJourneyDialogProps) {
  const { data: events = [], isLoading } = useProductJourney(open ? productId : null);

  const fmt = (n: number, currency = 'COP') =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(n);

  const fmtDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-cyan-500" />
            Trazabilidad del Producto
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            <span className="font-mono font-bold">{productSku}</span>
            {' — '}
            {productDescription}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No se encontraron eventos para este producto</p>
          </div>
        ) : (
          <div className="relative ml-4 mt-2">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

            <div className="space-y-6">
              {events.map((event, idx) => {
                const config = EVENT_CONFIG[event.type];
                const Icon = config.icon;

                return (
                  <div key={`${event.type}-${event.item_id}-${idx}`} className="relative pl-10">
                    {/* Circle icon */}
                    <div
                      className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}
                    >
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>

                    {/* Content card */}
                    <div className="p-3 rounded-lg border bg-card">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${config.color}`}>
                            {config.label}
                          </Badge>
                          <span className="font-mono text-xs font-bold">
                            {event.ref_number}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {fmtDate(event.event_date)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className="text-muted-foreground">Cantidad: </span>
                          <span className="font-medium">{event.quantity}</span>
                        </div>
                        {event.unit_price != null && (
                          <div>
                            <span className="text-muted-foreground">Vr. Unit: </span>
                            <span className="font-mono">{fmt(event.unit_price, event.currency)}</span>
                          </div>
                        )}
                        {event.total != null && (
                          <div>
                            <span className="text-muted-foreground">Total: </span>
                            <span className="font-mono font-semibold">{fmt(event.total, event.currency)}</span>
                          </div>
                        )}
                        {event.status && (
                          <div>
                            <span className="text-muted-foreground">Estado: </span>
                            <span className="font-medium">{event.status}</span>
                          </div>
                        )}
                      </div>

                      {/* Extra details per type */}
                      <div className="mt-1.5 text-[11px] text-muted-foreground space-y-0.5">
                        {event.customer_name && (
                          <p>Cliente: {event.customer_name}</p>
                        )}
                        {event.advisor_name && (
                          <p>Asesor: {event.advisor_name}</p>
                        )}
                        {event.supplier_name && (
                          <p>Proveedor: {event.supplier_name}</p>
                        )}
                        {event.carrier && (
                          <p>Transportadora: {event.carrier}</p>
                        )}
                        {event.tracking_number && (
                          <p>Guía: {event.tracking_number}</p>
                        )}
                      </div>

                      {/* Quantity breakdown for purchase/shipment */}
                      {(event.quantity_purchased != null || event.quantity_received != null ||
                        event.quantity_dispatched != null || event.quantity_delivered != null) && (
                        <div className="mt-2 flex gap-3 text-[10px]">
                          {event.quantity_purchased != null && (
                            <span className="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">
                              Comprado: {event.quantity_purchased}
                            </span>
                          )}
                          {event.quantity_received != null && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                              Recibido: {event.quantity_received}
                            </span>
                          )}
                          {event.quantity_dispatched != null && (
                            <span className="px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300">
                              Despachado: {event.quantity_dispatched}
                            </span>
                          )}
                          {event.quantity_delivered != null && (
                            <span className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                              Entregado: {event.quantity_delivered}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
