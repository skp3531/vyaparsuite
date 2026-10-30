/**
 * VyaparSuite Purchase Order & Procurement Validation Schemas
 * Strict runtime validation for purchase orders, supplier commitments,
 * and upstream procurement requisitions.
 */

import { z } from 'zod';

export const purchaseOrderStatusEnum = z.enum([
  'Draft',
  'Pending Approval',
  'Approved',
  'To Receive and Bill',
  'To Receive',
  'To Bill',
  'Completed',
  'Cancelled',
  'On Hold',
]);
export type PurchaseOrderStatus = z.infer<typeof purchaseOrderStatusEnum>;

const decimalRegex = /^-?\d+(\.\d+)?$/;

export const purchaseOrderItemInputSchema = z.object({
  id: z.string().uuid().optional(),
  item_id: z.string().uuid('Item ID must be a valid UUID'),
  item_code: z.string().min(1, 'Item code is required'),
  item_name: z.string().min(1, 'Item name is required'),
  description: z.string().optional().nullable(),
  qty: z.string().regex(decimalRegex, 'Qty must be a valid decimal string').default('1.000000'),
  uom_id: z.string().uuid('UOM ID must be a valid UUID'),
  rate: z.string().regex(decimalRegex, 'Rate must be a valid decimal string').default('0.000000'),
  discount_percentage: z.string().regex(decimalRegex).default('0.000000'),
  discount_amount: z.string().regex(decimalRegex).default('0.000000'),
  tax_template_id: z.string().uuid().optional().nullable(),
  tax_rate: z.string().regex(decimalRegex).default('0.000000'),
  warehouse_id: z.string().uuid().optional().nullable(),
  material_request_item_id: z.string().uuid().optional().nullable(),
});

export const purchaseOrderSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  purchase_order_number: z.string().optional(),
  company_id: z.string().uuid('Company ID is required'),
  supplier_id: z.string().uuid('Supplier ID is required'),
  supplier_quotation_id: z.string().uuid().optional().nullable(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().slice(0, 10)),
  schedule_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Schedule/Expected delivery date is required'),
  status: purchaseOrderStatusEnum.default('Draft'),
  currency: z.string().default('INR'),
  exchange_rate: z.string().regex(decimalRegex).default('1.000000'),
  net_total: z.string().regex(decimalRegex).default('0.000000'),
  tax_total: z.string().regex(decimalRegex).default('0.000000'),
  grand_total: z.string().regex(decimalRegex).default('0.000000'),
  rounding_adjustment: z.string().regex(decimalRegex).default('0.000000'),
  rounded_total: z.string().regex(decimalRegex).default('0.000000'),
  received_percent: z.string().regex(decimalRegex).default('0.000000'),
  billed_percent: z.string().regex(decimalRegex).default('0.000000'),
  is_subcontracted: z.boolean().default(false),
  payment_terms_template_id: z.string().uuid().optional().nullable(),
  terms_and_conditions_id: z.string().uuid().optional().nullable(),
  shipping_address_id: z.string().uuid().optional().nullable(),
  billing_address_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemInputSchema).min(1, 'Purchase Order must have at least one line item'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
});

export const createPurchaseOrderSchema = purchaseOrderSchema.omit({
  id: true,
  purchase_order_number: true,
  net_total: true,
  tax_total: true,
  grand_total: true,
  rounding_adjustment: true,
  rounded_total: true,
  received_percent: true,
  billed_percent: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updatePurchaseOrderSchema = createPurchaseOrderSchema.partial();

export const purchaseOrderFilterSchema = z.object({
  status: purchaseOrderStatusEnum.optional(),
  supplier_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['transaction_date', 'grand_total', 'schedule_date', 'created_at']).default('transaction_date'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type PurchaseOrder = z.infer<typeof purchaseOrderSchema>;
export type CreatePurchaseOrderInput = z.input<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderInput = z.input<typeof updatePurchaseOrderSchema>;
export type PurchaseOrderItemInput = z.input<typeof purchaseOrderItemInputSchema>;
export type PurchaseOrderItem = z.infer<typeof purchaseOrderItemInputSchema> & {
  purchase_order_id?: string;
  received_qty?: string;
  billed_qty?: string;
};
export type PurchaseOrderFilterParams = z.input<typeof purchaseOrderFilterSchema>;
