/**
 * VyaparSuite Sales Quotation & Sales Order Validation Schemas
 * Strict runtime validation for quotations, order booking, line item computations,
 * and quote-to-order conversions with penny-exact Decimal strings.
 */

import { z } from 'zod';

export const quotationStatusEnum = z.enum([
  'Draft',
  'Submitted',
  'Approved',
  'Ordered',
  'Lost',
  'Cancelled',
  'Expired',
]);
export type QuotationStatus = z.infer<typeof quotationStatusEnum>;

export const salesOrderStatusEnum = z.enum([
  'Draft',
  'Pending Approval',
  'Approved',
  'To Deliver and Bill',
  'To Deliver',
  'To Bill',
  'Completed',
  'Cancelled',
  'On Hold',
]);
export type SalesOrderStatus = z.infer<typeof salesOrderStatusEnum>;

const decimalRegex = /^-?\d+(\.\d+)?$/;

export const orderItemInputSchema = z.object({
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
  lead_time_days: z.number().int().optional().default(0),
});

/**
 * Quotation Schemas
 */
export const quotationSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  quotation_number: z.string().optional(),
  company_id: z.string().uuid('Company ID is required'),
  party_type: z.enum(['Customer', 'Lead']).default('Customer'),
  customer_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  opportunity_id: z.string().uuid().optional().nullable(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').default(() => new Date().toISOString().slice(0, 10)),
  valid_upto: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: quotationStatusEnum.default('Draft'),
  currency: z.string().default('INR'),
  exchange_rate: z.string().regex(decimalRegex).default('1.000000'),
  net_total: z.string().regex(decimalRegex).default('0.000000'),
  tax_total: z.string().regex(decimalRegex).default('0.000000'),
  grand_total: z.string().regex(decimalRegex).default('0.000000'),
  rounding_adjustment: z.string().regex(decimalRegex).default('0.000000'),
  rounded_total: z.string().regex(decimalRegex).default('0.000000'),
  payment_terms_template_id: z.string().uuid().optional().nullable(),
  terms_and_conditions_id: z.string().uuid().optional().nullable(),
  shipping_address_id: z.string().uuid().optional().nullable(),
  billing_address_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, 'Quotation must have at least one line item'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
});

export const createQuotationSchema = quotationSchema.omit({
  id: true,
  quotation_number: true,
  net_total: true,
  tax_total: true,
  grand_total: true,
  rounding_adjustment: true,
  rounded_total: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateQuotationSchema = createQuotationSchema.partial();

/**
 * Sales Order Schemas
 */
export const salesOrderSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  order_number: z.string().optional(),
  company_id: z.string().uuid('Company ID is required'),
  customer_id: z.string().uuid('Customer ID is required'),
  quotation_id: z.string().uuid().optional().nullable(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(() => new Date().toISOString().slice(0, 10)),
  delivery_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivery date is required'),
  customer_po_no: z.string().optional().nullable(),
  customer_po_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: salesOrderStatusEnum.default('Draft'),
  currency: z.string().default('INR'),
  exchange_rate: z.string().regex(decimalRegex).default('1.000000'),
  advance_paid: z.string().regex(decimalRegex).default('0.000000'),
  net_total: z.string().regex(decimalRegex).default('0.000000'),
  tax_total: z.string().regex(decimalRegex).default('0.000000'),
  grand_total: z.string().regex(decimalRegex).default('0.000000'),
  rounding_adjustment: z.string().regex(decimalRegex).default('0.000000'),
  rounded_total: z.string().regex(decimalRegex).default('0.000000'),
  delivered_percent: z.string().regex(decimalRegex).default('0.000000'),
  billed_percent: z.string().regex(decimalRegex).default('0.000000'),
  shipping_address_id: z.string().uuid().optional().nullable(),
  billing_address_id: z.string().uuid().optional().nullable(),
  payment_terms_template_id: z.string().uuid().optional().nullable(),
  terms_and_conditions_id: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, 'Sales Order must have at least one line item'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
});

export const createSalesOrderSchema = salesOrderSchema.omit({
  id: true,
  order_number: true,
  net_total: true,
  tax_total: true,
  grand_total: true,
  rounding_adjustment: true,
  rounded_total: true,
  delivered_percent: true,
  billed_percent: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateSalesOrderSchema = createSalesOrderSchema.partial();

export const convertQuotationToOrderSchema = z.object({
  quotationId: z.string().uuid('Quotation ID must be a valid UUID'),
  deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Delivery date must be YYYY-MM-DD'),
  customerPoNo: z.string().optional(),
  customerPoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const orderFilterSchema = z.object({
  status: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['transaction_date', 'grand_total', 'created_at']).default('transaction_date'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type Quotation = z.infer<typeof quotationSchema>;
export type CreateQuotationInput = z.input<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.input<typeof updateQuotationSchema>;

export type SalesOrder = z.infer<typeof salesOrderSchema>;
export type CreateSalesOrderInput = z.input<typeof createSalesOrderSchema>;
export type UpdateSalesOrderInput = z.input<typeof updateSalesOrderSchema>;

export type OrderItemInput = z.input<typeof orderItemInputSchema>;
export type SalesOrderItem = z.infer<typeof orderItemInputSchema> & {
  sales_order_id?: string;
  delivered_qty?: string;
  billed_qty?: string;
};
export type ConvertQuotationToOrderInput = z.input<typeof convertQuotationToOrderSchema>;
export type OrderFilterParams = z.input<typeof orderFilterSchema>;
