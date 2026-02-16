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

// --- Sprint 3 Types ---

export type PurchaseOrderStatus = 'draft' | 'sent' | 'confirmed' | 'partial_received' | 'received' | 'cancelled';

export interface Supplier {
  id: string;
  organization_id: string;
  name: string;
  nit: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string;
  payment_terms: string | null;
  lead_time_days: number | null;
  rating: number | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  po_number: number;
  order_id: string;
  supplier_id: string;
  status: PurchaseOrderStatus;
  currency: string;
  trm_applied: number | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  notes: string | null;
  document_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  order_item_id: string;
  product_id: string | null;
  sku: string;
  description: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  subtotal: number;
  status: 'pending' | 'partial' | 'received';
  received_at: string | null;
  received_by: string | null;
}

export type ShipmentStatus = 'preparing' | 'dispatched' | 'in_transit' | 'delivered' | 'returned';

export interface Shipment {
  id: string;
  organization_id: string;
  shipment_number: number;
  order_id: string;
  status: ShipmentStatus;
  dispatch_type: 'envio' | 'retiro' | 'mensajeria';
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  delivery_address: string;
  delivery_city: string;
  delivery_contact: string;
  delivery_phone: string;
  estimated_delivery: string | null;
  actual_delivery: string | null;
  dispatched_at: string | null;
  dispatched_by: string | null;
  received_by_name: string | null;
  reception_notes: string | null;
  proof_of_delivery_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: ShipmentItem[];
}

export interface ShipmentItem {
  id: string;
  shipment_id: string;
  order_item_id: string;
  quantity_shipped: number;
  serial_numbers: string[];
  notes: string | null;
}

export type InvoiceStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  invoice_date: string;
  due_date: string | null;
  currency: string;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: InvoiceStatus;
  payment_date: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  document_url: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  order_item_id: string | null;
  sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  tax_amount: number;
  total: number;
}

export type LicenseType = 'software' | 'saas' | 'hardware_warranty' | 'support' | 'subscription';
export type LicenseStatus = 'pending' | 'active' | 'expired' | 'renewed' | 'cancelled';

export interface LicenseRecord {
  id: string;
  organization_id: string;
  order_id: string;
  order_item_id: string;
  product_id: string | null;
  license_type: LicenseType;
  license_key: string | null;
  vendor: string | null;
  activation_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  seats: number | null;
  status: LicenseStatus;
  activation_notes: string | null;
  end_user_name: string | null;
  end_user_email: string | null;
  document_url: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskType = 'purchase' | 'reception' | 'dispatch' | 'delivery' | 'billing' | 'license_activation';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TrafficLight = 'green' | 'yellow' | 'red';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface OrderPendingTask {
  id: string;
  organization_id: string;
  order_id: string;
  order_item_id: string | null;
  task_type: TaskType;
  title: string;
  description: string | null;
  priority: TaskPriority;
  traffic_light: TrafficLight;
  due_date: string | null;
  assigned_to: string | null;
  status: TaskStatus;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assigned_user?: { id: string; display_name: string };
}

export interface TraceabilityEvent {
  timestamp: string;
  type: 'status_change' | 'purchase_order' | 'reception' | 'shipment' | 'delivery' | 'invoice' | 'license' | 'task';
  title: string;
  description: string | null;
  user_name: string | null;
  metadata: Record<string, unknown>;
}
