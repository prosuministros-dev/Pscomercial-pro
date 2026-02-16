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
