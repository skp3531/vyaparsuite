/**
 * VyaparSuite Item & Inventory Master Data Service
 * 
 * Manages product master catalog, SKU variant dimensional generation,
 * multi-UOM conversions with mathematical precision, benchmark standard rates,
 * and multi-tier Price List resolution with dynamic promotional rule evaluation.
 */

import type { IDatabaseAdapter, QueryFilter, QuerySort } from '@/lib/db/adapter';
import { createSupabaseAdapter } from '@/lib/db/supabase-adapter';
import { createServerClient } from '@/lib/db/client';
import { Decimal } from '@/lib/utils/decimal';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  Item,
  ItemGroup,
  Uom,
  UomConversion,
  PriceList,
  ItemPrice,
  CreateItemInput,
  UpdateItemInput,
  CreateItemGroupInput,
  CreateUomInput,
  CreateUomConversionInput,
  CreatePriceListInput,
  CreateItemPriceInput,
  ItemFilterParams,
  createItemSchema,
  updateItemSchema,
  createItemGroupSchema,
  createUomSchema,
  createUomConversionSchema,
  createPriceListSchema,
  createItemPriceSchema,
} from '../schemas/item.schema';

export interface ServiceContext {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
}

export interface PricingLookupResult {
  itemId: string;
  itemCode: string;
  priceListId: string;
  uomId: string;
  baseRate: Decimal;
  finalRate: Decimal;
  discountPercentage: Decimal;
  discountAmount: Decimal;
  ruleApplied: boolean;
  pricingRuleTitle?: string;
  source: 'price_list' | 'pricing_rule' | 'standard_rate';
}

export interface UomConversionResult {
  convertedQuantity: Decimal;
  conversionFactor: Decimal;
  isReciprocal: boolean;
  fromUomId: string;
  toUomId: string;
}

export interface ItemAttributeRecord {
  id: string;
  attribute_name: string;
  attribute_values: string[];
  is_active: boolean;
}

export interface PricingRuleRecord {
  id: string;
  title: string;
  apply_on: string;
  item_id?: string | null;
  item_group_id?: string | null;
  min_qty: string | number;
  max_qty?: string | number | null;
  min_amt: string | number;
  discount_percentage: string | number;
  discount_amount: string | number;
  priority: number;
  valid_from?: string | null;
  valid_upto?: string | null;
  is_active: boolean;
}

export class ItemService {
  private db: IDatabaseAdapter;

  constructor(db?: IDatabaseAdapter) {
    this.db = db ?? createSupabaseAdapter(createServerClient());
  }

  // =========================================================================
  // ITEM MASTER CRUD
  // =========================================================================

