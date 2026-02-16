'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@kit/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@kit/ui/tabs';
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
import { Loader2, CheckCircle2, ArrowRight, DollarSign, FileText, Route } from 'lucide-react';
import { toast } from 'sonner';
import type { Order, OrderItem, OrderStatusHistory, OrderDestination } from '../_lib/types';
import { STATUS_LABELS, BILLING_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '../_lib/schemas';
import { AdvanceBillingPanel } from './advance-billing-panel';
import { OrderDestinationsPanel } from './order-destinations-panel';
import { PurchaseOrdersTab } from './purchase-orders-tab';
import { ShipmentsTab } from './shipments-tab';
import { InvoicesTab } from './invoices-tab';
import { LicensePanel } from './license-panel';
import { PendingTasksPanel } from './pending-tasks-panel';
import { OrderTimeline } from './order-timeline';
import { ProductJourneyDialog } from './product-journey-dialog';
import { useConfirmPayment } from '../_lib/order-queries';

interface OrderDetailDialogProps {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OrderDetail extends Order {
  items: OrderItem[];
  status_history: OrderStatusHistory[];
  destinations: OrderDestination[];
}

export function OrderDetailDialog({ orderId, open, onOpenChange }: OrderDetailDialogProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [journeyItem, setJourneyItem] = useState<OrderItem | null>(null);
  const confirmPayment = useConfirmPayment();

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

  const handleConfirmPayment = async () => {
    if (!orderId) return;
    try {
      await confirmPayment.mutateAsync({ orderId });
      toast.success('Pago confirmado exitosamente');
      const response = await fetch(`/api/orders/${orderId}/status`);
      if (response.ok) {
        setOrder(await response.json());
      }
    } catch (error) {
      toast.error('Error', {
        description: error instanceof Error ? error.message : 'Error al confirmar pago',
      });
    }
  };

  const handleDownloadPdf = async () => {
    if (!orderId) return;
    window.open(`/api/pdf/order/${orderId}`, '_blank');
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: order?.currency || 'COP',
      minimumFractionDigits: 0,
    }).format(n);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
          <Tabs defaultValue="detalle" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="detalle">Detalle</TabsTrigger>
              <TabsTrigger value="oc">OC</TabsTrigger>
              <TabsTrigger value="despachos">Despachos</TabsTrigger>
              <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="trazabilidad">Trazabilidad</TabsTrigger>
            </TabsList>

            {/* Tab 1: Detalle */}
            <TabsContent value="detalle" className="space-y-6 mt-4">
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
                  <p className="font-mono font-bold text-lg">{fmt(order.total)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado</p>
                  <Badge className="mt-1">{STATUS_LABELS[order.status] || order.status}</Badge>
                </div>
              </div>

              {/* Payment & Billing info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div>
                  <p className="text-xs text-gray-500">Forma de Pago</p>
                  <p className="text-sm font-medium">{order.payment_terms || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Estado de Pago</p>
                  <Badge variant={order.payment_status === 'confirmed' ? 'default' : 'outline'} className="mt-0.5">
                    {PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Tipo de Facturación</p>
                  <p className="text-sm font-medium">
                    {BILLING_TYPE_LABELS[order.billing_type] || order.billing_type || 'Total'}
                  </p>
                </div>
                {order.payment_confirmed_at && (
                  <div className="col-span-3">
                    <p className="text-xs text-green-600">
                      Pago confirmado el {new Date(order.payment_confirmed_at).toLocaleDateString('es-CO', {
                        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm payment button */}
              {order.status === 'payment_pending' && order.payment_status !== 'confirmed' && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <DollarSign className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Pago Anticipado Pendiente
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-300">
                      Este pedido requiere confirmación de pago para proceder
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleConfirmPayment}
                    disabled={confirmPayment.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    {confirmPayment.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Confirmar Pago'
                    )}
                  </Button>
                </div>
              )}

              {/* Advance billing panel */}
              {order.requires_advance_billing && orderId && (
                <div className="p-4 border rounded-lg">
                  <AdvanceBillingPanel orderId={orderId} />
                </div>
              )}

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

              {/* Destinations panel */}
              {orderId && (
                <div className="p-4 border rounded-lg">
                  <OrderDestinationsPanel orderId={orderId} />
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
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{idx + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                          <TableCell className="text-sm">{item.description}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{fmt(item.unit_price)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold text-sm">{fmt(item.total)}</TableCell>
                          <TableCell>
                            {item.product_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Ver trazabilidad"
                                onClick={() => setJourneyItem(item)}
                              >
                                <Route className="w-3.5 h-3.5 text-cyan-500" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Invoices section */}
              {orderId && (
                <div className="p-4 border rounded-lg">
                  <InvoicesTab orderId={orderId} currency={order.currency} />
                </div>
              )}

              {/* Licenses section */}
              {orderId && (
                <div className="p-4 border rounded-lg">
                  <LicensePanel orderId={orderId} orderItems={order.items} />
                </div>
              )}

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
            </TabsContent>

            {/* Tab 2: Ordenes de Compra */}
            <TabsContent value="oc" className="mt-4">
              {orderId && (
                <PurchaseOrdersTab
                  orderId={orderId}
                  orderItems={order.items}
                  currency={order.currency}
                />
              )}
            </TabsContent>

            {/* Tab 3: Despachos */}
            <TabsContent value="despachos" className="mt-4">
              {orderId && (
                <ShipmentsTab
                  orderId={orderId}
                  order={order}
                  orderItems={order.items}
                  currency={order.currency}
                />
              )}
            </TabsContent>

            {/* Tab 4: Pendientes */}
            <TabsContent value="pendientes" className="mt-4">
              {orderId && <PendingTasksPanel orderId={orderId} />}
            </TabsContent>

            {/* Tab 5: Trazabilidad */}
            <TabsContent value="trazabilidad" className="mt-4">
              {orderId && <OrderTimeline orderId={orderId} />}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No se encontró el pedido
          </div>
        )}

        <DialogFooter>
          {order && (
            <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Product Journey Dialog */}
      <ProductJourneyDialog
        productId={journeyItem?.product_id || null}
        productSku={journeyItem?.sku || ''}
        productDescription={journeyItem?.description || ''}
        open={!!journeyItem}
        onOpenChange={(open) => {
          if (!open) setJourneyItem(null);
        }}
      />
    </Dialog>
  );
}
