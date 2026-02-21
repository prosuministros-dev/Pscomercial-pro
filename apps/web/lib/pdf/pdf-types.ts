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
    full_name: string;
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
  banking?: {
    bank_name?: string;
    account_type?: string;
    account_number?: string;
    account_holder?: string;
    account_holder_nit?: string;
  };
}

// --- Order PDF types ---

export interface OrderItemForPdf {
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

export interface OrderDestinationForPdf {
  sort_order: number;
  delivery_address: string;
  delivery_city: string | null;
  delivery_contact: string | null;
  delivery_phone: string | null;
  delivery_schedule: string | null;
  dispatch_type: string | null;
  notes: string | null;
}

export interface OrderForPdf {
  id: string;
  order_number: number;
  created_at: string;
  currency: 'COP' | 'USD';
  subtotal: number;
  tax_amount: number;
  total: number;
  payment_terms: string | null;
  billing_type: string;
  notes: string | null;
  items: OrderItemForPdf[];
  destinations: OrderDestinationForPdf[];
  customer: {
    business_name: string;
    nit: string;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
  };
  advisor: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

// --- Purchase Order PDF types ---

export interface PurchaseOrderItemForPdf {
  sku: string;
  description: string;
  quantity_ordered: number;
  unit_cost: number;
  subtotal: number;
}

export interface PurchaseOrderForPdf {
  id: string;
  po_number: number;
  created_at: string;
  currency: 'COP' | 'USD';
  subtotal: number;
  tax_amount: number;
  total: number;
  expected_delivery_date: string | null;
  notes: string | null;
  items: PurchaseOrderItemForPdf[];
  supplier: {
    name: string;
    nit: string | null;
    address: string | null;
    city: string | null;
    phone: string | null;
    email: string | null;
  };
  order_number: number;
}

// --- Shipment PDF types ---

export interface ShipmentItemForPdf {
  sku: string;
  description: string;
  quantity_shipped: number;
  serial_numbers: string[] | null;
  notes: string | null;
}

export interface ShipmentForPdf {
  id: string;
  shipment_number: number;
  created_at: string;
  status: string;
  dispatch_type: string;
  carrier: string | null;
  tracking_number: string | null;
  delivery_address: string;
  delivery_city: string;
  delivery_contact: string;
  delivery_phone: string;
  estimated_delivery: string | null;
  notes: string | null;
  items: ShipmentItemForPdf[];
  order_number: number;
  customer: {
    business_name: string;
    nit: string;
    address: string | null;
    city: string | null;
    phone: string | null;
  };
}
