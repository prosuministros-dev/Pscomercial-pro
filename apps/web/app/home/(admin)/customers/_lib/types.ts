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

export interface CustomerFilters {
  business_name?: string;
  nit?: string;
  city?: string;
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
