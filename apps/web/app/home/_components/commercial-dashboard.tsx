'use client';

import { Users, FileText, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Loader2 } from 'lucide-react';
import { StatCard } from '~/components/shared/stat-card';
import { useCommercialDashboard } from '../_lib/dashboard-queries';
import type { DashboardFilters } from '../_lib/types';

interface CommercialDashboardProps {
  filters: DashboardFilters;
}

const FUNNEL_COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6'];

export function CommercialDashboard({ filters }: CommercialDashboardProps) {
  const { data, isLoading } = useCommercialDashboard(filters);

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

  const funnelData = [
    { name: 'Leads', value: data.total_leads },
    { name: 'Cotizaciones', value: data.total_quotes },
    { name: 'Pedidos', value: data.total_orders },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={data.total_leads}
          icon={Users}
          delay={0}
        />
        <StatCard
          title="Cotizaciones"
          value={data.total_quotes}
          icon={FileText}
          delay={0.1}
        />
        <StatCard
          title="Pedidos"
          value={data.total_orders}
          icon={ShoppingCart}
          delay={0.2}
        />
        <StatCard
          title="Pipeline"
          value={fmt(data.pipeline_value)}
          icon={DollarSign}
          delay={0.3}
        />
      </div>

      {/* Conversion rate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tasa de Conversión"
          value={`${data.conversion_rate}%`}
          icon={TrendingUp}
          description="Leads → Pedidos"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funnel chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Embudo Comercial</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(v: number) => [v, 'Cantidad']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((_, idx) => (
                    <Cell key={idx} fill={FUNNEL_COLORS[idx]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quotes by advisor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Cotizaciones por Asesor</CardTitle>
          </CardHeader>
          <CardContent>
            {data.quotes_by_advisor.length === 0 ? (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground text-sm">
                Sin datos
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.quotes_by_advisor} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="advisor_name" width={120} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number, name: string) => [
                      v,
                      name === 'total_quotes' ? 'Total' : 'Ganadas',
                    ]}
                  />
                  <Bar dataKey="total_quotes" fill="#94a3b8" name="Total" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="won" fill="#06b6d4" name="Ganadas" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
