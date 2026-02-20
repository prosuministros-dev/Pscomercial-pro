import { z } from 'zod';

export const productFormSchema = z.object({
  sku: z
    .string()
    .min(1, 'El SKU es obligatorio')
    .max(100, 'El SKU no puede exceder 100 caracteres')
    .regex(/^[A-Za-z0-9\-_]+$/, 'El SKU solo puede contener letras, números, guiones y guiones bajos'),

  name: z
    .string()
    .min(1, 'El nombre del producto es obligatorio')
    .max(255, 'El nombre no puede exceder 255 caracteres'),

  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),

  category_id: z
    .string()
    .min(1, 'La categoría es obligatoria'),

  brand: z
    .string()
    .min(1, 'La marca es obligatoria')
    .max(100, 'La marca no puede exceder 100 caracteres'),

  tax: z
    .number()
    .min(0, 'El impuesto no puede ser negativo')
    .max(100, 'El impuesto no puede exceder 100%')
    .optional()
    .nullable(),

  unit_cost_usd: z
    .number()
    .min(0, 'El costo en USD no puede ser negativo')
    .default(0),

  unit_cost_cop: z
    .number()
    .min(0, 'El costo en COP no puede ser negativo')
    .default(0),

  suggested_price_cop: z
    .number()
    .min(0, 'El precio sugerido no puede ser negativo')
    .optional()
    .nullable(),

  currency: z
    .enum(['COP', 'USD'], {
      errorMap: () => ({ message: 'La moneda debe ser COP o USD' }),
    })
    .default('COP'),

  is_service: z
    .boolean()
    .default(false),

  is_license: z
    .boolean()
    .default(false),

  is_active: z
    .boolean()
    .default(true),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
