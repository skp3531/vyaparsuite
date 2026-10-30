import { z } from 'zod';

const decimalRegex = /^-?\d+(\.\d+)?$/;

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const gstSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  company_id: z.string().uuid('Company is required'),
  gstin: z.string().regex(GSTIN_REGEX, 'Invalid GSTIN format (e.g. 27AAAAA0000A1Z5)'),
  registered_legal_name: z.string().min(1, 'Registered legal name is required'),
  registered_trade_name: z.string().optional().nullable(),
  state_code: z.string().length(2, 'State code must be 2 digits'),
  state_name: z.string().min(1, 'State name is required'),
  gst_category: z.enum([
    'Registered Regular',
    'Registered Composition',
    'SEZ Unit',
    'SEZ Developer',
    'Deemed Export',
    'Tax Deductor',
    'Tax Collector (e-Commerce)'
  ]).default('Registered Regular'),
  annual_turnover: z.string().regex(decimalRegex).default('0.000000'),
  is_e_invoice_applicable: z.boolean().default(false),
  e_invoice_threshold: z.string().regex(decimalRegex).default('50000000.000000'), // Default ₹5 Cr
  lut_number: z.string().optional().nullable(),
  lut_expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  default_eway_bill_threshold: z.string().regex(decimalRegex).default('50000.000000'), // Default ₹50,000
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type GSTSettings = z.infer<typeof gstSettingsSchema>;
export type CreateGSTSettingsInput = z.input<typeof gstSettingsSchema>;
