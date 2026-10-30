import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { Decimal, sum } from '@/lib/utils/decimal';
import { NotFoundError } from '@/lib/utils/errors';
import type { GLEntry } from '../schemas/gl-entry.schema';
import type { Account, AccountRootType } from '@/modules/setup/schemas/account.schema';

export interface ReportContext {
  tenantId: string;
  companyId: string;
}

export interface TrialBalanceRow {
  accountId: string;
  accountNumber?: string | null;
  accountName: string;
  rootType: AccountRootType;
  accountType?: string | null;
  totalDebit: string;
  totalCredit: string;
  closingDebit: string;
  closingCredit: string;
}

export interface TrialBalanceStatement {
  asOfDate: string;
  rows: TrialBalanceRow[];
  totalDebit: string;
  totalCredit: string;
  totalClosingDebit: string;
  totalClosingCredit: string;
  isBalanced: boolean;
  variance: string;
}

export interface ProfitAndLossStatement {
  fromDate: string;
  toDate: string;
  incomeRows: Array<{ accountId: string; accountName: string; amount: string }>;
  expenseRows: Array<{ accountId: string; accountName: string; amount: string }>;
  totalIncome: string;
  totalExpense: string;
  netProfit: string;
}

export interface BalanceSheetStatement {
  asOfDate: string;
  assetRows: Array<{ accountId: string; accountName: string; amount: string }>;
  liabilityRows: Array<{ accountId: string; accountName: string; amount: string }>;
  equityRows: Array<{ accountId: string; accountName: string; amount: string }>;
  totalAssets: string;
  totalLiabilities: string;
  totalEquity: string;
  currentEarnings: string;
  totalLiabilitiesAndEquity: string;
  isBalanced: boolean;
  variance: string;
}

export interface AccountLedgerEntry {
  id: string;
  postingDate: string;
  voucherType: string;
  voucherNumber: string;
  partyType?: string | null;
  partyName?: string | null;
  remarks?: string | null;
  debit: string;
  credit: string;
  runningBalance: string;
}

export interface AccountLedgerStatement {
  account: Account;
  fromDate?: string;
  toDate?: string;
  openingBalance: string;
  entries: AccountLedgerEntry[];
  totalDebit: string;
  totalCredit: string;
  closingBalance: string;
}

export class FinancialReportsService {
  constructor(private db: IDatabaseAdapter) {}

