// Sprint 4: Dashboard types

export interface CommercialDashboard {
  lead_counts: Record<string, number>;
  quote_counts: Record<string, number>;
  quotes_by_advisor: QuotesByAdvisor[];
  total_leads: number;
  total_quotes: number;
  total_orders: number;
  pipeline_value: number;
  conversion_rate: number;
}

export interface QuotesByAdvisor {
  advisor_name: string;
  total_quotes: number;
  won: number;
  won_value: number;
}

export interface OperationalDashboard {
  orders_by_status: Record<string, number>;
  orders_per_week: OrdersPerWeek[];
  active_orders: number;
  completed_orders: number;
  invoiced_total: number;
  pending_deliveries: number;
}

export interface OrdersPerWeek {
  week_start: string;
  order_count: number;
}

export interface SemaforoOrder {
  order_id: string;
  order_number: number;
  customer_name: string;
  advisor_name: string;
  status: string;
  total: number;
  currency: string;
  semaforo_color: SemaforoColor;
  pending_task_count: number;
  max_overdue_days: number;
  created_at: string;
}

export type SemaforoColor =
  | 'dark_green'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'fuchsia'
  | 'black';

export interface ProductJourneyEvent {
  type: 'quote' | 'order' | 'purchase_order' | 'shipment' | 'invoice';
  ref_number: string;
  quantity: number;
  unit_price?: number;
  total?: number;
  currency?: string;
  status: string;
  event_date: string;
  advisor_name?: string;
  customer_name?: string;
  supplier_name?: string;
  carrier?: string;
  tracking_number?: string;
  parent_id: string;
  item_id: string;
  quantity_purchased?: number;
  quantity_received?: number;
  quantity_dispatched?: number;
  quantity_delivered?: number;
}

export interface DashboardFilters {
  from?: string;
  to?: string;
  advisor_id?: string;
}

export interface SavedReport {
  id: string;
  name: string;
  report_type: ReportType;
  filters: Record<string, unknown>;
  columns: string[] | null;
  is_shared: boolean;
  created_at: string;
}

export type ReportType = 'leads' | 'quotes' | 'orders' | 'revenue' | 'performance';
