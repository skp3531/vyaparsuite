import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { Decimal, sum } from '@/lib/utils/decimal';
import { NotFoundError, BusinessRuleError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { GeneralLedgerService } from './general-ledger-service';
import {
  purchaseInvoiceSchema,
  type PurchaseInvoice,
  type CreatePurchaseInvoiceInput,
  type PurchaseInvoiceItem,
} from '../schemas/purchase-invoice.schema';
import type { CreateGLEntryInput } from '../schemas/gl-entry.schema';
import type { PurchaseOrder, PurchaseOrderItem } from '@/modules/purchase/schemas/purchase-order.schema';

export interface PurchaseInvoiceContext {
  tenantId: string;
  companyId: string;
  userId: string;
  roles: string[];
}

export class PurchaseInvoiceService {
  private namingService: NamingSeriesService;
  private glService: GeneralLedgerService;

  constructor(private db: IDatabaseAdapter) {
    this.namingService = new NamingSeriesService(db);
    this.glService = new GeneralLedgerService(db);
  }

  /**
   * Creates a Purchase Invoice (Vendor Bill) in Draft status.
   */
  async create(input: CreatePurchaseInvoiceInput, context: PurchaseInvoiceContext): Promise<PurchaseInvoice> {
    const validated = purchaseInvoiceSchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const invoiceNumber =
      validated.invoice_number ||
      (await this.namingService.getNextNumber('PINV-.YY.-.#####', {
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
      const lineTax = cgst.add(sgst).add(igst);
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
        total_amount: lineTotal.toString(6),
        created_by: context.userId,
        updated_by: context.userId,
      });
    }

    const tdsRate = Decimal.from(validated.tds_rate || '0');
    let tdsAmount = Decimal.from(validated.tds_amount || '0');
    if (tdsRate.greaterThan(Decimal.zero()) && tdsAmount.isZero()) {
      tdsAmount = netTotal.multiply(tdsRate).divide(100).round(2);
    }

    const netPayable = grandTotal.subtract(tdsAmount);

    const invData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      invoice_number: invoiceNumber,
      bill_number: validated.bill_number || null,
      bill_date: validated.bill_date || null,
      supplier_id: validated.supplier_id,
      supplier_name: validated.supplier_name || null,
      posting_date: validated.posting_date,
      due_date: validated.due_date,
      status: 'Draft',
      currency: validated.currency,
      exchange_rate: validated.exchange_rate,
      net_total: netTotal.toString(6),
      tax_total: taxTotal.toString(6),
      grand_total: grandTotal.toString(6),
      outstanding_amount: netPayable.toString(6),
      paid_amount: '0.000000',
      tds_category_id: validated.tds_category_id || null,
      tds_rate: tdsRate.toString(6),
      tds_amount: tdsAmount.toString(6),
      credit_to_account_id: validated.credit_to_account_id || null,
      remarks: validated.remarks || null,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const res = await this.db.insert<PurchaseInvoice>('purchase_invoice', invData);
    if (res.error || !res.data) {
      throw new BusinessRuleError(`Failed to create purchase invoice: ${res.error?.message}`);
    }

    const createdInvoice = res.data;

    for (const item of computedItems) {
      await this.db.insert<PurchaseInvoiceItem>('purchase_invoice_item', {
        ...item,
        purchase_invoice_id: createdInvoice.id,
      });
    }

    return this.getById(createdInvoice.id!, context.tenantId);
  }

  /**
   * Retrieves a Purchase Invoice with its child items.
   */
  async getById(id: string, tenantId: string): Promise<PurchaseInvoice> {
    const invRes = await this.db.findById<PurchaseInvoice>('purchase_invoice', id, { tenantId });
    if (!invRes.data) {
      throw new NotFoundError('Purchase Invoice', id);
    }

    const itemsRes = await this.db.findMany<PurchaseInvoiceItem>('purchase_invoice_item', {
      tenantId,
      filters: [{ column: 'purchase_invoice_id', operator: 'eq', value: id }],
    });

    return {
      ...invRes.data,
      items: itemsRes.data || [],
    };
  }

  /**
   * Lists Purchase Invoices with optional filters and pagination.
   */
  async list(
    options: {
      page?: number;
      pageSize?: number;
      supplierId?: string;
      status?: string;
    },
    tenantId: string
  ): Promise<{ data: PurchaseInvoice[]; count: number }> {
    const filters: Array<{ column: string; operator: any; value: any }> = [];

    if (options.supplierId) {
      filters.push({ column: 'supplier_id', operator: 'eq', value: options.supplierId });
    }
    if (options.status) {
      filters.push({ column: 'status', operator: 'eq', value: options.status });
    }

    const res = await this.db.findMany<PurchaseInvoice>('purchase_invoice', {
      tenantId,
      filters,
      pagination: {
        page: options.page || 1,
        pageSize: options.pageSize || 20,
      },
      sort: [{ column: 'posting_date', direction: 'desc' }],
    });

    return {
      data: res.data || [],
      count: res.count || 0,
    };
  }

  /**
   * Submits a Purchase Invoice and posts balanced GL entries.
   * Procure-to-Pay Accounting Entries:
   *  DEBIT  Expense / Asset Stock (Net Amount)
   *  DEBIT  Input CGST ITC (if applicable)
   *  DEBIT  Input SGST ITC (if applicable)
   *  DEBIT  Input IGST ITC (if applicable)
   *  CREDIT TDS Payable (if TDS deducted)
   *  CREDIT Supplier Accounts Payable (Grand Total - TDS)
   */
  async submit(id: string, context: PurchaseInvoiceContext): Promise<PurchaseInvoice> {
    const inv = await this.getById(id, context.tenantId);

    if (inv.status !== 'Draft') {
      throw new BusinessRuleError(
        `Cannot submit purchase invoice in '${inv.status}' status. Only Draft invoices can be submitted.`
      );
    }

    const payableAccountId =
      inv.credit_to_account_id || '20000000-0000-4000-a000-000000000005'; // Creditors / Accounts Payable
    const defaultExpenseAccountId = '50000000-0000-4000-a000-000000000001'; // Cost of Goods Sold / Purchase Expense
    const inputCgstAccountId = '10000000-0000-4000-a000-000000000002'; // Input CGST ITC
    const inputSgstAccountId = '10000000-0000-4000-a000-000000000003'; // Input SGST ITC
    const inputIgstAccountId = '10000000-0000-4000-a000-000000000004'; // Input IGST ITC
    const tdsPayableAccountId = '20000000-0000-4000-a000-000000000004'; // TDS Payable

    const grandTotal = Decimal.from(inv.grand_total);
    const netTotal = Decimal.from(inv.net_total);
    const tdsAmount = Decimal.from(inv.tds_amount || '0');
    const netPayable = grandTotal.subtract(tdsAmount);

    let totalCgst = Decimal.zero();
    let totalSgst = Decimal.zero();
    let totalIgst = Decimal.zero();

    for (const item of inv.items) {
      totalCgst = totalCgst.add(Decimal.from(item.cgst_amount || '0'));
      totalSgst = totalSgst.add(Decimal.from(item.sgst_amount || '0'));
      totalIgst = totalIgst.add(Decimal.from(item.igst_amount || '0'));
    }

    const glEntries: CreateGLEntryInput[] = [];

    // Line 1: DEBIT Expense Account for Net Total
    glEntries.push({
      tenant_id: context.tenantId,
      company_id: context.companyId,
      posting_date: inv.posting_date,
      account_id: defaultExpenseAccountId,
      party_type: 'Supplier',
      party_id: inv.supplier_id,
      debit: netTotal.toString(6),
      credit: '0.000000',
      voucher_type: 'Purchase Invoice' as const,
      voucher_id: inv.id!,
      voucher_number: inv.invoice_number!,
      remarks: `Purchase Expense on ${inv.invoice_number} from ${inv.supplier_name || 'Vendor'}`,
    });

    // Line 2: DEBIT Input CGST (if applicable)
    if (totalCgst.greaterThan(Decimal.zero())) {
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: inv.posting_date,
        account_id: inputCgstAccountId,
        debit: totalCgst.toString(6),
        credit: '0.000000',
        voucher_type: 'Purchase Invoice' as const,
        voucher_id: inv.id!,
        voucher_number: inv.invoice_number!,
        remarks: `Input CGST ITC on ${inv.invoice_number}`,
      });
    }

    // Line 3: DEBIT Input SGST (if applicable)
    if (totalSgst.greaterThan(Decimal.zero())) {
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: inv.posting_date,
        account_id: inputSgstAccountId,
        debit: totalSgst.toString(6),
        credit: '0.000000',
        voucher_type: 'Purchase Invoice' as const,
        voucher_id: inv.id!,
        voucher_number: inv.invoice_number!,
        remarks: `Input SGST ITC on ${inv.invoice_number}`,
      });
    }

    // Line 4: DEBIT Input IGST (if applicable)
    if (totalIgst.greaterThan(Decimal.zero())) {
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: inv.posting_date,
        account_id: inputIgstAccountId,
        debit: totalIgst.toString(6),
        credit: '0.000000',
        voucher_type: 'Purchase Invoice' as const,
        voucher_id: inv.id!,
        voucher_number: inv.invoice_number!,
        remarks: `Input IGST ITC on ${inv.invoice_number}`,
      });
    }

    // Line 5: CREDIT TDS Payable (if applicable)
    if (tdsAmount.greaterThan(Decimal.zero())) {
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: inv.posting_date,
        account_id: tdsPayableAccountId,
        debit: '0.000000',
        credit: tdsAmount.toString(6),
        voucher_type: 'Purchase Invoice' as const,
        voucher_id: inv.id!,
        voucher_number: inv.invoice_number!,
        remarks: `TDS Deduction on ${inv.invoice_number}`,
      });
    }

    // Line 6: CREDIT Supplier Accounts Payable for Net Payable
    glEntries.push({
      tenant_id: context.tenantId,
      company_id: context.companyId,
      posting_date: inv.posting_date,
      account_id: payableAccountId,
      party_type: 'Supplier',
      party_id: inv.supplier_id,
      debit: '0.000000',
      credit: netPayable.toString(6),
      voucher_type: 'Purchase Invoice' as const,
      voucher_id: inv.id!,
      voucher_number: inv.invoice_number!,
      remarks: `Accounts Payable for Bill ${inv.bill_number || inv.invoice_number}`,
    });

    // Post Double-Entry vouchers
    await this.glService.postEntries(glEntries, {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    });

    // Update Purchase Order billed quantities if linked
    for (const item of inv.items) {
      if (item.purchase_order_item_id && item.purchase_order_id) {
        const poItemRes = await this.db.findById<PurchaseOrderItem>(
          'purchase_order_item',
          item.purchase_order_item_id,
          { tenantId: context.tenantId }
        );

        if (poItemRes.data) {
          const currentBilled = Decimal.from((poItemRes.data as any).billed_qty || '0');
          const updatedBilled = currentBilled.add(Decimal.from(item.qty));

          await this.db.update('purchase_order_item', item.purchase_order_item_id, {
            billed_qty: updatedBilled.toString(6),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    // Refresh PO billed percentage
    const poIds = Array.from(
      new Set(inv.items.map((i) => i.purchase_order_id).filter(Boolean) as string[])
    );
    for (const poId of poIds) {
      await this.refreshPurchaseOrderBilling(poId, context);
    }

    // Update status to Submitted
    await this.db.update<PurchaseInvoice>('purchase_invoice', id, {
      status: 'Submitted',
      outstanding_amount: netPayable.toString(6),
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Purchase Invoice submitted and posted to GL', {
      invoiceNumber: inv.invoice_number,
      invoiceId: inv.id,
      netTotal: netTotal.toString(2),
      grandTotal: grandTotal.toString(2),
      netPayable: netPayable.toString(2),
      tdsAmount: tdsAmount.toString(2),
    });

    return this.getById(id, context.tenantId);
  }

  /**
   * Cancels a submitted Purchase Invoice and creates reversing GL entries.
   */
  async cancel(
    id: string,
    cancellationReason: string,
    context: PurchaseInvoiceContext
  ): Promise<PurchaseInvoice> {
    const inv = await this.getById(id, context.tenantId);

    if (inv.status !== 'Submitted') {
      throw new BusinessRuleError(
        `Cannot cancel purchase invoice in '${inv.status}' status. Only Submitted invoices can be cancelled.`
      );
    }

    if (Decimal.from(inv.paid_amount || '0').greaterThan(Decimal.zero())) {
      throw new BusinessRuleError(
        `Cannot cancel invoice ${inv.invoice_number}: Payments of ${inv.paid_amount} have been allocated. Unallocate payments first.`
      );
    }

    // Reverse GL entries
    await this.glService.reverseEntries(
      inv.id!,
      'Purchase Invoice',
      cancellationReason || `Cancellation of Purchase Invoice ${inv.invoice_number}`,
      {
        tenantId: context.tenantId,
        companyId: context.companyId,
        userId: context.userId,
      }
    );

    // Rollback Purchase Order billed quantities
    for (const item of inv.items) {
      if (item.purchase_order_item_id && item.purchase_order_id) {
        const poItemRes = await this.db.findById<PurchaseOrderItem>(
          'purchase_order_item',
          item.purchase_order_item_id,
          { tenantId: context.tenantId }
        );

        if (poItemRes.data) {
          const currentBilled = Decimal.from((poItemRes.data as any).billed_qty || '0');
          const updatedBilled = currentBilled.subtract(Decimal.from(item.qty));
          const finalBilled = updatedBilled.lessThan(Decimal.zero()) ? Decimal.zero() : updatedBilled;

          await this.db.update('purchase_order_item', item.purchase_order_item_id, {
            billed_qty: finalBilled.toString(6),
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    const poIds = Array.from(
      new Set(inv.items.map((i) => i.purchase_order_id).filter(Boolean) as string[])
    );
    for (const poId of poIds) {
      await this.refreshPurchaseOrderBilling(poId, context);
    }

    await this.db.update<PurchaseInvoice>('purchase_invoice', id, {
      status: 'Cancelled',
      outstanding_amount: '0.000000',
      remarks: inv.remarks ? `${inv.remarks} | Cancelled: ${cancellationReason}` : `Cancelled: ${cancellationReason}`,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Purchase Invoice cancelled', {
      invoiceNumber: inv.invoice_number,
      cancellationReason,
    });

    return this.getById(id, context.tenantId);
  }

  /**
   * Recalculates and updates the cumulative billed percentage on a Purchase Order.
   */
  private async refreshPurchaseOrderBilling(purchaseOrderId: string, context: PurchaseInvoiceContext): Promise<void> {
    const poRes = await this.db.findById<PurchaseOrder>('purchase_order', purchaseOrderId, {
      tenantId: context.tenantId,
    });
    if (!poRes.data) return;

    const po = poRes.data;
    const poItemsRes = await this.db.findMany<PurchaseOrderItem>('purchase_order_item', {
      tenantId: context.tenantId,
      filters: [{ column: 'purchase_order_id', operator: 'eq', value: purchaseOrderId }],
    });

    if (!poItemsRes.data || poItemsRes.data.length === 0) return;

    let totalOrdered = Decimal.zero();
    let totalBilled = Decimal.zero();

    for (const item of poItemsRes.data) {
      totalOrdered = totalOrdered.add(Decimal.from(item.qty));
      totalBilled = totalBilled.add(Decimal.from((item as any).billed_qty || '0'));
    }

    let billedPercent = Decimal.zero();
    if (totalOrdered.greaterThan(Decimal.zero())) {
      billedPercent = totalBilled.multiply(100).divide(totalOrdered).round(2);
    }

    const receivedPercent = Decimal.from(po.received_percent || '0');
    let nextStatus = po.status;

    if (receivedPercent.greaterThanOrEqual(Decimal.from(100)) && billedPercent.greaterThanOrEqual(Decimal.from(100))) {
      nextStatus = 'Completed';
    } else if (billedPercent.greaterThanOrEqual(Decimal.from(100))) {
      nextStatus = 'To Receive';
    } else if (receivedPercent.greaterThanOrEqual(Decimal.from(100))) {
      nextStatus = 'To Bill';
    }

    await this.db.update('purchase_order', purchaseOrderId, {
      billed_percent: billedPercent.toString(6),
      status: nextStatus,
      updated_at: new Date().toISOString(),
    });
  }
}
