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
      'approved',
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
    .min(0, 'El IVA no puede ser negativo')
    .max(100, 'El IVA no puede ser mayor a 100%')
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
  pending_approval: { label: 'Pend. Aprobación', variant: 'outline' },
  pending_oc: { label: 'Pendiente OC', variant: 'outline' },
  approved: { label: 'Aprobada', variant: 'default' },
  rejected: { label: 'Rechazada', variant: 'destructive' },
  lost: { label: 'Perdida', variant: 'destructive' },
  expired: { label: 'Expirada', variant: 'secondary' },
};

export const KANBAN_COLUMNS = [
  { key: 'borrador', label: 'Borrador', statuses: ['draft'], headerColor: 'bg-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-800/50' },
  { key: 'oferta', label: 'Creación Oferta', statuses: ['offer_created'], headerColor: 'bg-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'negociacion', label: 'Negociación', statuses: ['negotiation'], headerColor: 'bg-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  { key: 'riesgo', label: 'Riesgo', statuses: ['risk'], headerColor: 'bg-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  { key: 'aprobacion', label: 'Aprobación', statuses: ['pending_approval'], headerColor: 'bg-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  { key: 'pendiente_oc', label: 'Pendiente OC', statuses: ['pending_oc'], headerColor: 'bg-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  { key: 'aprobada', label: 'Aprobada', statuses: ['approved'], headerColor: 'bg-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  { key: 'rechazada', label: 'Rechazada', statuses: ['rejected'], headerColor: 'bg-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  { key: 'vencida', label: 'Vencida', statuses: ['expired'], headerColor: 'bg-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700/50' },
] as const;

export const MARGIN_HEALTH = {
  critical: { max: 7, borderColor: 'border-l-red-500', textColor: 'text-red-600' },
  warning: { max: 9, borderColor: 'border-l-yellow-500', textColor: 'text-yellow-600' },
  healthy: { max: Infinity, borderColor: 'border-l-green-500', textColor: 'text-green-600' },
} as const;
