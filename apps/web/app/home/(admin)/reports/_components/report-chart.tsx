'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ReportDataRow } from '../_lib/types';

interface ReportChartProps {
  chartType: 'bar' | 'line' | 'pie';
  data: ReportDataRow[];
  isCurrency?: boolean;
}

const COLORS = ['#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f97316', '#ef4444', '#ec4899'];

export function ReportChart({ chartType, data, isCurrency = false }: ReportChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  const fmt = (n: number) =>
    isCurrency
      ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n)
      : n.toLocaleString('es-CO');

  if (chartType === 'bar') {
    const hasSecondary = data.some((d) => d.secondary_value != null);
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v: number) => [fmt(v), '']} />
          <Bar dataKey="value" fill="#06b6d4" name="Total" radius={[0, 4, 4, 0]} />
          {hasSecondary && (
            <Bar dataKey="secondary_value" fill="#8b5cf6" name="Secundario" radius={[0, 4, 4, 0]} />
          )}
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v: number) => (isCurrency ? `$${(v / 1000000).toFixed(0)}M` : String(v))} />
          <Tooltip formatter={(v: number) => [fmt(v), 'Valor']} />
          <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4, fill: '#06b6d4' }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Pie
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          nameKey="label"
          label={({ label, value }) => `${label}: ${fmt(value)}`}
          labelLine={false}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => [fmt(v), '']} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
