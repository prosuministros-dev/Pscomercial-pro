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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useReceivePurchaseOrderItems } from '../_lib/order-queries';
import type { PurchaseOrderItem } from '../_lib/types';

interface ReceiveDialogProps {
  poId: string;
  orderId: string;
  items: PurchaseOrderItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PurchaseOrderReceiveDialog({ poId, orderId, items, open, onOpenChange }: ReceiveDialogProps) {
  const receiveItems = useReceivePurchaseOrderItems();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map(i => [i.id, 0]))
  );

  const handleSubmit = async () => {
    const toReceive = items
      .filter(i => (quantities[i.id] || 0) > 0)
      .map(i => ({
        po_item_id: i.id,
        quantity_received: quantities[i.id] || 0,
      }));

    if (toReceive.length === 0) {
      toast.error('Ingresa al menos una cantidad');
      return;
    }

    try {
      await receiveItems.mutateAsync({ poId, orderId, items: toReceive });
      toast.success('Recepción registrada');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar recepción');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar Recepción</DialogTitle>
        </DialogHeader>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="p-2 text-left">Código</th>
                <th className="p-2 text-left">Descripción</th>
                <th className="p-2 text-center">Ordenado</th>
                <th className="p-2 text-center">Recibido</th>
                <th className="p-2 text-center">Pendiente</th>
                <th className="p-2 text-center">Recibir</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const pending = item.quantity_ordered - item.quantity_received;
                return (
                  <tr key={item.id} className={`border-t ${pending <= 0 ? 'opacity-40' : ''}`}>
                    <td className="p-2 font-mono text-xs">{item.sku}</td>
                    <td className="p-2 text-xs">{item.description}</td>
                    <td className="p-2 text-center">{item.quantity_ordered}</td>
                    <td className="p-2 text-center">{item.quantity_received}</td>
                    <td className="p-2 text-center font-medium">{pending}</td>
                    <td className="p-2 text-center">
                      <Input
                        type="number"
                        min={0}
                        max={pending}
                        value={quantities[item.id] || ''}
                        onChange={(e) => setQuantities(q => ({ ...q, [item.id]: parseInt(e.target.value) || 0 }))}
                        className="w-20 text-center h-8"
                        disabled={pending <= 0}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={receiveItems.isPending}>
            {receiveItems.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Registrar Recepción
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
