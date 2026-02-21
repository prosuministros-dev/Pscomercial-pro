import { z } from 'zod';

export const quoteFormSchema = z.object({
  lead_id: z.string().uuid().optional(),
  customer_id: z.string().uuid('Cliente es requerido'),
  contact_id: z.string().uuid().optional(),
  advisor_id: z.string().uuid().optional(),
  quote_date: z.string().optional(),
  validity_days: z.number().int().min(1).max(365).optional(),
  status: z
    .enum([
      'draft',
      'offer_created',
      'negotiation',
      'risk',
      'pending_oc',
      'converted',
      'rejected',
      'lost',
      'expired',
    ])
    .optional(),
  currency: z.enum(['COP', 'USD']).optional(),
  payment_terms: z.string().optional(),
  transport_cost: z.number().min(0).optional(),
  transport_included: z.boolean().optional(),
  notes: z.string().optional(),
  credit_blocked: z.boolean().optional(),
  credit_block_reason: z.string().optional(),
  estimated_close_month: z.string().optional(),
  estimated_close_week: z.string().optional(),
  estimated_billing_date: z.string().optional(),
  rejection_reason: z.string().optional(),
});

export const quoteItemFormSchema = z.object({
  product_id: z.string().uuid().optional(),
  sku: z.string().min(1, 'SKU es requerido').max(50),
  description: z.string().min(1, 'Descripción es requerida'),
  quantity: z
    .number()
    .positive('La cantidad debe ser mayor a 0')
    .max(999999, 'Cantidad máxima excedida'),
  unit_price: z
    .number()
    .nonnegative('El precio debe ser mayor o igual a 0')
    .max(9999999999, 'Precio máximo excedido'),
  discount_pct: z
    .number()
    .min(0, 'El descuento no puede ser negativo')
    .max(100, 'El descuento no puede ser mayor a 100%')
    .optional(),
  tax_pct: z
    .number()
    .refine(
      (val) => [0, 5, 19].includes(val),
      { message: 'El IVA solo puede ser 0%, 5% o 19%' },
    )
    .optional(),
  cost_price: z
    .number()
    .nonnegative('El costo debe ser mayor o igual a 0')
    .max(9999999999, 'Costo máximo excedido'),
  notes: z.string().optional(),
});

export type QuoteFormSchema = z.infer<typeof quoteFormSchema>;
export type QuoteItemFormSchema = z.infer<typeof quoteItemFormSchema>;

export const STATUS_LABELS: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft: { label: 'Borrador', variant: 'secondary' },
  offer_created: { label: 'Oferta Creada', variant: 'outline' },
  negotiation: { label: 'En Negociación', variant: 'default' },
  risk: { label: 'Riesgo', variant: 'destructive' },
  pending_oc: { label: 'Pendiente OC', variant: 'outline' },
  converted: { label: 'Convertida a Pedido', variant: 'default' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  lost: { label: 'Perdida', variant: 'destructive' },
  expired: { label: 'Expirada', variant: 'secondary' },
};

// Pipeline Kanban: EXACTLY 4 columns per Daniel's requirement
// Terminal states (converted, rejected, lost, expired) shown separately, NOT in Kanban
export const KANBAN_COLUMNS = [
  { key: 'oferta', label: 'Creación Oferta (40%)', statuses: ['offer_created'], headerColor: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'negociacion', label: 'Negociación (60%)', statuses: ['negotiation'], headerColor: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  { key: 'riesgo', label: 'Riesgo (70%)', statuses: ['risk'], headerColor: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  { key: 'pendiente_oc', label: 'Pendiente OC (80%)', statuses: ['pending_oc'], headerColor: 'bg-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
] as const;

// Terminal states shown in a separate section below Kanban
export const TERMINAL_STATUSES = ['converted', 'rejected', 'lost', 'expired'] as const;

export const MARGIN_HEALTH = {
  critical: { max: 7, borderColor: 'border-l-red-500', textColor: 'text-red-600' },
  warning: { max: 9, borderColor: 'border-l-yellow-500', textColor: 'text-yellow-600' },
  healthy: { max: Infinity, borderColor: 'border-l-green-500', textColor: 'text-green-600' },
} as const;
