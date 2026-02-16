'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
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
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Order, OrderItem, OrderStatusHistory } from '../_lib/types';
import { STATUS_LABELS } from '../_lib/schemas';

interface OrderDetailDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderDetail extends Order {
  items: OrderItem[];
  status_history: OrderStatusHistory[];
}

export function OrderDetailDialog({ orderId, open, onOpenChange }: OrderDetailDialogProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open || !orderId) return;
    setIsLoading(true);
    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/orders/${orderId}/status`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data);
        }
      } catch (error) {
        console.error('Error fetching order detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetail();
  }, [open, orderId]);

  const handleClose = () => {
    setOrder(null);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {order ? `Pedido #${order.order_number}` : 'Detalle de Pedido'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
          </div>
        ) : order ? (
          <div className="space-y-6">
            {/* Header info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-medium text-sm">{order.customer?.business_name || 'N/A'}</p>
                {order.customer?.nit && (
                  <p className="text-xs text-gray-500">NIT: {order.customer.nit}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Asesor</p>
                <p className="font-medium text-sm">{order.advisor?.display_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-mono font-bold text-lg">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: order.currency,
                    minimumFractionDigits: 0,
                  }).format(order.total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Estado</p>
                <Badge className="mt-1">{STATUS_LABELS[order.status] || order.status}</Badge>
              </div>
            </div>

            {/* Delivery info */}
            {(order.delivery_address || order.delivery_city || order.delivery_contact) && (
              <div className="p-4 border rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Información de Entrega</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {order.delivery_address && (
                    <div>
                      <span className="text-gray-500">Dirección:</span> {order.delivery_address}
                    </div>
                  )}
                  {order.delivery_city && (
                    <div>
                      <span className="text-gray-500">Ciudad:</span> {order.delivery_city}
                    </div>
                  )}
                  {order.delivery_contact && (
                    <div>
                      <span className="text-gray-500">Contacto:</span> {order.delivery_contact}
                    </div>
                  )}
                  {order.delivery_phone && (
                    <div>
                      <span className="text-gray-500">Teléfono:</span> {order.delivery_phone}
                    </div>
                  )}
                  {order.expected_delivery_date && (
                    <div>
                      <span className="text-gray-500">Fecha esperada:</span>{' '}
                      {new Date(order.expected_delivery_date).toLocaleDateString('es-CO')}
                    </div>
                  )}
                </div>
                {order.delivery_notes && (
                  <p className="text-sm text-gray-600 mt-2">{order.delivery_notes}</p>
                )}
              </div>
            )}

            {/* Items table */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Items del Pedido</h4>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">Vr. Unit.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, idx) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                        <TableCell className="text-sm">{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: order.currency,
                            minimumFractionDigits: 0,
                          }).format(item.unit_price)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-sm">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: order.currency,
                            minimumFractionDigits: 0,
                          }).format(item.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Status Timeline */}
            {order.status_history.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">Historial de Estados</h4>
                <div className="space-y-3">
                  {order.status_history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3">
                      <div className="mt-1">
                        <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {entry.from_status && (
                            <>
                              <Badge variant="outline" className="text-xs">
                                {STATUS_LABELS[entry.from_status] || entry.from_status}
                              </Badge>
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                            </>
                          )}
                          <Badge className="text-xs">
                            {STATUS_LABELS[entry.to_status] || entry.to_status}
                          </Badge>
                        </div>
                        {entry.changed_by_user && (
                          <p className="text-xs text-gray-500 mt-1">
                            Por {entry.changed_by_user.display_name}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {entry.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(entry.created_at).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No se encontró el pedido
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
