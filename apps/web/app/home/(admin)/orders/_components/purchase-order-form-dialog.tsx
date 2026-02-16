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
import { useCreatePurchaseOrder } from '../_lib/order-queries';
import { SupplierSelect } from './supplier-select';
import type { OrderItem, Supplier } from '../_lib/types';

interface PurchaseOrderFormDialogProps {
  orderId: string;
  orderItems: OrderItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface POItemRow {
  order_item_id: string;
  sku: string;
  description: string;
  available: number;
  quantity_ordered: number;
  unit_cost: number;
  selected: boolean;
}

export function PurchaseOrderFormDialog({ orderId, orderItems, open, onOpenChange }: PurchaseOrderFormDialogProps) {
  const createPO = useCreatePurchaseOrder();
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'COP' | 'USD'>('COP');
  const [trmApplied, setTrmApplied] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItemRow[]>(
    orderItems.map((oi) => ({
      order_item_id: oi.id,
      sku: oi.sku,
      description: oi.description,
      available: oi.quantity - ((oi as any).quantity_purchased || 0),
      quantity_ordered: 0,
      unit_cost: 0,
      selected: false,
    }))
  );

  const handleItemChange = (idx: number, field: string, value: number | boolean) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const selectedItems = items.filter(i => i.selected && i.quantity_ordered > 0);
  const subtotal = selectedItems.reduce((sum, i) => sum + i.quantity_ordered * i.unit_cost, 0);
  const tax = subtotal * 0.19;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!supplierId) {
      toast.error('Selecciona un proveedor');
      return;
    }
    if (selectedItems.length === 0) {
      toast.error('Selecciona al menos un item');
      return;
    }
    for (const item of selectedItems) {
      if (item.quantity_ordered > item.available) {
        toast.error(`${item.sku}: cantidad excede disponible (${item.available})`);
        return;
      }
    }

    try {
      await createPO.mutateAsync({
        order_id: orderId,
        supplier_id: supplierId,
        currency,
        trm_applied: trmApplied ? parseFloat(trmApplied) : undefined,
        expected_delivery_date: expectedDelivery || undefined,
        notes: notes || undefined,
        items: selectedItems.map(i => ({
          order_item_id: i.order_item_id,
          quantity_ordered: i.quantity_ordered,
          unit_cost: i.unit_cost,
        })),
      });
      toast.success('Orden de compra creada');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear OC');
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Orden de Compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <SupplierSelect value={supplierId} onChange={(id) => setSupplierId(id)} />

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Moneda</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'COP' | 'USD')}
              >
                <option value="COP">COP</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {currency === 'USD' && (
              <div>
                <Label>TRM</Label>
                <Input type="number" value={trmApplied} onChange={(e) => setTrmApplied(e.target.value)} placeholder="4200" />
              </div>
            )}
            <div>
              <Label>Entrega esperada</Label>
              <Input type="date" value={expectedDelivery} onChange={(e) => setExpectedDelivery(e.target.value)} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="p-2 text-left w-8"></th>
                    <th className="p-2 text-left">Código</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-center">Disp.</th>
                    <th className="p-2 text-center">Cant.</th>
                    <th className="p-2 text-right">Costo Unit.</th>
                    <th className="p-2 text-right">Subtotal</th>
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
                          value={item.quantity_ordered || ''}
                          onChange={(e) => handleItemChange(idx, 'quantity_ordered', parseInt(e.target.value) || 0)}
                          className="w-20 text-center h-8"
                          disabled={!item.selected}
                        />
                      </td>
                      <td className="p-2 text-right">
                        <Input
                          type="number"
                          min={0}
                          value={item.unit_cost || ''}
                          onChange={(e) => handleItemChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-28 text-right h-8"
                          disabled={!item.selected}
                        />
                      </td>
                      <td className="p-2 text-right font-mono text-xs">
                        {item.selected && item.quantity_ordered > 0 ? fmt(item.quantity_ordered * item.unit_cost) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2 text-sm space-x-4">
              <span>Subtotal: <strong className="font-mono">{fmt(subtotal)}</strong></span>
              <span>IVA 19%: <strong className="font-mono">{fmt(tax)}</strong></span>
              <span>Total: <strong className="font-mono text-lg">{fmt(total)}</strong></span>
            </div>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={createPO.isPending}>
            {createPO.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Crear Orden de Compra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
