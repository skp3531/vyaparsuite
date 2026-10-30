import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { Decimal } from '@/lib/utils/decimal';
import { NotFoundError, BusinessRuleError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { StockLedgerService } from './stock-ledger-service';
import {
  stockReconciliationSchema,
  type StockReconciliation,
  type CreateStockReconciliationInput,
  type StockReconciliationItem,
} from '../schemas/stock-reconciliation.schema';

export interface StockReconciliationContext {
  tenantId: string;
  companyId: string;
  userId: string;
  roles: string[];
}

export class StockReconciliationService {
  private namingService: NamingSeriesService;
  private stockLedgerService: StockLedgerService;

  constructor(private db: IDatabaseAdapter) {
    this.namingService = new NamingSeriesService(db);
    this.stockLedgerService = new StockLedgerService(db);
  }

  /**
   * Creates a Stock Reconciliation in Draft status, automatically snapshotting
   * the current system book balances and computing count differences.
   */
  async create(
    input: CreateStockReconciliationInput,
    context: StockReconciliationContext
  ): Promise<StockReconciliation> {
    const validated = stockReconciliationSchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const recNumber =
      validated.reconciliation_number ||
      (await this.namingService.getNextNumber('SR-.YY.-.#####', {
        tenantId: context.tenantId,
        companyId: context.companyId,
        postingDate: validated.posting_date,
      }));

    const stockContext = {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    };

    const computedItems: Array<Record<string, unknown>> = [];

    for (const item of validated.items) {
      // Snapshot current system balance
      const balance = await this.stockLedgerService.getBalance(
        item.item_id,
        item.warehouse_id,
        stockContext
      );

      const currentQty = Decimal.from(balance.actual_qty || '0');
      const countedQty = Decimal.from(item.counted_qty);
      const qtyDifference = countedQty.subtract(currentQty);
      const currentRate = Decimal.from(balance.valuation_rate || '0');
      const newRate = item.new_valuation_rate ? Decimal.from(item.new_valuation_rate) : currentRate;

      computedItems.push({
        ...item,
        tenant_id: context.tenantId,
        current_qty: currentQty.toString(6),
        counted_qty: countedQty.toString(6),
        qty_difference: qtyDifference.toString(6),
        current_valuation_rate: currentRate.toString(6),
        new_valuation_rate: newRate.toString(6),
        created_by: context.userId,
        updated_by: context.userId,
      });
    }

    const recData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      reconciliation_number: recNumber,
      posting_date: validated.posting_date,
      purpose: validated.purpose,
      status: 'Draft',
      remarks: validated.remarks || null,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const created = await this.db.insert<StockReconciliation>('stock_reconciliation', recData);
    if (created.error || !created.data) {
      throw new Error(`Failed to create stock reconciliation: ${created.error?.message}`);
    }

    const recId = created.data.id!;
    const savedItems: StockReconciliationItem[] = [];

    for (const item of computedItems) {
      const itemRes = await this.db.insert<StockReconciliationItem>('stock_reconciliation_item', {
        ...item,
        reconciliation_id: recId,
      });
      if (itemRes.data) {
        savedItems.push(itemRes.data);
      }
    }

    logger.info('Stock Reconciliation created in Draft status', {
      recNumber,
      recId,
      lineCount: savedItems.length,
    });

    return {
      ...created.data,
      items: savedItems,
    };
  }

  /**
   * Submits a Stock Reconciliation:
   * Posts adjustment SLEs for variance quantities and adjusts warehouse stock balances to match physical counts.
   */
  async submit(id: string, context: StockReconciliationContext): Promise<StockReconciliation> {
    const rec = await this.getById(id, context);
    if (!rec) {
      throw new NotFoundError('Stock Reconciliation', id);
    }

    if (rec.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot submit Stock Reconciliation with status '${rec.status}'`);
    }

    const stockContext = {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    };

    for (const item of rec.items) {
      const diff = Decimal.from(item.qty_difference);
      const newRate = Decimal.from(item.new_valuation_rate || item.current_valuation_rate || '0');

      // Post adjustment to stock ledger if there is a quantity difference or rate change
      if (!diff.isZero() || !Decimal.from(item.current_valuation_rate).equals(newRate)) {
        await this.stockLedgerService.postEntry(
          {
            tenant_id: context.tenantId,
            company_id: context.companyId,
            item_id: item.item_id,
            warehouse_id: item.warehouse_id,
            posting_date: rec.posting_date,
            actual_qty: diff.toString(6),
            incoming_rate: newRate.toString(6),
            voucher_type: 'Stock Reconciliation',
            voucher_id: rec.id!,
            voucher_detail_id: item.id || null,
            batch_id: item.batch_id || null,
          },
          stockContext,
          { allowNegativeStock: true } // Audit reconciliation adjusts book to physical reality
        );
      }
    }

    const updated = await this.db.update<StockReconciliation>('stock_reconciliation', id, {
      status: 'Submitted',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Stock Reconciliation submitted and stock ledger adjusted to physical audit', {
      reconciliationNumber: rec.reconciliation_number,
      recId: rec.id,
      itemCount: rec.items.length,
    });

    return {
      ...rec,
      ...updated.data,
      status: 'Submitted',
    };
  }

  /**
   * Cancels a Stock Reconciliation:
   * Reverses adjustment SLE entries.
   */
  async cancel(id: string, reason: string, context: StockReconciliationContext): Promise<StockReconciliation> {
    const rec = await this.getById(id, context);
    if (!rec) {
      throw new NotFoundError('Stock Reconciliation', id);
    }

    if (rec.status !== 'Submitted') {
      throw new BusinessRuleError(`Cannot cancel Stock Reconciliation with status '${rec.status}'`);
    }

    const stockContext = {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    };

    for (const item of rec.items) {
      const diff = Decimal.from(item.qty_difference);

      if (!diff.isZero()) {
        await this.stockLedgerService.postEntry(
          {
            tenant_id: context.tenantId,
            company_id: context.companyId,
            item_id: item.item_id,
            warehouse_id: item.warehouse_id,
            posting_date: new Date().toISOString().split('T')[0],
            actual_qty: diff.negate().toString(6), // Reverse adjustment
            voucher_type: 'Stock Reconciliation',
            voucher_id: rec.id!,
            is_cancelled: true,
          },
          stockContext,
          { allowNegativeStock: true }
        );
      }
    }

    const updated = await this.db.update<StockReconciliation>('stock_reconciliation', id, {
      status: 'Cancelled',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Stock Reconciliation cancelled and adjustments reversed', {
      reconciliationNumber: rec.reconciliation_number,
      recId: rec.id,
      reason,
    });

    return {
      ...rec,
      ...updated.data,
      status: 'Cancelled',
    };
  }

  /**
   * Fetches Stock Reconciliation by ID with line items.
   */
  async getById(id: string, context: StockReconciliationContext): Promise<StockReconciliation | null> {
    const res = await this.db.findById<StockReconciliation>('stock_reconciliation', id, {
      tenantId: context.tenantId,
    });
    if (!res.data) return null;

    const itemsRes = await this.db.findMany<StockReconciliationItem>('stock_reconciliation_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'reconciliation_id', operator: 'eq', value: id },
      ],
      tenantId: context.tenantId,
    });

    return {
      ...res.data,
      items: itemsRes.data || [],
    };
  }

  /**
   * Lists Stock Reconciliations with pagination.
   */
  async list(
    options: { status?: string; page?: number; pageSize?: number } = {},
    context: StockReconciliationContext
  ): Promise<{ data: StockReconciliation[]; total: number }> {
    const filters = [{ column: 'tenant_id', operator: 'eq' as const, value: context.tenantId }];

    if (options.status) {
      filters.push({ column: 'status', operator: 'eq' as const, value: options.status });
    }

    const res = await this.db.findMany<StockReconciliation>('stock_reconciliation', {
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
