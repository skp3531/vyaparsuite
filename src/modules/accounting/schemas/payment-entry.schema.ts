import { z } from 'zod';

const decimalRegex = /^-?\d+(\.\d+)?$/;

export const paymentEntryReferenceSchema = z.object({
  id: z.string().uuid().optional(),
  reference_doctype: z.enum(['Sales Invoice', 'Purchase Invoice', 'Journal Entry', 'Sales Order', 'Purchase Order']),
  reference_id: z.string().uuid('Reference ID must be a valid UUID'),
  reference_number: z.string().optional(),
  total_amount: z.string().regex(decimalRegex).default('0.000000'),
  outstanding_amount: z.string().regex(decimalRegex).default('0.000000'),
  allocated_amount: z.string().regex(decimalRegex, 'Allocated amount must be positive'),
});

export type PaymentEntryReference = z.infer<typeof paymentEntryReferenceSchema>;
export type CreatePaymentEntryReferenceInput = z.input<typeof paymentEntryReferenceSchema>;

export const paymentEntrySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  company_id: z.string().uuid('Company is required'),
  payment_number: z.string().optional(),
  payment_type: z.enum(['Receive', 'Pay', 'Internal Transfer']).default('Receive'),
  party_type: z.enum(['Customer', 'Supplier', 'Employee']).optional().nullable(),
  party_id: z.string().uuid().optional().nullable(),
  party_name: z.string().optional().nullable(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  paid_from_account_id: z.string().uuid('Paid From Account is required'),
  paid_to_account_id: z.string().uuid('Paid To Account is required'),
  paid_amount: z.string().regex(decimalRegex, 'Paid amount must be decimal'),
  received_amount: z.string().regex(decimalRegex, 'Received amount must be decimal'),
  unallocated_amount: z.string().regex(decimalRegex).default('0.000000'),
  mode_of_payment: z.enum(['Bank Transfer', 'NEFT/RTGS', 'Cheque', 'Cash', 'UPI', 'Credit Card']).default('Bank Transfer'),
  reference_no: z.string().optional().nullable(),
  reference_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  status: z.enum(['Draft', 'Submitted', 'Cancelled']).default('Draft'),
  user_remark: z.string().optional().nullable(),
  references: z.array(paymentEntryReferenceSchema).optional().default([]),
});

export type PaymentEntry = z.infer<typeof paymentEntrySchema>;
export type CreatePaymentEntryInput = z.input<typeof paymentEntrySchema>;
