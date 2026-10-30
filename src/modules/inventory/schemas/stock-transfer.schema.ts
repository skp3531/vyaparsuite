import { z } from 'zod';

export const stockTransferItemSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid('Item is required'),
  item_code: z.string().optional(),
  item_name: z.string().optional(),
  qty: z.string().regex(/^\d+(\.\d+)?$/, 'Qty must be a positive decimal string'),
  uom_id: z.string().uuid('UOM is required'),
  uom_name: z.string().optional(),
  transfer_rate: z.string().regex(/^\d+(\.\d+)?$/, 'Transfer rate must be a decimal string').default('0'),
  batch_id: z.string().uuid().optional().nullable(),
});

export type StockTransferItem = z.infer<typeof stockTransferItemSchema>;
export type CreateStockTransferItemInput = z.input<typeof stockTransferItemSchema>;

export const stockTransferSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
  transfer_number: z.string().optional(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  from_warehouse_id: z.string().uuid('Source warehouse is required'),
  from_warehouse_name: z.string().optional(),
  to_warehouse_id: z.string().uuid('Destination warehouse is required'),
  to_warehouse_name: z.string().optional(),
  purpose: z.string().default('Material Transfer'),
  status: z.enum(['Draft', 'Submitted', 'Closed', 'Cancelled']).default('Draft'),
  remarks: z.string().optional().nullable(),
  items: z.array(stockTransferItemSchema).min(1, 'At least one item is required'),
}).refine((data) => data.from_warehouse_id !== data.to_warehouse_id, {
  message: 'Source and destination warehouses must be different',
  path: ['to_warehouse_id'],
});

export type StockTransfer = z.infer<typeof stockTransferSchema>;
export type CreateStockTransferInput = z.input<typeof stockTransferSchema>;
