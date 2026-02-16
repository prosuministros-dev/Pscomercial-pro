export type OrderStatus =
  | 'created'
  | 'payment_pending'
  | 'payment_confirmed'
  | 'available_for_purchase'
  | 'in_purchase'
  | 'partial_delivery'
  | 'in_logistics'
  | 'delivered'
  | 'invoiced'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'confirmed' | 'partial' | 'overdue';

export type BillingType = 'total' | 'parcial';

export type AdvBillingStepValue = string; // e.g. 'not_required', 'required', 'pending', 'approved', etc.

export interface Order {
  id: string;
  organization_id: string;
  order_number: number;
  quote_id: string | null;
  customer_id: string;
  advisor_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_terms: string;
  billing_type: BillingType;
  requires_advance_billing: boolean;
  currency: 'COP' | 'USD';
  subtotal: number;
  tax_amount: number;
  total: number;
  delivery_address: string | null;
  delivery_city: string | null;
  delivery_contact: string | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  // Advance billing 4 steps
  adv_billing_request: AdvBillingStepValue;
  adv_billing_request_at: string | null;
  adv_billing_request_by: string | null;
  adv_billing_approval: AdvBillingStepValue;
  adv_billing_approval_at: string | null;
  adv_billing_approval_by: string | null;
  adv_billing_remission: AdvBillingStepValue;
  adv_billing_remission_at: string | null;
  adv_billing_remission_by: string | null;
  adv_billing_invoice: AdvBillingStepValue;
  adv_billing_invoice_at: string | null;
  adv_billing_invoice_by: string | null;
  // Payment confirmation
  payment_confirmed_at: string | null;
  payment_confirmed_by: string | null;
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
  quote?: {
    id: string;
    quote_number: number;
  };
  destinations?: OrderDestination[];
}

export interface OrderDestination {
  id: string;
  organization_id: string;
  order_id: string;
  sort_order: number;
  delivery_address: string;
  delivery_city: string | null;
  delivery_contact: string | null;
  delivery_phone: string | null;
  delivery_schedule: string | null;
  dispatch_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  quote_item_id: string | null;
  product_id: string | null;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  item_status: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string;
  notes: string | null;
  created_at: string;
  changed_by_user?: {
    id: string;
    display_name: string;
    email: string;
  };
}

export interface OrderFilters {
  status?: string;
  customer_id?: string;
  advisor_id?: string;
  payment_status?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
}
