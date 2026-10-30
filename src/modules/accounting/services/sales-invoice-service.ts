import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { Decimal, sum } from '@/lib/utils/decimal';
import { NotFoundError, BusinessRuleError, CreditLimitExceededError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { GeneralLedgerService } from './general-ledger-service';
import {
  salesInvoiceSchema,
  type SalesInvoice,
  type CreateSalesInvoiceInput,
  type SalesInvoiceItem,
} from '../schemas/sales-invoice.schema';
import type { CreateGLEntryInput } from '../schemas/gl-entry.schema';
import type { Customer } from '@/modules/sales/schemas/customer.schema';
import type { SalesOrder, SalesOrderItem } from '@/modules/sales/schemas/order.schema';

export interface SalesInvoiceContext {
  tenantId: string;
  companyId: string;
  userId: string;
  roles: string[];
}

export class SalesInvoiceService {
  private namingService: NamingSeriesService;
  private glService: GeneralLedgerService;

  constructor(private db: IDatabaseAdapter) {
    this.namingService = new NamingSeriesService(db);
    this.glService = new GeneralLedgerService(db);
  }

  /**
   * Creates a Sales Invoice in Draft status.
   */
  async create(input: CreateSalesInvoiceInput, context: SalesInvoiceContext): Promise<SalesInvoice> {
    const validated = salesInvoiceSchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const invoiceNumber =
      validated.invoice_number ||
      (await this.namingService.getNextNumber('SINV-.YY.-.#####', {
        tenantId: context.tenantId,
        companyId: context.companyId,
        postingDate: validated.posting_date,
      }));

    let netTotal = Decimal.zero();
    let taxTotal = Decimal.zero();
    let grandTotal = Decimal.zero();
    const computedItems: Array<Record<string, unknown>> = [];

    for (const item of validated.items) {
      const qty = Decimal.from(item.qty);
      const rate = Decimal.from(item.rate);
      const lineNet = qty.multiply(rate).round(2);

      const cgst = Decimal.from(item.cgst_amount || '0');
      const sgst = Decimal.from(item.sgst_amount || '0');
      const igst = Decimal.from(item.igst_amount || '0');
      const cess = Decimal.from(item.cess_amount || '0');
      const lineTax = cgst.add(sgst).add(igst).add(cess);
      const lineTotal = lineNet.add(lineTax);

      netTotal = netTotal.add(lineNet);
      taxTotal = taxTotal.add(lineTax);
      grandTotal = grandTotal.add(lineTotal);

      computedItems.push({
        ...item,
        tenant_id: context.tenantId,
        qty: qty.toString(6),
        rate: rate.toString(6),
        net_amount: lineNet.toString(6),
        cgst_amount: cgst.toString(6),
        sgst_amount: sgst.toString(6),
        igst_amount: igst.toString(6),
        cess_amount: cess.toString(6),
        total_amount: lineTotal.toString(6),
        created_by: context.userId,
        updated_by: context.userId,
      });
    }

    const invData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      invoice_number: invoiceNumber,
      customer_id: validated.customer_id,
      customer_name: validated.customer_name || null,
      posting_date: validated.posting_date,
      due_date: validated.due_date,
      status: 'Draft',
      is_pos: validated.is_pos || false,
      is_return: validated.is_return || false,
      return_against_id: validated.return_against_id || null,
      currency: validated.currency,
      exchange_rate: validated.exchange_rate,
      net_total: netTotal.toString(6),
      tax_total: taxTotal.toString(6),
      grand_total: grandTotal.toString(6),
      outstanding_amount: grandTotal.toString(6),
      paid_amount: '0.000000',
      debit_to_account_id: validated.debit_to_account_id || null,
      cost_centre_id: validated.cost_centre_id || null,
      remarks: validated.remarks || null,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const created = await this.db.insert<SalesInvoice>('sales_invoice', invData);
    if (created.error || !created.data) {
      throw new Error(`Failed to create sales invoice: ${created.error?.message}`);
    }

    const invoiceId = created.data.id!;
    const savedItems: SalesInvoiceItem[] = [];

    for (const item of computedItems) {
      const itemRes = await this.db.insert<SalesInvoiceItem>('sales_invoice_item', {
        ...item,
        sales_invoice_id: invoiceId,
      });
      if (itemRes.data) {
        savedItems.push(itemRes.data);
      }
    }

    logger.info('Sales Invoice created in Draft status', {
      invoiceNumber,
      invoiceId,
      customer: validated.customer_id,
      grandTotal: grandTotal.toString(2),
    });

    return {
      ...created.data,
      items: savedItems,
    };
  }

  /**
   * Submits a Sales Invoice:
   * 1. Performs credit limit validation on Customer.
   * 2. Posts balanced double-entry rows to General Ledger (gl_entry).
   * 3. Increases Customer outstanding balance.
   * 4. Updates originating Sales Order billed quantities and status.
   */
  async submit(id: string, context: SalesInvoiceContext): Promise<SalesInvoice> {
    const inv = await this.getById(id, context);
    if (!inv) {
      throw new NotFoundError('Sales Invoice', id);
    }

    if (inv.status !== 'Draft') {
      throw new BusinessRuleError(`Cannot submit Sales Invoice with status '${inv.status}'`);
    }

    // 1. Validate Customer Credit Limit
    const custRes = await this.db.findById<Customer>('customer', inv.customer_id, {
      tenantId: context.tenantId,
    });
    if (custRes.data) {
      const cust = custRes.data;
      const creditLimit = Decimal.from(cust.credit_limit || '0');
      const currentOutstanding = Decimal.from(cust.total_outstanding || '0');
      const invoiceAmt = Decimal.from(inv.grand_total);

      if (creditLimit.greaterThan(Decimal.zero())) {
        const totalExposure = currentOutstanding.add(invoiceAmt);
        if (totalExposure.greaterThan(creditLimit)) {
          throw new CreditLimitExceededError(
            cust.customer_name,
            creditLimit.toString(2),
            totalExposure.toString(2)
          );
        }
      }
    }

    // 2. Prepare Double-Entry GL Postings
    // Default system GL accounts (or specified on customer / company)
    const receivableAccountId =
      inv.debit_to_account_id || '10000000-0000-4000-a000-000000000001'; // Debtors
    const incomeAccountId = '40000000-0000-4000-a000-000000000001'; // Sales Income
    const cgstAccountId = '20000000-0000-4000-a000-000000000001'; // Output CGST
    const sgstAccountId = '20000000-0000-4000-a000-000000000002'; // Output SGST
    const igstAccountId = '20000000-0000-4000-a000-000000000003'; // Output IGST

    const grandTotal = Decimal.from(inv.grand_total);
    const netTotal = Decimal.from(inv.net_total);

    let totalCgst = Decimal.zero();
    let totalSgst = Decimal.zero();
    let totalIgst = Decimal.zero();

    for (const item of inv.items) {
      totalCgst = totalCgst.add(Decimal.from(item.cgst_amount || '0'));
      totalSgst = totalSgst.add(Decimal.from(item.sgst_amount || '0'));
      totalIgst = totalIgst.add(Decimal.from(item.igst_amount || '0'));
    }

    const glEntries: CreateGLEntryInput[] = [];

    // Line 1: DEBIT Customer (Accounts Receivable) for Grand Total
    glEntries.push({
      tenant_id: context.tenantId,
      company_id: context.companyId,
      posting_date: inv.posting_date,
      account_id: receivableAccountId,
      party_type: 'Customer',
      party_id: inv.customer_id,
      debit: grandTotal.toString(6),
      credit: '0.000000',
      voucher_type: 'Sales Invoice' as const,
      voucher_id: inv.id!,
      voucher_number: inv.invoice_number!,
      remarks: `Sales Invoice ${inv.invoice_number} to ${inv.customer_name || 'Customer'}`,
    });

    // Line 2: CREDIT Sales Revenue for Net Total
    glEntries.push({
      tenant_id: context.tenantId,
      company_id: context.companyId,
      posting_date: inv.posting_date,
      account_id: incomeAccountId,
      debit: '0.000000',
      credit: netTotal.toString(6),
      voucher_type: 'Sales Invoice' as const,
      voucher_id: inv.id!,
      voucher_number: inv.invoice_number!,
      remarks: `Sales Revenue on ${inv.invoice_number}`,
    });

    // Line 3: CREDIT Output CGST (if applicable)
    if (totalCgst.greaterThan(Decimal.zero())) {
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: inv.posting_date,
        account_id: cgstAccountId,
        debit: '0.000000',
        credit: totalCgst.toString(6),
        voucher_type: 'Sales Invoice' as const,
        voucher_id: inv.id!,
        voucher_number: inv.invoice_number!,
        remarks: `CGST Output Liability on ${inv.invoice_number}`,
      });
    }

    // Line 4: CREDIT Output SGST (if applicable)
    if (totalSgst.greaterThan(Decimal.zero())) {
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: inv.posting_date,
        account_id: sgstAccountId,
        debit: '0.000000',
        credit: totalSgst.toString(6),
        voucher_type: 'Sales Invoice' as const,
        voucher_id: inv.id!,
        voucher_number: inv.invoice_number!,
        remarks: `SGST Output Liability on ${inv.invoice_number}`,
      });
    }

    // Line 5: CREDIT Output IGST (if applicable)
    if (totalIgst.greaterThan(Decimal.zero())) {
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: inv.posting_date,
        account_id: igstAccountId,
        debit: '0.000000',
        credit: totalIgst.toString(6),
        voucher_type: 'Sales Invoice' as const,
        voucher_id: inv.id!,
        voucher_number: inv.invoice_number!,
        remarks: `IGST Output Liability on ${inv.invoice_number}`,
      });
    }

    // 3. Post to General Ledger
    await this.glService.postEntries(glEntries, {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    });

    // 4. Update Customer total outstanding balance
    if (custRes.data) {
      const updatedOutstanding = Decimal.from(custRes.data.total_outstanding || '0').add(grandTotal);
      await this.db.update('customer', inv.customer_id, {
        total_outstanding: updatedOutstanding.toString(6),
        updated_at: new Date().toISOString(),
      });
    }

    // 5. Update linked Sales Order billed quantities
    for (const item of inv.items) {
      if (item.sales_order_item_id && item.sales_order_id) {
        const soItemRes = await this.db.findById<SalesOrderItem>(
          'sales_order_item',
          item.sales_order_item_id,
          { tenantId: context.tenantId }
        );

        if (soItemRes.data) {
          const currentBilled = Decimal.from(soItemRes.data.billed_qty || '0');
          const updatedBilled = currentBilled.add(Decimal.from(item.qty));

          await this.db.update('sales_order_item', item.sales_order_item_id, {
            billed_qty: updatedBilled.toString(6),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // Refresh Sales Order fulfillment percentage if linked
    const salesOrderIds = Array.from(
      new Set(inv.items.map((i) => i.sales_order_id).filter(Boolean) as string[])
    );
    for (const soId of salesOrderIds) {
      await this.refreshSalesOrderBilling(soId, context);
    }

    // 6. Update Invoice status to Submitted
    const updated = await this.db.update<SalesInvoice>('sales_invoice', id, {
      status: 'Submitted',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Sales Invoice submitted and posted to GL', {
      invoiceNumber: inv.invoice_number,
      invoiceId: inv.id,
      grandTotal: grandTotal.toString(2),
    });

    return {
      ...inv,
      ...updated.data,
      status: 'Submitted',
    };
  }

  /**
   * Cancels a Sales Invoice:
   * Reverses GL postings and rolls back customer outstanding.
   */
  async cancel(id: string, reason: string, context: SalesInvoiceContext): Promise<SalesInvoice> {
    const inv = await this.getById(id, context);
    if (!inv) {
      throw new NotFoundError('Sales Invoice', id);
    }

    if (inv.status !== 'Submitted') {
      throw new BusinessRuleError(`Cannot cancel Sales Invoice with status '${inv.status}'`);
    }

    // Fetch original GL entries for this invoice to reverse them cleanly
    const glRes = await this.glService.getEntries(
      {
        voucher_type: 'Sales Invoice' as const,
        voucher_id: inv.id!,
      },
      {
        tenantId: context.tenantId,
        companyId: context.companyId,
        userId: context.userId,
      }
    );

    const reversingEntries: CreateGLEntryInput[] = (glRes.data || []).map((e) => ({
      tenant_id: context.tenantId,
      company_id: context.companyId,
      posting_date: new Date().toISOString().split('T')[0],
      account_id: e.account_id,
      party_type: e.party_type || null,
      party_id: e.party_id || null,
      debit: e.credit, // SWAP
      credit: e.debit, // SWAP
      voucher_type: 'Sales Invoice' as const,
      voucher_id: inv.id!,
      voucher_number: inv.invoice_number!,
      is_cancelled: true,
      remarks: `Reversal of ${inv.invoice_number}: ${reason}`,
    }));

    if (reversingEntries.length > 0) {
      await this.glService.postEntries(reversingEntries, {
        tenantId: context.tenantId,
        companyId: context.companyId,
        userId: context.userId,
      });
    }

    // Roll back customer outstanding
    const custRes = await this.db.findById<Customer>('customer', inv.customer_id, {
      tenantId: context.tenantId,
    });
    if (custRes.data) {
      const grandTotal = Decimal.from(inv.grand_total);
      const currentOutstanding = Decimal.from(custRes.data.total_outstanding || '0');
      const reverted = currentOutstanding.subtract(grandTotal);
      await this.db.update('customer', inv.customer_id, {
        total_outstanding: (reverted.isNegative() ? Decimal.zero() : reverted).toString(6),
        updated_at: new Date().toISOString(),
      });
    }

    const updated = await this.db.update<SalesInvoice>('sales_invoice', id, {
      status: 'Cancelled',
      outstanding_amount: '0.000000',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Sales Invoice cancelled and GL reversed', {
      invoiceNumber: inv.invoice_number,
      invoiceId: inv.id,
      reason,
    });

    return {
      ...inv,
      ...updated.data,
      status: 'Cancelled',
    };
  }

  /**
   * Recalculates total billed percentage on linked Sales Order.
   */
  private async refreshSalesOrderBilling(salesOrderId: string, context: SalesInvoiceContext): Promise<void> {
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
    let totalBilled = Decimal.zero();

    for (const itm of items) {
      totalOrdered = totalOrdered.add(Decimal.from(itm.qty));
      totalBilled = totalBilled.add(Decimal.from(itm.billed_qty || '0'));
    }

    const billedPercent = totalOrdered.isZero()
      ? Decimal.from(100)
      : totalBilled.multiply(100).divide(totalOrdered).round(2);

    const soRes = await this.db.findById<SalesOrder>('sales_order', salesOrderId, {
      tenantId: context.tenantId,
    });

    let newStatus = soRes.data?.status || 'Approved';
    if (soRes.data) {
      const deliveredPercent = Decimal.from(soRes.data.delivered_percent || '0');
      if (deliveredPercent.greaterThanOrEqual(Decimal.from(100)) && billedPercent.greaterThanOrEqual(Decimal.from(100))) {
        newStatus = 'Completed';
      }
    }

    await this.db.update('sales_order', salesOrderId, {
      billed_percent: billedPercent.toString(2),
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Fetches Sales Invoice with lines.
   */
  async getById(id: string, contextOrTenantId: SalesInvoiceContext | string): Promise<SalesInvoice | null> {
    const tenantId = typeof contextOrTenantId === 'string' ? contextOrTenantId : contextOrTenantId.tenantId;
    const res = await this.db.findById<SalesInvoice>('sales_invoice', id, {
      tenantId,
    });
    if (!res.data) return null;

    const itemsRes = await this.db.findMany<SalesInvoiceItem>('sales_invoice_item', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'sales_invoice_id', operator: 'eq', value: id },
      ],
      tenantId,
    });

    return {
      ...res.data,
      items: itemsRes.data || [],
    };
  }

  /**
   * Lists Sales Invoices with pagination.
   */
  async list(
    options: { customerId?: string; status?: string; page?: number; pageSize?: number } = {},
    context: SalesInvoiceContext
  ): Promise<{ data: SalesInvoice[]; total: number }> {
    const filters = [{ column: 'tenant_id', operator: 'eq' as const, value: context.tenantId }];

    if (options.customerId) {
      filters.push({ column: 'customer_id', operator: 'eq' as const, value: options.customerId });
    }
    if (options.status) {
      filters.push({ column: 'status', operator: 'eq' as const, value: options.status });
    }

    const res = await this.db.findMany<SalesInvoice>('sales_invoice', {
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