  /**
   * Generates a balanced Trial Balance statement up to a given asOfDate.
   */
  async getTrialBalance(context: ReportContext, asOfDate?: string): Promise<TrialBalanceStatement> {
    const effectiveDate = asOfDate || new Date().toISOString().slice(0, 10);

    // 1. Fetch active accounts
    const accountsRes = await this.db.findMany<Account>('account', {
      tenantId: context.tenantId,
      filters: [
        { column: 'company_id', operator: 'eq', value: context.companyId },
        { column: 'is_active', operator: 'eq', value: true },
        { column: 'is_group', operator: 'eq', value: false },
      ],
    });

    const accounts = accountsRes.data || [];

    // 2. Fetch all valid GL entries up to effective date
    const glFilters: Array<{ column: string; operator: any; value: any }> = [
      { column: 'company_id', operator: 'eq', value: context.companyId },
      { column: 'posting_date', operator: 'lte', value: effectiveDate },
      { column: 'is_cancelled', operator: 'eq', value: false },
    ];

    const glRes = await this.db.findMany<GLEntry>('gl_entry', {
      tenantId: context.tenantId,
      filters: glFilters,
    });

    const glEntries = glRes.data || [];

    // 3. Accumulate debits & credits per account
    const debitMap: Record<string, Decimal> = {};
    const creditMap: Record<string, Decimal> = {};

    let totalSystemDebit = Decimal.zero();
    let totalSystemCredit = Decimal.zero();

    for (const gle of glEntries) {
      const d = Decimal.from(gle.debit);
      const c = Decimal.from(gle.credit);

      totalSystemDebit = totalSystemDebit.add(d);
      totalSystemCredit = totalSystemCredit.add(c);

      debitMap[gle.account_id] = (debitMap[gle.account_id] || Decimal.zero()).add(d);
      creditMap[gle.account_id] = (creditMap[gle.account_id] || Decimal.zero()).add(c);
    }

    let totalClosingDebit = Decimal.zero();
    let totalClosingCredit = Decimal.zero();

    const rows: TrialBalanceRow[] = [];

    for (const acc of accounts) {
      const totalDebit = debitMap[acc.id!] || Decimal.zero();
      const totalCredit = creditMap[acc.id!] || Decimal.zero();

      // Only include accounts with activity or non-zero balance
      if (totalDebit.isZero() && totalCredit.isZero()) {
        continue;
      }

      let closingDebit = Decimal.zero();
      let closingCredit = Decimal.zero();

      if (acc.root_type === 'Asset' || acc.root_type === 'Expense') {
        const net = totalDebit.subtract(totalCredit);
        if (net.greaterThanOrEqual(Decimal.zero())) {
          closingDebit = net;
        } else {
          closingCredit = net.abs();
        }
      } else {
        // Liability, Equity, Income (credit-normal)
        const net = totalCredit.subtract(totalDebit);
        if (net.greaterThanOrEqual(Decimal.zero())) {
          closingCredit = net;
        } else {
          closingDebit = net.abs();
        }
      }

      totalClosingDebit = totalClosingDebit.add(closingDebit);
      totalClosingCredit = totalClosingCredit.add(closingCredit);

      rows.push({
        accountId: acc.id!,
        accountNumber: acc.account_number,
        accountName: acc.account_name,
        rootType: acc.root_type,
        accountType: acc.account_type,
        totalDebit: totalDebit.toString(2),
        totalCredit: totalCredit.toString(2),
        closingDebit: closingDebit.toString(2),
        closingCredit: closingCredit.toString(2),
      });
    }

    // Sort rows by rootType, then account name
    rows.sort((a, b) => a.rootType.localeCompare(b.rootType) || a.accountName.localeCompare(b.accountName));

    const variance = totalClosingDebit.subtract(totalClosingCredit).abs();
    const isBalanced = variance.lessThan(Decimal.from('0.01'));

    return {
      asOfDate: effectiveDate,
      rows,
      totalDebit: totalSystemDebit.toString(2),
      totalCredit: totalSystemCredit.toString(2),
      totalClosingDebit: totalClosingDebit.toString(2),
      totalClosingCredit: totalClosingCredit.toString(2),
      isBalanced,
      variance: variance.toString(2),
    };
  }

  /**
   * Generates a Profit and Loss Statement for a specified date range.
   */
  async getProfitAndLoss(
    context: ReportContext,
    fromDate: string,
    toDate: string
  ): Promise<ProfitAndLossStatement> {
    const accountsRes = await this.db.findMany<Account>('account', {
      tenantId: context.tenantId,
      filters: [
        { column: 'company_id', operator: 'eq', value: context.companyId },
        { column: 'is_active', operator: 'eq', value: true },
        { column: 'is_group', operator: 'eq', value: false },
      ],
    });
    const accounts = accountsRes.data || [];
    const accountMap = new Map(accounts.map((a) => [a.id!, a]));

    const glRes = await this.db.findMany<GLEntry>('gl_entry', {
      tenantId: context.tenantId,
      filters: [
        { column: 'company_id', operator: 'eq', value: context.companyId },
        { column: 'posting_date', operator: 'gte', value: fromDate },
        { column: 'posting_date', operator: 'lte', value: toDate },
        { column: 'is_cancelled', operator: 'eq', value: false },
      ],
    });

    const glEntries = glRes.data || [];

    const incomeMap: Record<string, Decimal> = {};
    const expenseMap: Record<string, Decimal> = {};

    for (const gle of glEntries) {
      const acc = accountMap.get(gle.account_id);
      if (!acc) continue;

      const d = Decimal.from(gle.debit);
      const c = Decimal.from(gle.credit);

      if (acc.root_type === 'Income') {
        // Income is increased by credit, decreased by debit
        incomeMap[acc.id!] = (incomeMap[acc.id!] || Decimal.zero()).add(c.subtract(d));
      } else if (acc.root_type === 'Expense') {
        // Expense is increased by debit, decreased by credit
        expenseMap[acc.id!] = (expenseMap[acc.id!] || Decimal.zero()).add(d.subtract(c));
      }
    }

    let totalIncome = Decimal.zero();
    const incomeRows: Array<{ accountId: string; accountName: string; amount: string }> = [];
    for (const [accId, amt] of Object.entries(incomeMap)) {
      if (!amt.isZero()) {
        totalIncome = totalIncome.add(amt);
        incomeRows.push({
          accountId: accId,
          accountName: accountMap.get(accId)?.account_name || 'Income Account',
          amount: amt.toString(2),
        });
      }
    }

    let totalExpense = Decimal.zero();
    const expenseRows: Array<{ accountId: string; accountName: string; amount: string }> = [];
    for (const [accId, amt] of Object.entries(expenseMap)) {
      if (!amt.isZero()) {
        totalExpense = totalExpense.add(amt);
        expenseRows.push({
          accountId: accId,
          accountName: accountMap.get(accId)?.account_name || 'Expense Account',
          amount: amt.toString(2),
        });
      }
    }

    const netProfit = totalIncome.subtract(totalExpense);

    return {
      fromDate,
      toDate,
      incomeRows,
      expenseRows,
      totalIncome: totalIncome.toString(2),
      totalExpense: totalExpense.toString(2),
      netProfit: netProfit.toString(2),
    };
  }

