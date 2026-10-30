/**
 * VyaparSuite Sales Quotation Service
 * Manages commercial proposals, multi-tier line pricing calculations,
 * tax computation breakdowns, proposal submission, and seamless Quote-to-Order conversion.
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
  Quotation,
  CreateQuotationInput,
  UpdateQuotationInput,
  OrderItemInput,
  ConvertQuotationToOrderInput,
  OrderFilterParams,
  createQuotationSchema,
  updateQuotationSchema,
  convertQuotationToOrderSchema,
} from '../schemas/order.schema';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { SalesOrderService } from './sales-order-service';

export interface ServiceContext {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
}

export interface ComputedTotals {
  netTotal: Decimal;
  taxTotal: Decimal;
  grandTotal: Decimal;
  roundingAdjustment: Decimal;
  roundedTotal: Decimal;
  computedItems: Array<{
    item_id: string;
    item_code: string;
    item_name: string;
    description?: string | null;
    qty: string;
    uom_id: string;
    rate: string;
    discount_percentage: string;
    discount_amount: string;
    net_amount: string;
    tax_template_id?: string | null;
    tax_rate: string;
    tax_amount: string;
    total_amount: string;
    lead_time_days?: number;
    idx: number;
  }>;
}

export class QuotationService {
  private db: IDatabaseAdapter;
  private namingService: NamingSeriesService;

  constructor(db?: IDatabaseAdapter) {
    this.db = db || createSupabaseAdapter(createServerClient());
    this.namingService = new NamingSeriesService(this.db);
  }

  /**
   * Calculate line item totals and aggregate summary using high-precision Decimal
   */
  public computeTotals(items: OrderItemInput[]): ComputedTotals {
    let netTotal = Decimal.zero();
    let taxTotal = Decimal.zero();

    const computedItems = items.map((item, idx) => {
      const qty = Decimal.from(item.qty || '1');
      const rate = Decimal.from(item.rate || '0');
      const gross = qty.multiply(rate);

      let discount = Decimal.zero();
      const discPct = Decimal.from(item.discount_percentage || '0');
      if (discPct.isPositive()) {
        discount = gross.multiply(discPct).divide(100);
      } else if (item.discount_amount) {
        discount = Decimal.from(item.discount_amount);
      }

      const net = gross.subtract(discount);
      const taxRate = Decimal.from(item.tax_rate || '0');
      const taxAmount = net.multiply(taxRate).divide(100);
      const lineTotal = net.add(taxAmount);

      netTotal = netTotal.add(net);
      taxTotal = taxTotal.add(taxAmount);

      return {
        idx: idx + 1,
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        qty: qty.toString(6),
        uom_id: item.uom_id,
        rate: rate.toString(6),
        discount_percentage: discPct.toString(6),
        discount_amount: discount.toString(6),
        net_amount: net.toString(6),
        tax_template_id: item.tax_template_id,
        tax_rate: taxRate.toString(6),
        tax_amount: taxAmount.toString(6),
        total_amount: lineTotal.toString(6),
        lead_time_days: item.lead_time_days || 0,
      };
    });

    const grandTotal = netTotal.add(taxTotal);
    const rounded = grandTotal.round(2);
    const roundingAdj = rounded.subtract(grandTotal);

    return {
      netTotal,
      taxTotal,
      grandTotal,
      roundingAdjustment: roundingAdj,
      roundedTotal: rounded,
      computedItems,
    };
  }

  /**
   * Create Quotation
   */
  async createQuotation(data: CreateQuotationInput, context: ServiceContext): Promise<Quotation> {
    const validated = createQuotationSchema.parse(data);
    const totals = this.computeTotals(validated.items);

    // Generate quotation number via NamingSeries
    const qtnNumber = await this.namingService.getNextNumber(
      'QTN-{FY}-{#####}',
      {
        tenantId: context.tenantId,
        companyId: validated.company_id,
        postingDate: validated.transaction_date,
      }
    );

    const { items: _, ...headerData } = validated;

    const payload = {
      ...headerData,
      quotation_number: qtnNumber,
      net_total: totals.netTotal.toString(6),
      tax_total: totals.taxTotal.toString(6),
      grand_total: totals.grandTotal.toString(6),
      rounding_adjustment: totals.roundingAdjustment.toString(6),
      rounded_total: totals.roundedTotal.toString(6),
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const res = await this.db.insert<Quotation>('quotation', payload);
    if (res.error || !res.data) {
      throw new ConflictError(res.error?.message || 'Failed to create quotation');
    }

    const quotation = res.data;

    // Insert child items
    const itemRows = totals.computedItems.map((ci) => ({
      ...ci,
      tenant_id: context.tenantId,
      quotation_id: quotation.id,
      created_by: context.userId,
      updated_by: context.userId,
    }));
    await this.db.insertMany('quotation_item', itemRows);

    logger.info('Quotation created successfully', {
      quotationNumber: qtnNumber,
      quotationId: quotation.id,
      grandTotal: totals.grandTotal.toString(2),
    });

    return quotation;
  }

  /**
   * Update Quotation (allowed only in Draft status)
   */
  async updateQuotation(id: string, data: UpdateQuotationInput, context: ServiceContext): Promise<Quotation> {
    const existing = await this.getQuotationById(id, context.tenantId);
    if (existing.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot modify quotation in status '${existing.status}'`);
    }

    const validated = updateQuotationSchema.parse(data);
    let totals: ComputedTotals | null = null;

    if (validated.items && validated.items.length > 0) {
      totals = this.computeTotals(validated.items as OrderItemInput[]);
    }

    const { items: _, ...headerData } = validated;

    const updatePayload: Record<string, unknown> = {
      ...headerData,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    };

    if (totals) {
      updatePayload.net_total = totals.netTotal.toString(6);
      updatePayload.tax_total = totals.taxTotal.toString(6);
      updatePayload.grand_total = totals.grandTotal.toString(6);
      updatePayload.rounding_adjustment = totals.roundingAdjustment.toString(6);
      updatePayload.rounded_total = totals.roundedTotal.toString(6);
    }

    const res = await this.db.update<Quotation>('quotation', id, updatePayload);
    if (res.error || !res.data) {
      throw new NotFoundError('Quotation', id);
    }

    // Refresh child items if supplied
    if (totals) {
      // Clean previous items
      await this.db.raw('DELETE FROM quotation_item WHERE quotation_id = ?', [id]);
      const itemRows = totals.computedItems.map((ci) => ({
        ...ci,
        tenant_id: context.tenantId,
        quotation_id: id,
        created_by: context.userId,
        updated_by: context.userId,
      }));
      await this.db.insertMany('quotation_item', itemRows);
    }

    return res.data;
  }

  /**
   * Submit Quotation (locks into Submitted proposal)
   */
  async submitQuotation(id: string, context: ServiceContext): Promise<Quotation> {
    const quotation = await this.getQuotationById(id, context.tenantId);
    if (quotation.status !== 'Draft') {
      throw new BusinessRuleError(`Only Draft quotations can be submitted. Current status: ${quotation.status}`);
    }

    const res = await this.db.update<Quotation>('quotation', id, {
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
      submitted_by: context.userId,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    if (res.error || !res.data) {
      throw new NotFoundError('Quotation', id);
    }

    logger.info('Quotation submitted successfully', {
      quotationId: id,
      quotationNumber: quotation.quotation_number,
    });
    return res.data;
  }

  /**
   * Convert Quotation into Sales Order
   */
  async convertToSalesOrder(
    input: ConvertQuotationToOrderInput,
    context: ServiceContext
  ): Promise<{ quotation: Quotation; salesOrderId: string; orderNumber: string }> {
    const validated = convertQuotationToOrderSchema.parse(input);
    const quotation = await this.getQuotationById(validated.quotationId, context.tenantId);

    if (quotation.status === 'Ordered') {
      throw new BusinessRuleError('Quotation has already been converted to a Sales Order');
    }
    if (quotation.status === 'Lost' || quotation.status === 'Cancelled' || quotation.status === 'Expired') {
      throw new BusinessRuleError(`Cannot convert quotation with status '${quotation.status}'`);
    }

    if (!quotation.customer_id) {
      throw new BusinessRuleError('Cannot convert quotation without a linked Customer. Please convert Lead first.');
    }

    // Fetch child items
    const itemsRes = await this.db.findMany<Record<string, unknown>>('quotation_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'quotation_id', operator: 'eq', value: quotation.id },
      ],
      sort: [{ column: 'idx', direction: 'asc' }],
    });

    const items = (itemsRes.data || []).map((row) => ({
      item_id: row.item_id as string,
      item_code: row.item_code as string,
      item_name: row.item_name as string,
      description: row.description as string | null | undefined,
      qty: row.qty as string,
      uom_id: row.uom_id as string,
      rate: row.rate as string,
      discount_percentage: row.discount_percentage as string,
      discount_amount: row.discount_amount as string,
      tax_template_id: row.tax_template_id as string | null | undefined,
      tax_rate: row.tax_rate as string,
      warehouse_id: row.warehouse_id as string | null | undefined,
    }));

    // Create Sales Order via SalesOrderService
    const soService = new SalesOrderService(this.db);
    const salesOrder = await soService.createSalesOrder(
      {
        company_id: quotation.company_id,
        customer_id: quotation.customer_id,
        quotation_id: quotation.id,
        delivery_date: validated.deliveryDate,
        customer_po_no: validated.customerPoNo,
        customer_po_date: validated.customerPoDate,
        currency: quotation.currency,
        exchange_rate: quotation.exchange_rate,
        payment_terms_template_id: quotation.payment_terms_template_id,
        terms_and_conditions_id: quotation.terms_and_conditions_id,
        shipping_address_id: quotation.shipping_address_id,
        billing_address_id: quotation.billing_address_id,
        items,
      },
      context
    );

    // Update Quotation status to Ordered
    const updatedQtnRes = await this.db.update<Quotation>('quotation', quotation.id!, {
      status: 'Ordered',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Quotation converted to Sales Order', {
      quotationNumber: quotation.quotation_number,
      orderNumber: salesOrder.order_number,
      salesOrderId: salesOrder.id,
    });

    return {
      quotation: updatedQtnRes.data!,
      salesOrderId: salesOrder.id!,
      orderNumber: salesOrder.order_number!,
    };
  }

  /**
   * Mark Quotation as Lost
   */
  async markLost(id: string, reason: string, context: ServiceContext): Promise<Quotation> {
    const qtn = await this.getQuotationById(id, context.tenantId);
    if (qtn.status === 'Ordered') {
      throw new BusinessRuleError('Cannot mark an ordered quotation as Lost');
    }

    const res = await this.db.update<Quotation>('quotation', id, {
      status: 'Lost',
      order_lost_reason: reason,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Get Quotation by ID
   */
  async getQuotationById(id: string, tenantId: string): Promise<Quotation> {
    const res = await this.db.findById<Quotation>('quotation', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('Quotation', id);
    }
    return res.data;
  }

  /**
   * List Quotations
   */
  async listQuotations(
    params: OrderFilterParams,
    tenantId: string
  ): Promise<{ data: Quotation[]; total: number }> {
    const filters: QueryFilter[] = [{ column: 'tenant_id', operator: 'eq', value: tenantId }];

    if (params.status) {
      filters.push({ column: 'status', operator: 'eq', value: params.status });
    }
    if (params.customer_id) {
      filters.push({ column: 'customer_id', operator: 'eq', value: params.customer_id });
    }
    if (params.company_id) {
      filters.push({ column: 'company_id', operator: 'eq', value: params.company_id });
    }
    if (params.search) {
      filters.push({ column: 'quotation_number', operator: 'ilike', value: `%${params.search}%` });
    }

    const sort: QuerySort[] = [
      { column: params.sortBy || 'transaction_date', direction: params.sortDirection || 'desc' },
    ];

    const res = await this.db.findMany<Quotation>('quotation', {
      filters,
      sort,
      pagination: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      },
    });

    return {
      data: res.data || [],
      total: res.count ?? (res.data ? res.data.length : 0),
    };
  }
}
