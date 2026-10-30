/**
 * VyaparSuite Customer & Sales Master Data Validation Schemas
 * 
 * Strict runtime validation for:
 * - Customer entity creation, mutation, and status management
 * - Customer group hierarchy
 * - Credit limit checks and financial exposures
 * - GSTIN / PAN statutory validation (Indian Taxation Architecture)
 */

import { z } from 'zod';

/**
 * Legal constitution / customer type
 */
export const customerTypeEnum = z.enum(['Company', 'Individual']);
export type CustomerType = z.infer<typeof customerTypeEnum>;

/**
 * Statutory Indian GST Registration Categories
 */
export const customerGstCategoryEnum = z.enum([
  'Registered Regular',
  'Registered Composition',
  'Unregistered',
  'SEZ',
  'Overseas',
  'Consumer',
  'Deemed Export',
]);
export type CustomerGstCategory = z.infer<typeof customerGstCategoryEnum>;

/**
 * Regex patterns for Indian statutory tax compliance
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Fixed-precision non-negative decimal string schema
 */
export const decimalStringSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, {
    message: 'Must be a valid non-negative decimal number string',
  });

/**
 * Customer Group Schema
 */
export const customerGroupSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  customer_group_name: z
    .string()
    .trim()
    .min(1, 'Customer group name is required')
    .max(150, 'Group name cannot exceed 150 characters'),
  parent_customer_group_id: z.string().uuid().nullable().optional(),
  is_group: z.boolean().default(false),
  default_price_list_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const createCustomerGroupSchema = customerGroupSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateCustomerGroupSchema = createCustomerGroupSchema.partial();

/**
 * Customer Master Schema
 */
export const customerSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  customer_name: z
    .string()
    .trim()
    .min(1, 'Customer name is required')
    .max(255, 'Customer name cannot exceed 255 characters'),
  customer_code: z
    .string()
    .trim()
    .min(1, 'Customer code is required')
    .max(50, 'Customer code cannot exceed 50 characters')
    .regex(/^[A-Za-z0-9\-_.]+$/, 'Customer code must contain only alphanumeric characters, dashes, or dots'),
  customer_group_id: z.string().uuid('Customer group ID must be a valid UUID'),
  territory_id: z.string().uuid().nullable().optional(),
  customer_type: customerTypeEnum.default('Company'),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(GSTIN_REGEX, 'Invalid 15-character Indian GSTIN format')
    .nullable()
    .optional()
    .or(z.literal('')),
  pan: z
    .string()
    .trim()
    .toUpperCase()
    .regex(PAN_REGEX, 'Invalid 10-character PAN format')
    .nullable()
    .optional()
    .or(z.literal('')),
  gst_category: customerGstCategoryEnum.default('Registered Regular'),
  tax_id: z.string().trim().max(50).nullable().optional(),
  default_currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter ISO code')
    .default('INR'),
  default_price_list_id: z.string().uuid().nullable().optional(),
  credit_limit: decimalStringSchema.default('0.000000'),
  total_outstanding: decimalStringSchema.default('0.000000').optional(),
  credit_days: z
    .number()
    .int('Credit days must be an integer')
    .min(0, 'Credit days cannot be negative')
    .default(30),
  is_credit_freeze: z.boolean().default(false),
  account_manager_id: z.string().uuid().nullable().optional(),
  primary_address_id: z.string().uuid().nullable().optional(),
  primary_contact_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const baseCreateCustomerSchema = customerSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const createCustomerSchema = baseCreateCustomerSchema.refine(
  (data) => {
    // If GST category is Registered Regular or Registered Composition, GSTIN should be present
    if (
      (data.gst_category === 'Registered Regular' || data.gst_category === 'Registered Composition') &&
      data.gstin &&
      data.gstin.trim().length > 0
    ) {
      return GSTIN_REGEX.test(data.gstin);
    }
    return true;
  },
  {
    message: 'Valid GSTIN is required for Registered Regular or Registered Composition tax categories',
    path: ['gstin'],
  }
);

export const updateCustomerSchema = baseCreateCustomerSchema.partial();

/**
 * Filter & query parameters for listing customers
 */
export const customerFilterSchema = z.object({
  search: z.string().optional(),
  customer_group_id: z.string().uuid().optional(),
  customer_type: customerTypeEnum.optional(),
  gst_category: customerGstCategoryEnum.optional(),
  is_active: z.boolean().optional(),
  is_credit_freeze: z.boolean().optional(),
  territory_id: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['customer_name', 'customer_code', 'created_at', 'credit_limit']).default('customer_name'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Credit limit verification request schema
 */
export const creditLimitCheckSchema = z.object({
  customerId: z.string().uuid(),
  newOrderAmount: decimalStringSchema,
  companyId: z.string().uuid().optional(),
});

/**
 * Outstanding balance update schema
 */
export const updateOutstandingBalanceSchema = z.object({
  customerId: z.string().uuid(),
  amountDelta: z.string().regex(/^-?\d+(\.\d+)?$/, 'Amount delta must be a valid decimal number string'),
  referenceType: z.string().min(1),
  referenceId: z.string().uuid(),
});

// Type definitions
export type CustomerGroup = z.infer<typeof customerGroupSchema>;
export type CreateCustomerGroupInput = z.input<typeof createCustomerGroupSchema>;
export type UpdateCustomerGroupInput = z.input<typeof updateCustomerGroupSchema>;

export type Customer = z.infer<typeof customerSchema>;
export type CreateCustomerInput = z.input<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.input<typeof updateCustomerSchema>;
export type CustomerFilterParams = z.input<typeof customerFilterSchema>;
export type CreditLimitCheckInput = z.input<typeof creditLimitCheckSchema>;
export type UpdateOutstandingBalanceInput = z.input<typeof updateOutstandingBalanceSchema>;
