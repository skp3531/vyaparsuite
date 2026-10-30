/**
 * VyaparSuite Core Document Zod Schemas
 * 
 * Strict runtime validation schemas for:
 * - Fixed-precision decimals and currency
 * - ISO dates, times, and timestamps
 * - Base document metadata, audit properties, and status enums
 * - Transaction documents, line items, taxes, and payment schedules
 * - Lifecycle transition requests and doctype definitions
 */

import { z } from 'zod';
import { DocumentStatus, DocumentAction, DocumentEventType } from '../types/document';

/**
 * Validates a string as a fixed-precision numeric/decimal value.
 * Disallows floating point inaccuracies by strictly enforcing string representation.
 */
export const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d+)?$/, {
    message: 'Must be a valid decimal number represented as a string (e.g. "100.50")',
  });

/**
 * Validates non-negative decimal string (e.g. for rates, amounts, quantities).
 */
export const nonNegativeDecimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, {
    message: 'Must be a valid non-negative decimal string',
  });

/**
 * Validates ISO date in YYYY-MM-DD format.
 */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be formatted as YYYY-MM-DD',
  });

/**
 * Validates 24-hour time in HH:MM:SS format.
 */
export const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/, {
    message: 'Time must be formatted as HH:MM:SS',
  });

/**
 * Document lifecycle status schema.
 */
export const documentStatusSchema = z.nativeEnum(DocumentStatus);

/**
 * Document action schema.
 */
export const documentActionSchema = z.nativeEnum(DocumentAction);

/**
 * Document event type schema.
 */
export const documentEventTypeSchema = z.nativeEnum(DocumentEventType);

/**
 * Child Line Item Schema (BaseDocumentItem)
 */
