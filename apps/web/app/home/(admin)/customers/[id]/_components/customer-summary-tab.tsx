'use client';

import { motion } from 'motion/react';
import { FileText, ShoppingCart, MapPin, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@kit/ui/card';

import { useCustomerHistory } from '../../_lib/customer-queries';
import { useCustomerVisits } from '../../_lib/customer-queries';

interface CustomerSummaryTabProps {
  customerId: string;
}

export function CustomerSummaryTab({ customerId }: CustomerSummaryTabProps) {
  const { data: historyData, isLoading: historyLoading } = useCustomerHistory(customerId);
  const { data: visitsData, isLoading: visitsLoading } = useCustomerVisits(customerId);

  const isLoading = historyLoading || visitsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const quotes = historyData?.quotes?.data || [];
  const orders = historyData?.orders?.data || [];
  const visits = visitsData?.data || [];

  const totalQuotes = historyData?.quotes?.total || 0;
  const wonQuotes = quotes.filter((q) => q.status === 'ganada').length;
  const totalOrders = historyData?.orders?.total || 0;
  const deliveredOrders = orders.filter((o) => o.status === 'entregado' || o.status === 'facturado').length;
  const totalVisits = visitsData?.pagination?.total || 0;

  // Calculate total sales (from orders)
  const totalSalesCOP = orders.reduce((acc, o) => acc + (o.total_cop || 0), 0);

  // Last visit
  const lastVisit = visits[0];

  const kpis = [
    {
      label: 'Cotizaciones',
      value: totalQuotes,
      detail: `${wonQuotes} ganadas`,
      icon: FileText,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Pedidos',
      value: totalOrders,
      detail: `${deliveredOrders} entregados`,
      icon: ShoppingCart,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Visitas',
      value: totalVisits,
      detail: lastVisit
        ? `Última: ${new Date(lastVisit.visit_date).toLocaleDateString('es-CO')}`
        : 'Sin visitas',
      icon: MapPin,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Ventas Totales',
      value: totalSalesCOP > 0
        ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalSalesCOP)
        : '$0',
      detail: `${totalOrders} pedidos`,
      icon: DollarSign,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${kpi.bg}`}>
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold">{kpi.value}</p>
                      <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{kpi.detail}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity Timeline */}
      {(quotes.length > 0 || orders.length > 0 || visits.length > 0) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3">Actividad Reciente</h3>
            <div className="space-y-3">
              {/* Combine and sort recent activity */}
              {[
                ...quotes.slice(0, 3).map((q) => ({
                  type: 'quote' as const,
                  date: q.created_at,
                  label: `Cotización ${q.consecutive || ''} - ${q.status}`,
                  icon: FileText,
                })),
                ...orders.slice(0, 3).map((o) => ({
                  type: 'order' as const,
                  date: o.created_at,
                  label: `Pedido ${o.consecutive || ''} - ${o.status}`,
                  icon: ShoppingCart,
                })),
                ...visits.slice(0, 3).map((v) => ({
                  type: 'visit' as const,
                  date: v.visit_date,
                  label: `Visita ${v.visit_type} - ${v.status}`,
                  icon: MapPin,
                })),
              ]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 8)
                .map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={`${item.type}-${index}`} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{item.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.date).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
