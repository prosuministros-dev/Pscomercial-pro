export { type Supplier } from '../../orders/_lib/types';

export interface SupplierFilters {
  search?: string;
  city?: string;
  is_active?: string;
  page?: number;
  limit?: number;
}

export interface SuppliersResponse {
  data: import('../../orders/_lib/types').Supplier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
