export interface Quote {
  id: string;
  organization_id: string;
  quote_number: number;
  lead_id: string | null;
  customer_id: string;
  contact_id: string | null;
  advisor_id: string;
  quote_date: string;
  validity_days: number;
  expires_at: string;
  status:
    | 'draft'
    | 'offer_created'
    | 'negotiation'
    | 'risk'
    | 'pending_approval'
    | 'pending_oc'
    | 'approved'
    | 'rejected'
    | 'lost'
    | 'expired';
  currency: 'COP' | 'USD';
  trm_applied: number | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  transport_cost: number;
  transport_included: boolean;
  total: number;
  margin_pct: number | null;
  margin_approved: boolean;
  margin_approved_by: string | null;
  margin_approved_at: string | null;
  payment_terms: string;
  credit_validated: boolean;
  credit_validation_result: Record<string, unknown> | null;
  credit_blocked: boolean;
  credit_blocked_by: string | null;
  credit_blocked_at: string | null;
  credit_block_reason: string | null;
  estimated_close_month: string | null;
  estimated_close_week: string | null;
  estimated_billing_date: string | null;
  rejection_reason: string | null;
  proforma_url: string | null;
  proforma_generated_at: string | null;
  sent_to_client: boolean;
  sent_at: string | null;
  sent_via: string | null;
  loss_reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  customer?: {
    id: string;
    business_name: string;
    nit: string;
    city?: string;
  };
  advisor?: {
    id: string;
    display_name: string;
    email: string;
  };
  lead?: {
    id: string;
    lead_number: number;
    business_name: string;
  };
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string | null;
  sort_order: number;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  discount_amount: number;
  tax_pct: number;
  tax_amount: number;
  subtotal: number;
  total: number;
  cost_price: number;
  margin_pct: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    sku: string;
    name: string;
    brand: string | null;
    category_id: string | null;
  };
}

export interface QuoteFilters {
  status?: string;
  customer_id?: string;
  advisor_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
}

export interface QuoteFormData {
  lead_id?: string;
  customer_id: string;
  contact_id?: string;
  advisor_id?: string;
  quote_date?: string;
  validity_days?: number;
  status?: string;
  currency?: 'COP' | 'USD';
  payment_terms?: string;
  transport_cost?: number;
  transport_included?: boolean;
  notes?: string;
}

export interface QuoteItemFormData {
  product_id?: string;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_pct?: number;
  tax_pct?: number;
  cost_price: number;
  notes?: string;
}