  /**
   * Creates a new Item SKU record with inventory and valuation validation
   */
  async createItem(input: CreateItemInput, context: ServiceContext): Promise<Item> {
    const parsed = createItemSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Item validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    // 1. Verify item group exists
    const groupRes = await this.db.findById<ItemGroup>('item_group', data.item_group_id, {
      tenantId: context.tenantId,
    });
    if (groupRes.error || !groupRes.data) {
      throw new NotFoundError('ItemGroup', data.item_group_id);
    }

    // 2. Verify stock UOM exists
    const uomRes = await this.db.findById<Uom>('uom', data.stock_uom_id, {
      tenantId: context.tenantId,
    });
    if (uomRes.error || !uomRes.data) {
      throw new NotFoundError('UOM', data.stock_uom_id);
    }

    // 3. Unique item code check per tenant
    const codeDup = await this.db.findOne<Item>('item', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'item_code', operator: 'eq', value: data.item_code },
    ]);
    if (codeDup.data) {
      throw new ConflictError(
        `An item with code '${data.item_code}' already exists in this tenant`
      );
    }

    const payload: Record<string, unknown> = {
      ...data,
      standard_rate: Decimal.from(data.standard_rate || 0).toFixed(6),
      opening_stock: Decimal.from(data.opening_stock || 0).toFixed(6),
      safety_stock: Decimal.from(data.safety_stock || 0).toFixed(6),
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const insertRes = await this.db.insert<Item>('item', payload);
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(`Failed to create item: ${insertRes.error?.message}`);
    }

    logger.info('Item created successfully', {
      itemId: insertRes.data.id,
      itemCode: data.item_code,
      tenantId: context.tenantId,
    });

    return insertRes.data;
  }

  /**
   * Retrieves an item by UUID
   */
  async getItemById(id: string, tenantId: string): Promise<Item> {
    const res = await this.db.findById<Item>('item', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('Item', id);
    }
    return res.data;
  }

  /**
   * Retrieves an item by tenant-unique code
   */
  async getItemByCode(itemCode: string, tenantId: string): Promise<Item> {
    const res = await this.db.findOne<Item>('item', [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
      { column: 'item_code', operator: 'eq', value: itemCode },
    ]);
    if (res.error || !res.data) {
      throw new NotFoundError('Item', itemCode);
    }
    return res.data;
  }

  /**
   * Updates an existing item record
   */
  async updateItem(
    id: string,
    input: UpdateItemInput,
    context: ServiceContext
  ): Promise<Item> {
    const existing = await this.getItemById(id, context.tenantId);

    const parsed = updateItemSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Item update validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    // Check unique code if updated
    if (data.item_code && data.item_code !== existing.item_code) {
      const codeDup = await this.db.findOne<Item>('item', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'item_code', operator: 'eq', value: data.item_code },
      ]);
      if (codeDup.data && codeDup.data.id !== id) {
        throw new ConflictError(
          `Item code '${data.item_code}' is already assigned to another catalog product`
        );
      }
    }

    const payload: Record<string, unknown> = {
      ...data,
      updated_by: context.userId,
    };
    if (data.standard_rate !== undefined) {
      payload.standard_rate = Decimal.from(data.standard_rate).toFixed(6);
    }
    if (data.opening_stock !== undefined) {
      payload.opening_stock = Decimal.from(data.opening_stock).toFixed(6);
    }
    if (data.safety_stock !== undefined) {
      payload.safety_stock = Decimal.from(data.safety_stock).toFixed(6);
    }

    const updateRes = await this.db.update<Item>('item', id, payload, {
      tenantId: context.tenantId,
    });

    if (updateRes.error || !updateRes.data) {
      throw new BusinessRuleError(`Failed to update item: ${updateRes.error?.message}`);
    }

    return updateRes.data;
  }

  /**
   * Soft-deletes an item if no stock ledger entries or open transactions exist
   */
  async deleteItem(id: string, context: ServiceContext): Promise<void> {
    const item = await this.getItemById(id, context.tenantId);

    // Verify no stock ledger entries
    const sleCountRes = await this.db.count('stock_ledger_entry', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'item_id', operator: 'eq', value: id },
    ]);

    if (sleCountRes.count && sleCountRes.count > 0) {
      throw new BusinessRuleError(
        `Cannot delete item '${item.item_code}'. There are ${sleCountRes.count} stock ledger entries recorded for this SKU. Deactivate the item instead.`
      );
    }

    const delRes = await this.db.softDelete('item', id, context.userId, {
      tenantId: context.tenantId,
    });

    if (delRes.error) {
      throw new BusinessRuleError(`Failed to delete item: ${delRes.error.message}`);
    }

    logger.info('Item deleted (soft-delete)', { itemId: id, tenantId: context.tenantId });
  }

  /**
   * Lists catalog items with filters, search, and pagination
   */
  async listItems(
    tenantId: string,
    options?: Partial<ItemFilterParams>
  ): Promise<{ data: Item[]; total: number }> {
    const filters: QueryFilter[] = [{ column: 'tenant_id', operator: 'eq', value: tenantId }];

    if (options?.item_group_id) {
      filters.push({ column: 'item_group_id', operator: 'eq', value: options.item_group_id });
    }
    if (options?.brand_id) {
      filters.push({ column: 'brand_id', operator: 'eq', value: options.brand_id });
    }
    if (options?.is_stock_item !== undefined) {
      filters.push({ column: 'is_stock_item', operator: 'eq', value: options.is_stock_item });
    }
    if (options?.is_sales_item !== undefined) {
      filters.push({ column: 'is_sales_item', operator: 'eq', value: options.is_sales_item });
    }
    if (options?.is_purchase_item !== undefined) {
      filters.push({ column: 'is_purchase_item', operator: 'eq', value: options.is_purchase_item });
    }
    if (options?.has_variants !== undefined) {
      filters.push({ column: 'has_variants', operator: 'eq', value: options.has_variants });
    }
    if (options?.variant_of_id) {
      filters.push({ column: 'variant_of_id', operator: 'eq', value: options.variant_of_id });
    }
    if (options?.is_active !== undefined) {
      filters.push({ column: 'is_active', operator: 'eq', value: options.is_active });
    }
    if (options?.search) {
      filters.push({ column: 'item_name', operator: 'ilike', value: `%${options.search}%` });
    }

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const sortBy = options?.sortBy ?? 'item_name';
    const sortDirection = options?.sortDirection ?? 'asc';

    const countRes = await this.db.count('item', filters);
    const listRes = await this.db.findMany<Item>('item', {
      filters,
      sort: [{ column: sortBy, direction: sortDirection }],
      pagination: { page, pageSize },
    });

    if (listRes.error) {
      throw new BusinessRuleError(`Failed to list items: ${listRes.error.message}`);
    }

    return {
      data: listRes.data || [],
      total: countRes.count || 0,
    };
  }

  // =========================================================================
  // VARIANTS GENERATION
  // =========================================================================

  /**
   * Generates concrete variant SKU items from a template item and attribute dimensions
   */
  async generateVariants(
    templateItemId: string,
    attributeCombinations: Array<Record<string, string>>,
    context: ServiceContext
  ): Promise<Item[]> {
    const template = await this.getItemById(templateItemId, context.tenantId);

    if (!template.has_variants) {
      throw new BusinessRuleError(
        `Item '${template.item_code}' is not configured as a variant template (has_variants is false)`
      );
    }

    const createdVariants: Item[] = [];

    // Cache attribute names to attribute IDs
    const attrMap = new Map<string, string>();
    const allAttrsRes = await this.db.findMany<ItemAttributeRecord>('item_attribute', {
      filters: [{ column: 'tenant_id', operator: 'eq', value: context.tenantId }],
    });
    for (const attr of allAttrsRes.data || []) {
      attrMap.set(attr.attribute_name.toLowerCase(), attr.id);
    }

    for (const combo of attributeCombinations) {
      const keys = Object.keys(combo).sort();
      const suffixParts = keys.map((k) => combo[k].replace(/[^A-Za-z0-9]/g, ''));
      const variantCode = `${template.item_code}-${suffixParts.join('-')}`.toUpperCase();
      const variantName = `${template.item_name} (${keys.map((k) => `${k}: ${combo[k]}`).join(', ')})`;

      // Check if variant SKU already exists
      const existing = await this.db.findOne<Item>('item', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'item_code', operator: 'eq', value: variantCode },
      ]);

      let variantItem: Item;

      if (existing.data) {
        variantItem = existing.data;
      } else {
        // Create the variant item inheriting template specifications
        const variantPayload: Record<string, unknown> = {
          tenant_id: context.tenantId,
          item_code: variantCode,
          item_name: variantName,
          item_group_id: template.item_group_id,
          stock_uom_id: template.stock_uom_id,
          brand_id: template.brand_id,
          is_stock_item: template.is_stock_item,
          is_sales_item: template.is_sales_item,
          is_purchase_item: template.is_purchase_item,
          is_fixed_asset: template.is_fixed_asset,
          has_batch_no: template.has_batch_no,
          has_serial_no: template.has_serial_no,
          has_variants: false,
          variant_of_id: templateItemId,
          valuation_method: template.valuation_method,
          standard_rate: template.standard_rate,
          opening_stock: '0.000000',
          safety_stock: template.safety_stock,
          lead_time_days: template.lead_time_days,
          hsn_sac_code: template.hsn_sac_code,
          default_warehouse_id: template.default_warehouse_id,
          description: template.description,
          is_active: true,
          created_by: context.userId,
          updated_by: context.userId,
        };

        const insRes = await this.db.insert<Item>('item', variantPayload);
        if (insRes.error || !insRes.data) {
          throw new BusinessRuleError(
            `Failed to create variant '${variantCode}': ${insRes.error?.message}`
          );
        }
        variantItem = insRes.data;
      }

      // Link attribute dimensions in item_variant table
      for (const [attrName, attrValue] of Object.entries(combo)) {
        let attrId = attrMap.get(attrName.toLowerCase());
        if (!attrId) {
          // Create attribute dimension if not yet registered
          const newAttrRes = await this.db.insert<ItemAttributeRecord>('item_attribute', {
            tenant_id: context.tenantId,
            attribute_name: attrName,
            attribute_values: [attrValue],
            is_active: true,
            created_by: context.userId,
            updated_by: context.userId,
          });
          if (newAttrRes.data) {
            attrId = newAttrRes.data.id;
            attrMap.set(attrName.toLowerCase(), attrId);
          }
        }

        if (attrId && variantItem.id) {
          // Upsert item_variant pair
          await this.db.insert('item_variant', {
            tenant_id: context.tenantId,
            template_item_id: templateItemId,
            variant_item_id: variantItem.id,
            attribute_id: attrId,
            attribute_value: attrValue,
            created_by: context.userId,
            updated_by: context.userId,
          });
        }
      }

      createdVariants.push(variantItem);
    }

    logger.info('Generated item variants', {
      templateId: templateItemId,
      count: createdVariants.length,
    });

    return createdVariants;
  }

  // =========================================================================
  // UOM CONVERSIONS
  // =========================================================================

  /**
   * Computes quantity conversions between alternative UOMs with Decimal precision
   */
  async convertUomQuantity(params: {
    itemId?: string;
    fromUomId: string;
    toUomId: string;
    quantity: Decimal | string | number;
    tenantId: string;
  }): Promise<UomConversionResult> {
    const qty = Decimal.from(params.quantity);

    // Identity check
    if (params.fromUomId === params.toUomId) {
      return {
        convertedQuantity: qty,
        conversionFactor: Decimal.from(1),
        isReciprocal: false,
        fromUomId: params.fromUomId,
        toUomId: params.toUomId,
      };
    }

    // 1. Look for direct conversion (item-specific first, then global)
    let conv: UomConversion | null = null;
    let isReciprocal = false;

    if (params.itemId) {
      const itemConvRes = await this.db.findOne<UomConversion>('uom_conversion', [
        { column: 'tenant_id', operator: 'eq', value: params.tenantId },
        { column: 'item_id', operator: 'eq', value: params.itemId },
        { column: 'from_uom_id', operator: 'eq', value: params.fromUomId },
        { column: 'to_uom_id', operator: 'eq', value: params.toUomId },
      ]);
      conv = itemConvRes.data;
    }

    if (!conv) {
      const globalConvRes = await this.db.findOne<UomConversion>('uom_conversion', [
        { column: 'tenant_id', operator: 'eq', value: params.tenantId },
        { column: 'from_uom_id', operator: 'eq', value: params.fromUomId },
        { column: 'to_uom_id', operator: 'eq', value: params.toUomId },
      ]);
      conv = globalConvRes.data;
    }

    // 2. Look for reciprocal conversion if forward not found
    if (!conv) {
      if (params.itemId) {
        const itemInvRes = await this.db.findOne<UomConversion>('uom_conversion', [
          { column: 'tenant_id', operator: 'eq', value: params.tenantId },
          { column: 'item_id', operator: 'eq', value: params.itemId },
          { column: 'from_uom_id', operator: 'eq', value: params.toUomId },
          { column: 'to_uom_id', operator: 'eq', value: params.fromUomId },
        ]);
        conv = itemInvRes.data;
        if (conv) isReciprocal = true;
      }
    }

    if (!conv) {
      const globalInvRes = await this.db.findOne<UomConversion>('uom_conversion', [
        { column: 'tenant_id', operator: 'eq', value: params.tenantId },
        { column: 'from_uom_id', operator: 'eq', value: params.toUomId },
        { column: 'to_uom_id', operator: 'eq', value: params.fromUomId },
      ]);
      conv = globalInvRes.data;
      if (conv) isReciprocal = true;
    }

    if (!conv) {
      throw new BusinessRuleError(
        `No UOM conversion factor defined between UOM '${params.fromUomId}' and '${params.toUomId}'`
      );
    }

    const factor = Decimal.from(conv.conversion_factor);

    // If reciprocal: converted = qty / factor; direct: converted = qty * factor
    const convertedQuantity = isReciprocal
      ? qty.divide(factor).round(6)
      : qty.multiply(factor).round(6);

    return {
      convertedQuantity,
      conversionFactor: factor,
      isReciprocal,
      fromUomId: params.fromUomId,
      toUomId: params.toUomId,
    };
  }

  // =========================================================================
  // STANDARD RATES & PRICING LOOKUP
  // =========================================================================

  /**
   * Updates standard benchmark rate for an item
   */
  async updateStandardRate(
    itemId: string,
    newRate: Decimal | string | number,
    context: ServiceContext
  ): Promise<Item> {
    const rateDecimal = Decimal.from(newRate);
    if (rateDecimal.isNegative()) {
      throw new BusinessRuleError('Standard rate cannot be negative');
    }

    const item = await this.getItemById(itemId, context.tenantId);

    const updateRes = await this.db.update<Item>(
      'item',
      itemId,
      {
        standard_rate: rateDecimal.toFixed(6),
        updated_by: context.userId,
      },
      { tenantId: context.tenantId }
    );

    if (updateRes.error || !updateRes.data) {
      throw new BusinessRuleError(
        `Failed to update standard rate for item '${item.item_code}': ${updateRes.error?.message}`
      );
    }

    logger.info('Updated item standard rate', {
      itemId,
      itemCode: item.item_code,
      newRate: rateDecimal.toFixed(2),
    });

    return updateRes.data;
  }

  /**
   * Resolves active unit price from Price List with volume breaks and promotional discount rules
   */
  async getItemPrice(params: {
    itemId: string;
    priceListId: string;
    uomId?: string;
    quantity?: Decimal | string | number;
    transactionDate?: string | Date;
    tenantId: string;
  }): Promise<PricingLookupResult> {
    const item = await this.getItemById(params.itemId, params.tenantId);
    const targetUomId = params.uomId || item.stock_uom_id;
    const reqQty = Decimal.from(params.quantity || 1);
    const txnDate =
      typeof params.transactionDate === 'string'
        ? params.transactionDate
        : params.transactionDate?.toISOString().slice(0, 10) ||
          new Date().toISOString().slice(0, 10);

    // 1. Fetch item prices for this price list and item
    const priceFilters: QueryFilter[] = [
      { column: 'tenant_id', operator: 'eq', value: params.tenantId },
      { column: 'price_list_id', operator: 'eq', value: params.priceListId },
      { column: 'item_id', operator: 'eq', value: params.itemId },
    ];

    const priceListRes = await this.db.findMany<ItemPrice>('item_price', {
      filters: priceFilters,
      sort: [{ column: 'min_qty', direction: 'desc' }],
    });

    let baseRate: Decimal | null = null;
    let source: 'price_list' | 'pricing_rule' | 'standard_rate' = 'standard_rate';

    const entries = priceListRes.data || [];

    // Filter by validity dates and minimum quantity
    for (const entry of entries) {
      if (entry.valid_from && entry.valid_from > txnDate) continue;
      if (entry.valid_upto && entry.valid_upto < txnDate) continue;

      const minQty = Decimal.from(entry.min_qty || 1);
      if (reqQty.greaterThanOrEqual(minQty)) {
        let entryRate = Decimal.from(entry.price_rate);

        // Adjust for UOM if priced in different UOM
        if (entry.uom_id !== targetUomId) {
          const conv = await this.convertUomQuantity({
            itemId: params.itemId,
            fromUomId: entry.uom_id,
            toUomId: targetUomId,
            quantity: 1,
            tenantId: params.tenantId,
          });
          // Rate per target UOM = entryRate / convFactor
          entryRate = entryRate.divide(conv.conversionFactor).round(6);
        }

        baseRate = entryRate;
        source = 'price_list';
        break; // entries are sorted by min_qty desc, so the first match is the best volume tier
      }
    }

    // Fall back to item benchmark standard rate if no price list entry found
    if (!baseRate) {
      baseRate = Decimal.from(item.standard_rate || 0);
      source = 'standard_rate';
    }

    // 2. Evaluate promotional Pricing Rules
    const ruleFilters: QueryFilter[] = [
      { column: 'tenant_id', operator: 'eq', value: params.tenantId },
      { column: 'is_active', operator: 'eq', value: true },
    ];

    const rulesRes = await this.db.findMany<PricingRuleRecord>('pricing_rule', {
      filters: ruleFilters,
      sort: [{ column: 'priority', direction: 'desc' }],
    });

    let discountPercentage = Decimal.zero();
    let discountAmount = Decimal.zero();
    let ruleApplied = false;
    let appliedRuleTitle: string | undefined;

    for (const rule of rulesRes.data || []) {
      if (rule.valid_from && rule.valid_from > txnDate) continue;
      if (rule.valid_upto && rule.valid_upto < txnDate) continue;

      // Check applicability condition
      const matchesItem = rule.apply_on === 'Item Code' && rule.item_id === params.itemId;
      const matchesGroup =
        rule.apply_on === 'Item Group' && rule.item_group_id === item.item_group_id;

      if (!matchesItem && !matchesGroup) continue;

      // Check min/max qty limits
      const minQty = Decimal.from(rule.min_qty || 0);
      if (reqQty.lessThan(minQty)) continue;
      if (rule.max_qty) {
        const maxQty = Decimal.from(rule.max_qty);
        if (reqQty.greaterThan(maxQty)) continue;
      }

      // Check min amount
      const orderVal = baseRate.multiply(reqQty);
      const minAmt = Decimal.from(rule.min_amt || 0);
      if (orderVal.lessThan(minAmt)) continue;

      discountPercentage = Decimal.from(rule.discount_percentage || 0);
      discountAmount = Decimal.from(rule.discount_amount || 0);
      ruleApplied = true;
      appliedRuleTitle = rule.title;
      source = 'pricing_rule';
      break; // Highest priority rule matched
    }

    // Calculate final unit rate
    let finalRate = baseRate;
    if (ruleApplied) {
      if (discountPercentage.isPositive()) {
        const pctDiscount = baseRate.multiply(discountPercentage).divide(100);
        finalRate = finalRate.subtract(pctDiscount);
      }
      if (discountAmount.isPositive()) {
        finalRate = finalRate.subtract(discountAmount);
      }
      if (finalRate.isNegative()) {
        finalRate = Decimal.zero();
      }
    }

    return {
      itemId: params.itemId,
      itemCode: item.item_code,
      priceListId: params.priceListId,
      uomId: targetUomId,
      baseRate: baseRate.round(2),
      finalRate: finalRate.round(2),
      discountPercentage: discountPercentage.round(2),
      discountAmount: discountAmount.round(2),
      ruleApplied,
      pricingRuleTitle: appliedRuleTitle,
      source,
    };
  }

  // =========================================================================
  // AUXILIARY CRUD: UOM, ITEM GROUP, PRICE LIST
  // =========================================================================

  async createUom(input: CreateUomInput, context: ServiceContext): Promise<Uom> {
    const parsed = createUomSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'UOM validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const insertRes = await this.db.insert<Uom>('uom', {
      ...parsed.data,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(`Failed to create UOM: ${insertRes.error?.message}`);
    }
    return insertRes.data;
  }

  async createUomConversion(
    input: CreateUomConversionInput,
    context: ServiceContext
  ): Promise<UomConversion> {
    const parsed = createUomConversionSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'UOM conversion validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const insertRes = await this.db.insert<UomConversion>('uom_conversion', {
      ...parsed.data,
      conversion_factor: Decimal.from(parsed.data.conversion_factor).toFixed(6),
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(
        `Failed to create UOM conversion: ${insertRes.error?.message}`
      );
    }
    return insertRes.data;
  }

  async createItemGroup(
    input: CreateItemGroupInput,
    context: ServiceContext
  ): Promise<ItemGroup> {
    const parsed = createItemGroupSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Item group validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const insertRes = await this.db.insert<ItemGroup>('item_group', {
      ...parsed.data,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(
        `Failed to create item group: ${insertRes.error?.message}`
      );
    }
    return insertRes.data;
  }

  async createPriceList(
    input: CreatePriceListInput,
    context: ServiceContext
  ): Promise<PriceList> {
    const parsed = createPriceListSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Price list validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const insertRes = await this.db.insert<PriceList>('price_list', {
      ...parsed.data,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(
        `Failed to create price list: ${insertRes.error?.message}`
      );
    }
    return insertRes.data;
  }

  async createItemPrice(
    input: CreateItemPriceInput,
    context: ServiceContext
  ): Promise<ItemPrice> {
    const parsed = createItemPriceSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Item price validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const insertRes = await this.db.insert<ItemPrice>('item_price', {
      ...parsed.data,
      price_rate: Decimal.from(parsed.data.price_rate).toFixed(6),
      min_qty: Decimal.from(parsed.data.min_qty).toFixed(6),
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(
        `Failed to create item price entry: ${insertRes.error?.message}`
      );
    }
    return insertRes.data;
  }
}
