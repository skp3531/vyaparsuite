import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { NamingSeriesService } from '@/modules/core/services/naming-series-service';
import { Decimal, sum } from '@/lib/utils/decimal';
import { NotFoundError, BusinessRuleError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { GeneralLedgerService } from './general-ledger-service';
import {
  paymentEntrySchema,
  type PaymentEntry,
  type CreatePaymentEntryInput,
  type PaymentEntryReference,
} from '../schemas/payment-entry.schema';
import type { CreateGLEntryInput } from '../schemas/gl-entry.schema';
import type { SalesInvoice } from '../schemas/sales-invoice.schema';
import type { PurchaseInvoice } from '../schemas/purchase-invoice.schema';
import type { Customer } from '@/modules/sales/schemas/customer.schema';

export interface PaymentEntryContext {
  tenantId: string;
  companyId: string;
  userId: string;
  roles: string[];
}

export class PaymentEntryService {
  private namingService: NamingSeriesService;
  private glService: GeneralLedgerService;

  constructor(private db: IDatabaseAdapter) {
    this.namingService = new NamingSeriesService(db);
    this.glService = new GeneralLedgerService(db);
  }

  /**
   * Creates a Payment Entry in Draft status.
   */
  async create(input: CreatePaymentEntryInput, context: PaymentEntryContext): Promise<PaymentEntry> {
    const validated = paymentEntrySchema.parse({
      ...input,
      tenant_id: context.tenantId,
      company_id: context.companyId,
    });

    const seriesPrefix =
      validated.payment_type === 'Receive'
        ? 'REC-.YY.-.#####'
        : validated.payment_type === 'Pay'
        ? 'PAY-.YY.-.#####'
        : 'TRF-.YY.-.#####';

    const paymentNumber =
      validated.payment_number ||
      (await this.namingService.getNextNumber(seriesPrefix, {
        tenantId: context.tenantId,
        companyId: context.companyId,
        postingDate: validated.posting_date,
      }));

    const paidAmt = Decimal.from(validated.paid_amount);
    const receivedAmt = Decimal.from(validated.received_amount || validated.paid_amount);

    let allocatedTotal = Decimal.zero();
    const references = validated.references || [];
    for (const ref of references) {
      allocatedTotal = allocatedTotal.add(Decimal.from(ref.allocated_amount));
    }

    if (allocatedTotal.greaterThan(paidAmt)) {
      throw new BusinessRuleError(
        `Total allocated amount (${allocatedTotal.toString(2)}) cannot exceed paid amount (${paidAmt.toString(2)})`
      );
    }

    const unallocatedAmt = paidAmt.subtract(allocatedTotal);

    const peData: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: context.companyId,
      payment_number: paymentNumber,
      payment_type: validated.payment_type,
      party_type: validated.party_type || null,
      party_id: validated.party_id || null,
      party_name: validated.party_name || null,
      posting_date: validated.posting_date,
      paid_from_account_id: validated.paid_from_account_id,
      paid_to_account_id: validated.paid_to_account_id,
      paid_amount: paidAmt.toString(6),
      received_amount: receivedAmt.toString(6),
      unallocated_amount: unallocatedAmt.toString(6),
      mode_of_payment: validated.mode_of_payment,
      reference_no: validated.reference_no || null,
      reference_date: validated.reference_date || null,
      status: 'Draft',
      user_remark: validated.user_remark || null,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const res = await this.db.insert<PaymentEntry>('payment_entry', peData);
    if (res.error || !res.data) {
      throw new BusinessRuleError(`Failed to create payment entry: ${res.error?.message}`);
    }

    const createdPE = res.data;

    for (const ref of references) {
      await this.db.insert<PaymentEntryReference>('payment_entry_reference', {
        tenant_id: context.tenantId,
        payment_entry_id: createdPE.id!,
        reference_doctype: ref.reference_doctype,
        reference_id: ref.reference_id,
        reference_number: ref.reference_number || null,
        total_amount: Decimal.from(ref.total_amount || '0').toString(6),
        outstanding_amount: Decimal.from(ref.outstanding_amount || '0').toString(6),
        allocated_amount: Decimal.from(ref.allocated_amount).toString(6),
        created_by: context.userId,
        updated_by: context.userId,
      });
    }

    return this.getById(createdPE.id!, context.tenantId);
  }

  /**
   * Retrieves a Payment Entry along with its allocated invoice references.
   */
  async getById(id: string, tenantId: string): Promise<PaymentEntry> {
    const peRes = await this.db.findById<PaymentEntry>('payment_entry', id, { tenantId });
    if (!peRes.data) {
      throw new NotFoundError('Payment Entry', id);
    }

    const refRes = await this.db.findMany<PaymentEntryReference>('payment_entry_reference', {
      tenantId,
      filters: [{ column: 'payment_entry_id', operator: 'eq', value: id }],
    });

    return {
      ...peRes.data,
      references: refRes.data || [],
    };
  }

  /**
   * Lists Payment Entries with filtering and pagination.
   */
  async list(
    options: {
      page?: number;
      pageSize?: number;
      paymentType?: string;
      partyType?: string;
      partyId?: string;
      status?: string;
    },
    tenantId: string
  ): Promise<{ data: PaymentEntry[]; count: number }> {
    const filters: Array<{ column: string; operator: any; value: any }> = [];

    if (options.paymentType) {
      filters.push({ column: 'payment_type', operator: 'eq', value: options.paymentType });
    }
    if (options.partyType) {
      filters.push({ column: 'party_type', operator: 'eq', value: options.partyType });
    }
    if (options.partyId) {
      filters.push({ column: 'party_id', operator: 'eq', value: options.partyId });
    }
    if (options.status) {
      filters.push({ column: 'status', operator: 'eq', value: options.status });
    }

    const res = await this.db.findMany<PaymentEntry>('payment_entry', {
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
   * Submits a Payment Entry, updates invoice balances, and posts GL entries.
   */
  async submit(id: string, context: PaymentEntryContext): Promise<PaymentEntry> {
    const pe = await this.getById(id, context.tenantId);

    if (pe.status !== 'Draft') {
      throw new BusinessRuleError(
        `Cannot submit payment entry in '${pe.status}' status. Only Draft entries can be submitted.`
      );
    }

    const paidAmt = Decimal.from(pe.paid_amount);
    const receivedAmt = Decimal.from(pe.received_amount);

    if (paidAmt.lessThanOrEqual(Decimal.zero())) {
      throw new BusinessRuleError('Payment amount must be greater than zero.');
    }

    const glEntries: CreateGLEntryInput[] = [];

    if (pe.payment_type === 'Receive') {
      // Inward Customer Receipt
      // DEBIT: Bank / Cash Account (paid_to_account_id)
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: pe.posting_date,
        account_id: pe.paid_to_account_id,
        debit: receivedAmt.toString(6),
        credit: '0.000000',
        voucher_type: 'Payment Entry' as const,
        voucher_id: pe.id!,
        voucher_number: pe.payment_number!,
        remarks: `Receipt ${pe.payment_number} via ${pe.mode_of_payment} from ${pe.party_name || 'Customer'}`,
      });

      // CREDIT: Customer Receivable (paid_from_account_id)
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: pe.posting_date,
        account_id: pe.paid_from_account_id,
        party_type: 'Customer',
        party_id: pe.party_id || undefined,
        debit: '0.000000',
        credit: paidAmt.toString(6),
        voucher_type: 'Payment Entry' as const,
        voucher_id: pe.id!,
        voucher_number: pe.payment_number!,
        remarks: `Customer payment received on ${pe.payment_number}`,
      });
    } else if (pe.payment_type === 'Pay') {
      // Outward Supplier / Expense Payment
      // DEBIT: Supplier Payable (paid_to_account_id)
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: pe.posting_date,
        account_id: pe.paid_to_account_id,
        party_type: 'Supplier',
        party_id: pe.party_id || undefined,
        debit: paidAmt.toString(6),
        credit: '0.000000',
        voucher_type: 'Payment Entry' as const,
        voucher_id: pe.id!,
        voucher_number: pe.payment_number!,
        remarks: `Payment to ${pe.party_name || 'Vendor'} via ${pe.mode_of_payment}`,
      });

      // CREDIT: Bank / Cash Account (paid_from_account_id)
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: pe.posting_date,
        account_id: pe.paid_from_account_id,
        debit: '0.000000',
        credit: receivedAmt.toString(6),
        voucher_type: 'Payment Entry' as const,
        voucher_id: pe.id!,
        voucher_number: pe.payment_number!,
        remarks: `Disbursement ${pe.payment_number}`,
      });
    } else if (pe.payment_type === 'Internal Transfer') {
      // Contra Bank-to-Bank or Bank-to-Cash Transfer
      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: pe.posting_date,
        account_id: pe.paid_to_account_id,
        debit: receivedAmt.toString(6),
        credit: '0.000000',
        voucher_type: 'Payment Entry' as const,
        voucher_id: pe.id!,
        voucher_number: pe.payment_number!,
        remarks: `Internal Transfer ${pe.payment_number} to target account`,
      });

      glEntries.push({
        tenant_id: context.tenantId,
        company_id: context.companyId,
        posting_date: pe.posting_date,
        account_id: pe.paid_from_account_id,
        debit: '0.000000',
        credit: paidAmt.toString(6),
        voucher_type: 'Payment Entry' as const,
        voucher_id: pe.id!,
        voucher_number: pe.payment_number!,
        remarks: `Internal Transfer ${pe.payment_number} from source account`,
      });
    }

    // Post to General Ledger
    await this.glService.postEntries(glEntries, {
      tenantId: context.tenantId,
      companyId: context.companyId,
      userId: context.userId,
    });

    // Allocate payment against referenced invoices
    if (pe.references && pe.references.length > 0) {
      for (const ref of pe.references) {
        const allocAmt = Decimal.from(ref.allocated_amount);

        if (ref.reference_doctype === 'Sales Invoice') {
          const invRes = await this.db.findById<SalesInvoice>('sales_invoice', ref.reference_id, {
            tenantId: context.tenantId,
          });

          if (invRes.data) {
            const currentPaid = Decimal.from(invRes.data.paid_amount || '0');
            const newPaid = currentPaid.add(allocAmt);
            const grandTotal = Decimal.from(invRes.data.grand_total);
            const newOutstanding = grandTotal.subtract(newPaid);
            const finalOutstanding = newOutstanding.lessThan(Decimal.zero()) ? Decimal.zero() : newOutstanding;

            const nextStatus =
              finalOutstanding.isZero()
                ? 'Paid'
                : newPaid.greaterThan(Decimal.zero())
                ? 'Partially Paid'
                : invRes.data.status;

            await this.db.update('sales_invoice', ref.reference_id, {
              paid_amount: newPaid.toString(6),
              outstanding_amount: finalOutstanding.toString(6),
              status: nextStatus,
              updated_at: new Date().toISOString(),
            });

            // Update customer outstanding balance
            if (invRes.data.customer_id) {
              const custRes = await this.db.findById<Customer>('customer', invRes.data.customer_id, {
                tenantId: context.tenantId,
              });
              if (custRes.data) {
                const currentCustOut = Decimal.from(custRes.data.total_outstanding || '0');
                const updatedCustOut = currentCustOut.subtract(allocAmt);
                await this.db.update('customer', invRes.data.customer_id, {
                  total_outstanding: (updatedCustOut.lessThan(Decimal.zero()) ? Decimal.zero() : updatedCustOut).toString(6),
                  updated_at: new Date().toISOString(),
                });
              }
            }
          }
        } else if (ref.reference_doctype === 'Purchase Invoice') {
          const pInvRes = await this.db.findById<PurchaseInvoice>('purchase_invoice', ref.reference_id, {
            tenantId: context.tenantId,
          });

          if (pInvRes.data) {
            const currentPaid = Decimal.from(pInvRes.data.paid_amount || '0');
            const newPaid = currentPaid.add(allocAmt);
            const grandTotal = Decimal.from(pInvRes.data.grand_total);
            const tdsAmount = Decimal.from(pInvRes.data.tds_amount || '0');
            const netPayable = grandTotal.subtract(tdsAmount);
            const newOutstanding = netPayable.subtract(newPaid);
            const finalOutstanding = newOutstanding.lessThan(Decimal.zero()) ? Decimal.zero() : newOutstanding;

            const nextStatus =
              finalOutstanding.isZero()
                ? 'Paid'
                : newPaid.greaterThan(Decimal.zero())
                ? 'Partially Paid'
                : pInvRes.data.status;

            await this.db.update('purchase_invoice', ref.reference_id, {
              paid_amount: newPaid.toString(6),
              outstanding_amount: finalOutstanding.toString(6),
              status: nextStatus,
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Update status to Submitted
    await this.db.update<PaymentEntry>('payment_entry', id, {
      status: 'Submitted',
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Payment Entry submitted and posted to GL', {
      paymentNumber: pe.payment_number,
      paymentId: pe.id,
      paymentType: pe.payment_type,
      paidAmount: paidAmt.toString(2),
    });

    return this.getById(id, context.tenantId);
  }

  /**
   * Cancels a submitted Payment Entry and reverses invoice allocations and GL postings.
   */
  async cancel(
    id: string,
    cancellationReason: string,
    context: PaymentEntryContext
  ): Promise<PaymentEntry> {
    const pe = await this.getById(id, context.tenantId);

    if (pe.status !== 'Submitted') {
      throw new BusinessRuleError(
        `Cannot cancel payment entry in '${pe.status}' status. Only Submitted entries can be cancelled.`
      );
    }

    // Reverse GL entries
    await this.glService.reverseEntries(
      pe.id!,
      'Payment Entry',
      cancellationReason || `Cancellation of Payment Entry ${pe.payment_number}`,
      {
        tenantId: context.tenantId,
        companyId: context.companyId,
        userId: context.userId,
      }
    );

    // Rollback invoice allocations
    if (pe.references && pe.references.length > 0) {
      for (const ref of pe.references) {
        const allocAmt = Decimal.from(ref.allocated_amount);

        if (ref.reference_doctype === 'Sales Invoice') {
          const invRes = await this.db.findById<SalesInvoice>('sales_invoice', ref.reference_id, {
            tenantId: context.tenantId,
          });

          if (invRes.data) {
            const currentPaid = Decimal.from(invRes.data.paid_amount || '0');
            const restoredPaid = currentPaid.subtract(allocAmt);
            const finalPaid = restoredPaid.lessThan(Decimal.zero()) ? Decimal.zero() : restoredPaid;

            const grandTotal = Decimal.from(invRes.data.grand_total);
            const restoredOutstanding = grandTotal.subtract(finalPaid);

            const nextStatus =
              restoredOutstanding.isZero()
                ? 'Paid'
                : finalPaid.greaterThan(Decimal.zero())
                ? 'Partially Paid'
                : 'Submitted';

            await this.db.update('sales_invoice', ref.reference_id, {
              paid_amount: finalPaid.toString(6),
              outstanding_amount: restoredOutstanding.toString(6),
              status: nextStatus,
              updated_at: new Date().toISOString(),
            });

            // Restore customer outstanding balance
            if (invRes.data.customer_id) {
              const custRes = await this.db.findById<Customer>('customer', invRes.data.customer_id, {
                tenantId: context.tenantId,
              });
              if (custRes.data) {
                const currentCustOut = Decimal.from(custRes.data.total_outstanding || '0');
                const restoredCustOut = currentCustOut.add(allocAmt);
                await this.db.update('customer', invRes.data.customer_id, {
                  total_outstanding: restoredCustOut.toString(6),
                  updated_at: new Date().toISOString(),
                });
              }
            }
          }
        } else if (ref.reference_doctype === 'Purchase Invoice') {
          const pInvRes = await this.db.findById<PurchaseInvoice>('purchase_invoice', ref.reference_id, {
            tenantId: context.tenantId,
          });

          if (pInvRes.data) {
            const currentPaid = Decimal.from(pInvRes.data.paid_amount || '0');
            const restoredPaid = currentPaid.subtract(allocAmt);
            const finalPaid = restoredPaid.lessThan(Decimal.zero()) ? Decimal.zero() : restoredPaid;

            const grandTotal = Decimal.from(pInvRes.data.grand_total);
            const tdsAmount = Decimal.from(pInvRes.data.tds_amount || '0');
            const netPayable = grandTotal.subtract(tdsAmount);
            const restoredOutstanding = netPayable.subtract(finalPaid);

            const nextStatus =
              restoredOutstanding.isZero()
                ? 'Paid'
                : finalPaid.greaterThan(Decimal.zero())
                ? 'Partially Paid'
                : 'Submitted';

            await this.db.update('purchase_invoice', ref.reference_id, {
              paid_amount: finalPaid.toString(6),
              outstanding_amount: restoredOutstanding.toString(6),
              status: nextStatus,
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    await this.db.update<PaymentEntry>('payment_entry', id, {
      status: 'Cancelled',
      user_remark: pe.user_remark
        ? `${pe.user_remark} | Cancelled: ${cancellationReason}`
        : `Cancelled: ${cancellationReason}`,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Payment Entry cancelled', {
      paymentNumber: pe.payment_number,
      cancellationReason,
    });

    return this.getById(id, context.tenantId);
  }
}
