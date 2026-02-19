'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Badge } from '@kit/ui/badge';
import { Card, CardContent } from '@kit/ui/card';

import { useCustomerHistory } from '../../_lib/customer-queries';

interface CustomerOrdersTabProps {
  customerId: string;
}

const ORDER_STATUS_MAP: Record<string, { label: string; className: string }> = {
  creado: { label: 'Creado', className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  en_proceso: { label: 'En Proceso', className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  compra_aprobada: { label: 'Compra Aprobada', className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400' },
  oc_enviada: { label: 'OC Enviada', className: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' },
  mercancia_recibida: { label: 'Mercancía Recibida', className: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400' },
  en_despacho: { label: 'En Despacho', className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400' },
  entregado: { label: 'Entregado', className: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  facturado: { label: 'Facturado', className: 'bg-green-600/10 text-green-800 dark:text-green-300' },
};

export function CustomerOrdersTab({ customerId }: CustomerOrdersTabProps) {
  const { data, isLoading, error } = useCustomerHistory(customerId, 'orders');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      </div>
    );
  }

  const orders = data?.orders?.data || [];

  if (orders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium">Sin pedidos</p>
        <p className="text-xs text-muted-foreground">Este cliente aún no tiene pedidos registrados</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {data?.orders?.total || 0} pedidos
        </h3>
      </div>

      <div className="space-y-2">
        {orders.map((order, index) => {
          const statusInfo = ORDER_STATUS_MAP[order.status] || { label: order.status, className: '' };

          return (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <Link
                      href={`/home/orders`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {order.consecutive || 'Sin consecutivo'}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('es-CO')}
                      {order.advisor?.full_name && ` · ${order.advisor.full_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {order.total_cop > 0 && (
                      <p className="text-sm font-medium">
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.total_cop)}
                      </p>
                    )}
                    <Badge className={statusInfo.className}>
                      {statusInfo.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
