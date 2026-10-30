/**
 * VyaparSuite Supplier & Procurement Master Data Validation Schemas
 * 
 * Strict runtime validation for:
 * - Supplier master CRUD and status tracking
 * - Vendor groups and classification
 * - Statutory Indian GSTIN and PAN validation
 * - MSME compliance (Micro, Small & Medium Enterprises Development Act / Sec 43B(h))
 * - Payment terms and credit schedules
 */

import { z } from 'zod';

/**
 * Supplier Constitution / Legal Status
 */
export const supplierTypeEnum = z.enum(['Company', 'Individual']);
export type SupplierType = z.infer<typeof supplierTypeEnum>;

/**
 * Statutory Indian GST Registration Categories for Vendors
 */
export const supplierGstCategoryEnum = z.enum([
  'Registered Regular',
  'Registered Composition',
  'Unregistered',
  'SEZ',
  'Overseas',
  'Deemed Export',
]);
export type SupplierGstCategory = z.infer<typeof supplierGstCategoryEnum>;

/**
 * Regulatory regex patterns
 */
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
// Udyam Registration format: UDYAM-XX-00-0000000
export const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/i;

/**
 * Supplier Group Schema
 */
export const supplierGroupSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  supplier_group_name: z
    .string()
    .trim()
    .min(1, 'Supplier group name is required')
    .max(150, 'Group name cannot exceed 150 characters'),
  parent_supplier_group_id: z.string().uuid().nullable().optional(),
  is_group: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const createSupplierGroupSchema = supplierGroupSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateSupplierGroupSchema = createSupplierGroupSchema.partial();

/**
 * Supplier Master Schema
 */
export const supplierSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  supplier_name: z
    .string()
    .trim()
    .min(1, 'Supplier name is required')
    .max(255, 'Supplier name cannot exceed 255 characters'),
  supplier_code: z
    .string()
    .trim()
    .min(1, 'Supplier code is required')
    .max(50, 'Supplier code cannot exceed 50 characters')
    .regex(/^[A-Za-z0-9\-_.]+$/, 'Supplier code must contain only alphanumeric characters, dashes, or dots'),
  supplier_group_id: z.string().uuid('Supplier group ID must be a valid UUID'),
  supplier_type: supplierTypeEnum.default('Company'),
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
  gst_category: supplierGstCategoryEnum.default('Registered Regular'),
  tax_id: z.string().trim().max(50).nullable().optional(),
  default_currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter ISO code')
    .default('INR'),
  payment_terms_days: z
    .number()
    .int('Payment terms days must be an integer')
    .min(0, 'Payment terms days cannot be negative')
    .default(30),
  payment_terms_template_id: z.string().uuid().nullable().optional(),
  is_msme_registered: z.boolean().default(false),
  msme_registration_no: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const baseCreateSupplierSchema = supplierSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const createSupplierSchema = baseCreateSupplierSchema.refine(
  (data) => {
    // MSME registration requires registration number
    if (data.is_msme_registered) {
      return !!data.msme_registration_no && data.msme_registration_no.trim().length > 0;
    }
    return true;
  },
  {
    message: 'MSME registration number is required when MSME registered is true',
    path: ['msme_registration_no'],
  }
);

export const updateSupplierSchema = baseCreateSupplierSchema.partial();

/**
 * Filter & query parameters for listing suppliers
 */
export const supplierFilterSchema = z.object({
  search: z.string().optional(),
  supplier_group_id: z.string().uuid().optional(),
  supplier_type: supplierTypeEnum.optional(),
  gst_category: supplierGstCategoryEnum.optional(),
  is_msme_registered: z.boolean().optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['supplier_name', 'supplier_code', 'created_at', 'payment_terms_days']).default('supplier_name'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * Payment Terms Assignment & Schedule Request Schema
 */
export const assignPaymentTermsSchema = z.object({
  supplierId: z.string().uuid(),
  paymentTermsDays: z.number().int().min(0).optional(),
  paymentTermsTemplateId: z.string().uuid().nullable().optional(),
});

export const paymentScheduleCalcSchema = z.object({
  supplierId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  invoiceAmount: z.string().regex(/^\d+(\.\d+)?$/, 'Invoice amount must be a positive decimal string'),
  invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invoice date must be YYYY-MM-DD'),
});

// Type definitions
export type SupplierGroup = z.infer<typeof supplierGroupSchema>;
export type CreateSupplierGroupInput = z.input<typeof createSupplierGroupSchema>;
export type UpdateSupplierGroupInput = z.input<typeof updateSupplierGroupSchema>;

export type Supplier = z.infer<typeof supplierSchema>;
export type CreateSupplierInput = z.input<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.input<typeof updateSupplierSchema>;
export type SupplierFilterParams = z.input<typeof supplierFilterSchema>;
export type AssignPaymentTermsInput = z.input<typeof assignPaymentTermsSchema>;
export type PaymentScheduleCalcInput = z.input<typeof paymentScheduleCalcSchema>;