  /**
   * Generates a Balance Sheet statement as of a given date.
   */
  async getBalanceSheet(context: ReportContext, asOfDate: string): Promise<BalanceSheetStatement> {
    const accountsRes = await this.db.findMany<Account>('account', {
      tenantId: context.tenantId,
      filters: [
        { column: 'company_id', operator: 'eq', value: context.companyId },
        { column: 'is_active', operator: 'eq', value: true },
        { column: 'is_group', operator: 'eq', value: false },
      ],
    });
    const accounts = accountsRes.data || [];
    const accountMap = new Map(accounts.map((a) => [a.id!, a]));

    const glRes = await this.db.findMany<GLEntry>('gl_entry', {
      tenantId: context.tenantId,
      filters: [
        { column: 'company_id', operator: 'eq', value: context.companyId },
        { column: 'posting_date', operator: 'lte', value: asOfDate },
        { column: 'is_cancelled', operator: 'eq', value: false },
      ],
    });

    const glEntries = glRes.data || [];

    const balanceMap: Record<string, Decimal> = {};
    let totalIncome = Decimal.zero();
    let totalExpense = Decimal.zero();

    for (const gle of glEntries) {
      const acc = accountMap.get(gle.account_id);
      if (!acc) continue;

      const d = Decimal.from(gle.debit);
      const c = Decimal.from(gle.credit);

      if (acc.root_type === 'Asset') {
        balanceMap[acc.id!] = (balanceMap[acc.id!] || Decimal.zero()).add(d.subtract(c));
      } else if (acc.root_type === 'Liability' || acc.root_type === 'Equity') {
        balanceMap[acc.id!] = (balanceMap[acc.id!] || Decimal.zero()).add(c.subtract(d));
      } else if (acc.root_type === 'Income') {
        totalIncome = totalIncome.add(c.subtract(d));
      } else if (acc.root_type === 'Expense') {
        totalExpense = totalExpense.add(d.subtract(c));
      }
    }

    const currentEarnings = totalIncome.subtract(totalExpense);

    let totalAssets = Decimal.zero();
    const assetRows: Array<{ accountId: string; accountName: string; amount: string }> = [];
    let totalLiabilities = Decimal.zero();
    const liabilityRows: Array<{ accountId: string; accountName: string; amount: string }> = [];
    let totalEquity = Decimal.zero();
    const equityRows: Array<{ accountId: string; accountName: string; amount: string }> = [];

    for (const [accId, amt] of Object.entries(balanceMap)) {
      if (amt.isZero()) continue;
      const acc = accountMap.get(accId);
      if (!acc) continue;

      if (acc.root_type === 'Asset') {
        totalAssets = totalAssets.add(amt);
        assetRows.push({ accountId: accId, accountName: acc.account_name, amount: amt.toString(2) });
      } else if (acc.root_type === 'Liability') {
        totalLiabilities = totalLiabilities.add(amt);
        liabilityRows.push({ accountId: accId, accountName: acc.account_name, amount: amt.toString(2) });
      } else if (acc.root_type === 'Equity') {
        totalEquity = totalEquity.add(amt);
        equityRows.push({ accountId: accId, accountName: acc.account_name, amount: amt.toString(2) });
      }
    }

    const totalLiabilitiesAndEquity = totalLiabilities.add(totalEquity).add(currentEarnings);
    const variance = totalAssets.subtract(totalLiabilitiesAndEquity).abs();
    const isBalanced = variance.lessThan(Decimal.from('0.01'));

    return {
      asOfDate,
      assetRows,
      liabilityRows,
      equityRows,
      totalAssets: totalAssets.toString(2),
      totalLiabilities: totalLiabilities.toString(2),
      totalEquity: totalEquity.toString(2),
      currentEarnings: currentEarnings.toString(2),
      totalLiabilitiesAndEquity: totalLiabilitiesAndEquity.toString(2),
      isBalanced,
      variance: variance.toString(2),
    };
  }

