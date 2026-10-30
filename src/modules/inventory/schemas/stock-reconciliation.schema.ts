import { z } from 'zod';

export const stockReconciliationItemSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid('Item is required'),
  item_code: z.string().optional(),
  item_name: z.string().optional(),
  warehouse_id: z.string().uuid('Warehouse is required'),
  warehouse_name: z.string().optional(),
  current_qty: z.string().regex(/^-?\d+(\.\d+)?$/, 'Current Qty must be a decimal string').default('0'),
  counted_qty: z.string().regex(/^\d+(\.\d+)?$/, 'Counted Qty must be a non-negative decimal string'),
  qty_difference: z.string().regex(/^-?\d+(\.\d+)?$/, 'Difference must be a decimal string').default('0'),
  current_valuation_rate: z.string().regex(/^\d+(\.\d+)?$/, 'Current rate must be decimal').default('0'),
  new_valuation_rate: z.string().regex(/^\d+(\.\d+)?$/, 'New rate must be decimal').default('0'),
  batch_id: z.string().uuid().optional().nullable(),
});

export type StockReconciliationItem = z.infer<typeof stockReconciliationItemSchema>;
export type CreateStockReconciliationItemInput = z.input<typeof stockReconciliationItemSchema>;

export const stockReconciliationSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
  reconciliation_number: z.string().optional(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  purpose: z.string().default('Stock Reconciliation'),
  status: z.enum(['Draft', 'Submitted', 'Closed', 'Cancelled']).default('Draft'),
  remarks: z.string().optional().nullable(),
  items: z.array(stockReconciliationItemSchema).min(1, 'At least one count item is required'),
});

export type StockReconciliation = z.infer<typeof stockReconciliationSchema>;
export type CreateStockReconciliationInput = z.input<typeof stockReconciliationSchema>;
