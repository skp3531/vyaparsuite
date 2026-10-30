import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { Decimal, sum } from '@/lib/utils/decimal';
import { NotFoundError, BusinessRuleError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { StockLedgerService } from './stock-ledger-service';
import {
  deliveryNoteSchema,
  type DeliveryNote,
  type CreateDeliveryNoteInput,
  type DeliveryNoteItem,
} from '../schemas/delivery-note.schema';
import type { SalesOrder, SalesOrderItem } from '@/modules/sales/schemas/order.schema';

export interface DeliveryNoteContext {
  tenantId: string;
  companyId: string;
  userId: string;
  roles: string[];
}

export class DeliveryNoteService {
  private namingService: NamingSeriesService;
  private stockLedgerService: StockLedgerService;

  constructor(private db: IDatabaseAdapter) {
    this.namingService = new NamingSeriesService(db);
    this.stockLedgerService = new StockLedgerService(db);
  }

  /**
   * Creates a Delivery Note in Draft status.
   */
  async create(input: CreateDeliveryNoteInput, context: DeliveryNoteContext): Promise<DeliveryNote> {
    const validated = deliveryNoteSchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const dnNumber =
      validated.delivery_note_number ||
      (await this.namingService.getNextNumber('DN-.YY.-.#####', {
        tenantId: context.tenantId,
        companyId: context.companyId,
        postingDate: validated.posting_date,
      }));

    // Calculate line amounts and grand total
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

    const dnData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      delivery_note_number: dnNumber,
      customer_id: validated.customer_id,
      customer_name: validated.customer_name || null,
      posting_date: validated.posting_date,
      posting_time: validated.posting_time || new Date().toISOString(),
      status: 'Draft',
      transporter_name: validated.transporter_name || null,
      vehicle_no: validated.vehicle_no || null,
      lr_no: validated.lr_no || null,
      lr_date: validated.lr_date || null,
      eway_bill_no: validated.eway_bill_no || null,
      eway_bill_validity: validated.eway_bill_validity || null,
      grand_total: grandTotal.toString(6),
      created_by: context.userId,
      updated_by: context.userId,
    };

    const created = await this.db.insert<DeliveryNote>('delivery_note', dnData);
    if (created.error || !created.data) {
      throw new Error(`Failed to create delivery note: ${created.error?.message}`);
    }

    const dnId = created.data.id!;
    const savedItems: DeliveryNoteItem[] = [];

    for (const item of computedItems) {
      const itemRes = await this.db.insert<DeliveryNoteItem>('delivery_note_item', {
        ...item,
        delivery_note_id: dnId,
      });
      if (itemRes.data) {
        savedItems.push(itemRes.data);
      }
    }

    logger.info('Delivery Note created in Draft status', {
      dnNumber,
      dnId,
      customer: validated.customer_id,
      grandTotal: grandTotal.toString(2),
    });

    return {
      ...created.data,
      items: savedItems,
    };
  }

  /**
   * Submits a Delivery Note:
   * 1. Issues physical stock from warehouse (posts negative StockLedgerEntry).
   * 2. Back-updates originating Sales Order delivered quantities and completion status.
   */
  async submit(id: string, context: DeliveryNoteContext): Promise<DeliveryNote> {
    const dn = await this.getById(id, context);
    if (!dn) {
      throw new NotFoundError('Delivery Note', id);
    }

    if (dn.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot submit Delivery Note with status '${dn.status}'`);
    }

    // 1. Post stock ledger entries for each line item (negative actual_qty)
    for (const item of dn.items) {
      const qty = Decimal.from(item.qty);

      await this.stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: item.item_id,
          warehouse_id: item.warehouse_id,
          posting_date: dn.posting_date,
          posting_time: dn.posting_time,
          actual_qty: qty.negate().toString(6),
          voucher_type: 'Delivery Note',
          voucher_id: dn.id!,
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

      // 2. If linked to a Sales Order Item, update delivered_qty
      if (item.sales_order_item_id && item.sales_order_id) {
        const soItemRes = await this.db.findById<SalesOrderItem>(
          'sales_order_item',
          item.sales_order_item_id,
          { tenantId: context.tenantId }
        );

        if (soItemRes.data) {
          const currentDelivered = Decimal.from(soItemRes.data.delivered_qty || '0');
          const updatedDelivered = currentDelivered.add(qty);

          await this.db.update('sales_order_item', item.sales_order_item_id, {
            delivered_qty: updatedDelivered.toString(6),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Update Sales Order fulfillment percentage if linked
    const salesOrderIds = Array.from(
      new Set(dn.items.map((i) => i.sales_order_id).filter(Boolean) as string[])
    );

    for (const soId of salesOrderIds) {
      await this.refreshSalesOrderFulfillment(soId, context);
    }

    // 4. Mark Delivery Note as Submitted
    const updated = await this.db.update<DeliveryNote>('delivery_note', id, {
      status: 'Submitted',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Delivery Note submitted and stock dispatched', {
      dnNumber: dn.delivery_note_number,
      dnId: dn.id,
      itemCount: dn.items.length,
    });

    return {
      ...dn,
      ...updated.data,
      status: 'Submitted',
    };
  }

  /**
   * Cancels a Delivery Note:
   * 1. Posts reversing stock entries (compensating positive SLEs).
   * 2. Deducts quantities from originating Sales Order delivered progress.
   */
  async cancel(id: string, reason: string, context: DeliveryNoteContext): Promise<DeliveryNote> {
    const dn = await this.getById(id, context);
    if (!dn) {
      throw new NotFoundError('Delivery Note', id);
    }

    if (dn.status !== 'Submitted') {
      throw new BusinessRuleError(`Cannot cancel Delivery Note with status '${dn.status}'`);
    }

    // 1. Post reversing stock ledger entries
    for (const item of dn.items) {
      const qty = Decimal.from(item.qty);

      await this.stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: item.item_id,
          warehouse_id: item.warehouse_id,
          posting_date: new Date().toISOString().split('T')[0],
          actual_qty: qty.toString(6), // Positive inward to reverse previous issue
          incoming_rate: item.rate,
          voucher_type: 'Delivery Note',
          voucher_id: dn.id!,
          voucher_detail_id: item.id || null,
          is_cancelled: true,
        },
        {
          tenantId: context.tenantId,
          companyId: context.companyId,
          userId: context.userId,
        }
      );

      // 2. Roll back Sales Order Item delivered_qty
      if (item.sales_order_item_id && item.sales_order_id) {
        const soItemRes = await this.db.findById<SalesOrderItem>(
          'sales_order_item',
          item.sales_order_item_id,
          { tenantId: context.tenantId }
        );

        if (soItemRes.data) {
          const currentDelivered = Decimal.from(soItemRes.data.delivered_qty || '0');
          const revertedDelivered = currentDelivered.subtract(qty);

          await this.db.update('sales_order_item', item.sales_order_item_id, {
            delivered_qty: (revertedDelivered.isNegative() ? Decimal.zero() : revertedDelivered).toString(6),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // 3. Refresh Sales Order fulfillment
    const salesOrderIds = Array.from(
      new Set(dn.items.map((i) => i.sales_order_id).filter(Boolean) as string[])
    );
    for (const soId of salesOrderIds) {
      await this.refreshSalesOrderFulfillment(soId, context);
    }

    // 4. Mark status Cancelled
    const updated = await this.db.update<DeliveryNote>('delivery_note', id, {
      status: 'Cancelled',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Delivery Note cancelled and stock reversed', {
      dnNumber: dn.delivery_note_number,
      dnId: dn.id,
      reason,
    });

    return {
      ...dn,
      ...updated.data,
      status: 'Cancelled',
    };
  }

  /**
   * Recalculates total delivered percentage on a linked Sales Order.
   */
  private async refreshSalesOrderFulfillment(salesOrderId: string, context: DeliveryNoteContext): Promise<void> {
    const itemsRes = await this.db.findMany<SalesOrderItem>('sales_order_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'sales_order_id', operator: 'eq', value: salesOrderId },
      ],
      tenantId: context.tenantId,
    });

    const items = itemsRes.data || [];
    if (items.length === 0) return;

    let totalOrdered = Decimal.zero();
    let totalDelivered = Decimal.zero();

    for (const itm of items) {
      totalOrdered = totalOrdered.add(Decimal.from(itm.qty));
      totalDelivered = totalDelivered.add(Decimal.from(itm.delivered_qty || '0'));
    }

    const deliveredPercent = totalOrdered.isZero()
      ? Decimal.from(100)
      : totalDelivered.multiply(100).divide(totalOrdered).round(2);

    // Fetch SO to check billing progress
    const soRes = await this.db.findById<SalesOrder>('sales_order', salesOrderId, {
      tenantId: context.tenantId,
    });

    let newStatus = soRes.data?.status || 'Approved';
    if (soRes.data) {
      const billedPercent = Decimal.from(soRes.data.billed_percent || '0');
      if (deliveredPercent.greaterThanOrEqual(Decimal.from(100)) && billedPercent.greaterThanOrEqual(Decimal.from(100))) {
        newStatus = 'Completed';
      }
    }

    await this.db.update('sales_order', salesOrderId, {
      delivered_percent: deliveredPercent.toString(2),
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Fetches Delivery Note by ID including item lines.
   */
  async getById(id: string, context: DeliveryNoteContext): Promise<DeliveryNote | null> {
    const res = await this.db.findById<DeliveryNote>('delivery_note', id, {
      tenantId: context.tenantId,
    });
    if (!res.data) return null;

    const itemsRes = await this.db.findMany<DeliveryNoteItem>('delivery_note_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'delivery_note_id', operator: 'eq', value: id },
      ],
      tenantId: context.tenantId,
    });

    return {
      ...res.data,
      items: itemsRes.data || [],
    };
  }

  /**
   * Lists Delivery Notes with pagination and filters.
   */
  async list(
    options: { customerId?: string; status?: string; page?: number; pageSize?: number } = {},
    context: DeliveryNoteContext
  ): Promise<{ data: DeliveryNote[]; total: number }> {
    const filters = [{ column: 'tenant_id', operator: 'eq' as const, value: context.tenantId }];

    if (options.customerId) {
      filters.push({ column: 'customer_id', operator: 'eq' as const, value: options.customerId });
    }
    if (options.status) {
      filters.push({ column: 'status', operator: 'eq' as const, value: options.status });
    }

    const res = await this.db.findMany<DeliveryNote>('delivery_note', {
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