  /**
   * Generates a detailed Account Ledger with chronological running balance.
   */
  async getAccountLedger(
    context: ReportContext,
    accountId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<AccountLedgerStatement> {
    const accRes = await this.db.findById<Account>('account', accountId, {
      tenantId: context.tenantId,
    });
    if (!accRes.data) {
      throw new NotFoundError('Account', accountId);
    }
    const account = accRes.data;

    // 1. Calculate opening balance if fromDate provided
    let openingBalance = Decimal.zero();
    if (fromDate) {
      const priorGLEs = await this.db.findMany<GLEntry>('gl_entry', {
        tenantId: context.tenantId,
        filters: [
          { column: 'company_id', operator: 'eq', value: context.companyId },
          { column: 'account_id', operator: 'eq', value: accountId },
          { column: 'posting_date', operator: 'lt', value: fromDate },
          { column: 'is_cancelled', operator: 'eq', value: false },
        ],
      });

      for (const gle of priorGLEs.data || []) {
        const d = Decimal.from(gle.debit);
        const c = Decimal.from(gle.credit);
        if (account.root_type === 'Asset' || account.root_type === 'Expense') {
          openingBalance = openingBalance.add(d.subtract(c));
        } else {
          openingBalance = openingBalance.add(c.subtract(d));
        }
      }
    }

    // 2. Fetch GL entries in range
    const filters: Array<{ column: string; operator: any; value: any }> = [
      { column: 'company_id', operator: 'eq', value: context.companyId },
      { column: 'account_id', operator: 'eq', value: accountId },
      { column: 'is_cancelled', operator: 'eq', value: false },
    ];
    if (fromDate) {
      filters.push({ column: 'posting_date', operator: 'gte', value: fromDate });
    }
    if (toDate) {
      filters.push({ column: 'posting_date', operator: 'lte', value: toDate });
    }

    const currentGLEs = await this.db.findMany<GLEntry>('gl_entry', {
      tenantId: context.tenantId,
      filters,
      sort: [
        { column: 'posting_date', direction: 'asc' },
        { column: 'created_at', direction: 'asc' },
      ],
    });

    let running = openingBalance;
    let totalDebit = Decimal.zero();
    let totalCredit = Decimal.zero();
    const entries: AccountLedgerEntry[] = [];

    for (const gle of currentGLEs.data || []) {
      const d = Decimal.from(gle.debit);
      const c = Decimal.from(gle.credit);

      totalDebit = totalDebit.add(d);
      totalCredit = totalCredit.add(c);

      if (account.root_type === 'Asset' || account.root_type === 'Expense') {
        running = running.add(d.subtract(c));
      } else {
        running = running.add(c.subtract(d));
      }

      entries.push({
        id: gle.id!,
        postingDate: gle.posting_date,
        voucherType: gle.voucher_type,
        voucherNumber: gle.voucher_number,
        partyType: gle.party_type,
        remarks: gle.remarks,
        debit: d.toString(2),
        credit: c.toString(2),
        runningBalance: running.toString(2),
      });
    }

    return {
      account,
      fromDate,
      toDate,
      openingBalance: openingBalance.toString(2),
      entries,
      totalDebit: totalDebit.toString(2),
      totalCredit: totalCredit.toString(2),
      closingBalance: running.toString(2),
    };
  }
}
