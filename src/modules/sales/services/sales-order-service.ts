/**
 * VyaparSuite Sales Order Service
 * Manages confirmed sales commitments, credit exposure validation,
 * four-eyes managerial approval workflows, cumulative delivery & billing tracking,
 * and automated fulfillment lifecycle state transitions.
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
  CreditLimitExceededError,
  AuthorizationError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  SalesOrder,
  CreateSalesOrderInput,
  UpdateSalesOrderInput,
  OrderItemInput,
  OrderFilterParams,
  createSalesOrderSchema,
  updateSalesOrderSchema,
} from '../schemas/order.schema';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { CustomerService } from './customer-service';

export interface ServiceContext {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
  userRoles?: string[];
}

export class SalesOrderService {
  private db: IDatabaseAdapter;
  private namingService: NamingSeriesService;
  private customerService: CustomerService;

  constructor(db?: IDatabaseAdapter) {
    this.db = db || createSupabaseAdapter(createServerClient());
    this.namingService = new NamingSeriesService(this.db);
    this.customerService = new CustomerService(this.db);
  }

  /**
   * Compute line items and aggregate header totals
   */
  public computeOrderTotals(items: OrderItemInput[]) {
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
        warehouse_id: item.warehouse_id,
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
   * Create Sales Order in Draft status
   */
  async createSalesOrder(data: CreateSalesOrderInput, context: ServiceContext): Promise<SalesOrder> {
    const validated = createSalesOrderSchema.parse(data);
    const totals = this.computeOrderTotals(validated.items);

    // Generate Order Number
    const orderNumber = await this.namingService.getNextNumber(
      'SO-{FY}-{#####}',
      {
        tenantId: context.tenantId,
        companyId: validated.company_id,
        postingDate: validated.transaction_date,
      }
    );

    const { items: _, ...headerData } = validated;

    const payload = {
      ...headerData,
      order_number: orderNumber,
      net_total: totals.netTotal.toString(6),
      tax_total: totals.taxTotal.toString(6),
      grand_total: totals.grandTotal.toString(6),
      rounding_adjustment: totals.roundingAdjustment.toString(6),
      rounded_total: totals.roundedTotal.toString(6),
      status: 'Draft',
      delivered_percent: '0.000000',
      billed_percent: '0.000000',
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const res = await this.db.insert<SalesOrder>('sales_order', payload);
    if (res.error || !res.data) {
      throw new ConflictError(res.error?.message || 'Failed to create sales order');
    }

    const order = res.data;

    // Insert line items
    const itemRows = totals.computedItems.map((ci) => ({
      ...ci,
      tenant_id: context.tenantId,
      sales_order_id: order.id,
      delivered_qty: '0.000000',
      billed_qty: '0.000000',
      created_by: context.userId,
      updated_by: context.userId,
    }));
    await this.db.insertMany('sales_order_item', itemRows);

    logger.info('Sales Order booked in Draft status', {
      orderNumber,
      orderId: order.id,
      customer: validated.customer_id,
      grandTotal: totals.grandTotal.toString(2),
    });

    return order;
  }

  /**
   * Submit Sales Order for Approval
   * Checks customer credit exposure before advancing
   */
  async submitSalesOrder(id: string, context: ServiceContext): Promise<SalesOrder> {
    const order = await this.getSalesOrderById(id, context.tenantId);
    if (order.status !== 'Draft') {
      throw new BusinessRuleError(`Only Draft sales orders can be submitted. Current status: ${order.status}`);
    }

    // Evaluate Credit Limit
    const creditCheck = await this.customerService.checkCreditLimit(
      order.customer_id,
      order.grand_total,
      context.tenantId,
      order.company_id
    );

    if (!creditCheck.allowed) {
      logger.warn('Sales order blocked by credit limit check', {
        orderId: id,
        customerId: order.customer_id,
        reason: creditCheck.reason,
      });
      throw new CreditLimitExceededError(
        order.customer_id,
        creditCheck.creditLimit.toFixed(2),
        creditCheck.currentOutstanding.toFixed(2)
      );
    }

    const res = await this.db.update<SalesOrder>('sales_order', id, {
      status: 'Pending Approval',
      submitted_at: new Date().toISOString(),
      submitted_by: context.userId,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Approve Sales Order (Enforces 4-Eyes Principle)
   */
  async approveSalesOrder(id: string, context: ServiceContext): Promise<SalesOrder> {
    const order = await this.getSalesOrderById(id, context.tenantId);
    if (order.status !== 'Pending Approval' && order.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot approve sales order with status '${order.status}'`);
    }

    // Segregation of Duties: Creator cannot approve their own order
    if (order.created_by === context.userId) {
      throw new AuthorizationError(
        'Four-eyes principle violation: Creator cannot approve their own Sales Order'
      );
    }

    const res = await this.db.update<SalesOrder>('sales_order', id, {
      status: 'To Deliver and Bill',
      approved_at: new Date().toISOString(),
      approved_by: context.userId,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Sales Order approved and released for dispatch & billing', {
      orderId: id,
      orderNumber: order.order_number,
      approverId: context.userId,
    });

    return res.data!;
  }

  /**
   * Update Delivery Progress from Delivery Note or Dispatch
   */
  async updateDeliveryProgress(
    orderId: string,
    deliveredQuantities: Record<string, string>, // itemId -> cumulative delivered qty
    tenantId: string
  ): Promise<SalesOrder> {
    const order = await this.getSalesOrderById(orderId, tenantId);
    const itemsRes = await this.db.findMany<Record<string, unknown>>('sales_order_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'sales_order_id', operator: 'eq', value: orderId },
      ],
    });

    const items = itemsRes.data || [];
    let totalOrderedQty = Decimal.zero();
    let totalDeliveredQty = Decimal.zero();

    for (const item of items) {
      const itemId = item.item_id as string;
      const orderQty = Decimal.from(item.qty as string);
      totalOrderedQty = totalOrderedQty.add(orderQty);

      if (deliveredQuantities[itemId]) {
        const newDelivered = Decimal.from(deliveredQuantities[itemId]);
        totalDeliveredQty = totalDeliveredQty.add(newDelivered);
        await this.db.update('sales_order_item', item.id as string, {
          delivered_qty: newDelivered.toString(6),
        });
      } else {
        totalDeliveredQty = totalDeliveredQty.add(Decimal.from(item.delivered_qty as string || '0'));
      }
    }

    const deliveredPercent = totalOrderedQty.isPositive()
      ? totalDeliveredQty.multiply(100).divide(totalOrderedQty).round(2)
      : Decimal.zero();

    const billedPercent = Decimal.from(order.billed_percent || '0');

    let newStatus = order.status;
    if (deliveredPercent.greaterThanOrEqual(100) && billedPercent.greaterThanOrEqual(100)) {
      newStatus = 'Completed';
    } else if (deliveredPercent.greaterThanOrEqual(100)) {
      newStatus = 'To Bill';
    } else if (billedPercent.greaterThanOrEqual(100)) {
      newStatus = 'To Deliver';
    } else {
      newStatus = 'To Deliver and Bill';
    }

    const res = await this.db.update<SalesOrder>('sales_order', orderId, {
      delivered_percent: deliveredPercent.toString(6),
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Update Invoicing Progress from Sales Invoice
   */
  async updateBillingProgress(
    orderId: string,
    billedQuantities: Record<string, string>,
    tenantId: string
  ): Promise<SalesOrder> {
    const order = await this.getSalesOrderById(orderId, tenantId);
    const itemsRes = await this.db.findMany<Record<string, unknown>>('sales_order_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'sales_order_id', operator: 'eq', value: orderId },
      ],
    });

    const items = itemsRes.data || [];
    let totalOrderedQty = Decimal.zero();
    let totalBilledQty = Decimal.zero();

    for (const item of items) {
      const itemId = item.item_id as string;
      const orderQty = Decimal.from(item.qty as string);
      totalOrderedQty = totalOrderedQty.add(orderQty);

      if (billedQuantities[itemId]) {
        const newBilled = Decimal.from(billedQuantities[itemId]);
        totalBilledQty = totalBilledQty.add(newBilled);
        await this.db.update('sales_order_item', item.id as string, {
          billed_qty: newBilled.toString(6),
        });
      } else {
        totalBilledQty = totalBilledQty.add(Decimal.from(item.billed_qty as string || '0'));
      }
    }

    const billedPercent = totalOrderedQty.isPositive()
      ? totalBilledQty.multiply(100).divide(totalOrderedQty).round(2)
      : Decimal.zero();

    const deliveredPercent = Decimal.from(order.delivered_percent || '0');

    let newStatus = order.status;
    if (deliveredPercent.greaterThanOrEqual(100) && billedPercent.greaterThanOrEqual(100)) {
      newStatus = 'Completed';
    } else if (billedPercent.greaterThanOrEqual(100)) {
      newStatus = 'To Deliver';
    } else if (deliveredPercent.greaterThanOrEqual(100)) {
      newStatus = 'To Bill';
    } else {
      newStatus = 'To Deliver and Bill';
    }

    const res = await this.db.update<SalesOrder>('sales_order', orderId, {
      billed_percent: billedPercent.toString(6),
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Cancel Sales Order (Allowed only when 0 dispatches and 0 invoices have occurred)
   */
  async cancelSalesOrder(id: string, reason: string, context: ServiceContext): Promise<SalesOrder> {
    const order = await this.getSalesOrderById(id, context.tenantId);

    const delivered = Decimal.from(order.delivered_percent || '0');
    const billed = Decimal.from(order.billed_percent || '0');

    if (delivered.isPositive() || billed.isPositive()) {
      throw new BusinessRuleError(
        `Cannot cancel Sales Order ${order.order_number}: Fulfillment has commenced (${delivered.toFixed(1)}% delivered, ${billed.toFixed(1)}% billed). Please reverse Delivery Notes and Credit Note Invoices first.`
      );
    }

    const res = await this.db.update<SalesOrder>('sales_order', id, {
      status: 'Cancelled',
      notes: order.notes ? `${order.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Get Sales Order by ID
   */
  async getSalesOrderById(id: string, tenantId: string): Promise<SalesOrder> {
    const res = await this.db.findById<SalesOrder>('sales_order', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('SalesOrder', id);
    }
    return res.data;
  }

  /**
   * List Sales Orders
   */
  async listSalesOrders(
    params: OrderFilterParams,
    tenantId: string
  ): Promise<{ data: SalesOrder[]; total: number }> {
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
      filters.push({ column: 'order_number', operator: 'ilike', value: `%${params.search}%` });
    }

    const sort: QuerySort[] = [
      { column: params.sortBy || 'transaction_date', direction: params.sortDirection || 'desc' },
    ];

    const res = await this.db.findMany<SalesOrder>('sales_order', {
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
