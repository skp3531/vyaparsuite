import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { Decimal, sum } from '@/lib/utils/decimal';
import { UnbalancedEntryError, BusinessRuleError, NotFoundError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  glEntrySchema,
  type GLEntry,
  type CreateGLEntryInput,
  type GLFilterParams,
} from '../schemas/gl-entry.schema';

export interface AccountingContext {
  tenantId: string;
  companyId: string;
  userId: string;
}

export class GeneralLedgerService {
  constructor(private db: IDatabaseAdapter) {}

  /**
   * Posts a set of General Ledger entries for a voucher.
   * STRICT DOUBLE-ENTRY ENFORCEMENT:
   * Total Debits MUST EXACTLY equal Total Credits, down to 6 decimal places.
   */
  async postEntries(
    entries: CreateGLEntryInput[],
    context: AccountingContext
  ): Promise<GLEntry[]> {
    if (entries.length === 0) {
      throw new BusinessRuleError('Cannot post empty General Ledger transaction');
    }

    // 1. Validate each line with Zod
    const validatedEntries = entries.map((e) =>
      glEntrySchema.parse({
        ...e,
        tenant_id: context.tenantId,
        company_id: context.companyId,
      })
    );

    // 2. Double-Entry Invariant Verification: Debit == Credit
    let totalDebit = Decimal.zero();
    let totalCredit = Decimal.zero();

    for (const entry of validatedEntries) {
      totalDebit = totalDebit.add(Decimal.from(entry.debit));
      totalCredit = totalCredit.add(Decimal.from(entry.credit));
    }

    if (!totalDebit.equals(totalCredit)) {
      logger.error('Unbalanced General Ledger voucher rejected', undefined, {
        voucherType: validatedEntries[0]?.voucher_type,
        voucherNumber: validatedEntries[0]?.voucher_number,
        totalDebit: totalDebit.toString(2),
        totalCredit: totalCredit.toString(2),
      });
      throw new UnbalancedEntryError(totalDebit.toString(2), totalCredit.toString(2));
    }

    // 3. Post append-only immutable rows to gl_entry
    const savedEntries: GLEntry[] = [];

    for (const entry of validatedEntries) {
      const glData: Record<string, unknown> = {
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: entry.posting_date,
        posting_time: entry.posting_time || new Date().toISOString(),
        account_id: entry.account_id,
        party_type: entry.party_type || null,
        party_id: entry.party_id || null,
        cost_centre_id: entry.cost_centre_id || null,
        profit_centre_id: entry.profit_centre_id || null,
        debit: Decimal.from(entry.debit).toString(6),
        credit: Decimal.from(entry.credit).toString(6),
        account_currency: entry.account_currency || 'INR',
        debit_in_account_currency: Decimal.from(entry.debit).toString(6),
        credit_in_account_currency: Decimal.from(entry.credit).toString(6),
        voucher_type: entry.voucher_type,
        voucher_id: entry.voucher_id,
        voucher_number: entry.voucher_number,
        fiscal_year_id: entry.fiscal_year_id || null,
        is_cancelled: entry.is_cancelled || false,
        remarks: entry.remarks || null,
        created_by: context.userId,
        updated_by: context.userId,
      };

      const result = await this.db.insert<GLEntry>('gl_entry', glData);
      if (result.error || !result.data) {
        throw new Error(`Failed to post GL entry: ${result.error?.message}`);
      }
      savedEntries.push(result.data);
    }

    logger.info('General Ledger transaction posted successfully', {
      voucherType: validatedEntries[0].voucher_type,
      voucherNumber: validatedEntries[0].voucher_number,
      linesCount: savedEntries.length,
      balancedSum: totalDebit.toString(2),
    });

    return savedEntries;
  }

  /**
   * Retrieves all GL entries associated with a voucher.
   */
  async getVoucherEntries(
    voucherId: string,
    voucherType: string,
    tenantId: string
  ): Promise<GLEntry[]> {
    const res = await this.db.findMany<GLEntry>('gl_entry', {
      tenantId,
      filters: [
        { column: 'voucher_id', operator: 'eq', value: voucherId },
        { column: 'voucher_type', operator: 'eq', value: voucherType },
      ],
      sort: [{ column: 'created_at', direction: 'asc' }],
    });

    return res.data || [];
  }

