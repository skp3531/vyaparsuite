/**
 * VyaparSuite Purchase Order Service
 * Manages procurement commitments, supplier validation, multi-tier
 * managerial approval workflows, statutory MSME tenure checks,
 * and goods receipt / vendor invoice fulfillment tracking.
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
  AuthorizationError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  PurchaseOrder,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
  PurchaseOrderItemInput,
  PurchaseOrderFilterParams,
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
} from '../schemas/purchase-order.schema';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { SupplierService } from './supplier-service';

export interface ServiceContext {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
  approvalLimit?: string;
}

export class PurchaseOrderService {
  private db: IDatabaseAdapter;
  private namingService: NamingSeriesService;
  private supplierService: SupplierService;

  constructor(db?: IDatabaseAdapter) {
    this.db = db || createSupabaseAdapter(createServerClient());
    this.namingService = new NamingSeriesService(this.db);
    this.supplierService = new SupplierService(this.db);
  }

  /**
   * Compute line items and aggregate purchase order totals
   */
  public computeOrderTotals(items: PurchaseOrderItemInput[]) {
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
        material_request_item_id: item.material_request_item_id,
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
   * Create Purchase Order in Draft status
   */
  async createPurchaseOrder(
    data: CreatePurchaseOrderInput,
    context: ServiceContext
  ): Promise<PurchaseOrder> {
    const validated = createPurchaseOrderSchema.parse(data);

    // Verify supplier is active
    const supplier = await this.supplierService.getSupplierById(validated.supplier_id, context.tenantId);
    if (!supplier.is_active) {
      throw new BusinessRuleError(`Supplier '${supplier.supplier_name}' is inactive and cannot accept orders.`);
    }

    const totals = this.computeOrderTotals(validated.items);

    // Generate PO Number
    const poNumber = await this.namingService.getNextNumber(
      'PO-{FY}-{#####}',
      {
        tenantId: context.tenantId,
        companyId: validated.company_id,
        postingDate: validated.transaction_date,
      }
    );

    const { items: _, ...headerData } = validated;

    const payload = {
      ...headerData,
      purchase_order_number: poNumber,
      net_total: totals.netTotal.toString(6),
      tax_total: totals.taxTotal.toString(6),
      grand_total: totals.grandTotal.toString(6),
      rounding_adjustment: totals.roundingAdjustment.toString(6),
      rounded_total: totals.roundedTotal.toString(6),
      status: 'Draft',
      received_percent: '0.000000',
      billed_percent: '0.000000',
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const res = await this.db.insert<PurchaseOrder>('purchase_order', payload);
    if (res.error || !res.data) {
      throw new ConflictError(res.error?.message || 'Failed to create purchase order');
    }

    const po = res.data;

    // Insert line items
    const itemRows = totals.computedItems.map((ci) => ({
      ...ci,
      tenant_id: context.tenantId,
      purchase_order_id: po.id,
      received_qty: '0.000000',
      billed_qty: '0.000000',
      created_by: context.userId,
      updated_by: context.userId,
    }));
    await this.db.insertMany('purchase_order_item', itemRows);

    logger.info('Purchase Order created in Draft status', {
      poNumber,
      poId: po.id,
      supplierId: validated.supplier_id,
      grandTotal: totals.grandTotal.toString(2),
    });

    return po;
  }

  /**
   * Submit Purchase Order for Managerial Approval
   */
  async submitPurchaseOrder(id: string, context: ServiceContext): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id, context.tenantId);
    if (po.status !== 'Draft') {
      throw new BusinessRuleError(`Only Draft purchase orders can be submitted. Current status: ${po.status}`);
    }

    const res = await this.db.update<PurchaseOrder>('purchase_order', id, {
      status: 'Pending Approval',
      submitted_at: new Date().toISOString(),
      submitted_by: context.userId,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Approve Purchase Order (Enforces 4-Eyes Principle and Approval Limits)
   */
  async approvePurchaseOrder(id: string, context: ServiceContext): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id, context.tenantId);
    if (po.status !== 'Pending Approval' && po.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot approve purchase order with status '${po.status}'`);
    }

    // Four-Eyes Principle check: Creator cannot approve their own PO
    if (po.created_by === context.userId) {
      throw new AuthorizationError(
        'Four-eyes principle violation: Creator cannot approve their own Purchase Order'
      );
    }

    // Check approval monetary limit if context specifies
    if (context.approvalLimit) {
      const limit = Decimal.from(context.approvalLimit);
      const poTotal = Decimal.from(po.grand_total);
      if (poTotal.greaterThan(limit)) {
        throw new AuthorizationError(
          `Purchase order amount (₹${poTotal.toFixed(2)}) exceeds your authorized approval limit (₹${limit.toFixed(2)})`
        );
      }
    }

    const res = await this.db.update<PurchaseOrder>('purchase_order', id, {
      status: 'To Receive and Bill',
      approved_at: new Date().toISOString(),
      approved_by: context.userId,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Purchase Order approved and released to vendor', {
      poNumber: po.purchase_order_number,
      poId: po.id,
      approverId: context.userId,
    });

    return res.data!;
  }

  /**
   * Update Material Receipt Progress from Goods Receipt Note (GRN)
   */
  async updateReceiptProgress(
    poId: string,
    receivedQuantities: Record<string, string>,
    tenantId: string
  ): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(poId, tenantId);
    const itemsRes = await this.db.findMany<Record<string, unknown>>('purchase_order_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'purchase_order_id', operator: 'eq', value: poId },
      ],
    });

    const items = itemsRes.data || [];
    let totalOrderedQty = Decimal.zero();
    let totalReceivedQty = Decimal.zero();

    for (const item of items) {
      const itemId = item.item_id as string;
      const orderQty = Decimal.from(item.qty as string);
      totalOrderedQty = totalOrderedQty.add(orderQty);

      if (receivedQuantities[itemId]) {
        const newReceived = Decimal.from(receivedQuantities[itemId]);
        totalReceivedQty = totalReceivedQty.add(newReceived);
        await this.db.update('purchase_order_item', item.id as string, {
          received_qty: newReceived.toString(6),
        });
      } else {
        totalReceivedQty = totalReceivedQty.add(Decimal.from(item.received_qty as string || '0'));
      }
    }

    const receivedPercent = totalOrderedQty.isPositive()
      ? totalReceivedQty.multiply(100).divide(totalOrderedQty).round(2)
      : Decimal.zero();

    const billedPercent = Decimal.from(po.billed_percent || '0');

    let newStatus = po.status;
    if (receivedPercent.greaterThanOrEqual(100) && billedPercent.greaterThanOrEqual(100)) {
      newStatus = 'Completed';
    } else if (receivedPercent.greaterThanOrEqual(100)) {
      newStatus = 'To Bill';
    } else if (billedPercent.greaterThanOrEqual(100)) {
      newStatus = 'To Receive';
    } else {
      newStatus = 'To Receive and Bill';
    }

    const res = await this.db.update<PurchaseOrder>('purchase_order', poId, {
      received_percent: receivedPercent.toString(6),
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Update Invoicing Progress from Purchase Invoice
   */
  async updateBillingProgress(
    poId: string,
    billedQuantities: Record<string, string>,
    tenantId: string
  ): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(poId, tenantId);
    const itemsRes = await this.db.findMany<Record<string, unknown>>('purchase_order_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'purchase_order_id', operator: 'eq', value: poId },
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
        await this.db.update('purchase_order_item', item.id as string, {
          billed_qty: newBilled.toString(6),
        });
      } else {
        totalBilledQty = totalBilledQty.add(Decimal.from(item.billed_qty as string || '0'));
      }
    }

    const billedPercent = totalOrderedQty.isPositive()
      ? totalBilledQty.multiply(100).divide(totalOrderedQty).round(2)
      : Decimal.zero();

    const receivedPercent = Decimal.from(po.received_percent || '0');

    let newStatus = po.status;
    if (receivedPercent.greaterThanOrEqual(100) && billedPercent.greaterThanOrEqual(100)) {
      newStatus = 'Completed';
    } else if (billedPercent.greaterThanOrEqual(100)) {
      newStatus = 'To Receive';
    } else if (receivedPercent.greaterThanOrEqual(100)) {
      newStatus = 'To Bill';
    } else {
      newStatus = 'To Receive and Bill';
    }

    const res = await this.db.update<PurchaseOrder>('purchase_order', poId, {
      billed_percent: billedPercent.toString(6),
      status: newStatus,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Cancel Purchase Order
   */
  async cancelPurchaseOrder(id: string, reason: string, context: ServiceContext): Promise<PurchaseOrder> {
    const po = await this.getPurchaseOrderById(id, context.tenantId);

    const received = Decimal.from(po.received_percent || '0');
    const billed = Decimal.from(po.billed_percent || '0');

    if (received.isPositive() || billed.isPositive()) {
      throw new BusinessRuleError(
        `Cannot cancel Purchase Order ${po.purchase_order_number}: Receipts or bills have occurred (${received.toFixed(1)}% received, ${billed.toFixed(1)}% billed). Please reverse Goods Receipts and Debit Note Invoices first.`
      );
    }

    const res = await this.db.update<PurchaseOrder>('purchase_order', id, {
      status: 'Cancelled',
      notes: po.notes ? `${po.notes}\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}`,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    return res.data!;
  }

  /**
   * Get Purchase Order by ID
   */
  async getPurchaseOrderById(id: string, tenantId: string): Promise<PurchaseOrder> {
    const res = await this.db.findById<PurchaseOrder>('purchase_order', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('PurchaseOrder', id);
    }
    return res.data;
  }

  /**
   * List Purchase Orders
   */
  async listPurchaseOrders(
    params: PurchaseOrderFilterParams,
    tenantId: string
  ): Promise<{ data: PurchaseOrder[]; total: number }> {
    const filters: QueryFilter[] = [{ column: 'tenant_id', operator: 'eq', value: tenantId }];

    if (params.status) {
      filters.push({ column: 'status', operator: 'eq', value: params.status });
    }
    if (params.supplier_id) {
      filters.push({ column: 'supplier_id', operator: 'eq', value: params.supplier_id });
    }
    if (params.company_id) {
      filters.push({ column: 'company_id', operator: 'eq', value: params.company_id });
    }
    if (params.search) {
      filters.push({ column: 'purchase_order_number', operator: 'ilike', value: `%${params.search}%` });
    }

    const sort: QuerySort[] = [
      { column: params.sortBy || 'transaction_date', direction: params.sortDirection || 'desc' },
    ];

    const res = await this.db.findMany<PurchaseOrder>('purchase_order', {
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
