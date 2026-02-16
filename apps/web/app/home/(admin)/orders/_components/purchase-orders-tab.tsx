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
import { Loader2, Plus, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useOrderPurchaseOrders } from '../_lib/order-queries';
import { PO_STATUS_LABELS } from '../_lib/schemas';
import { PurchaseOrderFormDialog } from './purchase-order-form-dialog';
import { PurchaseOrderReceiveDialog } from './purchase-order-receive-dialog';
import type { PurchaseOrder, OrderItem } from '../_lib/types';

interface PurchaseOrdersTabProps {
  orderId: string;
  orderItems: OrderItem[];
  currency: string;
}

export function PurchaseOrdersTab({ orderId, orderItems, currency }: PurchaseOrdersTabProps) {
  const { data: purchaseOrders = [], isLoading } = useOrderPurchaseOrders(orderId);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedPO, setExpandedPO] = useState<string | null>(null);
  const [receiveDialogPO, setReceiveDialogPO] = useState<PurchaseOrder | null>(null);

  const fmt = (n: number, cur?: string) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur || currency, minimumFractionDigits: 0 }).format(n);

  const statusColor = (status: string) => {
    switch (status) {
      case 'received': return 'default';
      case 'cancelled': return 'destructive';
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
        <h4 className="text-sm font-semibold">Ordenes de Compra</h4>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nueva OC
        </Button>
      </div>

      {(purchaseOrders as PurchaseOrder[]).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay órdenes de compra</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>OC #</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Entrega Esperada</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(purchaseOrders as PurchaseOrder[]).map((po) => (
                <>
                  <TableRow key={po.id}>
                    <TableCell>
                      <button onClick={() => setExpandedPO(expandedPO === po.id ? null : po.id)}>
                        {expandedPO === po.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </TableCell>
                    <TableCell className="font-mono font-medium">OC-{po.po_number}</TableCell>
                    <TableCell>{po.supplier?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={statusColor(po.status)}>{PO_STATUS_LABELS[po.status] || po.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{fmt(po.total, po.currency)}</TableCell>
                    <TableCell className="text-sm">
                      {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString('es-CO') : '—'}
                    </TableCell>
                    <TableCell>
                      {['draft', 'sent', 'confirmed', 'partial_received'].includes(po.status) && po.items && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReceiveDialogPO(po)}
                        >
                          Recibir
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {expandedPO === po.id && po.items && (
                    <TableRow key={`${po.id}-items`}>
                      <TableCell colSpan={7} className="bg-gray-50 dark:bg-gray-800/50 p-3">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="text-left p-1">Código</th>
                              <th className="text-left p-1">Descripción</th>
                              <th className="text-center p-1">Ordenado</th>
                              <th className="text-center p-1">Recibido</th>
                              <th className="text-right p-1">Costo Unit.</th>
                              <th className="text-right p-1">Subtotal</th>
                              <th className="text-center p-1">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {po.items.map((item) => (
                              <tr key={item.id} className="border-t border-gray-200 dark:border-gray-700">
                                <td className="p-1 font-mono">{item.sku}</td>
                                <td className="p-1">{item.description}</td>
                                <td className="p-1 text-center">{item.quantity_ordered}</td>
                                <td className="p-1 text-center">{item.quantity_received}</td>
                                <td className="p-1 text-right font-mono">{fmt(item.unit_cost, po.currency)}</td>
                                <td className="p-1 text-right font-mono">{fmt(item.subtotal, po.currency)}</td>
                                <td className="p-1 text-center">
                                  <Badge variant="outline" className="text-[10px]">
                                    {item.status === 'received' ? 'Recibido' : item.status === 'partial' ? 'Parcial' : 'Pendiente'}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showCreate && (
        <PurchaseOrderFormDialog
          orderId={orderId}
          orderItems={orderItems}
          open={showCreate}
          onOpenChange={setShowCreate}
        />
      )}

      {receiveDialogPO && receiveDialogPO.items && (
        <PurchaseOrderReceiveDialog
          poId={receiveDialogPO.id}
          orderId={orderId}
          items={receiveDialogPO.items}
          open={!!receiveDialogPO}
          onOpenChange={(open) => { if (!open) setReceiveDialogPO(null); }}
        />
      )}
    </div>
  );
}
