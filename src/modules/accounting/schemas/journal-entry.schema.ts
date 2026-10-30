import { z } from 'zod';

const decimalRegex = /^-?\d+(\.\d+)?$/;

export const journalEntryItemSchema = z.object({
  id: z.string().uuid().optional(),
  account_id: z.string().uuid('Account is required'),
  account_code: z.string().optional(),
  account_name: z.string().optional(),
  party_type: z.enum(['Customer', 'Supplier', 'Employee', 'Shareholder']).optional().nullable(),
  party_id: z.string().uuid().optional().nullable(),
  cost_centre_id: z.string().uuid().optional().nullable(),
  debit: z.string().regex(decimalRegex, 'Debit must be decimal').default('0.000000'),
  credit: z.string().regex(decimalRegex, 'Credit must be decimal').default('0.000000'),
  user_remark: z.string().optional().nullable(),
});

export type JournalEntryItem = z.infer<typeof journalEntryItemSchema>;
export type CreateJournalEntryItemInput = z.input<typeof journalEntryItemSchema>;

export const journalEntrySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  company_id: z.string().uuid('Company is required'),
  entry_number: z.string().optional(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  entry_type: z.enum([
    'Journal Entry',
    'Inter Company Journal Entry',
    'Bank Entry',
    'Cash Entry',
    'Credit Card Entry',
    'Debit Note',
    'Credit Note',
    'Contra Entry',
    'Excise Entry',
    'Write Off Entry',
    'Opening Entry',
    'Depreciation Entry',
    'Exchange Rate Revaluation',
  ]).default('Journal Entry'),
  total_debit: z.string().regex(decimalRegex).default('0.000000'),
  total_credit: z.string().regex(decimalRegex).default('0.000000'),
  difference: z.string().regex(decimalRegex).default('0.000000'),
  status: z.enum(['Draft', 'Submitted', 'Cancelled']).default('Draft'),
  user_remark: z.string().optional().nullable(),
  items: z.array(journalEntryItemSchema).min(2, 'Journal entry requires at least 2 line items'),
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;
export type CreateJournalEntryInput = z.input<typeof journalEntrySchema>;
