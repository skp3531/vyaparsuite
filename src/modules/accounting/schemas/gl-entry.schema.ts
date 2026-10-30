import { z } from 'zod';

const decimalRegex = /^-?\d+(\.\d+)?$/;

export const glEntrySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  posting_time: z.string().optional(),
  account_id: z.string().uuid('Account ID must be a valid UUID'),
  party_type: z.enum(['Customer', 'Supplier', 'Employee', 'Shareholder']).optional().nullable(),
  party_id: z.string().uuid().optional().nullable(),
  cost_centre_id: z.string().uuid().optional().nullable(),
  profit_centre_id: z.string().uuid().optional().nullable(),
  debit: z.string().regex(decimalRegex, 'Debit must be a decimal string').default('0.000000'),
  credit: z.string().regex(decimalRegex, 'Credit must be a decimal string').default('0.000000'),
  account_currency: z.string().default('INR'),
  debit_in_account_currency: z.string().regex(decimalRegex).default('0.000000'),
  credit_in_account_currency: z.string().regex(decimalRegex).default('0.000000'),
  voucher_type: z.enum([
    'Journal Entry',
    'Sales Invoice',
    'Purchase Invoice',
    'Payment Entry',
    'Delivery Note',
    'Purchase Receipt',
    'Asset Depreciation',
    'Period Closing',
  ]),
  voucher_id: z.string().uuid('Voucher ID must be a valid UUID'),
  voucher_number: z.string().min(1, 'Voucher number is required'),
  fiscal_year_id: z.string().uuid().optional().nullable(),
  is_cancelled: z.boolean().default(false),
  remarks: z.string().optional().nullable(),
});

export type GLEntry = z.infer<typeof glEntrySchema>;
export type CreateGLEntryInput = z.input<typeof glEntrySchema>;

export const glFilterSchema = z.object({
  account_id: z.string().uuid().optional(),
  party_type: z.string().optional(),
  party_id: z.string().uuid().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  voucher_type: z.string().optional(),
  voucher_id: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
});

export type GLFilterParams = z.input<typeof glFilterSchema>;
