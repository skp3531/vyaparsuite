import { z } from 'zod';

const decimalRegex = /^-?\d+(\.\d+)?$/;

// NIC E-Invoice JSON Schema v1.03 Data Structures
export const eInvoiceTranDtlsSchema = z.object({
  TaxSch: z.literal('GST').default('GST'),
  SupTyp: z.enum(['B2B', 'SEZWP', 'SEZWOP', 'EXPWP', 'EXPWOP', 'DEXP']).default('B2B'),
  RegRev: z.enum(['Y', 'N']).default('N'),
  EcmGstin: z.string().optional().nullable(),
  IgstOnIntra: z.enum(['Y', 'N']).default('N'),
});

export const eInvoiceDocDtlsSchema = z.object({
  Typ: z.enum(['INV', 'CRN', 'DBN']).default('INV'),
  No: z.string().max(16, 'Invoice number max 16 chars'),
  Dt: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date format DD/MM/YYYY'),
});

export const eInvoiceSellerDtlsSchema = z.object({
  Gstin: z.string().length(15),
  LglNm: z.string().max(100),
  TrdNm: z.string().max(100).optional().nullable(),
  Addr1: z.string().max(100),
  Addr2: z.string().max(100).optional().nullable(),
  Loc: z.string().max(50),
  Pin: z.number().int(),
  Stcd: z.string().length(2),
  Ph: z.string().optional().nullable(),
  Em: z.string().optional().nullable(),
});

export const eInvoiceBuyerDtlsSchema = z.object({
  Gstin: z.string().min(3).max(15),
  LglNm: z.string().max(100),
  TrdNm: z.string().max(100).optional().nullable(),
  Pos: z.string().length(2), // Place of supply state code
  Addr1: z.string().max(100),
  Addr2: z.string().max(100).optional().nullable(),
  Loc: z.string().max(50),
  Pin: z.number().int(),
  Stcd: z.string().length(2),
  Ph: z.string().optional().nullable(),
  Em: z.string().optional().nullable(),
});

export const eInvoiceItemDtlsSchema = z.object({
  SlNo: z.string(),
  PrdDesc: z.string().max(300),
  IsServc: z.enum(['Y', 'N']),
  HsnCd: z.string().min(2).max(8),
  Qty: z.number().optional().nullable(),
  Unit: z.string().optional().nullable(),
  UnitPrice: z.number(),
  TotAmt: z.number(),
  Discount: z.number().default(0),
  AssAmt: z.number(), // Taxable / Assessable amount
  GstRt: z.number(),
  IgstAmt: z.number().default(0),
  CgstAmt: z.number().default(0),
  SgstAmt: z.number().default(0),
  CesRt: z.number().default(0),
  CesAmt: z.number().default(0),
  TotItemVal: z.number(),
});

export const eInvoiceValDtlsSchema = z.object({
  AssVal: z.number(),
  CgstVal: z.number().default(0),
  SgstVal: z.number().default(0),
  IgstVal: z.number().default(0),
  CesVal: z.number().default(0),
  Discount: z.number().default(0),
  OthChrg: z.number().default(0),
  RndOffAmt: z.number().default(0),
  TotInvVal: z.number(),
});

export const eInvoicePayloadSchema = z.object({
  Version: z.literal('1.03').default('1.03'),
  TranDtls: eInvoiceTranDtlsSchema,
  DocDtls: eInvoiceDocDtlsSchema,
  SellerDtls: eInvoiceSellerDtlsSchema,
  BuyerDtls: eInvoiceBuyerDtlsSchema,
  ItemList: z.array(eInvoiceItemDtlsSchema),
  ValDtls: eInvoiceValDtlsSchema,
});

export type EInvoicePayload = z.infer<typeof eInvoicePayloadSchema>;

export const eInvoiceLogSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  company_id: z.string().uuid('Company is required'),
  sales_invoice_id: z.string().uuid('Sales Invoice ID is required'),
  invoice_number: z.string().min(1, 'Invoice number is required'),
  irn: z.string().length(64, 'IRN must be 64-character SHA-256 hash'),
  ack_number: z.string().optional().nullable(),
  ack_date: z.string().optional().nullable(),
  signed_invoice_json: z.string().optional().nullable(),
  signed_qr_code: z.string().optional().nullable(),
  status: z.enum(['Generated', 'Cancelled', 'Failed']).default('Generated'),
  cancellation_date: z.string().optional().nullable(),
  cancellation_reason: z.string().optional().nullable(),
  error_details: z.record(z.string(), z.unknown()).optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type EInvoiceLog = z.infer<typeof eInvoiceLogSchema>;
export type CreateEInvoiceLogInput = z.input<typeof eInvoiceLogSchema>;
