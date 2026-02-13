export interface Product {
  id: string;
  organization_id: string;
  sku: string;
  name: string;
  description?: string | null;
  category_id: string;
  brand?: string | null;
  unit_cost_usd: number;
  unit_cost_cop: number;
  suggested_price_cop?: number | null;
  currency: 'COP' | 'USD';
  tax?: number | null;
  is_service: boolean;
  is_license: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  product_categories?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ProductFilters {
  search?: string;
  category_id?: string;
  is_active?: string;
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductsResponse {
  data: Product[];
  pagination: PaginationInfo;
}

export interface TRMResponse {
  value: number;
  date: string;
}

export type UserRole = 'gerente_general' | 'gerente_comercial' | 'comercial' | null;
