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
