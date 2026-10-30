import { z } from 'zod';

const decimalRegex = /^-?\d+(\.\d+)?$/;

export const hsnSacSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  code: z.string().min(2, 'Code must be at least 2 digits').max(8, 'Code cannot exceed 8 digits'),
  type: z.enum(['HSN', 'SAC']).default('HSN'),
  description: z.string().min(1, 'Description is required'),
  chapter_number: z.string().optional().nullable(),
  default_gst_rate: z.string().regex(decimalRegex).default('18.000000'),
  cess_rate: z.string().regex(decimalRegex).default('0.000000'),
  is_rcm_applicable: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type HsnSac = z.infer<typeof hsnSacSchema>;
export type CreateHsnSacInput = z.input<typeof hsnSacSchema>;
