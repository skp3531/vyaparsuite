import { z } from 'zod';

export const deliveryNoteItemSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid('Item is required'),
  item_code: z.string().optional(),
  item_name: z.string().optional(),
  warehouse_id: z.string().uuid('Warehouse is required'),
  warehouse_name: z.string().optional(),
  qty: z.string().regex(/^\d+(\.\d+)?$/, 'Qty must be a positive decimal string'),
  uom_id: z.string().uuid('UOM is required'),
  uom_name: z.string().optional(),
  rate: z.string().regex(/^\d+(\.\d+)?$/, 'Rate must be a positive decimal string').default('0'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a decimal string').default('0'),
  batch_id: z.string().uuid().optional().nullable(),
  serial_nos: z.string().optional().nullable(),
  sales_order_id: z.string().uuid().optional().nullable(),
  sales_order_item_id: z.string().uuid().optional().nullable(),
});

export type DeliveryNoteItem = z.infer<typeof deliveryNoteItemSchema>;
export type CreateDeliveryNoteItemInput = z.input<typeof deliveryNoteItemSchema>;

export const deliveryNoteSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
  delivery_note_number: z.string().optional(),
  customer_id: z.string().uuid('Customer is required'),
  customer_name: z.string().optional(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  posting_time: z.string().optional(),
  status: z.enum(['Draft', 'Submitted', 'Closed', 'Cancelled']).default('Draft'),
  transporter_name: z.string().optional().nullable(),
  vehicle_no: z.string().optional().nullable(),
  lr_no: z.string().optional().nullable(),
  lr_date: z.string().optional().nullable(),
  eway_bill_no: z.string().optional().nullable(),
  eway_bill_validity: z.string().optional().nullable(),
  grand_total: z.string().default('0'),
  items: z.array(deliveryNoteItemSchema).min(1, 'At least one item is required'),
});

export type DeliveryNote = z.infer<typeof deliveryNoteSchema>;
export type CreateDeliveryNoteInput = z.input<typeof deliveryNoteSchema>;
