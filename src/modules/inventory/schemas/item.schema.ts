/**
 * VyaparSuite Item & Inventory Master Data Validation Schemas
 * 
 * Strict runtime validation for:
 * - Product catalog items, stock tracking, and asset flags
 * - Item group taxonomy and brand relations
 * - Multi-UOM conversions and mathematical scaling
 * - Item price tiers and Price List assignments
 * - Item variant dimension generation
 */

import { z } from 'zod';

/**
 * Inventory valuation methodologies
 */
export const valuationMethodEnum = z.enum(['FIFO', 'Moving Average']);
export type ValuationMethod = z.infer<typeof valuationMethodEnum>;

/**
 * Buying vs Selling Price List direction
 */
export const priceListTypeEnum = z.enum(['Buying', 'Selling']);
export type PriceListType = z.infer<typeof priceListTypeEnum>;

/**
 * Non-negative and positive decimal string validators
 */
export const nonNegativeDecimalSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, 'Must be a valid non-negative decimal string (e.g. "10.50")');

export const positiveDecimalSchema = z
  .string()
  .trim()
  .regex(/^(0*[1-9]\d*(\.\d+)?|0+\.\d*[1-9]\d*)$/, 'Must be a strictly positive decimal number');

/**
 * Unit of Measure (UOM) Schema
 */
export const uomSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  uom_name: z
    .string()
    .trim()
    .min(1, 'UOM name is required')
    .max(50, 'UOM name cannot exceed 50 characters'),
  must_be_whole_number: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const createUomSchema = uomSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateUomSchema = createUomSchema.partial();

/**
 * UOM Conversion Factor Schema
 */
export const baseUomConversionSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  item_id: z.string().uuid().nullable().optional(),
  from_uom_id: z.string().uuid('from_uom_id must be a valid UUID'),
  to_uom_id: z.string().uuid('to_uom_id must be a valid UUID'),
  conversion_factor: positiveDecimalSchema.default('1.000000'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const uomConversionSchema = baseUomConversionSchema.refine(
  (data) => data.from_uom_id !== data.to_uom_id,
  {
    message: 'Source and target UOM cannot be the same',
    path: ['to_uom_id'],
  }
);

export const createUomConversionSchema = baseUomConversionSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateUomConversionSchema = createUomConversionSchema.partial();

/**
 * Item Group Taxonomy Schema
 */
export const itemGroupSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  item_group_name: z
    .string()
    .trim()
    .min(1, 'Item group name is required')
    .max(150, 'Item group name cannot exceed 150 characters'),
  parent_item_group_id: z.string().uuid().nullable().optional(),
  is_group: z.boolean().default(false),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const createItemGroupSchema = itemGroupSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateItemGroupSchema = createItemGroupSchema.partial();

/**
 * Item Master Schema
 */
export const itemSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  item_code: z
    .string()
    .trim()
    .min(1, 'Item code is required')
    .max(100, 'Item code cannot exceed 100 characters')
    .regex(/^[A-Za-z0-9\-_./]+$/, 'Item code must contain valid alphanumeric characters, dashes, or slashes'),
  item_name: z
    .string()
    .trim()
    .min(1, 'Item name is required')
    .max(255, 'Item name cannot exceed 255 characters'),
  item_group_id: z.string().uuid('Item group ID must be a valid UUID'),
  stock_uom_id: z.string().uuid('Stock UOM ID must be a valid UUID'),
  brand_id: z.string().uuid().nullable().optional(),
  is_stock_item: z.boolean().default(true),
  is_sales_item: z.boolean().default(true),
  is_purchase_item: z.boolean().default(true),
  is_fixed_asset: z.boolean().default(false),
  has_batch_no: z.boolean().default(false),
  has_serial_no: z.boolean().default(false),
  has_variants: z.boolean().default(false),
  variant_of_id: z.string().uuid().nullable().optional(),
  valuation_method: valuationMethodEnum.default('FIFO'),
  standard_rate: nonNegativeDecimalSchema.default('0.000000'),
  opening_stock: nonNegativeDecimalSchema.default('0.000000'),
  safety_stock: nonNegativeDecimalSchema.default('0.000000'),
  lead_time_days: z
    .number()
    .int('Lead time days must be an integer')
    .min(0, 'Lead time cannot be negative')
    .default(0),
  hsn_sac_code: z
    .string()
    .trim()
    .regex(/^\d{2,8}$/, 'HSN/SAC code must be between 2 and 8 digits')
    .nullable()
    .optional()
    .or(z.literal('')),
  default_warehouse_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url('Invalid image URL format').nullable().optional().or(z.literal('')),
  description: z.string().trim().max(2000).nullable().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const createItemSchema = itemSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateItemSchema = createItemSchema.partial();

/**
 * Price List Schema
 */
export const priceListSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  price_list_name: z
    .string()
    .trim()
    .min(1, 'Price list name is required')
    .max(150, 'Price list name cannot exceed 150 characters'),
  currency: z
    .string()
    .trim()
    .length(3, 'Currency must be a 3-letter ISO code')
    .default('INR'),
  buying_or_selling: priceListTypeEnum.default('Selling'),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const createPriceListSchema = priceListSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updatePriceListSchema = createPriceListSchema.partial();

/**
 * Item Price Entry Schema
 */
export const baseItemPriceSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  price_list_id: z.string().uuid('price_list_id must be a valid UUID'),
  item_id: z.string().uuid('item_id must be a valid UUID'),
  uom_id: z.string().uuid('uom_id must be a valid UUID'),
  price_rate: nonNegativeDecimalSchema.default('0.000000'),
  min_qty: positiveDecimalSchema.default('1.000000'),
  valid_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'valid_from must be YYYY-MM-DD').nullable().optional(),
  valid_upto: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'valid_upto must be YYYY-MM-DD').nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().nullable().optional(),
  updated_by: z.string().uuid().nullable().optional(),
});

