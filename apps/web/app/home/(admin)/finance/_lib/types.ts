export interface CustomerCartera {
  id: string;
  business_name: string;
  nit: string;
  city: string | null;
  credit_limit: number;
  credit_used: number;
  credit_available: number;
  is_blocked: boolean;
  block_reason: string | null;
  payment_terms: string | null;
  assigned_sales_rep?: {
    id: string;
    full_name: string;
  } | null;
}

export interface CarteraFilters {
  search?: string;
  blocked_only?: boolean;
  overdue_only?: boolean;
}

export interface CarteraSummary {
  total_customers: number;
  total_credit_limit: number;
  total_credit_used: number;
  blocked_customers: number;
}