  /**
   * Reverses General Ledger entries for a cancelled voucher by posting
   * compensating entries with debits and credits inverted.
   */
  async reverseEntries(
    voucherId: string,
    voucherType: any,
    cancellationReason: string,
    context: AccountingContext
  ): Promise<GLEntry[]> {
    const existing = await this.getVoucherEntries(voucherId, voucherType, context.tenantId);
    const activeEntries = existing.filter((e) => !e.is_cancelled);

    if (activeEntries.length === 0) {
      return [];
    }

    const reversingEntries: CreateGLEntryInput[] = activeEntries.map((e) => ({
      tenant_id: context.tenantId,
      company_id: context.companyId,
      posting_date: new Date().toISOString().slice(0, 10),
      account_id: e.account_id,
      party_type: e.party_type as any,
      party_id: e.party_id,
      cost_centre_id: e.cost_centre_id,
      profit_centre_id: e.profit_centre_id,
      debit: e.credit, // SWAP
      credit: e.debit, // SWAP
      account_currency: e.account_currency,
      voucher_type: e.voucher_type as any,
      voucher_id: e.voucher_id,
      voucher_number: e.voucher_number,
      is_cancelled: true,
      remarks: `Reversal of ${e.voucher_number}: ${cancellationReason}`,
    }));

    return this.postEntries(reversingEntries, context);
  }

  /**
   * Retrieves GL entries with filtering.
   */
  async getEntries(
    filters: GLFilterParams,
    context: AccountingContext
  ): Promise<{ data: GLEntry[]; total: number }> {
    const queryFilters: Array<{ column: string; operator: any; value: any }> = [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'company_id', operator: 'eq', value: context.companyId },
    ];

    if (filters.account_id) {
      queryFilters.push({ column: 'account_id', operator: 'eq', value: filters.account_id });
    }
    if (filters.party_id) {
      queryFilters.push({ column: 'party_id', operator: 'eq', value: filters.party_id });
    }
    if (filters.voucher_type) {
      queryFilters.push({ column: 'voucher_type', operator: 'eq', value: filters.voucher_type });
    }
    if (filters.voucher_id) {
      queryFilters.push({ column: 'voucher_id', operator: 'eq', value: filters.voucher_id });
    }
    if (filters.from_date) {
      queryFilters.push({ column: 'posting_date', operator: 'gte', value: filters.from_date });
    }
    if (filters.to_date) {
      queryFilters.push({ column: 'posting_date', operator: 'lte', value: filters.to_date });
    }

    const result = await this.db.findMany<GLEntry>('gl_entry', {
      filters: queryFilters,
      sort: [
        { column: 'posting_date', direction: 'desc' },
        { column: 'posting_time', direction: 'desc' },
      ],
      pagination: {
        page: filters.page || 1,
        pageSize: filters.pageSize || 50,
      },
      tenantId: context.tenantId,
    });

    return {
      data: result.data || [],
      total: result.count || 0,
    };
  }

  /**
   * Computes the net running balance of an account.
   * Supports calling with either (accountId, context, asOfDate) or (accountId, companyId, tenantId, asOfDate).
   */
  async getAccountBalance(
    accountId: string,
    contextOrCompanyId: AccountingContext | string,
    asOfDateOrTenantId?: string,
    asOfDate?: string
  ): Promise<{ debitTotal: string; creditTotal: string; balance: string }> {
    let tenantId: string;
    let cutoffDate: string | undefined;

    if (typeof contextOrCompanyId === 'object') {
      tenantId = contextOrCompanyId.tenantId;
      cutoffDate = asOfDateOrTenantId;
    } else {
      tenantId = asOfDateOrTenantId || '';
      cutoffDate = asOfDate;
    }

    const filters: Array<{ column: string; operator: any; value: any }> = [
      { column: 'account_id', operator: 'eq', value: accountId },
    ];
    if (tenantId) {
      filters.push({ column: 'tenant_id', operator: 'eq', value: tenantId });
    }
    if (cutoffDate) {
      filters.push({ column: 'posting_date', operator: 'lte', value: cutoffDate });
    }

    const res = await this.db.findMany<GLEntry>('gl_entry', {
      filters,
      tenantId,
    });

    const entries = res.data || [];
    let debitTotal = Decimal.zero();
    let creditTotal = Decimal.zero();

    for (const e of entries) {
      debitTotal = debitTotal.add(Decimal.from(e.debit));
      creditTotal = creditTotal.add(Decimal.from(e.credit));
    }

    return {
      debitTotal: debitTotal.toString(6),
      creditTotal: creditTotal.toString(6),
      balance: debitTotal.subtract(creditTotal).toString(6),
    };
  }
}
