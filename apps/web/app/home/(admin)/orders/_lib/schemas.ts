import { z } from 'zod';

const destinationSchema = z.object({
  delivery_address: z.string().min(1, 'Dirección de entrega es requerida'),
  delivery_city: z.string().optional(),
  delivery_contact: z.string().optional(),
  delivery_phone: z.string().optional(),
  delivery_schedule: z.string().optional(),
  dispatch_type: z.string().optional(),
  notes: z.string().optional(),
});

export const createOrderSchema = z.object({
  quote_id: z.string().uuid('Selecciona una cotización'),
  billing_type: z.enum(['total', 'parcial']).default('total'),
  delivery_address: z.string().optional(),
  delivery_city: z.string().optional(),
  delivery_contact: z.string().optional(),
  delivery_phone: z.string().optional(),
  delivery_notes: z.string().optional(),
  expected_delivery_date: z.string().optional(),
  destinations: z.array(destinationSchema).optional(),
});

export type CreateOrderFormData = z.infer<typeof createOrderSchema>;

export const updateStatusSchema = z.object({
  status: z.string().min(1, 'Selecciona un estado'),
  notes: z.string().optional(),
});

export type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;

/** Valid transitions for each order status */
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  created: ['payment_pending', 'available_for_purchase', 'cancelled'],
  payment_pending: ['payment_confirmed', 'cancelled'],
  payment_confirmed: ['available_for_purchase', 'cancelled'],
  available_for_purchase: ['in_purchase', 'cancelled'],
  in_purchase: ['partial_delivery', 'in_logistics', 'cancelled'],
  partial_delivery: ['in_logistics', 'cancelled'],
  in_logistics: ['delivered', 'cancelled'],
  delivered: ['invoiced', 'cancelled'],
  invoiced: ['completed'],
  completed: [],
  cancelled: [],
};

export const STATUS_LABELS: Record<string, string> = {
  created: 'Creado',
  payment_pending: 'Pago Pendiente',
  payment_confirmed: 'Pago Confirmado',
  available_for_purchase: 'Disponible para Compra',
  in_purchase: 'En Compra',
  partial_delivery: 'Entrega Parcial',
  in_logistics: 'En Logística',
  delivered: 'Entregado',
  invoiced: 'Facturado',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

export const BILLING_TYPE_LABELS: Record<string, string> = {
  total: 'Facturación Total',
  parcial: 'Facturación Parcial',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  partial: 'Parcial',
  overdue: 'Vencido',
};

export const ADV_BILLING_STEP_LABELS: Record<string, string> = {
  request: 'Solicitud',
  approval: 'Aprobación',
  remission: 'Remisión',
  invoice: 'Factura',
};

export const ADV_BILLING_VALUE_LABELS: Record<string, Record<string, string>> = {
  request: {
    not_required: 'No Requerida',
    required: 'Requerida',
  },
  approval: {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  },
  remission: {
    not_generated: 'No Generada',
    generated: 'Generada',
  },
  invoice: {
    not_generated: 'No Generada',
    generated: 'Generada',
  },
};

// --- Sprint 3 Schemas ---

export const createPurchaseOrderSchema = z.object({
  order_id: z.string().uuid('Pedido es requerido'),
  supplier_id: z.string().uuid('Proveedor es requerido'),
  currency: z.enum(['COP', 'USD']).default('COP'),
  trm_applied: z.number().optional(),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    order_item_id: z.string().uuid(),
    quantity_ordered: z.number().positive('Cantidad debe ser mayor a 0'),
    unit_cost: z.number().positive('Costo unitario debe ser mayor a 0'),
  })).min(1, 'Debe seleccionar al menos un item'),
});

export type CreatePurchaseOrderFormData = z.infer<typeof createPurchaseOrderSchema>;

export const receiveItemsSchema = z.object({
  items: z.array(z.object({
    po_item_id: z.string().uuid(),
    quantity_received: z.number().min(0),
  })).min(1, 'Debe indicar cantidades recibidas'),
});

