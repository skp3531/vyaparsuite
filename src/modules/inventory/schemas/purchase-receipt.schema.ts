import { z } from 'zod';

export const purchaseReceiptItemSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid('Item is required'),
  item_code: z.string().optional(),
  item_name: z.string().optional(),
  warehouse_id: z.string().uuid('Warehouse is required'),
  warehouse_name: z.string().optional(),
  qty: z.string().regex(/^\d+(\.\d+)?$/, 'Accepted Qty must be a non-negative decimal string'),
  rejected_qty: z.string().regex(/^\d+(\.\d+)?$/, 'Rejected Qty must be a non-negative decimal string').default('0'),
  uom_id: z.string().uuid('UOM is required'),
  uom_name: z.string().optional(),
  rate: z.string().regex(/^\d+(\.\d+)?$/, 'Rate must be a non-negative decimal string').default('0'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a decimal string').default('0'),
  batch_id: z.string().uuid().optional().nullable(),
  serial_nos: z.string().optional().nullable(),
  purchase_order_id: z.string().uuid().optional().nullable(),
  purchase_order_item_id: z.string().uuid().optional().nullable(),
});

export type PurchaseReceiptItem = z.infer<typeof purchaseReceiptItemSchema>;
export type CreatePurchaseReceiptItemInput = z.input<typeof purchaseReceiptItemSchema>;

export const purchaseReceiptSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
  receipt_number: z.string().optional(),
  supplier_id: z.string().uuid('Supplier is required'),
  supplier_name: z.string().optional(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  posting_time: z.string().optional(),
  status: z.enum(['Draft', 'Submitted', 'Closed', 'Cancelled']).default('Draft'),
  supplier_delivery_note: z.string().optional().nullable(),
  grand_total: z.string().default('0'),
  items: z.array(purchaseReceiptItemSchema).min(1, 'At least one item line is required'),
});

export type PurchaseReceipt = z.infer<typeof purchaseReceiptSchema>;
export type CreatePurchaseReceiptInput = z.input<typeof purchaseReceiptSchema>;
