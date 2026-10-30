import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { Decimal } from '@/lib/utils/decimal';
import { InsufficientStockError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { ValuationService } from './valuation-service';
import {
  stockLedgerEntrySchema,
  type StockLedgerEntry,
  type CreateStockLedgerEntryInput,
  type StockBalance,
} from '../schemas/stock-ledger.schema';

export interface StockContext {
  tenantId: string;
  companyId: string;
  userId: string;
}

export interface PostStockEntryOptions {
  allowNegativeStock?: boolean;
}

export class StockLedgerService {
  constructor(private db: IDatabaseAdapter) {}

  /**
   * Posts an append-only transaction entry to the immutable stock ledger.
   * Updates real-time stock balances and enforces negative-stock prevention rules.
   */
  async postEntry(
    input: CreateStockLedgerEntryInput,
    context: StockContext,
    options: PostStockEntryOptions = {}
  ): Promise<StockLedgerEntry> {
    const validated = stockLedgerEntrySchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const deltaQty = Decimal.from(validated.actual_qty);
    const incomingRate = Decimal.from(validated.incoming_rate);

    // 1. Fetch current stock balance (Bin)
    const currentBalance = await this.getOrCreateStockBalance(
      validated.item_id,
      validated.warehouse_id,
      context
    );

    const currentQty = Decimal.from(currentBalance.actual_qty);
    const currentValuationRate = Decimal.from(currentBalance.valuation_rate);

    // 2. Negative Stock Prevention Guard
    if (deltaQty.isNegative() && !options.allowNegativeStock) {
      const requiredQty = deltaQty.abs();
      if (currentQty.lessThan(requiredQty)) {
        logger.warn('Stock issue blocked by negative stock prevention guard', {
          itemId: validated.item_id,
          warehouseId: validated.warehouse_id,
          available: currentQty.toString(2),
          requested: requiredQty.toString(2),
        });
        throw new InsufficientStockError(
          validated.item_id,
          validated.warehouse_id,
          requiredQty.toString(2),
          currentQty.toString(2)
        );
      }
    }

    // 3. Valuation & Balance Calculation
    let newQty: Decimal;
    let newValuationRate: Decimal;
    let newStockValue: Decimal;
    let valueDifference: Decimal;

    if (deltaQty.isPositive()) {
      // Inward movement (Receipt, Inward Transfer, Adjustment +)
      const res = ValuationService.calculateMovingAverageInward(
        currentQty,
        currentValuationRate,
        deltaQty,
        incomingRate
      );
      newQty = res.newQty;
      newValuationRate = res.newValuationRate;
      newStockValue = res.newStockValue;
      valueDifference = res.valueDifference;
    } else if (deltaQty.isNegative()) {
      // Outward movement (Delivery, Outward Transfer, Issue -)
      const res = ValuationService.calculateMovingAverageOutward(
        currentQty,
        currentValuationRate,
        deltaQty.abs()
      );
      newQty = res.newQty;
      newValuationRate = res.newValuationRate;
      newStockValue = res.newStockValue;
      valueDifference = res.valueDifference;
    } else {
      // Zero qty (Rate revaluation or reconciliation)
      newQty = currentQty;
      newValuationRate = incomingRate.isPositive() ? incomingRate : currentValuationRate;
      newStockValue = newQty.multiply(newValuationRate).round(2);
      valueDifference = newStockValue.subtract(Decimal.from(currentBalance.stock_value));
    }

    // 4. Construct Immutable Ledger Entry Record
    const sleData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      item_id: validated.item_id,
      warehouse_id: validated.warehouse_id,
      posting_date: validated.posting_date,
      posting_time: validated.posting_time || new Date().toISOString(),
      actual_qty: deltaQty.toString(6),
      qty_after_transaction: newQty.toString(6),
      incoming_rate: incomingRate.toString(6),
      valuation_rate: newValuationRate.toString(6),
      stock_value: newStockValue.toString(6),
      stock_value_difference: valueDifference.toString(6),
      voucher_type: validated.voucher_type,
      voucher_id: validated.voucher_id,
      voucher_detail_id: validated.voucher_detail_id || null,
      batch_id: validated.batch_id || null,
      serial_no: validated.serial_no || null,
      is_cancelled: validated.is_cancelled,
      fiscal_year_id: validated.fiscal_year_id || null,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const insertResult = await this.db.insert<StockLedgerEntry>('stock_ledger_entry', sleData);
    if (insertResult.error || !insertResult.data) {
      throw new Error(`Failed to insert stock ledger entry: ${insertResult.error?.message}`);
    }

    // 5. Update cached Stock Balance (Bin)
    const newProjectedQty = newQty.subtract(Decimal.from(currentBalance.reserved_qty));
    await this.db.update('stock_balance', currentBalance.id!, {
      actual_qty: newQty.toString(6),
      valuation_rate: newValuationRate.toString(6),
      stock_value: newStockValue.toString(6),
      projected_qty: newProjectedQty.toString(6),
      updated_at: new Date().toISOString(),
    });

    logger.info('Stock ledger entry posted successfully', {
      sleId: insertResult.data.id,
      voucherType: validated.voucher_type,
      voucherId: validated.voucher_id,
      itemId: validated.item_id,
      warehouseId: validated.warehouse_id,
      qtyDelta: deltaQty.toString(2),
      balanceAfter: newQty.toString(2),
      valuationRate: newValuationRate.toString(2),
    });

    return insertResult.data;
  }

  /**
   * Retrieves or creates a cached stock balance record for an item in a warehouse.
   */
  async getOrCreateStockBalance(
    itemId: string,
    warehouseId: string,
    context: StockContext
  ): Promise<StockBalance> {
    const existing = await this.db.findOne<StockBalance>(
      'stock_balance',
      [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'item_id', operator: 'eq', value: itemId },
        { column: 'warehouse_id', operator: 'eq', value: warehouseId },
      ],
      { tenantId: context.tenantId }
    );

    if (existing.data) {
      return existing.data;
    }

    // Initialize new Bin
    const initData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      item_id: itemId,
      warehouse_id: warehouseId,
      actual_qty: '0.000000',
      reserved_qty: '0.000000',
      ordered_qty: '0.000000',
      indented_qty: '0.000000',
      projected_qty: '0.000000',
      valuation_rate: '0.000000',
      stock_value: '0.000000',
    };

    const created = await this.db.insert<StockBalance>('stock_balance', initData);
    if (created.error || !created.data) {
      throw new Error(`Failed to initialize stock balance: ${created.error?.message}`);
    }

    return created.data;
  }

  /**
   * Retrieves current stock balance for item and warehouse.
   */
  async getBalance(
    itemId: string,
    warehouseId: string,
    context: StockContext
  ): Promise<StockBalance> {
    return this.getOrCreateStockBalance(itemId, warehouseId, context);
  }

  /**
   * Lists stock balances across warehouses with filtering.
   */
  async listBalances(
    options: { warehouseId?: string; itemId?: string; page?: number; pageSize?: number } = {},
    context: StockContext
  ): Promise<{ data: StockBalance[]; total: number }> {
    const filters = [{ column: 'tenant_id', operator: 'eq' as const, value: context.tenantId }];

    if (options.warehouseId) {
      filters.push({ column: 'warehouse_id', operator: 'eq' as const, value: options.warehouseId });
    }
    if (options.itemId) {
      filters.push({ column: 'item_id', operator: 'eq' as const, value: options.itemId });
    }

    const result = await this.db.findMany<StockBalance>('stock_balance', {
      filters,
      pagination: {
        page: options.page || 1,
        pageSize: options.pageSize || 50,
      },
      tenantId: context.tenantId,
    });

    return {
      data: result.data || [],
      total: result.count || 0,
    };
  }

  /**
   * Lists historical audit entries from the immutable stock ledger.
   */
  async getLedgerEntries(
    options: {
      itemId?: string;
      warehouseId?: string;
      voucherType?: string;
      voucherId?: string;
      page?: number;
      pageSize?: number;
    } = {},
    context: StockContext
  ): Promise<{ data: StockLedgerEntry[]; total: number }> {
    const filters = [{ column: 'tenant_id', operator: 'eq' as const, value: context.tenantId }];

    if (options.itemId) {
      filters.push({ column: 'item_id', operator: 'eq' as const, value: options.itemId });
    }
    if (options.warehouseId) {
      filters.push({ column: 'warehouse_id', operator: 'eq' as const, value: options.warehouseId });
    }
    if (options.voucherType) {
      filters.push({ column: 'voucher_type', operator: 'eq' as const, value: options.voucherType });
    }
    if (options.voucherId) {
      filters.push({ column: 'voucher_id', operator: 'eq' as const, value: options.voucherId });
    }

    const result = await this.db.findMany<StockLedgerEntry>('stock_ledger_entry', {
      filters,
      sort: [{ column: 'posting_time', direction: 'desc' }],
      pagination: {
        page: options.page || 1,
        pageSize: options.pageSize || 50,
      },
      tenantId: context.tenantId,
    });

    return {
      data: result.data || [],
      total: result.count || 0,
    };
  }
}
