import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { Decimal } from '@/lib/utils/decimal';
import { NotFoundError, BusinessRuleError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { StockLedgerService } from './stock-ledger-service';
import {
  stockTransferSchema,
  type StockTransfer,
  type CreateStockTransferInput,
  type StockTransferItem,
} from '../schemas/stock-transfer.schema';

export interface StockTransferContext {
  tenantId: string;
  companyId: string;
  userId: string;
  roles: string[];
}

export class StockTransferService {
  private namingService: NamingSeriesService;
  private stockLedgerService: StockLedgerService;

  constructor(private db: IDatabaseAdapter) {
    this.namingService = new NamingSeriesService(db);
    this.stockLedgerService = new StockLedgerService(db);
  }

  /**
   * Creates an internal warehouse Stock Transfer in Draft status.
   */
  async create(input: CreateStockTransferInput, context: StockTransferContext): Promise<StockTransfer> {
    const validated = stockTransferSchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const transferNumber =
      validated.transfer_number ||
      (await this.namingService.getNextNumber('ST-.YY.-.#####', {
        tenantId: context.tenantId,
        companyId: context.companyId,
        postingDate: validated.posting_date,
      }));

    const transferData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      transfer_number: transferNumber,
      posting_date: validated.posting_date,
      from_warehouse_id: validated.from_warehouse_id,
      from_warehouse_name: validated.from_warehouse_name || null,
      to_warehouse_id: validated.to_warehouse_id,
      to_warehouse_name: validated.to_warehouse_name || null,
      purpose: validated.purpose,
      status: 'Draft',
      remarks: validated.remarks || null,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const created = await this.db.insert<StockTransfer>('stock_transfer', transferData);
    if (created.error || !created.data) {
      throw new Error(`Failed to create stock transfer: ${created.error?.message}`);
    }

    const stId = created.data.id!;
    const savedItems: StockTransferItem[] = [];

    for (const item of validated.items) {
      const itemRes = await this.db.insert<StockTransferItem>('stock_transfer_item', {
        ...item,
        tenant_id: context.tenantId,
        stock_transfer_id: stId,
        created_by: context.userId,
        updated_by: context.userId,
      });
      if (itemRes.data) {
        savedItems.push(itemRes.data);
      }
    }

    logger.info('Stock Transfer created in Draft status', {
      transferNumber,
      stId,
      from: validated.from_warehouse_id,
      to: validated.to_warehouse_id,
    });

    return {
      ...created.data,
      items: savedItems,
    };
  }

  /**
   * Submits a Stock Transfer:
   * 1. Issues stock from source warehouse (negative SLE).
   * 2. Inwards stock to target warehouse (positive SLE at origin valuation rate).
   */
  async submit(id: string, context: StockTransferContext): Promise<StockTransfer> {
    const st = await this.getById(id, context);
    if (!st) {
      throw new NotFoundError('Stock Transfer', id);
    }

    if (st.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot submit Stock Transfer with status '${st.status}'`);
    }

    const stockContext = {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    };

    for (const item of st.items) {
      const qty = Decimal.from(item.qty);

      // Check current valuation rate in source warehouse
      const fromBalance = await this.stockLedgerService.getBalance(
        item.item_id,
        st.from_warehouse_id,
        stockContext
      );

      const transferRate = fromBalance.valuation_rate || '0.000000';

      // 1. Outward entry from source warehouse
      await this.stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: item.item_id,
          warehouse_id: st.from_warehouse_id,
          posting_date: st.posting_date,
          actual_qty: qty.negate().toString(6),
          incoming_rate: transferRate,
          voucher_type: 'Stock Transfer',
          voucher_id: st.id!,
          voucher_detail_id: item.id || null,
          batch_id: item.batch_id || null,
        },
        stockContext
      );

      // 2. Inward entry to destination warehouse
      await this.stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: item.item_id,
          warehouse_id: st.to_warehouse_id,
          posting_date: st.posting_date,
          actual_qty: qty.toString(6),
          incoming_rate: transferRate,
          voucher_type: 'Stock Transfer',
          voucher_id: st.id!,
          voucher_detail_id: item.id || null,
          batch_id: item.batch_id || null,
        },
        stockContext
      );
    }

    const updated = await this.db.update<StockTransfer>('stock_transfer', id, {
      status: 'Submitted',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Stock Transfer submitted and stock relocated between warehouses', {
      transferNumber: st.transfer_number,
      stId: st.id,
      fromWarehouse: st.from_warehouse_id,
      toWarehouse: st.to_warehouse_id,
    });

    return {
      ...st,
      ...updated.data,
      status: 'Submitted',
    };
  }

  /**
   * Cancels a Stock Transfer:
   * Reverses both the source outward and destination inward entries.
   */
  async cancel(id: string, reason: string, context: StockTransferContext): Promise<StockTransfer> {
    const st = await this.getById(id, context);
    if (!st) {
      throw new NotFoundError('Stock Transfer', id);
    }

    if (st.status !== 'Submitted') {
      throw new BusinessRuleError(`Cannot cancel Stock Transfer with status '${st.status}'`);
    }

    const stockContext = {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    };

    for (const item of st.items) {
      const qty = Decimal.from(item.qty);

      // Re-inward to source
      await this.stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: item.item_id,
          warehouse_id: st.from_warehouse_id,
          posting_date: new Date().toISOString().split('T')[0],
          actual_qty: qty.toString(6),
          voucher_type: 'Stock Transfer',
          voucher_id: st.id!,
          is_cancelled: true,
        },
        stockContext
      );

      // Re-issue from target
      await this.stockLedgerService.postEntry(
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          item_id: item.item_id,
          warehouse_id: st.to_warehouse_id,
          posting_date: new Date().toISOString().split('T')[0],
          actual_qty: qty.negate().toString(6),
          voucher_type: 'Stock Transfer',
          voucher_id: st.id!,
          is_cancelled: true,
        },
        stockContext
      );
    }

    const updated = await this.db.update<StockTransfer>('stock_transfer', id, {
      status: 'Cancelled',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Stock Transfer cancelled and movements reversed', {
      transferNumber: st.transfer_number,
      stId: st.id,
      reason,
    });

    return {
      ...st,
      ...updated.data,
      status: 'Cancelled',
    };
  }

  /**
   * Fetches Stock Transfer by ID.
   */
  async getById(id: string, context: StockTransferContext): Promise<StockTransfer | null> {
    const res = await this.db.findById<StockTransfer>('stock_transfer', id, {
      tenantId: context.tenantId,
    });
    if (!res.data) return null;

    const itemsRes = await this.db.findMany<StockTransferItem>('stock_transfer_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'stock_transfer_id', operator: 'eq', value: id },
      ],
      tenantId: context.tenantId,
    });

    return {
      ...res.data,
      items: itemsRes.data || [],
    };
  }

  /**
   * Lists Stock Transfers with pagination.
   */
  async list(
    options: { status?: string; page?: number; pageSize?: number } = {},
    context: StockTransferContext
  ): Promise<{ data: StockTransfer[]; total: number }> {
    const filters = [{ column: 'tenant_id', operator: 'eq' as const, value: context.tenantId }];

    if (options.status) {
      filters.push({ column: 'status', operator: 'eq' as const, value: options.status });
    }

    const res = await this.db.findMany<StockTransfer>('stock_transfer', {
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
