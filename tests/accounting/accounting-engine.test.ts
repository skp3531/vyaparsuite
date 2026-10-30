import { describe, it, beforeEach } from 'node:test';
import { expect } from '../helpers/test-runner';
import { MockDatabaseAdapter } from '../helpers/mock-db';
import { Decimal } from '@/lib/utils/decimal';
import { UnbalancedEntryError, CreditLimitExceededError, BusinessRuleError } from '@/lib/utils/errors';
import { GeneralLedgerService } from '@/modules/accounting/services/general-ledger-service';
import { JournalEntryService } from '@/modules/accounting/services/journal-entry-service';
import { SalesInvoiceService } from '@/modules/accounting/services/sales-invoice-service';
import { PurchaseInvoiceService } from '@/modules/accounting/services/purchase-invoice-service';
import { PaymentEntryService } from '@/modules/accounting/services/payment-entry-service';
import { FinancialReportsService } from '@/modules/accounting/services/financial-reports-service';

describe('Phase 5: Financial Accounting & General Ledger Engine Tests', () => {
  let db: MockDatabaseAdapter;
  let glService: GeneralLedgerService;
  let jeService: JournalEntryService;
  let siService: SalesInvoiceService;
  let piService: PurchaseInvoiceService;
  let peService: PaymentEntryService;
  let reportsService: FinancialReportsService;

  const context = {
    tenantId: '00000000-0000-4000-a000-000000000001',
    companyId: '11111111-1111-4111-a111-111111111111',
    userId: '22222222-2222-4222-a222-222222222222',
    roles: ['Finance Manager', 'Accountant'],
  };

  // Fixed Account UUIDs from Chart of Accounts
  const ACC_RECEIVABLE = '10000000-0000-4000-a000-000000000001'; // Debtors (Asset)
  const ACC_INPUT_CGST = '10000000-0000-4000-a000-000000000002'; // Input CGST (Asset)
  const ACC_INPUT_SGST = '10000000-0000-4000-a000-000000000003'; // Input SGST (Asset)
  const ACC_BANK = '10000000-0000-4000-a000-000000000005'; // Bank Account (Asset)
  const ACC_CASH = '10000000-0000-4000-a000-000000000006'; // Cash in Hand (Asset)
  const ACC_OUTPUT_CGST = '20000000-0000-4000-a000-000000000001'; // Output CGST (Liability)
  const ACC_OUTPUT_SGST = '20000000-0000-4000-a000-000000000002'; // Output SGST (Liability)
  const ACC_TDS_PAYABLE = '20000000-0000-4000-a000-000000000004'; // TDS Payable (Liability)
  const ACC_PAYABLE = '20000000-0000-4000-a000-000000000005'; // Creditors (Liability)
  const ACC_EQUITY = '30000000-0000-4000-a000-000000000001'; // Share Capital (Equity)
  const ACC_INCOME = '40000000-0000-4000-a000-000000000001'; // Sales Income (Income)
  const ACC_EXPENSE = '50000000-0000-4000-a000-000000000001'; // Purchase Expense (Expense)

  const CUSTOMER_ID = 'dddd0001-0000-4000-a000-000000000001';
  const SUPPLIER_ID = 'eeee0001-0000-4000-a000-000000000001';
  const ITEM_ID = 'bbbb0001-0000-4000-a000-000000000001';
  const UOM_ID = 'cccc0001-0000-4000-a000-000000000001';

  beforeEach(async () => {
    db = new MockDatabaseAdapter();
    glService = new GeneralLedgerService(db);
    jeService = new JournalEntryService(db);
    siService = new SalesInvoiceService(db);
    piService = new PurchaseInvoiceService(db);
    peService = new PaymentEntryService(db);
    reportsService = new FinancialReportsService(db);

    // Seed master accounts
    const accounts = [
      { id: ACC_RECEIVABLE, account_name: 'Debtors', account_number: '1100', root_type: 'Asset', account_type: 'Receivable' },
      { id: ACC_INPUT_CGST, account_name: 'Input CGST', account_number: '1210', root_type: 'Asset', account_type: 'Tax' },
      { id: ACC_INPUT_SGST, account_name: 'Input SGST', account_number: '1220', root_type: 'Asset', account_type: 'Tax' },
      { id: ACC_BANK, account_name: 'HDFC Bank', account_number: '1310', root_type: 'Asset', account_type: 'Bank' },
      { id: ACC_CASH, account_name: 'Main Cash', account_number: '1320', root_type: 'Asset', account_type: 'Cash' },
      { id: ACC_OUTPUT_CGST, account_name: 'Output CGST', account_number: '2110', root_type: 'Liability', account_type: 'Tax' },
      { id: ACC_OUTPUT_SGST, account_name: 'Output SGST', account_number: '2120', root_type: 'Liability', account_type: 'Tax' },
      { id: ACC_TDS_PAYABLE, account_name: 'TDS Payable', account_number: '2140', root_type: 'Liability', account_type: 'Tax' },
      { id: ACC_PAYABLE, account_name: 'Creditors', account_number: '2200', root_type: 'Liability', account_type: 'Payable' },
      { id: ACC_EQUITY, account_name: 'Share Capital', account_number: '3100', root_type: 'Equity', account_type: 'Equity' },
      { id: ACC_INCOME, account_name: 'Sales Revenue', account_number: '4100', root_type: 'Income', account_type: 'Income Account' },
      { id: ACC_EXPENSE, account_name: 'Purchase Expense', account_number: '5100', root_type: 'Expense', account_type: 'Cost of Goods Sold' },
    ];

    for (const acc of accounts) {
      await db.insert('account', {
        ...acc,
        tenant_id: context.tenantId,
        company_id: context.companyId,
        account_group_id: '99999999-0000-4000-a000-000000000001',
        currency: 'INR',
        is_group: false,
        is_active: true,
      });
    }

    // Seed Customer
    await db.insert('customer', {
      id: CUSTOMER_ID,
      tenant_id: context.tenantId,
      company_id: context.companyId,
      customer_name: 'Bharat Retailers Ltd',
      credit_limit: '100000.000000',
      total_outstanding: '0.000000',
    });

    // Seed Supplier
    await db.insert('supplier', {
      id: SUPPLIER_ID,
      tenant_id: context.tenantId,
      company_id: context.companyId,
      supplier_name: 'National Distributors',
    });
  });

  describe('General Ledger Service Invariants', () => {
    it('rejects an unbalanced voucher entry with UnbalancedEntryError', async () => {
      const unbalancedGLEs = [
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          posting_date: '2026-10-30',
          account_id: ACC_BANK,
          debit: '1000.000000',
          credit: '0.000000',
          voucher_type: 'Journal Entry' as const,
          voucher_id: 'aaaa1111-0000-4000-a000-000000000001',
          voucher_number: 'JV-001',
        },
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          posting_date: '2026-10-30',
          account_id: ACC_EQUITY,
          debit: '0.000000',
          credit: '950.000000', // ₹50 discrepancy!
          voucher_type: 'Journal Entry' as const,
          voucher_id: 'aaaa1111-0000-4000-a000-000000000001',
          voucher_number: 'JV-001',
        },
      ];

      let errorThrown: any = null;
      try {
        await glService.postEntries(unbalancedGLEs, context);
      } catch (err) {
        errorThrown = err;
      }

      expect(errorThrown).not.toBeNull();
      expect(errorThrown instanceof UnbalancedEntryError).toBe(true);
    });

    it('posts balanced GL entries and maintains correct account balance', async () => {
      const balancedGLEs = [
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          posting_date: '2026-10-30',
          account_id: ACC_BANK,
          debit: '50000.000000',
          credit: '0.000000',
          voucher_type: 'Journal Entry' as const,
          voucher_id: 'aaaa1111-0000-4000-a000-000000000002',
          voucher_number: 'OPEN-001',
        },
        {
          tenant_id: context.tenantId,
          company_id: context.companyId,
          posting_date: '2026-10-30',
          account_id: ACC_EQUITY,
          debit: '0.000000',
          credit: '50000.000000',
          voucher_type: 'Journal Entry' as const,
          voucher_id: 'aaaa1111-0000-4000-a000-000000000002',
          voucher_number: 'OPEN-001',
        },
      ];

      const res = await glService.postEntries(balancedGLEs, context);
      expect(res.length).toBe(2);

      const bankBalance = await glService.getAccountBalance(ACC_BANK, context.companyId, context.tenantId);
      expect(bankBalance.balance).toBe('50000.000000');
    });
  });

  describe('Journal Entry Lifecycle', () => {
    it('creates, submits, and verifies balanced GL posting from a Journal Entry voucher', async () => {
      const je = await jeService.create(
        {
          company_id: context.companyId,
          posting_date: '2026-10-30',
          entry_type: 'Bank Entry',
          user_remark: 'Initial Bank Deposit',
          items: [
            {
              account_id: ACC_BANK,
              debit: '25000.000000',
              credit: '0.000000',
            },
            {
              account_id: ACC_CASH,
              debit: '0.000000',
              credit: '25000.000000',
            },
          ],
        },
        context
      );

      expect(je.status).toBe('Draft');
      expect(je.total_debit).toBe('25000.000000');
      expect(je.total_credit).toBe('25000.000000');
      expect(je.difference).toBe('0.000000');

      const submitted = await jeService.submit(je.id!, context);
      expect(submitted.status).toBe('Submitted');

      const gles = await glService.getVoucherEntries(je.id!, 'Journal Entry', context.tenantId);
      expect(gles.length).toBe(2);
      expect(gles[0].account_id).toBe(ACC_BANK);
      expect(gles[0].debit).toBe('25000.000000');
      expect(gles[1].account_id).toBe(ACC_CASH);
      expect(gles[1].credit).toBe('25000.000000');
    });

    it('reverses GL entries upon Journal Entry cancellation', async () => {
      const je = await jeService.create(
        {
          company_id: context.companyId,
          posting_date: '2026-10-30',
          entry_type: 'Journal Entry',
          items: [
            { account_id: ACC_EXPENSE, debit: '1000.000000', credit: '0.000000' },
            { account_id: ACC_CASH, debit: '0.000000', credit: '1000.000000' },
          ],
        },
        context
      );
      await jeService.submit(je.id!, context);

      const cancelled = await jeService.cancel(je.id!, 'Erroneous voucher', context);
      expect(cancelled.status).toBe('Cancelled');

      const gles = await glService.getVoucherEntries(je.id!, 'Journal Entry', context.tenantId);
      // Immutable ledger: Original 2 (is_cancelled: false) + Reversing 2 (is_cancelled: true) = 4 GL entries
      expect(gles.length).toBe(4);
      const reversingGles = gles.filter((g) => g.is_cancelled);
      expect(reversingGles.length).toBe(2);

      // Verify net balance on both accounts returned to exactly zero
      const expBal = await glService.getAccountBalance(ACC_EXPENSE, context.companyId, context.tenantId);
      expect(expBal.balance).toBe('0.000000');
      const cashBal = await glService.getAccountBalance(ACC_CASH, context.companyId, context.tenantId);
      expect(cashBal.balance).toBe('0.000000');
    });
  });

  describe('Sales Invoice Billing & GL Engine', () => {
    it('submits Sales Invoice with GST breakdown, posts balanced GL, and updates customer exposure', async () => {
      const invoice = await siService.create(
        {
          company_id: context.companyId,
          customer_id: CUSTOMER_ID,
          customer_name: 'Bharat Retailers Ltd',
          posting_date: '2026-10-30',
          due_date: '2026-11-15',
          items: [
            {
              item_id: ITEM_ID,
              item_code: 'ITM-001',
              item_name: 'Enterprise Router',
              qty: '2.000000',
              uom_id: UOM_ID,
              rate: '5000.000000', // Net = 10,000
              cgst_rate: '9.000000',
              cgst_amount: '900.000000',
              sgst_rate: '9.000000',
              sgst_amount: '900.000000',
            },
          ],
        },
        context
      );

      expect(invoice.net_total).toBe('10000.000000');
      expect(invoice.tax_total).toBe('1800.000000');
      expect(invoice.grand_total).toBe('11800.000000');
      expect(invoice.outstanding_amount).toBe('11800.000000');

      const submitted = await siService.submit(invoice.id!, context);
      expect(submitted.status).toBe('Submitted');

      // Check GL Postings
      const gles = await glService.getVoucherEntries(invoice.id!, 'Sales Invoice', context.tenantId);
      expect(gles.length).toBe(4);

      // 1. Debtors Debit: ₹11,800
      const debtorLine = gles.find((g) => g.account_id === ACC_RECEIVABLE);
      expect(debtorLine).toBeDefined();
      expect(debtorLine?.debit).toBe('11800.000000');

      // 2. Income Credit: ₹10,000
      const incomeLine = gles.find((g) => g.account_id === ACC_INCOME);
      expect(incomeLine).toBeDefined();
      expect(incomeLine?.credit).toBe('10000.000000');

      // 3. Output CGST Credit: ₹900
      const cgstLine = gles.find((g) => g.account_id === ACC_OUTPUT_CGST);
      expect(cgstLine?.credit).toBe('900.000000');

      // 4. Output SGST Credit: ₹900
      const sgstLine = gles.find((g) => g.account_id === ACC_OUTPUT_SGST);
      expect(sgstLine?.credit).toBe('900.000000');

      // Customer outstanding balance check
      const custRes = await db.findById<any>('customer', CUSTOMER_ID, { tenantId: context.tenantId });
      expect(custRes.data?.total_outstanding).toBe('11800.000000');
    });

    it('enforces customer credit limit on invoice submission', async () => {
      // Customer has credit limit of 100,000.
      // Trying to invoice 120,000 should fail.
      const invoice = await siService.create(
        {
          company_id: context.companyId,
          customer_id: CUSTOMER_ID,
          customer_name: 'Bharat Retailers Ltd',
          posting_date: '2026-10-30',
          due_date: '2026-11-15',
          items: [
            {
              item_id: ITEM_ID,
              item_code: 'ITM-001',
              item_name: 'Enterprise Router Bulk',
              qty: '20.000000',
              uom_id: UOM_ID,
              rate: '6000.000000', // Net = 120,000
            },
          ],
        },
        context
      );

      let limitError: any = null;
      try {
        await siService.submit(invoice.id!, context);
      } catch (err) {
        limitError = err;
      }

      expect(limitError).not.toBeNull();
      expect(limitError instanceof CreditLimitExceededError).toBe(true);
    });
  });

  describe('Purchase Invoice Billing & GL Engine', () => {
    it('submits Purchase Invoice with TDS deduction, posts balanced GL, and tracks PO billing', async () => {
      // 1. Setup Purchase Order
      const poRes = await db.insert<any>('purchase_order', {
        id: '99990001-0000-4000-a000-000000000001',
        tenant_id: context.tenantId,
        company_id: context.companyId,
        purchase_order_number: 'PO-2026-0001',
        supplier_id: SUPPLIER_ID,
        schedule_date: '2026-11-10',
        status: 'To Receive and Bill',
        received_percent: '100.000000',
        billed_percent: '0.000000',
      });

      const poItemRes = await db.insert<any>('purchase_order_item', {
        id: '99990001-0000-4000-a000-000000000002',
        tenant_id: context.tenantId,
        purchase_order_id: poRes.data?.id,
        item_id: ITEM_ID,
        item_code: 'ITM-001',
        item_name: 'Enterprise Router',
        qty: '10.000000',
        billed_qty: '0.000000',
      });

      // 2. Create Purchase Invoice with 2% TDS on Net (₹40,000 net -> ₹800 TDS)
      const pInvoice = await piService.create(
        {
          company_id: context.companyId,
          supplier_id: SUPPLIER_ID,
          bill_number: 'INV-VEN-9876',
          posting_date: '2026-10-30',
          due_date: '2026-11-30',
          tds_rate: '2.000000',
          items: [
            {
              item_id: ITEM_ID,
              item_code: 'ITM-001',
              item_name: 'Enterprise Router',
              qty: '10.000000',
              uom_id: UOM_ID,
              rate: '4000.000000', // Net = 40,000
              cgst_rate: '9.000000',
              cgst_amount: '3600.000000',
              sgst_rate: '9.000000',
              sgst_amount: '3600.000000',
              purchase_order_id: poRes.data?.id,
              purchase_order_item_id: poItemRes.data?.id,
            },
          ],
        },
        context
      );

      expect(pInvoice.net_total).toBe('40000.000000');
      expect(pInvoice.tax_total).toBe('7200.000000');
      expect(pInvoice.grand_total).toBe('47200.000000');
      expect(pInvoice.tds_amount).toBe('800.000000');
      // Net Payable = 47,200 - 800 = 46,400
      expect(pInvoice.outstanding_amount).toBe('46400.000000');

      const submitted = await piService.submit(pInvoice.id!, context);
      expect(submitted.status).toBe('Submitted');

      // Verify GL entries:
      // Debit Expense: 40,000
      // Debit Input CGST: 3,600
      // Debit Input SGST: 3,600
      // Credit TDS Payable: 800
      // Credit Creditors: 46,400
      // Total Debit = 47,200, Total Credit = 47,200
      const gles = await glService.getVoucherEntries(pInvoice.id!, 'Purchase Invoice', context.tenantId);
      expect(gles.length).toBe(5);

      const expLine = gles.find((g) => g.account_id === ACC_EXPENSE);
      expect(expLine?.debit).toBe('40000.000000');

      const cgstLine = gles.find((g) => g.account_id === ACC_INPUT_CGST);
      expect(cgstLine?.debit).toBe('3600.000000');

      const tdsLine = gles.find((g) => g.account_id === ACC_TDS_PAYABLE);
      expect(tdsLine?.credit).toBe('800.000000');

      const payableLine = gles.find((g) => g.account_id === ACC_PAYABLE);
      expect(payableLine?.credit).toBe('46400.000000');

      // Verify PO status auto-completed (both received and billed 100%)
      const updatedPO = await db.findById<any>('purchase_order', poRes.data?.id, { tenantId: context.tenantId });
      expect(updatedPO.data?.billed_percent).toBe('100.000000');
      expect(updatedPO.data?.status).toBe('Completed');
    });
  });

  describe('Payment Entry & Allocation Lifecycle', () => {
    it('processes Inward Receipt, updates Sales Invoice balance to Paid, and posts to GL', async () => {
      // 1. Create and submit Sales Invoice for 10,000
      const invoice = await siService.create(
        {
          company_id: context.companyId,
          customer_id: CUSTOMER_ID,
          posting_date: '2026-10-30',
          due_date: '2026-11-15',
          items: [
            {
              item_id: ITEM_ID,
              item_code: 'ITM-001',
              item_name: 'Hardware',
              qty: '1.000000',
              uom_id: UOM_ID,
              rate: '10000.000000',
            },
          ],
        },
        context
      );
      await siService.submit(invoice.id!, context);

      // 2. Receive Payment of ₹10,000 into Bank
      const pe = await peService.create(
        {
          company_id: context.companyId,
          payment_type: 'Receive',
          party_type: 'Customer',
          party_id: CUSTOMER_ID,
          party_name: 'Bharat Retailers Ltd',
          posting_date: '2026-10-30',
          paid_from_account_id: ACC_RECEIVABLE,
          paid_to_account_id: ACC_BANK,
          paid_amount: '10000.000000',
          received_amount: '10000.000000',
          mode_of_payment: 'NEFT/RTGS',
          references: [
            {
              reference_doctype: 'Sales Invoice',
              reference_id: invoice.id!,
              total_amount: '10000.000000',
              outstanding_amount: '10000.000000',
              allocated_amount: '10000.000000',
            },
          ],
        },
        context
      );

      const submitted = await peService.submit(pe.id!, context);
      expect(submitted.status).toBe('Submitted');

      // Check GL Postings:
      // DEBIT: Bank ₹10,000
      // CREDIT: Debtors ₹10,000
      const gles = await glService.getVoucherEntries(pe.id!, 'Payment Entry', context.tenantId);
      expect(gles.length).toBe(2);
      expect(gles.find((g) => g.account_id === ACC_BANK)?.debit).toBe('10000.000000');
      expect(gles.find((g) => g.account_id === ACC_RECEIVABLE)?.credit).toBe('10000.000000');

      // Verify Sales Invoice is now Paid with 0 outstanding
      const updatedInv = await siService.getById(invoice.id!, context.tenantId);
      expect(updatedInv).not.toBeNull();
      expect(updatedInv!.paid_amount).toBe('10000.000000');
      expect(updatedInv!.outstanding_amount).toBe('0.000000');
      expect(updatedInv!.status).toBe('Paid');

      // Verify Customer total outstanding decreased by 10,000
      const updatedCust = await db.findById<any>('customer', CUSTOMER_ID, { tenantId: context.tenantId });
      expect(updatedCust.data?.total_outstanding).toBe('0.000000');
    });

    it('processes Internal Contra Bank-to-Cash Transfer', async () => {
      const contra = await peService.create(
        {
          company_id: context.companyId,
          payment_type: 'Internal Transfer',
          posting_date: '2026-10-30',
          paid_from_account_id: ACC_BANK, // Source
          paid_to_account_id: ACC_CASH, // Target
          paid_amount: '5000.000000',
          received_amount: '5000.000000',
          mode_of_payment: 'Cheque',
        },
        context
      );

      await peService.submit(contra.id!, context);

      const gles = await glService.getVoucherEntries(contra.id!, 'Payment Entry', context.tenantId);
      expect(gles.length).toBe(2);
      // Debit Cash
      expect(gles.find((g) => g.account_id === ACC_CASH)?.debit).toBe('5000.000000');
      // Credit Bank
      expect(gles.find((g) => g.account_id === ACC_BANK)?.credit).toBe('5000.000000');
    });
  });

  describe('Financial Reports & Statement Balancing Invariants', () => {
    it('produces a penny-exact balanced Trial Balance across all posted vouchers', async () => {
      // 1. Initial Capital: Bank Debit 100,000, Equity Credit 100,000
      await jeService.submit(
        (
          await jeService.create(
            {
              company_id: context.companyId,
              posting_date: '2026-10-01',
              entry_type: 'Journal Entry',
              items: [
                { account_id: ACC_BANK, debit: '100000.000000', credit: '0.000000' },
                { account_id: ACC_EQUITY, debit: '0.000000', credit: '100000.000000' },
              ],
            },
            context
          )
        ).id!,
        context
      );

      // 2. Sales Invoice: Debtors Debit 11,800, Income Credit 10,000, Output CGST 900, Output SGST 900
      await siService.submit(
        (
          await siService.create(
            {
              company_id: context.companyId,
              customer_id: CUSTOMER_ID,
              posting_date: '2026-10-15',
              due_date: '2026-10-30',
              items: [
                {
                  item_id: ITEM_ID,
                  item_code: 'ITM-001',
                  item_name: 'Product A',
                  qty: '1.000000',
                  uom_id: UOM_ID,
                  rate: '10000.000000',
                  cgst_rate: '9.000000',
                  cgst_amount: '900.000000',
                  sgst_rate: '9.000000',
                  sgst_amount: '900.000000',
                },
              ],
            },
            context
          )
        ).id!,
        context
      );

      // 3. Generate Trial Balance
      const tb = await reportsService.getTrialBalance(context, '2026-10-31');
      expect(tb.isBalanced).toBe(true);
      expect(tb.variance).toBe('0.00');
      expect(tb.totalDebit).toBe(tb.totalCredit);
      expect(tb.totalClosingDebit).toBe(tb.totalClosingCredit);
    });

    it('generates accurate Profit and Loss and Balance Sheet statements', async () => {
      // Post Equity vs Bank
      await jeService.submit(
        (
          await jeService.create(
            {
              company_id: context.companyId,
              posting_date: '2026-10-01',
              entry_type: 'Journal Entry',
              items: [
                { account_id: ACC_BANK, debit: '50000.000000', credit: '0.000000' },
                { account_id: ACC_EQUITY, debit: '0.000000', credit: '50000.000000' },
              ],
            },
            context
          )
        ).id!,
        context
      );

      // Post Revenue: Bank Debit 20,000, Income Credit 20,000
      await jeService.submit(
        (
          await jeService.create(
            {
              company_id: context.companyId,
              posting_date: '2026-10-10',
              entry_type: 'Journal Entry',
              items: [
                { account_id: ACC_BANK, debit: '20000.000000', credit: '0.000000' },
                { account_id: ACC_INCOME, debit: '0.000000', credit: '20000.000000' },
              ],
            },
            context
          )
        ).id!,
        context
      );

      // Post Expense: Expense Debit 6,000, Bank Credit 6,000
      await jeService.submit(
        (
          await jeService.create(
            {
              company_id: context.companyId,
              posting_date: '2026-10-15',
              entry_type: 'Journal Entry',
              items: [
                { account_id: ACC_EXPENSE, debit: '6000.000000', credit: '0.000000' },
                { account_id: ACC_BANK, debit: '0.000000', credit: '6000.000000' },
              ],
            },
            context
          )
        ).id!,
        context
      );

      // P&L Statement: Income = 20,000, Expense = 6,000, Net Profit = 14,000
      const pl = await reportsService.getProfitAndLoss(context, '2026-10-01', '2026-10-31');
      expect(pl.totalIncome).toBe('20000.00');
      expect(pl.totalExpense).toBe('6000.00');
      expect(pl.netProfit).toBe('14000.00');

      // Balance Sheet:
      // Assets: Bank = 50,000 + 20,000 - 6,000 = 64,000
      // Liabilities = 0
      // Equity: Share Capital = 50,000
      // Current Earnings = 14,000
      // Total Liabilities + Equity + Earnings = 64,000
      const bs = await reportsService.getBalanceSheet(context, '2026-10-31');
      expect(bs.totalAssets).toBe('64000.00');
      expect(bs.totalLiabilitiesAndEquity).toBe('64000.00');
      expect(bs.isBalanced).toBe(true);
      expect(bs.variance).toBe('0.00');
    });
  });
});
