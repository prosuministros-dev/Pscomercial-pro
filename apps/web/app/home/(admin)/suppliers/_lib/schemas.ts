import { z } from 'zod';

export { createSupplierSchema, type CreateSupplierFormData } from '../../orders/_lib/schemas';

export const updateSupplierSchema = z.object({
  id: z.string().uuid('ID debe ser un UUID válido'),
  name: z.string().min(1, 'Nombre del proveedor es requerido').optional(),
  nit: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  payment_terms: z.string().optional(),
  lead_time_days: z.number().int().positive().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;
