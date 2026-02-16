'use client';

import { useState } from 'react';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@kit/ui/table';
import { Loader2, Plus, Truck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useOrderShipments, useUpdateShipmentStatus } from '../_lib/order-queries';
import { SHIPMENT_STATUS_LABELS, DISPATCH_TYPE_LABELS } from '../_lib/schemas';
import { ShipmentFormDialog } from './shipment-form-dialog';
import type { Shipment, OrderItem, Order } from '../_lib/types';

interface ShipmentsTabProps {
  orderId: string;
  order: Order;
  orderItems: OrderItem[];
  currency: string;
}

export function ShipmentsTab({ orderId, order, orderItems, currency }: ShipmentsTabProps) {
  const { data: shipments = [], isLoading } = useOrderShipments(orderId);
  const [showCreate, setShowCreate] = useState(false);
  const updateStatus = useUpdateShipmentStatus();

  const handleDispatch = async (shipment: Shipment) => {
    try {
      await updateStatus.mutateAsync({ shipmentId: shipment.id, orderId, action: 'dispatch' });
      toast.success('Despacho marcado como despachado');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const handleDeliver = async (shipment: Shipment) => {
    const name = prompt('Nombre de quien recibe:');
    if (!name) return;
    try {
      await updateStatus.mutateAsync({ shipmentId: shipment.id, orderId, action: 'deliver', received_by_name: name });
      toast.success('Entrega registrada');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'returned': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Despachos</h4>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nuevo Despacho
        </Button>
      </div>

      {(shipments as Shipment[]).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay despachos</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(shipments as Shipment[]).map((shipment) => (
            <div key={shipment.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-medium">DSP-{shipment.shipment_number}</span>
                  <Badge variant={statusColor(shipment.status)}>
                    {SHIPMENT_STATUS_LABELS[shipment.status] || shipment.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {DISPATCH_TYPE_LABELS[shipment.dispatch_type] || shipment.dispatch_type}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {shipment.status === 'preparing' && (
                    <Button size="sm" variant="outline" onClick={() => handleDispatch(shipment)} disabled={updateStatus.isPending}>
                      Despachar
                    </Button>
                  )}
                  {['dispatched', 'in_transit'].includes(shipment.status) && (
                    <Button size="sm" onClick={() => handleDeliver(shipment)} disabled={updateStatus.isPending}>
                      Entregar
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="text-gray-500">Dirección: </span>{shipment.delivery_address}
                </div>
                <div>
                  <span className="text-gray-500">Ciudad: </span>{shipment.delivery_city}
                </div>
                <div>
                  <span className="text-gray-500">Contacto: </span>{shipment.delivery_contact}
                </div>
                {shipment.carrier && (
                  <div>
                    <span className="text-gray-500">Transportadora: </span>{shipment.carrier}
                  </div>
                )}
              </div>

              {shipment.tracking_number && (
                <div className="text-xs flex items-center gap-1">
                  <span className="text-gray-500">Guía:</span>
                  <span className="font-mono">{shipment.tracking_number}</span>
                  {shipment.tracking_url && (
                    <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                      <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  )}
                </div>
              )}

              {shipment.actual_delivery && (
                <p className="text-xs text-green-600">
                  Entregado el {new Date(shipment.actual_delivery).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {shipment.received_by_name && ` — Recibió: ${shipment.received_by_name}`}
                </p>
              )}

              {shipment.items && shipment.items.length > 0 && (
                <div className="text-xs text-gray-500">
                  {shipment.items.length} item(s) — {shipment.items.reduce((s, i) => s + i.quantity_shipped, 0)} unidades
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <ShipmentFormDialog
          orderId={orderId}
          order={order}
          orderItems={orderItems}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}
    </div>
  );
}