export const itemPriceSchema = baseItemPriceSchema.refine(
  (data) => {
    if (data.valid_from && data.valid_upto) {
      return new Date(data.valid_from) <= new Date(data.valid_upto);
    }
    return true;
  },
  {
    message: 'valid_upto must be on or after valid_from',
    path: ['valid_upto'],
  }
);

export const createItemPriceSchema = baseItemPriceSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateItemPriceSchema = createItemPriceSchema.partial();

/**
 * Variant Generation Schema
 */
export const generateVariantsSchema = z.object({
  templateItemId: z.string().uuid('templateItemId must be a valid UUID'),
  attributeCombinations: z
    .array(z.record(z.string().min(1), z.string().min(1)))
    .min(1, 'At least one attribute combination must be provided'),
  codePrefix: z.string().trim().optional(),
});

/**
 * Pricing Lookup Request Schema
 */
export const priceLookupSchema = z.object({
  itemId: z.string().uuid(),
  priceListId: z.string().uuid(),
  uomId: z.string().uuid().optional(),
  quantity: nonNegativeDecimalSchema.optional(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * Filter & query parameters for listing items
 */
export const itemFilterSchema = z.object({
  search: z.string().optional(),
  item_group_id: z.string().uuid().optional(),
  brand_id: z.string().uuid().optional(),
  is_stock_item: z.boolean().optional(),
  is_sales_item: z.boolean().optional(),
  is_purchase_item: z.boolean().optional(),
  has_variants: z.boolean().optional(),
  variant_of_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['item_name', 'item_code', 'standard_rate', 'created_at']).default('item_name'),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
});

// Type definitions
export type Uom = z.infer<typeof uomSchema>;
export type CreateUomInput = z.input<typeof createUomSchema>;
export type UpdateUomInput = z.input<typeof updateUomSchema>;

export type UomConversion = z.infer<typeof uomConversionSchema>;
export type CreateUomConversionInput = z.input<typeof createUomConversionSchema>;
export type UpdateUomConversionInput = z.input<typeof updateUomConversionSchema>;

export type ItemGroup = z.infer<typeof itemGroupSchema>;
export type CreateItemGroupInput = z.input<typeof createItemGroupSchema>;
export type UpdateItemGroupInput = z.input<typeof updateItemGroupSchema>;

export type Item = z.infer<typeof itemSchema>;
export type CreateItemInput = z.input<typeof createItemSchema>;
export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type ItemFilterParams = z.input<typeof itemFilterSchema>;

export type PriceList = z.infer<typeof priceListSchema>;
export type CreatePriceListInput = z.input<typeof createPriceListSchema>;
export type UpdatePriceListInput = z.input<typeof updatePriceListSchema>;

export type ItemPrice = z.infer<typeof itemPriceSchema>;
export type CreateItemPriceInput = z.input<typeof createItemPriceSchema>;
export type UpdateItemPriceInput = z.input<typeof updateItemPriceSchema>;

export type GenerateVariantsInput = z.input<typeof generateVariantsSchema>;
export type PriceLookupInput = z.input<typeof priceLookupSchema>;
