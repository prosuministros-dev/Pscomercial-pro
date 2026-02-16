'use client';

import { ShoppingCart, DollarSign, Truck, CheckCircle2 } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Loader2 } from 'lucide-react';
import { StatCard } from '~/components/shared/stat-card';
import { useOperationalDashboard } from '../_lib/dashboard-queries';
import type { DashboardFilters } from '../_lib/types';

interface OperationalDashboardProps {
  filters: DashboardFilters;
}

const STATUS_COLORS: Record<string, string> = {
  created: '#94a3b8',
  payment_pending: '#f59e0b',
  payment_confirmed: '#10b981',
  available_for_purchase: '#3b82f6',
  in_purchase: '#8b5cf6',
  partial_delivery: '#f97316',
  in_logistics: '#06b6d4',
  delivered: '#22c55e',
  invoiced: '#14b8a6',
  completed: '#059669',
};

const STATUS_LABELS: Record<string, string> = {
  created: 'Creado',
  payment_pending: 'Pago pendiente',
  payment_confirmed: 'Pago confirmado',
  available_for_purchase: 'Disponible compra',
  in_purchase: 'En compra',
  partial_delivery: 'Entrega parcial',
  in_logistics: 'En logística',
  delivered: 'Entregado',
  invoiced: 'Facturado',
  completed: 'Completado',
};

export function OperationalDashboard({ filters }: OperationalDashboardProps) {
  const { data, isLoading } = useOperationalDashboard(filters);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  const pieData = Object.entries(data.orders_by_status).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    fill: STATUS_COLORS[status] || '#94a3b8',
  }));

  const weekData = (data.orders_per_week || []).map((w) => ({
    week: new Date(w.week_start).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    pedidos: w.order_count,
  }));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Pedidos Activos"
          value={data.active_orders}
          icon={ShoppingCart}
          delay={0}
        />
        <StatCard
          title="Facturado"
          value={fmt(data.invoiced_total)}
          icon={DollarSign}
          delay={0.1}
        />
        <StatCard
          title="Entregas Pendientes"
          value={data.pending_deliveries}
          icon={Truck}
          delay={0.2}
        />
        <StatCard
          title="Completados"
          value={data.completed_orders}
          icon={CheckCircle2}
          delay={0.3}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Orders per week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pedidos por Semana</CardTitle>
          </CardHeader>
          <CardContent>
            {weekData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="pedidos"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#06b6d4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
