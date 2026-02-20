import { z } from 'zod';

export const saveReportSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  report_type: z.enum(['leads', 'quotes', 'orders', 'revenue', 'performance']),
  filters: z.record(z.unknown()).default({}),
  is_shared: z.boolean().default(false),
});

export type SaveReportInput = z.infer<typeof saveReportSchema>;
