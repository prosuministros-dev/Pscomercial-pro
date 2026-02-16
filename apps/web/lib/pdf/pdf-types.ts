export interface QuoteItemForPdf {
  sort_order: number;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

export interface QuoteForPdf {
  id: string;
  quote_number: number;
  quote_date: string;
  expires_at: string;
  validity_days: number;
  currency: 'COP' | 'USD';
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  transport_cost: number;
  transport_included: boolean;
  total: number;
  payment_terms: string;
  notes: string | null;
  items: QuoteItemForPdf[];
  customer: {
    business_name: string;
    nit: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
  };
  advisor: {
    display_name: string;
    email: string;
    phone: string | null;
  };
}

export interface OrgForPdf {
  name: string;
  tax_id: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
}
