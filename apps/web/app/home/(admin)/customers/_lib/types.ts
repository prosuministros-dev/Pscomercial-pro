export interface Customer {
  id: string;
  organization_id: string;
  business_name: string;
  nit: string;
  address?: string;
  city?: string;
  department?: string;
  phone?: string;
  email?: string;
  payment_terms?: string;
  assigned_sales_rep_id?: string;
  assigned_advisor?: { id: string; full_name: string } | null;
  status: string;
  last_interaction_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  full_name: string;
  phone: string;
  email: string;
  position?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerVisit {
  id: string;
  organization_id: string;
  customer_id: string;
  advisor_id: string;
  advisor?: { id: string; full_name: string } | null;
  visit_date: string;
  visit_type: 'presencial' | 'virtual' | 'telefonica';
  status: 'programada' | 'realizada' | 'cancelada';
  observations?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFilters {
  business_name?: string;
  nit?: string;
  city?: string;
  status?: string;
  assigned_sales_rep_id?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomersResponse {
  data: Customer[];
  pagination: PaginationInfo;
}

export interface CustomerContactsResponse {
  data: CustomerContact[];
}

export interface CustomerVisitsResponse {
  data: CustomerVisit[];
  pagination: PaginationInfo;
}

export interface CustomerHistoryResponse {
  quotes?: {
    data: Array<{
      id: string;
      consecutive: string;
      status: string;
      total_cop: number;
      total_usd: number;
      valid_until: string;
      created_at: string;
      advisor?: { full_name: string } | null;
    }>;
    total: number;
  };
  orders?: {
    data: Array<{
      id: string;
      consecutive: string;
      status: string;
      total_cop: number;
      created_at: string;
      advisor?: { full_name: string } | null;
    }>;
    total: number;
  };
  purchase_orders?: {
    data: Array<{
      id: string;
      consecutive: string;
      status: string;
      total_cop: number;
      supplier?: { business_name: string } | null;
      created_at: string;
    }>;
    total: number;
  };
}
