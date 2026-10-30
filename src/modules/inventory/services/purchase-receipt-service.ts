import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { Decimal } from '@/lib/utils/decimal';
import { NotFoundError, BusinessRuleError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { StockLedgerService } from './stock-ledger-service';
import {
  purchaseReceiptSchema,
  type PurchaseReceipt,
  type CreatePurchaseReceiptInput,
  type PurchaseReceiptItem,
} from '../schemas/purchase-receipt.schema';
import type { PurchaseOrder, PurchaseOrderItem } from '@/modules/purchase/schemas/purchase-order.schema';

export interface PurchaseReceiptContext {
  tenantId: string;
  companyId: string;
  userId: string;
  roles: string[];
}

export class PurchaseReceiptService {
  private namingService: NamingSeriesService;
  private stockLedgerService: StockLedgerService;

  constructor(private db: IDatabaseAdapter) {
    this.namingService = new NamingSeriesService(db);
    this.stockLedgerService = new StockLedgerService(db);
  }

  /**
   * Creates a Goods Receipt Note (Purchase Receipt) in Draft status.
   */
  async create(input: CreatePurchaseReceiptInput, context: PurchaseReceiptContext): Promise<PurchaseReceipt> {
    const validated = purchaseReceiptSchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const receiptNumber =
      validated.receipt_number ||
      (await this.namingService.getNextNumber('PR-.YY.-.#####', {
        tenantId: context.tenantId,
        companyId: context.companyId,
        postingDate: validated.posting_date,
      }));

    let grandTotal = Decimal.zero();
    const computedItems: Array<Record<string, unknown>> = [];

    for (const item of validated.items) {
      const qty = Decimal.from(item.qty);
      const rate = Decimal.from(item.rate || '0');
      const amount = qty.multiply(rate).round(2);
      grandTotal = grandTotal.add(amount);

      computedItems.push({
        ...item,
        tenant_id: context.tenantId,
        qty: qty.toString(6),
        rate: rate.toString(6),
        amount: amount.toString(6),
        created_by: context.userId,
        updated_by: context.userId,
      });
    }

    const prData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      receipt_number: receiptNumber,
      supplier_id: validated.supplier_id,
      supplier_name: validated.supplier_name || null,
      posting_date: validated.posting_date,
      posting_time: validated.posting_time || new Date().toISOString(),
      status: 'Draft',
      supplier_delivery_note: validated.supplier_delivery_note || null,
      grand_total: grandTotal.toString(6),
      created_by: context.userId,
      updated_by: context.userId,
    };

    const created = await this.db.insert<PurchaseReceipt>('purchase_receipt', prData);
    if (created.error || !created.data) {
      throw new Error(`Failed to create purchase receipt: ${created.error?.message}`);
    }

    const prId = created.data.id!;
    const savedItems: PurchaseReceiptItem[] = [];

    for (const item of computedItems) {
      const itemRes = await this.db.insert<PurchaseReceiptItem>('purchase_receipt_item', {
        ...item,
        purchase_receipt_id: prId,
      });
      if (itemRes.data) {
        savedItems.push(itemRes.data);
      }
    }

    logger.info('Purchase Receipt (GRN) created in Draft status', {
      receiptNumber,
      prId,
      supplier: validated.supplier_id,
      grandTotal: grandTotal.toString(2),
    });

    return {
      ...created.data,
      items: savedItems,
    };
  }

  /**
   * Submits a Purchase Receipt:
   * 1. Posts positive inward stock entries to stock_ledger_entry.
   * 2. Recalculates Moving Average valuation rate.
   * 3. Back-updates originating Purchase Order received quantities.
   */
  async submit(id: string, context: PurchaseReceiptContext): Promise<PurchaseReceipt> {
    const pr = await this.getById(id, context);
    if (!pr) {
      throw new NotFoundError('Purchase Receipt', id);
    }

    if (pr.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot submit Purchase Receipt with status '${pr.status}'`);
    }

    // 1. Post stock ledger entries for each accepted line item
    for (const item of pr.items) {
      const qty = Decimal.from(item.qty);
      if (qty.isZero()) continue;

      await this.stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: item.item_id,
          warehouse_id: item.warehouse_id,
          posting_date: pr.posting_date,
          posting_time: pr.posting_time,
          actual_qty: qty.toString(6), // Positive inward
          incoming_rate: item.rate,
          voucher_type: 'Purchase Receipt',
          voucher_id: pr.id!,
          voucher_detail_id: item.id || null,
          batch_id: item.batch_id || null,
          serial_no: item.serial_nos || null,
        },
        {
          tenantId: context.tenantId,
          companyId: context.companyId,
          userId: context.userId,
        }
      );

      // 2. If linked to Purchase Order, update received_qty
      if (item.purchase_order_item_id && item.purchase_order_id) {
        const poItemRes = await this.db.findById<PurchaseOrderItem>(
          'purchase_order_item',
          item.purchase_order_item_id,
          { tenantId: context.tenantId }
        );

        if (poItemRes.data) {
          const currentReceived = Decimal.from(poItemRes.data.received_qty || '0');
          const updatedReceived = currentReceived.add(qty);

          await this.db.update('purchase_order_item', item.purchase_order_item_id, {
            received_qty: updatedReceived.toString(6),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Update Purchase Order fulfillment percentage if linked
    const purchaseOrderIds = Array.from(
      new Set(pr.items.map((i) => i.purchase_order_id).filter(Boolean) as string[])
    );

    for (const poId of purchaseOrderIds) {
      await this.refreshPurchaseOrderFulfillment(poId, context);
    }

    // 4. Mark Purchase Receipt as Submitted
    const updated = await this.db.update<PurchaseReceipt>('purchase_receipt', id, {
      status: 'Submitted',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Purchase Receipt submitted and stock received into warehouse', {
      receiptNumber: pr.receipt_number,
      prId: pr.id,
      itemCount: pr.items.length,
    });

    return {
      ...pr,
      ...updated.data,
      status: 'Submitted',
    };
  }

  /**
   * Cancels a Purchase Receipt:
   * 1. Posts compensating reversing stock entries (negative SLE with is_cancelled = true).
   * 2. Reduces received quantities on originating Purchase Order.
   */
  async cancel(id: string, reason: string, context: PurchaseReceiptContext): Promise<PurchaseReceipt> {
    const pr = await this.getById(id, context);
    if (!pr) {
      throw new NotFoundError('Purchase Receipt', id);
    }

    if (pr.status !== 'Submitted') {
      throw new BusinessRuleError(`Cannot cancel Purchase Receipt with status '${pr.status}'`);
    }

    // 1. Post reversing negative stock ledger entries
    for (const item of pr.items) {
      const qty = Decimal.from(item.qty);
      if (qty.isZero()) continue;

      await this.stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: item.item_id,
          warehouse_id: item.warehouse_id,
          posting_date: new Date().toISOString().split('T')[0],
          actual_qty: qty.negate().toString(6), // Negative outward to reverse
          voucher_type: 'Purchase Receipt',
          voucher_id: pr.id!,
          voucher_detail_id: item.id || null,
          is_cancelled: true,
        },
        {
          tenantId: context.tenantId,
          companyId: context.companyId,
          userId: context.userId,
        }
      );

      // 2. Roll back Purchase Order received_qty
      if (item.purchase_order_item_id && item.purchase_order_id) {
        const poItemRes = await this.db.findById<PurchaseOrderItem>(
          'purchase_order_item',
          item.purchase_order_item_id,
          { tenantId: context.tenantId }
        );

        if (poItemRes.data) {
          const currentReceived = Decimal.from(poItemRes.data.received_qty || '0');
          const revertedReceived = currentReceived.subtract(qty);

          await this.db.update('purchase_order_item', item.purchase_order_item_id, {
            received_qty: (revertedReceived.isNegative() ? Decimal.zero() : revertedReceived).toString(6),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Refresh Purchase Order fulfillment
    const purchaseOrderIds = Array.from(
      new Set(pr.items.map((i) => i.purchase_order_id).filter(Boolean) as string[])
    );
    for (const poId of purchaseOrderIds) {
      await this.refreshPurchaseOrderFulfillment(poId, context);
    }

    // 4. Mark status Cancelled
    const updated = await this.db.update<PurchaseReceipt>('purchase_receipt', id, {
      status: 'Cancelled',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Purchase Receipt cancelled and inward stock reversed', {
      receiptNumber: pr.receipt_number,
      prId: pr.id,
      reason,
    });

    return {
      ...pr,
      ...updated.data,
      status: 'Cancelled',
    };
  }

  /**
   * Recalculates total received percentage on a linked Purchase Order.
   */
  private async refreshPurchaseOrderFulfillment(purchaseOrderId: string, context: PurchaseReceiptContext): Promise<void> {
    const itemsRes = await this.db.findMany<PurchaseOrderItem>('purchase_order_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'purchase_order_id', operator: 'eq', value: purchaseOrderId },
      ],
      tenantId: context.tenantId,
    });

    const items = itemsRes.data || [];
    if (items.length === 0) return;

    let totalOrdered = Decimal.zero();
    let totalReceived = Decimal.zero();

    for (const itm of items) {
      totalOrdered = totalOrdered.add(Decimal.from(itm.qty));
      totalReceived = totalReceived.add(Decimal.from(itm.received_qty || '0'));
    }

    const receivedPercent = totalOrdered.isZero()
      ? Decimal.from(100)
      : totalReceived.multiply(100).divide(totalOrdered).round(2);

    const poRes = await this.db.findById<PurchaseOrder>('purchase_order', purchaseOrderId, {
      tenantId: context.tenantId,
    });

    let newStatus = poRes.data?.status || 'Approved';
    if (poRes.data) {
      const billedPercent = Decimal.from(poRes.data.billed_percent || '0');
      if (receivedPercent.greaterThanOrEqual(Decimal.from(100)) && billedPercent.greaterThanOrEqual(Decimal.from(100))) {
        newStatus = 'Completed';
      }
    }

    await this.db.update('purchase_order', purchaseOrderId, {
      received_percent: receivedPercent.toString(2),
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Fetches Purchase Receipt by ID including item lines.
   */
  async getById(id: string, context: PurchaseReceiptContext): Promise<PurchaseReceipt | null> {
    const res = await this.db.findById<PurchaseReceipt>('purchase_receipt', id, {
      tenantId: context.tenantId,
    });
    if (!res.data) return null;

    const itemsRes = await this.db.findMany<PurchaseReceiptItem>('purchase_receipt_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'purchase_receipt_id', operator: 'eq', value: id },
      ],
      tenantId: context.tenantId,
    });

    return {
      ...res.data,
      items: itemsRes.data || [],
    };
  }

  /**
   * Lists Purchase Receipts with pagination and filters.
   */
  async list(
    options: { supplierId?: string; status?: string; page?: number; pageSize?: number } = {},
    context: PurchaseReceiptContext
  ): Promise<{ data: PurchaseReceipt[]; total: number }> {
    const filters = [{ column: 'tenant_id', operator: 'eq' as const, value: context.tenantId }];

    if (options.supplierId) {
      filters.push({ column: 'supplier_id', operator: 'eq' as const, value: options.supplierId });
    }
    if (options.status) {
      filters.push({ column: 'status', operator: 'eq' as const, value: options.status });
    }

    const res = await this.db.findMany<PurchaseReceipt>('purchase_receipt', {
      filters,
      sort: [{ column: 'posting_date', direction: 'desc' }],
      pagination: {
        page: options.page || 1,
        pageSize: options.pageSize || 25,
      },
      tenantId: context.tenantId,
    });

    return {
      data: res.data || [],
      total: res.count || 0,
    };
  }
}