export const createShipmentSchema = z.object({
  order_id: z.string().uuid('Pedido es requerido'),
  dispatch_type: z.enum(['envio', 'retiro', 'mensajeria'], { required_error: 'Tipo de despacho es requerido' }),
  carrier: z.string().optional(),
  tracking_number: z.string().optional(),
  tracking_url: z.string().optional(),
  delivery_address: z.string().min(1, 'Dirección de entrega es requerida'),
  delivery_city: z.string().min(1, 'Ciudad es requerida'),
  delivery_contact: z.string().min(1, 'Contacto de entrega es requerido'),
  delivery_phone: z.string().min(1, 'Teléfono de entrega es requerido'),
  estimated_delivery: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    order_item_id: z.string().uuid(),
    quantity_shipped: z.number().positive('Cantidad debe ser mayor a 0'),
    serial_numbers: z.array(z.string()).optional(),
  })).min(1, 'Debe seleccionar al menos un item'),
});

export type CreateShipmentFormData = z.infer<typeof createShipmentSchema>;

export const registerInvoiceSchema = z.object({
  order_id: z.string().uuid('Pedido es requerido'),
  invoice_number: z.string().min(1, 'Número de factura es requerido'),
  invoice_date: z.string().min(1, 'Fecha de factura es requerida'),
  due_date: z.string().optional(),
  currency: z.enum(['COP', 'USD']).default('COP'),
  subtotal: z.number().min(0),
  tax_amount: z.number().min(0),
  total: z.number().positive('Total debe ser mayor a 0'),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    order_item_id: z.string().uuid().optional(),
    sku: z.string().min(1),
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    subtotal: z.number().min(0),
    tax_amount: z.number().min(0),
    total: z.number().positive(),
  })).optional(),
});

export type RegisterInvoiceFormData = z.infer<typeof registerInvoiceSchema>;

export const createLicenseSchema = z.object({
  order_id: z.string().uuid(),
  order_item_id: z.string().uuid(),
  product_id: z.string().uuid().optional(),
  license_type: z.enum(['software', 'saas', 'hardware_warranty', 'support', 'subscription']),
  license_key: z.string().optional(),
  vendor: z.string().optional(),
  activation_date: z.string().optional(),
  expiry_date: z.string().optional(),
  seats: z.number().int().positive().optional(),
  end_user_name: z.string().optional(),
  end_user_email: z.string().email('Email inválido').optional().or(z.literal('')),
  activation_notes: z.string().optional(),
});

export type CreateLicenseFormData = z.infer<typeof createLicenseSchema>;

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Nombre del proveedor es requerido'),
  nit: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Colombia'),
  payment_terms: z.string().optional(),
  lead_time_days: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

export type CreateSupplierFormData = z.infer<typeof createSupplierSchema>;

export const createPendingTaskSchema = z.object({
  order_id: z.string().uuid(),
  order_item_id: z.string().uuid().optional(),
  task_type: z.enum(['purchase', 'reception', 'dispatch', 'delivery', 'billing', 'license_activation']),
  title: z.string().min(1, 'Título es requerido'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  due_date: z.string().optional(),
  assigned_to: z.string().uuid().optional(),
});

export type CreatePendingTaskFormData = z.infer<typeof createPendingTaskSchema>;

// --- Sprint 3 Label Maps ---

export const PO_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  confirmed: 'Confirmada',
  partial_received: 'Recepción Parcial',
  received: 'Recibida',
  cancelled: 'Cancelada',
};

export const SHIPMENT_STATUS_LABELS: Record<string, string> = {
  preparing: 'Preparando',
  dispatched: 'Despachado',
  in_transit: 'En Tránsito',
  delivered: 'Entregado',
  returned: 'Devuelto',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  partial: 'Pago Parcial',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
};

export const LICENSE_TYPE_LABELS: Record<string, string> = {
  software: 'Software',
  saas: 'SaaS',
  hardware_warranty: 'Garantía Hardware',
  support: 'Soporte',
  subscription: 'Suscripción',
};

export const LICENSE_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  active: 'Activa',
  expired: 'Expirada',
  renewed: 'Renovada',
  cancelled: 'Cancelada',
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  purchase: 'Compra',
  reception: 'Recepción',
  dispatch: 'Despacho',
  delivery: 'Entrega',
  billing: 'Facturación',
  license_activation: 'Activación Licencia',
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const TRAFFIC_LIGHT_COLORS: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

export const DISPATCH_TYPE_LABELS: Record<string, string> = {
  envio: 'Envío',
  retiro: 'Retiro en Bodega',
  mensajeria: 'Mensajería',
};
