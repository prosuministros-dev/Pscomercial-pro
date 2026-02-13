import { z } from 'zod';

export const leadFormSchema = z.object({
  business_name: z.string().min(1, 'Razón social es requerida').max(255),
  nit: z.string().optional(),
  contact_name: z.string().min(1, 'Nombre del contacto es requerido').max(255),
  phone: z.string().min(1, 'Teléfono es requerido').max(20),
  email: z.string().email('Email inválido').max(255),
  requirement: z.string().min(1, 'Requerimiento es obligatorio'),
  channel: z.enum(['whatsapp', 'web', 'manual'], {
    required_error: 'Canal es requerido',
  }),
});

export type LeadFormSchema = z.infer<typeof leadFormSchema>;
