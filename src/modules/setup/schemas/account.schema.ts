/**
 * VyaparSuite Chart of Accounts (COA) Validation Schemas
 * 
 * Strict runtime validation for:
 * - Account master records and account groups
 * - Five fundamental root types: Asset, Liability, Equity, Income, Expense
 * - Specialized accounting subtypes (Bank, Cash, Receivable, Payable, Stock, Tax, etc.)
 * - General ledger posting validation rules (strictly leaf non-group active accounts)
 */

import { z } from 'zod';

/**
 * Top-level Balance Sheet and P&L classification
 */
export const accountRootTypeEnum = z.enum([
  'Asset',
  'Liability',
  'Equity',
  'Income',
  'Expense',
]);
export type AccountRootType = z.infer<typeof accountRootTypeEnum>;

/**
 * Specialized accounting behavior classifications
 */
export const accountTypeEnum = z.enum([
  'Accumulated Depreciation',
  'Bank',
  'Cash',
  'Chargeable',
  'Cost of Goods Sold',
  'Depreciation',
  'Equity',
  'Expense Account',
  'Expenses Included In Valuation',
  'Fixed Asset',
  'Income Account',
  'Payable',
  'Receivable',
  'Round Off',
  'Stock',
  'Stock Adjustment',
  'Stock Received But Not Billed',
  'Tax',
  'Temporary',
]);
export type AccountType = z.infer<typeof accountTypeEnum>;

/**
 * Account Group Schema
 */
export const accountGroupSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  company_id: z.string().uuid('company_id must be a valid UUID'),
  group_name: z
    .string()
    .trim()
    .min(1, 'Group name is required')
    .max(150, 'Group name cannot exceed 150 characters'),
  parent_group_id: z.string().uuid().nullable().optional(),
  root_type: accountRootTypeEnum.default('Asset'),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const createAccountGroupSchema = accountGroupSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateAccountGroupSchema = createAccountGroupSchema.partial();

/**
 * Account Master Schema
 */
export const accountSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  company_id: z.string().uuid('company_id must be a valid UUID'),
  account_name: z
    .string()
    .trim()
    .min(1, 'Account name is required')
    .max(255, 'Account name cannot exceed 255 characters'),
  account_number: z
    .string()
    .trim()
    .max(50, 'Account number cannot exceed 50 characters')
    .nullable()
    .optional()
    .or(z.literal('')),
  account_group_id: z.string().uuid('account_group_id must be a valid UUID'),
  root_type: accountRootTypeEnum.default('Asset'),
  account_type: accountTypeEnum.nullable().optional(),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter ISO code')
    .default('INR'),
  is_group: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const createAccountSchema = accountSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateAccountSchema = createAccountSchema.partial();

/**
 * Account posting validation schema
 */
export const validateAccountPostingSchema = z.object({
  accountId: z.string().uuid('accountId must be a valid UUID'),
  tenantId: z.string().uuid('tenantId must be a valid UUID'),
  companyId: z.string().uuid('companyId must be a valid UUID'),
});

/**
 * Tree navigation & query filters
 */
export const accountTreeQuerySchema = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  rootType: accountRootTypeEnum.optional(),
  includeInactive: z.boolean().default(false),
});

export const accountFilterSchema = z.object({
  company_id: z.string().uuid(),
  root_type: accountRootTypeEnum.optional(),
  account_type: accountTypeEnum.optional(),
  account_group_id: z.string().uuid().optional(),
  is_group: z.boolean().optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(50),
  sortBy: z.enum(['account_name', 'account_number', 'root_type', 'created_at']).default('account_number'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
});

// Type definitions
export type AccountGroup = z.infer<typeof accountGroupSchema>;
export type CreateAccountGroupInput = z.input<typeof createAccountGroupSchema>;
export type UpdateAccountGroupInput = z.input<typeof updateAccountGroupSchema>;

export type Account = z.infer<typeof accountSchema>;
export type CreateAccountInput = z.input<typeof createAccountSchema>;
export type UpdateAccountInput = z.input<typeof updateAccountSchema>;
export type ValidateAccountPostingInput = z.input<typeof validateAccountPostingSchema>;
export type AccountTreeQueryParams = z.input<typeof accountTreeQuerySchema>;
export type AccountFilterParams = z.input<typeof accountFilterSchema>;
