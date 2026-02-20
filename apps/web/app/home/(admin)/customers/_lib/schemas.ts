import { z } from 'zod';

// Validador de NIT colombiano con dígito de verificación
function validateNIT(nit: string): boolean {
  const cleanNit = nit.replace(/[^0-9]/g, '');
  if (cleanNit.length < 2) return false;

  const nitNumber = cleanNit.slice(0, -1);
  const checkDigit = parseInt(cleanNit.slice(-1));

  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;

  for (let i = 0; i < nitNumber.length; i++) {
    const digit = parseInt(nitNumber[nitNumber.length - 1 - i]!);
    sum += digit * weights[i]!;
  }

  const calculatedCheck = sum % 11;
  const finalCheck = calculatedCheck > 1 ? 11 - calculatedCheck : calculatedCheck;

  return finalCheck === checkDigit;
}

export const customerFormSchema = z.object({
  business_name: z
    .string()
    .min(1, 'La razón social es obligatoria')
    .max(255, 'La razón social no puede exceder 255 caracteres'),

  nit: z
    .string()
    .min(1, 'El NIT es obligatorio')
    .regex(/^[0-9-]+$/, 'El NIT solo puede contener números y guiones')
    .refine(validateNIT, {
      message: 'El NIT no es válido (verifique el dígito de verificación)',
    }),

  address: z
    .string()
    .min(1, 'La dirección es obligatoria')
    .max(500, 'La dirección no puede exceder 500 caracteres'),

  city: z
    .string()
    .min(1, 'La ciudad es obligatoria')
    .max(100, 'La ciudad no puede exceder 100 caracteres'),

  department: z
    .string()
    .min(1, 'El departamento es obligatorio')
    .max(100, 'El departamento no puede exceder 100 caracteres'),

  phone: z
    .string()
    .min(1, 'El teléfono principal es obligatorio')
    .regex(/^[0-9()\s+-]+$/, 'El teléfono solo puede contener números, espacios, +, - y paréntesis')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),

  email: z
    .string()
    .email('Debe ser un correo electrónico válido')
    .optional()
    .or(z.literal('')),

  payment_terms: z
    .string()
    .optional(),

  assigned_sales_rep_id: z
    .string()
    .optional()
    .or(z.literal('')),

  status: z
    .enum(['active', 'inactive'])
    .optional()
    .default('active'),

  notes: z
    .string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional(),
});

export const visitFormSchema = z.object({
  visit_date: z
    .string()
    .min(1, 'La fecha de visita es obligatoria'),

  visit_type: z.enum(['presencial', 'virtual', 'telefonica'], {
    errorMap: () => ({ message: 'Seleccione un tipo de visita' }),
  }),

  status: z.enum(['programada', 'realizada', 'cancelada']).default('realizada'),

  observations: z
    .string()
    .max(2000, 'Las observaciones no pueden exceder 2000 caracteres')
    .optional()
    .or(z.literal('')),
});

export type VisitFormData = z.infer<typeof visitFormSchema>;

export const contactFormSchema = z.object({
  full_name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(255, 'El nombre no puede exceder 255 caracteres'),

  phone: z
    .string()
    .min(1, 'El teléfono es obligatorio')
    .regex(/^[0-9()\s+-]+$/, 'El teléfono solo puede contener números, espacios, +, - y paréntesis')
    .max(20, 'El teléfono no puede exceder 20 caracteres'),

  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Debe ser un correo electrónico válido')
    .max(255, 'El correo electrónico no puede exceder 255 caracteres'),

  position: z
    .string()
    .max(100, 'El cargo no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),

  is_primary: z
    .boolean()
    .default(false),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;
export type ContactFormData = z.infer<typeof contactFormSchema>;
