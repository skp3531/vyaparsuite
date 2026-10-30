import { z } from 'zod';

const decimalRegex = /^-?\d+(\.\d+)?$/;

export const salesInvoiceItemSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid('Item is required'),
  item_code: z.string().min(1, 'Item code is required'),
  item_name: z.string().min(1, 'Item name is required'),
  hsn_sac_code: z.string().optional().nullable(),
  qty: z.string().regex(decimalRegex, 'Qty must be a decimal string').default('1.000000'),
  uom_id: z.string().uuid('UOM is required'),
  rate: z.string().regex(decimalRegex, 'Rate must be a decimal string').default('0.000000'),
  discount_percentage: z.string().regex(decimalRegex).default('0.000000'),
  net_amount: z.string().regex(decimalRegex).default('0.000000'),
  income_account_id: z.string().uuid().optional().nullable(),
  cgst_rate: z.string().regex(decimalRegex).default('0.000000'),
  cgst_amount: z.string().regex(decimalRegex).default('0.000000'),
  sgst_rate: z.string().regex(decimalRegex).default('0.000000'),
  sgst_amount: z.string().regex(decimalRegex).default('0.000000'),
  igst_rate: z.string().regex(decimalRegex).default('0.000000'),
  igst_amount: z.string().regex(decimalRegex).default('0.000000'),
  cess_rate: z.string().regex(decimalRegex).default('0.000000'),
  cess_amount: z.string().regex(decimalRegex).default('0.000000'),
  total_amount: z.string().regex(decimalRegex).default('0.000000'),
  sales_order_id: z.string().uuid().optional().nullable(),
  sales_order_item_id: z.string().uuid().optional().nullable(),
  delivery_note_id: z.string().uuid().optional().nullable(),
});

export type SalesInvoiceItem = z.infer<typeof salesInvoiceItemSchema>;
export type CreateSalesInvoiceItemInput = z.input<typeof salesInvoiceItemSchema>;

export const salesInvoiceSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  company_id: z.string().uuid('Company is required'),
  invoice_number: z.string().optional(),
  customer_id: z.string().uuid('Customer is required'),
  customer_name: z.string().optional().nullable(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be YYYY-MM-DD'),
  status: z.enum(['Draft', 'Submitted', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled']).default('Draft'),
  is_pos: z.boolean().default(false),
  is_return: z.boolean().default(false),
  return_against_id: z.string().uuid().optional().nullable(),
  currency: z.string().default('INR'),
  exchange_rate: z.string().regex(decimalRegex).default('1.000000'),
  net_total: z.string().regex(decimalRegex).default('0.000000'),
  tax_total: z.string().regex(decimalRegex).default('0.000000'),
  grand_total: z.string().regex(decimalRegex).default('0.000000'),
  outstanding_amount: z.string().regex(decimalRegex).default('0.000000'),
  paid_amount: z.string().regex(decimalRegex).default('0.000000'),
  irn: z.string().optional().nullable(),
  signed_qr_code: z.string().optional().nullable(),
  ack_no: z.string().optional().nullable(),
  ack_date: z.string().optional().nullable(),
  debit_to_account_id: z.string().uuid().optional().nullable(),
  cost_centre_id: z.string().uuid().optional().nullable(),
  remarks: z.string().optional().nullable(),
  items: z.array(salesInvoiceItemSchema).min(1, 'At least one item is required'),
});

export type SalesInvoice = z.infer<typeof salesInvoiceSchema>;
export type CreateSalesInvoiceInput = z.input<typeof salesInvoiceSchema>;
