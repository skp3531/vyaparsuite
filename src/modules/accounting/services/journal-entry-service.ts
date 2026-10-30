import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { Decimal } from '@/lib/utils/decimal';
import { NotFoundError, BusinessRuleError, UnbalancedEntryError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { GeneralLedgerService } from './general-ledger-service';
import {
  journalEntrySchema,
  type JournalEntry,
  type CreateJournalEntryInput,
  type JournalEntryItem,
} from '../schemas/journal-entry.schema';
import type { CreateGLEntryInput } from '../schemas/gl-entry.schema';

export interface JournalEntryContext {
  tenantId: string;
  companyId: string;
  userId: string;
  roles: string[];
}

export class JournalEntryService {
  private namingService: NamingSeriesService;
  private glService: GeneralLedgerService;

  constructor(private db: IDatabaseAdapter) {
    this.namingService = new NamingSeriesService(db);
    this.glService = new GeneralLedgerService(db);
  }

  /**
   * Creates a Journal Entry voucher in Draft status.
   */
  async create(input: CreateJournalEntryInput, context: JournalEntryContext): Promise<JournalEntry> {
    const validated = journalEntrySchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const entryNumber =
      validated.entry_number ||
      (await this.namingService.getNextNumber('JV-.YY.-.#####', {
        tenantId: context.tenantId,
        companyId: context.companyId,
        postingDate: validated.posting_date,
      }));

    let totalDebit = Decimal.zero();
    let totalCredit = Decimal.zero();
    const computedItems: Array<Record<string, unknown>> = [];

    for (const item of validated.items) {
      const debit = Decimal.from(item.debit || '0');
      const credit = Decimal.from(item.credit || '0');
      totalDebit = totalDebit.add(debit);
      totalCredit = totalCredit.add(credit);

      computedItems.push({
        ...item,
        tenant_id: context.tenantId,
        debit: debit.toString(6),
        credit: credit.toString(6),
        created_by: context.userId,
        updated_by: context.userId,
      });
    }

    const difference = totalDebit.subtract(totalCredit);

    const jvData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      entry_number: entryNumber,
      posting_date: validated.posting_date,
      entry_type: validated.entry_type,
      total_debit: totalDebit.toString(6),
      total_credit: totalCredit.toString(6),
      difference: difference.toString(6),
      status: 'Draft',
      user_remark: validated.user_remark || null,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const created = await this.db.insert<JournalEntry>('journal_entry', jvData);
    if (created.error || !created.data) {
      throw new Error(`Failed to create journal entry: ${created.error?.message}`);
    }

    const jvId = created.data.id!;
    const savedItems: JournalEntryItem[] = [];

    for (const item of computedItems) {
      const itemRes = await this.db.insert<JournalEntryItem>('journal_entry_item', {
        ...item,
        journal_entry_id: jvId,
      });
      if (itemRes.data) {
        savedItems.push(itemRes.data);
      }
    }

    logger.info('Journal Entry created in Draft status', {
      entryNumber,
      jvId,
      totalDebit: totalDebit.toString(2),
      totalCredit: totalCredit.toString(2),
    });

    return {
      ...created.data,
      items: savedItems,
    };
  }

  /**
   * Submits a Journal Entry:
   * 1. Validates that debit and credit amounts balance exactly.
   * 2. Posts balanced double-entry rows to the General Ledger (gl_entry).
   * 3. Transitions status to 'Submitted'.
   */
  async submit(id: string, context: JournalEntryContext): Promise<JournalEntry> {
    const jv = await this.getById(id, context);
    if (!jv) {
      throw new NotFoundError('Journal Entry', id);
    }

    if (jv.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot submit Journal Entry with status '${jv.status}'`);
    }

    const totalDebit = Decimal.from(jv.total_debit);
    const totalCredit = Decimal.from(jv.total_credit);

    if (!totalDebit.equals(totalCredit)) {
      throw new UnbalancedEntryError(totalDebit.toString(2), totalCredit.toString(2));
    }

    // 1. Construct GL entries
    const glEntries: CreateGLEntryInput[] = jv.items.map((item) => ({
      tenant_id: context.tenantId,
      company_id: context.companyId,
      posting_date: jv.posting_date,
      account_id: item.account_id,
      party_type: item.party_type || null,
      party_id: item.party_id || null,
      cost_centre_id: item.cost_centre_id || null,
      debit: item.debit,
      credit: item.credit,
      voucher_type: 'Journal Entry' as const,
      voucher_id: jv.id!,
      voucher_number: jv.entry_number!,
      remarks: item.user_remark || jv.user_remark,
    }));

    // 2. Post to General Ledger
    await this.glService.postEntries(glEntries, {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    });

    // 3. Update status to Submitted
    const updated = await this.db.update<JournalEntry>('journal_entry', id, {
      status: 'Submitted',
      difference: '0.000000',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Journal Entry submitted and posted to GL', {
      entryNumber: jv.entry_number,
      jvId: jv.id,
      amount: totalDebit.toString(2),
    });

    return {
      ...jv,
      ...updated.data,
      status: 'Submitted',
    };
  }

  /**
   * Cancels a Journal Entry:
   * Posts compensating reversed GL entries with debits and credits swapped.
   */
  async cancel(id: string, reason: string, context: JournalEntryContext): Promise<JournalEntry> {
    const jv = await this.getById(id, context);
    if (!jv) {
      throw new NotFoundError('Journal Entry', id);
    }

    if (jv.status !== 'Submitted') {
      throw new BusinessRuleError(`Cannot cancel Journal Entry with status '${jv.status}'`);
    }

    // Swap debits and credits for reversing entries
    const reverseGLEntries: CreateGLEntryInput[] = jv.items.map((item) => ({
      tenant_id: context.tenantId,
      company_id: context.companyId,
      posting_date: new Date().toISOString().split('T')[0],
      account_id: item.account_id,
      party_type: item.party_type || null,
      party_id: item.party_id || null,
      debit: item.credit, // SWAP
      credit: item.debit, // SWAP
      voucher_type: 'Journal Entry' as const,
      voucher_id: jv.id!,
      voucher_number: jv.entry_number!,
      is_cancelled: true,
      remarks: `Reversal of ${jv.entry_number}: ${reason}`,
    }));

    await this.glService.postEntries(reverseGLEntries, {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    });

    const updated = await this.db.update<JournalEntry>('journal_entry', id, {
      status: 'Cancelled',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Journal Entry cancelled and GL reversal posted', {
      entryNumber: jv.entry_number,
      jvId: jv.id,
      reason,
    });

    return {
      ...jv,
      ...updated.data,
      status: 'Cancelled',
    };
  }

  /**
   * Fetches Journal Entry with lines.
   */
  async getById(id: string, context: JournalEntryContext): Promise<JournalEntry | null> {
    const res = await this.db.findById<JournalEntry>('journal_entry', id, {
      tenantId: context.tenantId,
    });
    if (!res.data) return null;

    const itemsRes = await this.db.findMany<JournalEntryItem>('journal_entry_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'journal_entry_id', operator: 'eq', value: id },
      ],
      tenantId: context.tenantId,
    });

    return {
      ...res.data,
      items: itemsRes.data || [],
    };
  }

  /**
   * Lists Journal Entries with pagination.
   */
  async list(
    options: { status?: string; page?: number; pageSize?: number } = {},
    context: JournalEntryContext
  ): Promise<{ data: JournalEntry[]; total: number }> {
    const filters = [{ column: 'tenant_id', operator: 'eq' as const, value: context.tenantId }];

    if (options.status) {
      filters.push({ column: 'status', operator: 'eq' as const, value: options.status });
    }

    const res = await this.db.findMany<JournalEntry>('journal_entry', {
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
