import { z } from 'zod';

export const stockLedgerEntrySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
  item_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  posting_time: z.string().optional(),
  actual_qty: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid decimal string for actual_qty'),
  qty_after_transaction: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid decimal string for qty_after_transaction').default('0'),
  incoming_rate: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid decimal string for incoming_rate').default('0'),
  valuation_rate: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid decimal string for valuation_rate').default('0'),
  stock_value: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid decimal string for stock_value').default('0'),
  stock_value_difference: z.string().regex(/^-?\d+(\.\d+)?$/, 'Invalid decimal string for stock_value_difference').default('0'),
  voucher_type: z.enum([
    'Delivery Note',
    'Purchase Receipt',
    'Stock Transfer',
    'Stock Reconciliation',
    'Stock Entry',
    'Sales Invoice',
    'Purchase Invoice',
  ]),
  voucher_id: z.string().uuid(),
  voucher_detail_id: z.string().uuid().optional().nullable(),
  batch_id: z.string().uuid().optional().nullable(),
  serial_no: z.string().optional().nullable(),
  is_cancelled: z.boolean().default(false),
  fiscal_year_id: z.string().uuid().optional().nullable(),
});

export type StockLedgerEntry = z.infer<typeof stockLedgerEntrySchema>;
export type CreateStockLedgerEntryInput = z.input<typeof stockLedgerEntrySchema>;

export const stockBalanceSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  item_id: z.string().uuid(),
  warehouse_id: z.string().uuid(),
  actual_qty: z.string().default('0'),
  reserved_qty: z.string().default('0'),
  ordered_qty: z.string().default('0'),
  indented_qty: z.string().default('0'),
  projected_qty: z.string().default('0'),
  valuation_rate: z.string().default('0'),
  stock_value: z.string().default('0'),
});

export type StockBalance = z.infer<typeof stockBalanceSchema>;
export type UpdateStockBalanceInput = z.input<typeof stockBalanceSchema>;
