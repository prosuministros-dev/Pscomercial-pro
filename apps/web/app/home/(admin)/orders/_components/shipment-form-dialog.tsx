'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateShipment } from '../_lib/order-queries';
import { DISPATCH_TYPE_LABELS } from '../_lib/schemas';
import type { OrderItem, Order } from '../_lib/types';

interface ShipmentFormDialogProps {
  orderId: string;
  order: Order;
  orderItems: OrderItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShipItemRow {
  order_item_id: string;
  sku: string;
  description: string;
  available: number;
  quantity_shipped: number;
  selected: boolean;
}

export function ShipmentFormDialog({ orderId, order, orderItems, open, onOpenChange }: ShipmentFormDialogProps) {
  const createShipment = useCreateShipment();
  const [dispatchType, setDispatchType] = useState<'envio' | 'retiro' | 'mensajeria'>('envio');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(order.delivery_address || '');
  const [deliveryCity, setDeliveryCity] = useState(order.delivery_city || '');
  const [deliveryContact, setDeliveryContact] = useState(order.delivery_contact || '');
  const [deliveryPhone, setDeliveryPhone] = useState(order.delivery_phone || '');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ShipItemRow[]>(
    orderItems.map((oi) => ({
      order_item_id: oi.id,
      sku: oi.sku,
      description: oi.description,
      available: ((oi as any).quantity_received || 0) - ((oi as any).quantity_dispatched || 0),
      quantity_shipped: 0,
      selected: false,
    }))
  );

  const handleItemChange = (idx: number, field: string, value: number | boolean) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    const selectedItems = items.filter(i => i.selected && i.quantity_shipped > 0);
    if (selectedItems.length === 0) {
      toast.error('Selecciona al menos un item');
      return;
    }
    if (!deliveryAddress.trim()) {
      toast.error('Dirección de entrega es requerida');
      return;
    }

    try {
      await createShipment.mutateAsync({
        order_id: orderId,
        dispatch_type: dispatchType,
        carrier: carrier || undefined,
        tracking_number: trackingNumber || undefined,
        tracking_url: trackingUrl || undefined,
        delivery_address: deliveryAddress,
        delivery_city: deliveryCity,
        delivery_contact: deliveryContact,
        delivery_phone: deliveryPhone,
        estimated_delivery: estimatedDelivery || undefined,
        notes: notes || undefined,
        items: selectedItems.map(i => ({
          order_item_id: i.order_item_id,
          quantity_shipped: i.quantity_shipped,
        })),
      });
      toast.success('Despacho creado');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear despacho');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Despacho</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Despacho</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={dispatchType}
                onChange={(e) => setDispatchType(e.target.value as any)}
              >
                {Object.entries(DISPATCH_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Transportadora</Label>
              <Input value={carrier} onChange={(e) => setCarrier(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Número de guía</Label>
              <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
            </div>
            <div>
              <Label>URL de rastreo</Label>
              <Input value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold">Destino de entrega</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Dirección *</Label>
                <Input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
              </div>
              <div>
                <Label>Ciudad *</Label>
                <Input value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)} />
              </div>
              <div>
                <Label>Contacto *</Label>
                <Input value={deliveryContact} onChange={(e) => setDeliveryContact(e.target.value)} />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Entrega estimada</Label>
              <Input type="date" value={estimatedDelivery} onChange={(e) => setEstimatedDelivery(e.target.value)} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Items a despachar</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-2 w-8"></th>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-center">Disp.</th>
                    <th className="p-2 text-center">Cant.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={item.order_item_id} className={`border-t ${item.available <= 0 ? 'opacity-40' : ''}`}>
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          disabled={item.available <= 0}
                          onChange={(e) => handleItemChange(idx, 'selected', e.target.checked)}
                        />
                      </td>
                      <td className="p-2 font-mono text-xs">{item.sku}</td>
                      <td className="p-2 text-xs">{item.description}</td>
                      <td className="p-2 text-center">{item.available}</td>
                      <td className="p-2 text-center">
                        <Input
                          type="number"
                          min={0}
                          max={item.available}
                          value={item.quantity_shipped || ''}
                          onChange={(e) => handleItemChange(idx, 'quantity_shipped', parseInt(e.target.value) || 0)}
                          className="w-20 text-center h-8"
                          disabled={!item.selected}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createShipment.isPending}>
            {createShipment.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Crear Despacho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
