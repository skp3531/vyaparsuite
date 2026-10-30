/**
 * VyaparSuite Core Document Types
 * 
 * Every business document in the system extends BaseDocument.
 * This provides consistent metadata, lifecycle management,
 * audit trail, and workflow support across ALL modules.
 */

// Document lifecycle states
export enum DocumentStatus {
  Draft = 'draft',
  PendingApproval = 'pending_approval',
  Approved = 'approved',
  Rejected = 'rejected',
  Submitted = 'submitted',
  Posted = 'posted',
  PartiallyFulfilled = 'partially_fulfilled',
  Fulfilled = 'fulfilled',
  Closed = 'closed',
  OnHold = 'on_hold',
  Cancelled = 'cancelled',
  Amended = 'amended',
}

// Document workflow actions
export enum DocumentAction {
  Save = 'save',
  Submit = 'submit',
  Approve = 'approve',
  Reject = 'reject',
  Post = 'post',
  Hold = 'hold',
  Resume = 'resume',
  Cancel = 'cancel',
  Amend = 'amend',
  Close = 'close',
  Reopen = 'reopen',
}

// Valid state transitions
export const VALID_TRANSITIONS: Record<DocumentStatus, DocumentAction[]> = {
  [DocumentStatus.Draft]: [DocumentAction.Submit, DocumentAction.Save],
  [DocumentStatus.PendingApproval]: [DocumentAction.Approve, DocumentAction.Reject, DocumentAction.Hold],
  [DocumentStatus.Approved]: [DocumentAction.Post, DocumentAction.Hold],
  [DocumentStatus.Rejected]: [DocumentAction.Submit], // Resubmit
  [DocumentStatus.Submitted]: [DocumentAction.Approve, DocumentAction.Post, DocumentAction.Reject, DocumentAction.Hold],
  [DocumentStatus.Posted]: [DocumentAction.Cancel, DocumentAction.Close],
  [DocumentStatus.PartiallyFulfilled]: [DocumentAction.Close, DocumentAction.Cancel],
  [DocumentStatus.Fulfilled]: [DocumentAction.Close],
  [DocumentStatus.Closed]: [DocumentAction.Reopen, DocumentAction.Amend],
  [DocumentStatus.OnHold]: [DocumentAction.Resume],
  [DocumentStatus.Cancelled]: [DocumentAction.Amend],
  [DocumentStatus.Amended]: [], // Terminal state - amended doc is read-only
};

// Action -> resulting status mapping
export const ACTION_RESULTS: Record<DocumentAction, DocumentStatus> = {
  [DocumentAction.Save]: DocumentStatus.Draft,
  [DocumentAction.Submit]: DocumentStatus.PendingApproval, // or Submitted depending on workflow config
  [DocumentAction.Approve]: DocumentStatus.Approved,
  [DocumentAction.Reject]: DocumentStatus.Rejected,
  [DocumentAction.Post]: DocumentStatus.Posted,
  [DocumentAction.Hold]: DocumentStatus.OnHold,
  [DocumentAction.Resume]: DocumentStatus.PendingApproval, // Returns to previous state
  [DocumentAction.Cancel]: DocumentStatus.Cancelled,
  [DocumentAction.Amend]: DocumentStatus.Amended,
  [DocumentAction.Close]: DocumentStatus.Closed,
  [DocumentAction.Reopen]: DocumentStatus.Posted,
};

// Base document interface - ALL business documents extend this
export interface BaseDocument {
  // Identity
  id: string;
  tenant_id: string;
  company_id: string;
  branch_id?: string;
  
  // Document identification
  doctype: string; // e.g., 'sales_invoice', 'purchase_order'
  document_number: string;
  naming_series?: string;
  title?: string; // Display title
  
  // Temporal
  financial_year: string;
  posting_date: string; // YYYY-MM-DD
  posting_time?: string; // HH:MM:SS
  document_date?: string; // YYYY-MM-DD
  due_date?: string;
  
  // Currency
  currency: string;
  exchange_rate: string; // Decimal as string
  base_currency?: string;
  
  // Status
  status: DocumentStatus;
  workflow_state?: string;
  is_return?: boolean;
  return_against?: string;
  
  // Ownership & assignment
  owner_id: string;
  assigned_to?: string[];
  
  // Audit trail
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  posted_by?: string;
  posted_at?: string;
  cancelled_by?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  
  // Amendment chain
  amended_from?: string; // ID of the cancelled doc this amends
  amended_to?: string; // ID of the amendment doc
  amendment_number?: number;
  
  // Source references
  source_doctype?: string;
  source_document_id?: string;
  
  // Versioning
  version: number; // For optimistic locking
  
  // Custom data
  custom_fields?: Record<string, unknown>;
  tags?: string[];
  notes?: string;
  
  // Soft delete
  is_deleted?: boolean;
  deleted_by?: string;
  deleted_at?: string;
}

// Base document item (child table row)
export interface BaseDocumentItem {
  id: string;
  parent_id: string;
  parent_doctype: string;
  idx: number; // Row index for ordering
  
