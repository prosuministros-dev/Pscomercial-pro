export type ReportType = 'leads' | 'quotes' | 'orders' | 'revenue' | 'performance';

export interface ReportFilters {
  from?: string;
  to?: string;
  advisor_id?: string;
  status?: string;
  customer_id?: string;
}

export interface ReportDataRow {
  label: string;
  value: number;
  secondary_value?: number;
}

export interface ReportResponse {
  chart_data: ReportDataRow[];
  table_data: Record<string, unknown>[];
  summary: Record<string, number>;
}

export const REPORT_TYPE_CONFIG: Record<
  ReportType,
  { label: string; description: string; chartType: 'bar' | 'line' | 'pie' }
> = {
  leads: {
    label: 'Leads por Estado',
    description: 'Distribución de leads agrupados por su estado actual',
    chartType: 'bar',
  },
  quotes: {
    label: 'Cotizaciones por Asesor',
    description: 'Cotizaciones creadas agrupadas por asesor comercial',
    chartType: 'bar',
  },
  orders: {
    label: 'Pedidos por Semana',
    description: 'Volumen de pedidos creados semana a semana',
    chartType: 'line',
  },
  revenue: {
    label: 'Ingresos Mensuales',
    description: 'Total facturado agrupado por mes',
    chartType: 'line',
  },
  performance: {
    label: 'Rendimiento por Asesor',
    description: 'Leads convertidos y cotizaciones ganadas por asesor',
    chartType: 'bar',
  },
};