export const baseDocumentItemSchema = z.object({
  id: z.string().uuid().optional(),
  parent_id: z.string().uuid(),
  parent_doctype: z.string().min(1),
  idx: z.number().int().nonnegative(),

  item_id: z.string().uuid().optional(),
  item_code: z.string().min(1).max(100).optional(),
  item_name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  uom: z.string().max(20).optional(),
  quantity: decimalStringSchema,
  rate: decimalStringSchema,
  amount: decimalStringSchema,

  discount_percentage: nonNegativeDecimalStringSchema.optional(),
  discount_amount: nonNegativeDecimalStringSchema.optional(),

  tax_template_id: z.string().uuid().optional(),
  tax_amount: nonNegativeDecimalStringSchema.optional(),
  total_amount: decimalStringSchema.optional(),

  warehouse_id: z.string().uuid().optional(),

  source_doctype: z.string().optional(),
  source_document_id: z.string().uuid().optional(),
  source_item_id: z.string().uuid().optional(),

  fulfilled_quantity: nonNegativeDecimalStringSchema.optional(),
  returned_quantity: nonNegativeDecimalStringSchema.optional(),
  billed_quantity: nonNegativeDecimalStringSchema.optional(),

  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Tax breakdown schema (DocumentTax)
 */
export const documentTaxSchema = z.object({
  id: z.string().uuid().optional(),
  parent_id: z.string().uuid(),
  parent_doctype: z.string().min(1),
  idx: z.number().int().nonnegative(),

  tax_type: z.string().min(1).max(50), // CGST, SGST, IGST, Cess, etc.
  account_id: z.string().uuid(),
  account_name: z.string().min(1).max(200),
  rate: nonNegativeDecimalStringSchema,
  tax_amount: decimalStringSchema,
  base_tax_amount: decimalStringSchema.optional(),
  total: decimalStringSchema,
  base_total: decimalStringSchema.optional(),

  hsn_sac_code: z.string().max(20).optional(),
  is_reverse_charge: z.boolean().default(false),

  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Payment schedule item schema (PaymentSchedule)
 */
export const paymentScheduleSchema = z.object({
  id: z.string().uuid().optional(),
  parent_id: z.string().uuid(),
  parent_doctype: z.string().min(1),
  idx: z.number().int().nonnegative(),

  due_date: dateStringSchema,
  invoice_portion: nonNegativeDecimalStringSchema,
  payment_amount: nonNegativeDecimalStringSchema,
  outstanding_amount: decimalStringSchema,
  paid_amount: nonNegativeDecimalStringSchema.default('0'),
  discount_date: dateStringSchema.optional(),
  discount_percentage: nonNegativeDecimalStringSchema.optional(),

  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Base Document Schema (BaseDocument)
 */
export const baseDocumentSchema = z.object({
  // Identity
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  company_id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),

  // Identification
  doctype: z.string().min(1).max(100),
  document_number: z.string().min(1).max(100),
  naming_series: z.string().max(100).optional(),
  title: z.string().max(255).optional(),

  // Temporal
  financial_year: z.string().regex(/^\d{4}-\d{2,4}$/, {
    message: 'Financial year must be formatted as YYYY-YY or YYYY-YYYY',
  }),
  posting_date: dateStringSchema,
  posting_time: timeStringSchema.optional(),
  document_date: dateStringSchema.optional(),
  due_date: dateStringSchema.optional(),

  // Currency
  currency: z.string().length(3), // ISO 4217 code (INR, USD, EUR)
  exchange_rate: nonNegativeDecimalStringSchema.default('1'),
  base_currency: z.string().length(3).optional(),

  // Status
  status: documentStatusSchema,
  workflow_state: z.string().optional(),
  is_return: z.boolean().default(false),
  return_against: z.string().uuid().optional(),

  // Ownership
  owner_id: z.string().uuid(),
  assigned_to: z.array(z.string().uuid()).optional(),

  // Audit trail
  created_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_by: z.string().uuid(),
  updated_at: z.string().datetime(),
  submitted_by: z.string().uuid().optional(),
  submitted_at: z.string().datetime().optional(),
  approved_by: z.string().uuid().optional(),
  approved_at: z.string().datetime().optional(),
  posted_by: z.string().uuid().optional(),
  posted_at: z.string().datetime().optional(),
  cancelled_by: z.string().uuid().optional(),
  cancelled_at: z.string().datetime().optional(),
  cancellation_reason: z.string().max(500).optional(),

  // Amendment chain
  amended_from: z.string().uuid().optional(),
  amended_to: z.string().uuid().optional(),
  amendment_number: z.number().int().nonnegative().optional(),

  // Source references
  source_doctype: z.string().optional(),
  source_document_id: z.string().uuid().optional(),

  // Versioning
  version: z.number().int().positive().default(1),

  // Custom data
  custom_fields: z.record(z.string(), z.unknown()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),

  // Soft delete
  is_deleted: z.boolean().default(false),
  deleted_by: z.string().uuid().optional(),
  deleted_at: z.string().datetime().optional(),
});

/**
 * Transaction Document Schema (TransactionDocument)
 */
export const transactionDocumentSchema = baseDocumentSchema.extend({
  // Party
  party_type: z.enum(['customer', 'supplier', 'employee']).optional(),
  party_id: z.string().uuid().optional(),
  party_name: z.string().max(255).optional(),

  // Address
  billing_address_id: z.string().uuid().optional(),
  shipping_address_id: z.string().uuid().optional(),

  // Contact
  contact_id: z.string().uuid().optional(),
  contact_name: z.string().max(255).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().max(30).optional(),

  // Terms
  payment_terms_id: z.string().uuid().optional(),
  terms_and_conditions_id: z.string().uuid().optional(),
  terms_text: z.string().optional(),

  // Pricing
  price_list_id: z.string().uuid().optional(),

  // Child collections
  items: z.array(baseDocumentItemSchema).optional(),
  taxes: z.array(documentTaxSchema).optional(),
  payment_schedule: z.array(paymentScheduleSchema).optional(),

  // Totals
  total_quantity: decimalStringSchema,
  net_total: decimalStringSchema,
  tax_total: decimalStringSchema,
  discount_total: decimalStringSchema.default('0'),
  grand_total: decimalStringSchema,
  rounding_adjustment: decimalStringSchema.optional(),
  rounded_total: decimalStringSchema.optional(),
  outstanding_amount: decimalStringSchema.optional(),
  advance_paid: decimalStringSchema.optional(),

  // Base currency totals
  base_net_total: decimalStringSchema.optional(),
  base_tax_total: decimalStringSchema.optional(),
  base_grand_total: decimalStringSchema.optional(),
  base_rounding_adjustment: decimalStringSchema.optional(),
  base_rounded_total: decimalStringSchema.optional(),

  // Additional info
  remarks: z.string().max(1000).optional(),
  letter_head_id: z.string().uuid().optional(),
  print_heading: z.string().max(100).optional(),

  // Fulfilment status
  per_delivered: nonNegativeDecimalStringSchema.optional(),
  per_billed: nonNegativeDecimalStringSchema.optional(),
  per_returned: nonNegativeDecimalStringSchema.optional(),
  per_paid: nonNegativeDecimalStringSchema.optional(),
});

/**
 * Document Creation Request Input Schema
 */
export const createDocumentInputSchema = z.object({
  doctype: z.string().min(1),
  naming_series: z.string().optional(),
  title: z.string().optional(),
  posting_date: dateStringSchema,
  posting_time: timeStringSchema.optional(),
  document_date: dateStringSchema.optional(),
  due_date: dateStringSchema.optional(),
  currency: z.string().length(3).default('INR'),
  exchange_rate: nonNegativeDecimalStringSchema.default('1'),
  base_currency: z.string().length(3).optional(),
  party_type: z.enum(['customer', 'supplier', 'employee']).optional(),
  party_id: z.string().uuid().optional(),
  party_name: z.string().optional(),
  billing_address_id: z.string().uuid().optional(),
  shipping_address_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  payment_terms_id: z.string().uuid().optional(),
  price_list_id: z.string().uuid().optional(),
  items: z.array(baseDocumentItemSchema.omit({ id: true, parent_id: true, parent_doctype: true })).optional(),
  taxes: z.array(documentTaxSchema.omit({ id: true, parent_id: true, parent_doctype: true })).optional(),
  remarks: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  custom_fields: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Transition Action Request Schema
 */
export const transitionActionInputSchema = z.object({
  action: documentActionSchema,
  reason: z.string().max(500).optional(),
  comment: z.string().max(1000).optional(),
});

/**
 * DocType Link Schema
 */
export const doctypeLinkSchema = z.object({
  doctype: z.string().min(1),
  fieldName: z.string().min(1),
  label: z.string().min(1),
  isChild: z.boolean().default(false),
});

/**
 * DocType Metadata Definition Schema
 */
export const doctypeDefinitionSchema = z.object({
  name: z.string().min(1).max(100),
  label: z.string().min(1).max(100),
  module: z.string().min(1).max(50),
  tableName: z.string().min(1).max(100),
  itemTableName: z.string().max(100).optional(),
  taxTableName: z.string().max(100).optional(),
  isSubmittable: z.boolean().default(false),
  isAmendable: z.boolean().default(false),
  hasItems: z.boolean().default(false),
  hasAccounting: z.boolean().default(false),
  hasInventory: z.boolean().default(false),
  hasWorkflow: z.boolean().default(false),
  hasNamingSeries: z.boolean().default(true),
  defaultNamingSeries: z.string().optional(),
  links: z.array(doctypeLinkSchema).optional(),
  transitions: z.record(documentStatusSchema, z.array(documentActionSchema)),
});

// TypeScript type inference from Zod schemas
export type BaseDocumentSchemaType = z.infer<typeof baseDocumentSchema>;
export type BaseDocumentItemSchemaType = z.infer<typeof baseDocumentItemSchema>;
export type DocumentTaxSchemaType = z.infer<typeof documentTaxSchema>;
export type PaymentScheduleSchemaType = z.infer<typeof paymentScheduleSchema>;
export type TransactionDocumentSchemaType = z.infer<typeof transactionDocumentSchema>;
export type CreateDocumentInputType = z.infer<typeof createDocumentInputSchema>;
export type TransitionActionInputType = z.infer<typeof transitionActionInputSchema>;
export type DoctypeDefinitionSchemaType = z.infer<typeof doctypeDefinitionSchema>;