  // Common item fields
  item_id?: string;
  item_code?: string;
  item_name?: string;
  description?: string;
  uom?: string;
  quantity: string; // Decimal as string
  rate: string; // Decimal as string
  amount: string; // Decimal as string
  
  // Discounts
  discount_percentage?: string;
  discount_amount?: string;
  
  // Tax
  tax_template_id?: string;
  tax_amount?: string;
  total_amount?: string;
  
  // Warehouse
  warehouse_id?: string;
  
  // References
  source_doctype?: string;
  source_document_id?: string;
  source_item_id?: string;
  
  // Fulfilment tracking
  fulfilled_quantity?: string;
  returned_quantity?: string;
  billed_quantity?: string;
  
  created_at: string;
  updated_at: string;
}

// Document with items (most transaction documents)
export interface TransactionDocument extends BaseDocument {
  // Party
  party_type?: 'customer' | 'supplier' | 'employee';
  party_id?: string;
  party_name?: string;
  
  // Address
  billing_address_id?: string;
  shipping_address_id?: string;
  
  // Contact
  contact_id?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  
  // Terms
  payment_terms_id?: string;
  terms_and_conditions_id?: string;
  terms_text?: string;
  
  // Pricing
  price_list_id?: string;
  
  // Items array (hydrated)
  items?: BaseDocumentItem[];
  taxes?: DocumentTax[];
  payment_schedule?: PaymentSchedule[];

  // Totals (all as Decimal strings)
  total_quantity: string;
  net_total: string; // Before tax
  tax_total: string;
  discount_total: string;
  grand_total: string; // After tax
  rounding_adjustment?: string;
  rounded_total?: string;
  outstanding_amount?: string;
  advance_paid?: string;
  
  // Base currency totals (for multi-currency)
  base_net_total?: string;
  base_tax_total?: string;
  base_grand_total?: string;
  base_rounding_adjustment?: string;
  base_rounded_total?: string;
  
  // Additional info
  remarks?: string;
  letter_head_id?: string;
  print_heading?: string;
  
  // Fulfilment status
  per_delivered?: string; // Percentage delivered
  per_billed?: string; // Percentage billed
  per_returned?: string; // Percentage returned
  per_paid?: string; // Percentage paid
}

// Tax detail in a document
export interface DocumentTax {
  id: string;
  parent_id: string;
  parent_doctype: string;
  idx: number;
  
  tax_type: string; // 'CGST', 'SGST', 'IGST', 'Cess', 'VAT', etc.
  account_id: string;
  account_name: string;
  rate: string; // Tax rate percentage
  tax_amount: string;
  base_tax_amount?: string;
  total: string; // Cumulative total after this tax
  base_total?: string;
  
  // For GST
  hsn_sac_code?: string;
  is_reverse_charge?: boolean;
  
  created_at: string;
  updated_at: string;
}

// Payment schedule detail
export interface PaymentSchedule {
  id: string;
  parent_id: string;
  parent_doctype: string;
  idx: number;
  
  due_date: string;
  invoice_portion: string; // Percentage
  payment_amount: string;
  outstanding_amount: string;
  paid_amount: string;
  discount_date?: string;
  discount_percentage?: string;
  
  created_at: string;
  updated_at: string;
}

// Document event types
export enum DocumentEventType {
  Created = 'document.created',
  Updated = 'document.updated',
  Submitted = 'document.submitted',
  Approved = 'document.approved',
  Rejected = 'document.rejected',
  Posted = 'document.posted',
  Cancelled = 'document.cancelled',
  Amended = 'document.amended',
  Closed = 'document.closed',
  Reopened = 'document.reopened',
  Commented = 'document.commented',
  Assigned = 'document.assigned',
  Attached = 'document.attached',
}

// Document event payload
export interface DocumentEvent {
  type: DocumentEventType;
  doctype: string;
  documentId: string;
  tenantId: string;
  companyId: string;
  userId: string;
  timestamp: string;
  previousStatus?: DocumentStatus;
  newStatus?: DocumentStatus;
  data?: Record<string, unknown>;
}

// Doctype metadata (describes a document type)
export interface DoctypeDefinition {
  name: string; // e.g., 'sales_invoice'
  label: string; // e.g., 'Sales Invoice'
  module: string; // e.g., 'sales'
  tableName: string; // e.g., 'sales_invoice'
  itemTableName?: string; // e.g., 'sales_invoice_item'
  taxTableName?: string; // e.g., 'sales_invoice_tax'
  
  // Behavior flags
  isSubmittable: boolean; // Can be submitted (vs just saved)
  isAmendable: boolean;
  hasItems: boolean;
  hasAccounting: boolean; // Creates GL entries
  hasInventory: boolean; // Creates stock ledger entries
  hasWorkflow: boolean;
  hasNamingSeries: boolean;
  
  // Default naming
  defaultNamingSeries?: string;
  
  // Document links
  links?: DoctypeLink[];
  
  // Allowed actions per status
  transitions: Record<DocumentStatus, DocumentAction[]>;
}

export interface DoctypeLink {
  doctype: string;
  fieldName: string;
  label: string;
  isChild: boolean;
}
