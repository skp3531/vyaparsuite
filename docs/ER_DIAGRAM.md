# VyaparSuite ERP - Master Entity-Relationship (ER) Architecture

> **Document Version**: 1.0.0  
> **Target Release**: VyaparSuite v1.0.0 Enterprise Architecture  
> **Database Engine**: PostgreSQL 16+ / Supabase Relational Schema  
> **Multi-Tenancy Standard**: Shared Database, Tenant Isolation via PostgreSQL Row-Level Security (RLS)  
> **Schema Standard**: 3NF Normalized, Strict Referential Integrity, Foreign Keys with Restricted Cascades  

---

## Architecture Overview & ER Design Principles

VyaparSuite enforces a relational data architecture optimized for multi-tenant enterprise resource planning. All entity definitions adhere to the following design standards:

1. **Multi-Tenant Isolation**: Every operational and master table incorporates a mandatory, non-nullable `tenant_id` column protected by PostgreSQL Row-Level Security (RLS) policies.
2. **Immutable Financial & Stock Ledgers**: Financial General Ledger entries (`ACC_GL_ENTRY`) and Stock Ledger entries (`INV_STOCK_LEDGER_ENTRY`) are append-only. Mutation or deletion triggers database-level rollback exceptions. Reversals are executed strictly through offsetting inverse postings.
3. **Auditability & Optimistic Concurrency**: Every document and master record carries immutable audit fields (`created_at`, `created_by`, `updated_at`, `updated_by`) and a concurrency version token (`version` integer) for optimistic locking.
4. **Three-Tier Document Lifecycle**: Transaction documents implement uniform lifecycle states: `draft` (editable), `submitted` (locked & ledger-posted), `cancelled` (reversal entries generated), and `amended` (forked into a new revision).

---

## 1. Core & Organization Setup Domain

The Core and Setup domain establishes the tenant containment boundary, legal operating companies, organizational hierarchy, branches, cost centers, fiscal years, and document numbering series.

```mermaid
erDiagram
    SYS_TENANT ||--o{ SYS_ORGANIZATION : "contains"
    SYS_ORGANIZATION ||--o{ SYS_COMPANY : "manages"
    SYS_COMPANY ||--o{ SYS_BRANCH : "operates"
    SYS_COMPANY ||--o{ SYS_COST_CENTER : "allocates"
    SYS_COMPANY ||--o{ SYS_FISCAL_YEAR : "defines"
    SYS_COMPANY ||--o{ SYS_NAMING_SERIES : "configures"
    SYS_TENANT ||--o{ SYS_WORKFLOW : "owns"
    SYS_WORKFLOW ||--o{ SYS_WORKFLOW_STATE : "defines"
    SYS_WORKFLOW ||--o{ SYS_WORKFLOW_TRANSITION : "governs"
    SYS_TENANT ||--o{ SYS_AUDIT_LOG : "records"
    SYS_TENANT ||--o{ MD_CURRENCY : "uses"
    SYS_TENANT ||--o{ MD_UOM : "measures"

    SYS_TENANT {
        uuid id PK
        string subdomain UK
        string custom_domain
        string subscription_tier
        boolean is_active
        timestamp created_at
    }

    SYS_ORGANIZATION {
        uuid id PK
        uuid tenant_id FK
        string organization_name
        string tax_country
        boolean is_active
    }

    SYS_COMPANY {
        uuid id PK
        uuid tenant_id FK
        uuid organization_id FK
        uuid parent_company_id FK
        string company_name
        string company_code UK
        string currency_code
        string pan_tax_id
        boolean is_group
    }

    SYS_BRANCH {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string branch_name
        string branch_code
        uuid address_id
        boolean is_active
    }

    SYS_COST_CENTER {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid parent_cost_center_id FK
        string cost_center_name
        string cost_center_code
        boolean is_group
    }

    SYS_FISCAL_YEAR {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string year_name
        timestamp start_date
        timestamp end_date
        boolean is_closed
    }

    SYS_NAMING_SERIES {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string doctype
        string prefix
        integer current_value
        integer padding
    }

    SYS_WORKFLOW {
        uuid id PK
        uuid tenant_id FK
        string doctype
        string workflow_name
        boolean is_active
    }

    SYS_WORKFLOW_STATE {
        uuid id PK
        uuid workflow_id FK
        string state_name
        string status_badge_color
        boolean is_doc_editable
    }

    SYS_WORKFLOW_TRANSITION {
        uuid id PK
        uuid workflow_id FK
        string action_name
        uuid from_state_id FK
        uuid to_state_id FK
        string allowed_role
    }

    SYS_AUDIT_LOG {
        uuid id PK
        uuid tenant_id FK
        string doctype
        uuid document_id
        string action_type
        jsonb diff_payload
        uuid user_id
        timestamp created_at
    }

    MD_CURRENCY {
        uuid id PK
        uuid tenant_id FK
        string currency_code UK
        string currency_name
        string symbol
        integer decimal_places
    }

    MD_UOM {
        uuid id PK
        uuid tenant_id FK
        string uom_name UK
        string symbol
        boolean must_be_whole_number
    }
```

---

## 2. Authentication, Authorization & Security Domain

Manages cryptographic user identities, role-based access control (RBAC), attribute-based permission predicates, API access keys, and security activity monitoring.

```mermaid
erDiagram
    SYS_TENANT ||--o{ SYS_USER : "employs"
    SYS_TENANT ||--o{ SYS_ROLE : "maintains"
    SYS_USER ||--o{ SYS_USER_ROLE : "assigned"
    SYS_ROLE ||--o{ SYS_USER_ROLE : "mapped"
    SYS_ROLE ||--o{ SYS_PERMISSION : "grants"
    SYS_USER ||--o{ SYS_USER_PERMISSION : "restricted_by"
    SYS_USER ||--o{ SYS_API_KEY : "issues"
    SYS_USER ||--o{ SYS_USER_SESSION : "authorizes"
    SYS_USER ||--o{ SYS_SECURITY_LOG : "audited_in"
    SYS_USER ||--o{ SYS_NOTIFICATION : "receives"

    SYS_USER {
        uuid id PK
        uuid tenant_id FK
        uuid auth_provider_id UK
        string email UK
        string full_name
        string phone
        string status
        timestamp last_login_at
    }

    SYS_ROLE {
        uuid id PK
        uuid tenant_id FK
        string role_name
        string description
        boolean is_system_role
        boolean is_active
    }

    SYS_USER_ROLE {
        uuid id PK
        uuid user_id FK
        uuid role_id FK
        timestamp assigned_at
        uuid assigned_by
    }

    SYS_PERMISSION {
        uuid id PK
        uuid role_id FK
        string doctype
        boolean can_read
        boolean can_create
        boolean can_update
        boolean can_delete
        boolean can_submit
        boolean can_cancel
        boolean can_amend
        jsonb field_permissions
    }

    SYS_USER_PERMISSION {
        uuid id PK
        uuid user_id FK
        string allow_doctype
        uuid for_value_id
        boolean is_strict
    }

    SYS_API_KEY {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string key_identifier UK
        string secret_hash
        string label
        timestamp expires_at
        boolean is_revoked
    }

    SYS_USER_SESSION {
        uuid id PK
        uuid user_id FK
        string session_token UK
        string ip_address
        string user_agent
        timestamp created_at
        timestamp expires_at
    }

    SYS_SECURITY_LOG {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string event_type
        string ip_address
        boolean is_suspicious
        timestamp logged_at
    }

    SYS_NOTIFICATION {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string title
        text message
        string action_url
        boolean is_read
        timestamp created_at
    }
```

---

## 3. CRM & Lead Management Domain

Governs prospect acquisition, lead scoring, pipeline opportunity progression, multi-party contacts, polymorphic addresses, and communication logs.

```mermaid
erDiagram
    SYS_COMPANY ||--o{ CRM_LEAD : "captures"
    SYS_COMPANY ||--o{ CRM_OPPORTUNITY : "originates"
    CRM_LEAD ||--o| CRM_OPPORTUNITY : "converts_to"
    CRM_LEAD ||--o| MD_CUSTOMER : "qualifies_into"
    MD_CUSTOMER ||--o{ CRM_OPPORTUNITY : "generates"
    CRM_OPPORTUNITY ||--o{ CRM_OPPORTUNITY_ITEM : "specifies"
    CRM_LEAD ||--o{ CRM_ACTIVITY : "logs"
    CRM_OPPORTUNITY ||--o{ CRM_ACTIVITY : "logs"
    CRM_LEAD ||--o{ CRM_NOTE : "annotated"
    MD_CUSTOMER ||--o{ MD_CONTACT : "contacts"
    MD_CUSTOMER ||--o{ MD_ADDRESS : "located_at"

    CRM_LEAD {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        string lead_name
        string email
        string phone
        string lead_source
        string status
        numeric lead_score
        uuid assigned_to_user_id
    }

    CRM_OPPORTUNITY {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid customer_id FK
        uuid lead_id FK
        string pipeline_stage
        numeric expected_revenue
        numeric win_probability
        timestamp expected_close_date
        string status
    }

    CRM_OPPORTUNITY_ITEM {
        uuid id PK
        uuid opportunity_id FK
        uuid item_id
        numeric qty
        numeric estimated_rate
        numeric total_amount
    }

    CRM_ACTIVITY {
        uuid id PK
        uuid tenant_id FK
        string entity_doctype
        uuid entity_id
        string activity_type
        string summary
        timestamp scheduled_at
        timestamp completed_at
        uuid assigned_user_id
    }

    CRM_NOTE {
        uuid id PK
        uuid tenant_id FK
        string entity_doctype
        uuid entity_id
        text note_content
        uuid author_user_id
        timestamp created_at
    }

    MD_CUSTOMER {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string customer_code UK
        string customer_name
        string customer_group
        numeric credit_limit
        string status
    }

    MD_CONTACT {
        uuid id PK
        uuid tenant_id FK
        string party_type
        uuid party_id
        string first_name
        string last_name
        string email
        string phone
        boolean is_primary
    }

    MD_ADDRESS {
        uuid id PK
        uuid tenant_id FK
        string party_type
        uuid party_id
        string address_line1
        string city
        string state_province
        string postal_code
        string country_code
        string gstin_tax_number
        boolean is_billing
        boolean is_shipping
    }
```

---

## 4. Sales Order & Fulfillment Domain

Captures sales quotations, committed sales orders, fulfillment delivery notes, and customer billing linkages with stock and general ledgers.

```mermaid
erDiagram
    MD_CUSTOMER ||--o{ SALES_QUOTATION : "receives"
    SALES_QUOTATION ||--o{ SALES_QUOTATION_ITEM : "contains"
    SALES_QUOTATION ||--o| SALES_ORDER : "converted_to"
    MD_CUSTOMER ||--o{ SALES_ORDER : "places"
    SALES_ORDER ||--o{ SALES_ORDER_ITEM : "contains"
    SALES_ORDER ||--o{ SALES_PAYMENT_SCHEDULE : "schedules"
    SALES_ORDER ||--o{ INV_DELIVERY_NOTE : "fulfilled_by"
    INV_DELIVERY_NOTE ||--o{ INV_DELIVERY_NOTE_ITEM : "dispatches"
    SALES_ORDER ||--o{ ACC_SALES_INVOICE : "billed_by"
    ACC_SALES_INVOICE ||--o{ ACC_SALES_INVOICE_ITEM : "details"
    MD_PRICE_LIST ||--o{ SALES_ORDER_ITEM : "applies_rates"

    SALES_QUOTATION {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid customer_id FK
        timestamp transaction_date
        timestamp valid_till
        numeric net_total
        numeric tax_total
        numeric grand_total
        string status
    }

    SALES_QUOTATION_ITEM {
        uuid id PK
        uuid quotation_id FK
        uuid item_id FK
        numeric qty
        numeric rate
        numeric discount_pct
        numeric amount
    }

    SALES_ORDER {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid customer_id FK
        uuid quotation_id FK
        timestamp order_date
        timestamp expected_delivery_date
        numeric grand_total
        string status
        string delivery_status
        string billing_status
    }

    SALES_ORDER_ITEM {
        uuid id PK
        uuid sales_order_id FK
        uuid item_id FK
        uuid warehouse_id FK
        numeric qty
        numeric rate
        numeric delivered_qty
        numeric billed_qty
        numeric amount
    }

    SALES_PAYMENT_SCHEDULE {
        uuid id PK
        uuid sales_order_id FK
        timestamp payment_term_date
        numeric portion_percentage
        numeric scheduled_amount
        boolean is_cleared
    }

    INV_DELIVERY_NOTE {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid sales_order_id FK
        uuid customer_id FK
        timestamp posting_date
        string status
    }

    INV_DELIVERY_NOTE_ITEM {
        uuid id PK
        uuid delivery_note_id FK
        uuid item_id FK
        uuid warehouse_id FK
        numeric delivered_qty
        string batch_no
        string serial_numbers
    }

    ACC_SALES_INVOICE {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid customer_id FK
        uuid sales_order_id FK
        timestamp posting_date
        timestamp due_date
        numeric grand_total
        numeric outstanding_amount
        string status
    }

    ACC_SALES_INVOICE_ITEM {
        uuid id PK
        uuid sales_invoice_id FK
        uuid item_id FK
        numeric qty
        numeric rate
        numeric taxable_amount
        numeric tax_amount
    }

    MD_PRICE_LIST {
        uuid id PK
        uuid tenant_id FK
        string price_list_name
        string currency_code
        boolean is_selling
        boolean is_active
    }
```

---

## 5. Purchase & Procurement Domain

Enforces procurement demand pipelines from internal Material Requests through Requests for Quotation (RFQ), Supplier Quotations, Purchase Orders, Goods Receipts (GRN), and Vendor Bills.

```mermaid
erDiagram
    MD_SUPPLIER ||--o{ PROC_PURCHASE_ORDER : "fulfills"
    PROC_MATERIAL_REQUEST ||--o{ PROC_MATERIAL_REQUEST_ITEM : "contains"
    PROC_MATERIAL_REQUEST ||--o{ PROC_RFQ : "triggers"
    PROC_RFQ ||--o{ PROC_RFQ_SUPPLIER : "invites"
    MD_SUPPLIER ||--o{ PROC_RFQ_SUPPLIER : "receives"
    PROC_RFQ_SUPPLIER ||--o| PROC_SUPPLIER_QUOTATION : "submits"
    PROC_SUPPLIER_QUOTATION ||--o| PROC_PURCHASE_ORDER : "awarded_to"
    PROC_PURCHASE_ORDER ||--o{ PROC_PURCHASE_ORDER_ITEM : "contains"
    PROC_PURCHASE_ORDER ||--o{ INV_PURCHASE_RECEIPT : "received_in"
    INV_PURCHASE_RECEIPT ||--o{ INV_PURCHASE_RECEIPT_ITEM : "inspects"
    PROC_PURCHASE_ORDER ||--o{ ACC_PURCHASE_INVOICE : "billed_by"
    ACC_PURCHASE_INVOICE ||--o{ ACC_PURCHASE_INVOICE_ITEM : "charges"

    MD_SUPPLIER {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string supplier_code UK
        string supplier_name
        string supplier_group
        string tax_id
        string status
    }

    PROC_MATERIAL_REQUEST {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        string request_type
        timestamp schedule_date
        string status
    }

    PROC_MATERIAL_REQUEST_ITEM {
        uuid id PK
        uuid material_request_id FK
        uuid item_id FK
        numeric required_qty
        uuid target_warehouse_id
    }

    PROC_RFQ {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        timestamp transaction_date
        string status
    }

    PROC_RFQ_SUPPLIER {
        uuid id PK
        uuid rfq_id FK
        uuid supplier_id FK
        string quote_token UK
        string status
    }

    PROC_SUPPLIER_QUOTATION {
        uuid id PK
        uuid tenant_id FK
        uuid supplier_id FK
        uuid rfq_id FK
        string quotation_ref_no
        numeric total_amount
        string status
    }

    PROC_PURCHASE_ORDER {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid supplier_id FK
        timestamp order_date
        numeric grand_total
        string status
        string receipt_status
        string billing_status
    }

    PROC_PURCHASE_ORDER_ITEM {
        uuid id PK
        uuid purchase_order_id FK
        uuid item_id FK
        numeric qty
        numeric rate
        numeric received_qty
        numeric billed_qty
        numeric amount
    }

    INV_PURCHASE_RECEIPT {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid purchase_order_id FK
        uuid supplier_id FK
        timestamp posting_date
        string status
    }

    INV_PURCHASE_RECEIPT_ITEM {
        uuid id PK
        uuid purchase_receipt_id FK
        uuid item_id FK
        numeric received_qty
        numeric accepted_qty
        numeric rejected_qty
        uuid target_warehouse_id
    }

    ACC_PURCHASE_INVOICE {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid supplier_id FK
        uuid purchase_order_id FK
        timestamp posting_date
        numeric grand_total
        numeric outstanding_amount
        string status
    }

    ACC_PURCHASE_INVOICE_ITEM {
        uuid id PK
        uuid purchase_invoice_id FK
        uuid item_id FK
        numeric qty
        numeric rate
        numeric amount
    }
```

---

## 6. Inventory & Stock Ledger Domain

Implements real-time inventory management, immutable stock ledger tracking, valuation calculation (FIFO and Moving Average), serial numbering, and batch lifecycle tracking.

```mermaid
erDiagram
    MD_ITEM_GROUP ||--o{ MD_ITEM : "categorizes"
    MD_ITEM ||--o{ MD_ITEM_VARIANT : "specializes"
    MD_ITEM ||--o{ INV_STOCK_BIN : "tracked_in"
    MD_WAREHOUSE ||--o{ INV_STOCK_BIN : "stocks"
    MD_ITEM ||--o{ INV_STOCK_LEDGER_ENTRY : "mutates"
    MD_WAREHOUSE ||--o{ INV_STOCK_LEDGER_ENTRY : "locates"
    INV_STOCK_ENTRY ||--o{ INV_STOCK_ENTRY_ITEM : "transfers"
    MD_ITEM ||--o{ INV_BATCH : "manufactured_as"
    MD_ITEM ||--o{ INV_SERIAL_NO : "serialized_into"
    MD_WAREHOUSE ||--o{ INV_STOCK_RECONCILIATION : "audits"

    MD_ITEM_GROUP {
        uuid id PK
        uuid tenant_id FK
        string group_name
        uuid parent_group_id FK
        boolean is_group
    }

    MD_ITEM {
        uuid id PK
        uuid tenant_id FK
        string item_code UK
        string item_name
        uuid item_group_id FK
        string base_uom
        boolean is_stock_item
        boolean has_variants
        boolean has_batch_no
        boolean has_serial_no
        string valuation_method
        numeric standard_cost
        string status
    }

    MD_ITEM_VARIANT {
        uuid id PK
        uuid template_item_id FK
        string variant_sku UK
        jsonb attribute_values
    }

    MD_WAREHOUSE {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string warehouse_name
        string warehouse_code UK
        uuid parent_warehouse_id FK
        boolean is_group
        uuid account_id
    }

    INV_STOCK_BIN {
        uuid id PK
        uuid tenant_id FK
        uuid item_id FK
        uuid warehouse_id FK
        numeric actual_qty
        numeric reserved_qty
        numeric ordered_qty
        numeric projected_qty
        numeric valuation_rate
    }

    INV_STOCK_LEDGER_ENTRY {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid item_id FK
        uuid warehouse_id FK
        timestamp posting_datetime
        string voucher_type
        string voucher_no
        numeric qty_change
        numeric valuation_rate
        numeric stock_value_diff
        numeric balance_qty
        numeric balance_value
        string batch_no
        string serial_no
    }

    INV_STOCK_ENTRY {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        string entry_type
        timestamp posting_date
        numeric total_amount
        string status
    }

    INV_STOCK_ENTRY_ITEM {
        uuid id PK
        uuid stock_entry_id FK
        uuid item_id FK
        uuid source_warehouse_id FK
        uuid target_warehouse_id FK
        numeric transfer_qty
        numeric basic_rate
        numeric basic_amount
    }

    INV_BATCH {
        uuid id PK
        uuid tenant_id FK
        uuid item_id FK
        string batch_number UK
        timestamp manufacturing_date
        timestamp expiry_date
        numeric batch_qty
    }

    INV_SERIAL_NO {
        uuid id PK
        uuid tenant_id FK
        uuid item_id FK
        string serial_number UK
        uuid current_warehouse_id FK
        string status
    }

    INV_STOCK_RECONCILIATION {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid warehouse_id FK
        timestamp posting_date
        string status
    }
```

---

## 7. Accounting & Double-Entry General Ledger Domain

Maintains mathematical financial integrity via balanced double-entry General Ledger postings, multi-tier Charts of Accounts, Journal Vouchers, and Payment Allocations.

```mermaid
erDiagram
    SYS_COMPANY ||--o{ ACC_CHART_OF_ACCOUNTS : "owns"
    ACC_CHART_OF_ACCOUNTS ||--o{ ACC_CHART_OF_ACCOUNTS : "sub_accounts"
    ACC_CHART_OF_ACCOUNTS ||--o{ ACC_GL_ENTRY : "classifies"
    SYS_FISCAL_YEAR ||--o{ ACC_GL_ENTRY : "bounds"
    ACC_JOURNAL_ENTRY ||--o{ ACC_JOURNAL_ENTRY_ITEM : "contains"
    ACC_CHART_OF_ACCOUNTS ||--o{ ACC_JOURNAL_ENTRY_ITEM : "allocates"
    ACC_PAYMENT_ENTRY ||--o{ ACC_PAYMENT_REFERENCE : "allocates_to"
    ACC_BANK_ACCOUNT ||--o{ ACC_PAYMENT_ENTRY : "disburses"
    ACC_BANK_ACCOUNT ||--o{ ACC_BANK_TRANSACTION : "records"

    ACC_CHART_OF_ACCOUNTS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string account_name
        string account_number UK
        string root_type
        string report_type
        uuid parent_account_id FK
        boolean is_group
        string currency_code
    }

    ACC_GL_ENTRY {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        timestamp posting_date
        uuid account_id FK
        string party_type
        uuid party_id
        numeric debit_amount
        numeric credit_amount
        string voucher_type
        string voucher_no
        uuid cost_center_id
        uuid fiscal_year_id FK
        boolean is_cancelled
    }

    ACC_JOURNAL_ENTRY {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        timestamp posting_date
        string entry_type
        numeric total_debit
        numeric total_credit
        string user_remarks
        string status
    }

    ACC_JOURNAL_ENTRY_ITEM {
        uuid id PK
        uuid journal_entry_id FK
        uuid account_id FK
        string party_type
        uuid party_id
        numeric debit
        numeric credit
        uuid cost_center_id
    }

    ACC_PAYMENT_ENTRY {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        string payment_type
        string party_type
        uuid party_id
        uuid paid_from_account_id FK
        uuid paid_to_account_id FK
        numeric paid_amount
        numeric received_amount
        timestamp posting_date
        string reference_no
        string status
    }

    ACC_PAYMENT_REFERENCE {
        uuid id PK
        uuid payment_entry_id FK
        string reference_doctype
        uuid reference_doc_id
        numeric allocated_amount
        numeric outstanding_balance
    }

    ACC_BANK_ACCOUNT {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid gl_account_id FK
        string bank_name
        string account_number UK
        string ifsc_swift_code
        string currency_code
    }

    ACC_BANK_TRANSACTION {
        uuid id PK
        uuid bank_account_id FK
        timestamp transaction_date
        numeric deposit_amount
        numeric withdrawal_amount
        string reference_number
        boolean is_reconciled
    }
```

---

## 8. India GST & Statutory Compliance Domain

Ensures full compliance with the Indian Goods and Services Tax framework, automating tax rate determination, HSN/SAC categorizations, e-Invoicing (IRP IRN), and e-Way Bills.

```mermaid
erDiagram
    SYS_COMPANY ||--o| GST_SETTINGS : "holds"
    GST_SETTINGS ||--o{ GST_TAX_TEMPLATE : "defines"
    GST_HSN_SAC ||--o{ GST_TAX_RATE : "associates"
    GST_TAX_TEMPLATE ||--o{ GST_TAX_RATE : "rates"
    ACC_SALES_INVOICE ||--o| GST_E_INVOICE : "registers"
    INV_DELIVERY_NOTE ||--o| GST_E_WAY_BILL : "transports"
    GST_TDS_SECTION ||--o{ GST_TDS_LEDGER : "deducts"
    SYS_COMPANY ||--o{ GST_TDS_LEDGER : "remits"

    GST_SETTINGS {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string gstin UK
        string legal_trade_name
        string pan_number
        string state_code
        boolean is_composition_scheme
        boolean is_einvoice_enabled
    }

    GST_HSN_SAC {
        uuid id PK
        string code UK
        string description
        string type
        numeric default_gst_rate
        numeric compensation_cess_rate
    }

    GST_TAX_TEMPLATE {
        uuid id PK
        uuid tenant_id FK
        string template_name
        string tax_category
        boolean is_interstate
    }

    GST_TAX_RATE {
        uuid id PK
        uuid template_id FK
        uuid hsn_sac_id FK
        numeric cgst_rate
        numeric sgst_rate
        numeric igst_rate
        numeric cess_rate
    }

    GST_E_INVOICE {
        uuid id PK
        uuid tenant_id FK
        uuid invoice_id UK
        string irn_hash UK
        string ack_number
        timestamp ack_datetime
        text signed_qr_code
        text signed_invoice_jwt
        string status
        string irp_provider
    }

    GST_E_WAY_BILL {
        uuid id PK
        uuid tenant_id FK
        uuid delivery_note_id UK
        uuid invoice_id
        string ewb_number UK
        timestamp ewb_datetime
        timestamp valid_until
        string transporter_id
        string vehicle_number
        string status
    }

    GST_TDS_SECTION {
        uuid id PK
        string section_code UK
        string description
        numeric corporate_rate
        numeric individual_rate
        numeric threshold_amount
    }

    GST_TDS_LEDGER {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        uuid tds_section_id FK
        uuid party_id
        numeric gross_amount
        numeric tds_deducted_amount
        string challan_number
    }
```

---

## 9. Manufacturing & Asset Management Domain

Captures production operations: multi-level Bills of Materials (BOM), workstation capacities, routing schedules, job cards, quality inspection audits, and fixed asset depreciation.

```mermaid
erDiagram
    MD_ITEM ||--o{ MFG_BOM : "produces"
    MFG_BOM ||--o{ MFG_BOM_ITEM : "requires"
    MFG_ROUTING ||--o{ MFG_ROUTING_OPERATION : "sequences"
    MFG_WORKSTATION ||--o{ MFG_ROUTING_OPERATION : "hosts"
    MFG_BOM ||--o{ MFG_WORK_ORDER : "instructs"
    MFG_WORK_ORDER ||--o{ MFG_JOB_CARD : "dispatches"
    MFG_JOB_CARD ||--o{ MFG_JOB_CARD_TIME_LOG : "clocks"
    MFG_WORK_ORDER ||--o{ QA_INSPECTION : "verifies"
    SYS_COMPANY ||--o{ AST_ASSET : "capitalizes"
    AST_ASSET ||--o{ AST_DEPRECIATION_SCHEDULE : "depreciates"

    MFG_BOM {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string bom_number UK
        uuid item_id FK
        numeric quantity
        numeric total_raw_material_cost
        numeric total_operation_cost
        boolean is_active
        boolean is_default
    }

    MFG_BOM_ITEM {
        uuid id PK
        uuid bom_id FK
        uuid component_item_id FK
        numeric required_qty
        numeric scrap_factor_pct
        numeric unit_cost
    }

    MFG_WORKSTATION {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string workstation_name
        numeric hour_rate_labour
        numeric hour_rate_electricity
        numeric hour_rate_rent
    }

    MFG_ROUTING {
        uuid id PK
        uuid tenant_id FK
        string routing_name
    }

    MFG_ROUTING_OPERATION {
        uuid id PK
        uuid routing_id FK
        string operation_name
        uuid workstation_id FK
        integer standard_time_minutes
    }

    MFG_WORK_ORDER {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        uuid bom_id FK
        numeric target_qty
        numeric produced_qty
        timestamp planned_start_date
        string status
    }

    MFG_JOB_CARD {
        uuid id PK
        uuid work_order_id FK
        string operation_name
        uuid workstation_id FK
        numeric completed_qty
        string status
    }

    MFG_JOB_CARD_TIME_LOG {
        uuid id PK
        uuid job_card_id FK
        timestamp from_time
        timestamp to_time
        integer total_minutes
        uuid operator_employee_id
    }

    QA_INSPECTION {
        uuid id PK
        uuid tenant_id FK
        string reference_doctype
        uuid reference_doc_id
        timestamp inspection_date
        string inspection_status
        jsonb verified_readings
    }

    AST_ASSET {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string asset_name
        string asset_code UK
        timestamp purchase_date
        numeric gross_purchase_amount
        string depreciation_method
        integer useful_life_months
        string status
    }

    AST_DEPRECIATION_SCHEDULE {
        uuid id PK
        uuid asset_id FK
        timestamp schedule_date
        numeric depreciation_amount
        numeric accumulated_depreciation
        boolean is_posted
        uuid journal_entry_id
    }
```

---

## 10. HRMS & Payroll Domain

Models human capital operations: departmental hierarchies, designations, employee master profiles, shift rosters, biometric attendance, leaves, salary structures, and automated payroll runs.

```mermaid
erDiagram
    SYS_COMPANY ||--o{ HR_DEPARTMENT : "structures"
    SYS_COMPANY ||--o{ HR_EMPLOYEE : "hires"
    HR_DEPARTMENT ||--o{ HR_EMPLOYEE : "contains"
    HR_DESIGNATION ||--o{ HR_EMPLOYEE : "titles"
    HR_EMPLOYEE ||--o{ HR_ATTENDANCE : "punches"
    HR_SHIFT ||--o{ HR_ATTENDANCE : "schedules"
    HR_EMPLOYEE ||--o{ HR_LEAVE_APPLICATION : "requests"
    HR_LEAVE_TYPE ||--o{ HR_LEAVE_APPLICATION : "categorizes"
    HR_EMPLOYEE ||--o{ HR_SALARY_SLIP : "earns"
    HR_SALARY_STRUCTURE ||--o{ HR_SALARY_SLIP : "computes"
    HR_PAYROLL_ENTRY ||--o{ HR_SALARY_SLIP : "compiles"

    HR_DEPARTMENT {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string department_name
        uuid parent_department_id FK
    }

    HR_DESIGNATION {
        uuid id PK
        uuid tenant_id FK
        string designation_title UK
    }

    HR_EMPLOYEE {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string employee_code UK
        string first_name
        string last_name
        uuid department_id FK
        uuid designation_id FK
        timestamp date_of_joining
        string employment_type
        string status
        string pan_number
        string bank_account_number
    }

    HR_SHIFT {
        uuid id PK
        uuid tenant_id FK
        string shift_name
        string start_time
        string end_time
        integer grace_period_mins
    }

    HR_ATTENDANCE {
        uuid id PK
        uuid tenant_id FK
        uuid employee_id FK
        timestamp attendance_date
        uuid shift_id FK
        timestamp in_time
        timestamp out_time
        string status
    }

    HR_LEAVE_TYPE {
        uuid id PK
        uuid tenant_id FK
        string leave_type_name UK
        integer max_days_allowed
        boolean is_carry_forward
    }

    HR_LEAVE_APPLICATION {
        uuid id PK
        uuid employee_id FK
        uuid leave_type_id FK
        timestamp from_date
        timestamp to_date
        numeric total_days
        string reason
        string approval_status
    }

    HR_SALARY_STRUCTURE {
        uuid id PK
        uuid tenant_id FK
        string structure_name
        numeric base_annual_ctc
        boolean is_active
    }

    HR_PAYROLL_ENTRY {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        timestamp posting_date
        timestamp payroll_month
        numeric total_disbursement
        string status
    }

    HR_SALARY_SLIP {
        uuid id PK
        uuid tenant_id FK
        uuid payroll_entry_id FK
        uuid employee_id FK
        numeric gross_earnings
        numeric total_deductions
        numeric net_pay
        string status
    }
```

---

## 11. Projects, Timesheets & Customer Support Domain

Supports services delivery: projects with Work Breakdown Structures (WBS), billable timesheet submissions, customer helpdesk ticketing, and Service Level Agreement (SLA) fulfillment.

```mermaid
erDiagram
    SYS_COMPANY ||--o{ PRJ_PROJECT : "executes"
    MD_CUSTOMER ||--o{ PRJ_PROJECT : "sponsors"
    PRJ_PROJECT ||--o{ PRJ_TASK : "deconstructs"
    PRJ_TASK ||--o{ PRJ_TASK : "depends_on"
    PRJ_TASK ||--o{ PRJ_TIMESHEET_ENTRY : "logged_against"
    HR_EMPLOYEE ||--o{ PRJ_TIMESHEET : "submits"
    PRJ_TIMESHEET ||--o{ PRJ_TIMESHEET_ENTRY : "itemizes"
    MD_CUSTOMER ||--o{ SPT_TICKET : "raises"
    SPT_TICKET ||--o{ SPT_TICKET_MESSAGE : "threads"
    SPT_SLA_POLICY ||--o{ SPT_TICKET : "governs"

    PRJ_PROJECT {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string project_name
        string project_code UK
        uuid customer_id FK
        timestamp start_date
        timestamp end_date
        numeric total_budget
        string status
    }

    PRJ_TASK {
        uuid id PK
        uuid project_id FK
        string task_title
        uuid parent_task_id FK
        uuid assigned_employee_id
        timestamp due_date
        numeric estimated_hours
        integer progress_percent
        string status
    }

    PRJ_TIMESHEET {
        uuid id PK
        uuid tenant_id FK
        uuid employee_id FK
        timestamp period_start_date
        timestamp period_end_date
        numeric total_hours
        numeric total_billable_hours
        string approval_status
    }

    PRJ_TIMESHEET_ENTRY {
        uuid id PK
        uuid timesheet_id FK
        uuid project_id FK
        uuid task_id FK
        timestamp activity_date
        numeric hours_worked
        boolean is_billable
        numeric billing_rate
    }

    SPT_TICKET {
        uuid id PK
        uuid tenant_id FK
        uuid company_id FK
        string naming_series UK
        string ticket_subject
        uuid customer_id FK
        string priority
        string status
        uuid sla_policy_id FK
        uuid assigned_agent_user_id
    }

    SPT_TICKET_MESSAGE {
        uuid id PK
        uuid ticket_id FK
        string sender_type
        uuid sender_user_id
        text message_body
        jsonb attachment_urls
        timestamp sent_at
    }

    SPT_SLA_POLICY {
        uuid id PK
        uuid tenant_id FK
        string policy_name
        integer first_response_target_mins
        integer resolution_target_mins
        boolean is_active
    }
```

---

## 12. Master Enterprise Cross-Reference Diagram

The master cross-reference diagram illustrates how primary transaction anchors connect across modules—from Master Data to CRM, Sales, Procurement, Inventory, Manufacturing, Projects, Human Resources, and General Ledger Accounting.

```mermaid
erDiagram
    SYS_TENANT ||--o{ SYS_COMPANY : "scopes"
    SYS_COMPANY ||--o{ MD_CUSTOMER : "serves"
    SYS_COMPANY ||--o{ MD_SUPPLIER : "procures_from"
    SYS_COMPANY ||--o{ MD_ITEM : "catalogs"
    SYS_COMPANY ||--o{ MD_WAREHOUSE : "operates"

    MD_CUSTOMER ||--o{ SALES_ORDER : "places"
    SALES_ORDER ||--o{ INV_DELIVERY_NOTE : "fulfills"
    SALES_ORDER ||--o{ ACC_SALES_INVOICE : "invoices"

    MD_SUPPLIER ||--o{ PROC_PURCHASE_ORDER : "contracts"
    PROC_PURCHASE_ORDER ||--o{ INV_PURCHASE_RECEIPT : "receives"
    PROC_PURCHASE_ORDER ||--o{ ACC_PURCHASE_INVOICE : "bills"

    MD_ITEM ||--o{ INV_STOCK_LEDGER_ENTRY : "moves"
    MD_WAREHOUSE ||--o{ INV_STOCK_LEDGER_ENTRY : "holds"

    INV_DELIVERY_NOTE ||--o{ INV_STOCK_LEDGER_ENTRY : "posts"
    INV_PURCHASE_RECEIPT ||--o{ INV_STOCK_LEDGER_ENTRY : "posts"

    ACC_SALES_INVOICE ||--o{ ACC_GL_ENTRY : "posts_gl"
    ACC_PURCHASE_INVOICE ||--o{ ACC_GL_ENTRY : "posts_gl"

    ACC_SALES_INVOICE ||--o{ ACC_PAYMENT_REFERENCE : "reconciles"
    ACC_PURCHASE_INVOICE ||--o{ ACC_PAYMENT_REFERENCE : "reconciles"
    ACC_PAYMENT_ENTRY ||--o{ ACC_PAYMENT_REFERENCE : "contains"
    ACC_PAYMENT_ENTRY ||--o{ ACC_GL_ENTRY : "posts_gl"

    MD_ITEM ||--o{ MFG_WORK_ORDER : "produces"
    MFG_WORK_ORDER ||--o{ INV_STOCK_LEDGER_ENTRY : "consumes_and_yields"

    PRJ_PROJECT ||--o{ ACC_SALES_INVOICE : "bills_project"
    HR_EMPLOYEE ||--o{ HR_SALARY_SLIP : "paid_via"
    HR_SALARY_SLIP ||--o{ ACC_GL_ENTRY : "posts_payroll_gl"

    ACC_SALES_INVOICE ||--o| GST_E_INVOICE : "certifies"

    SYS_TENANT {
        uuid id PK
        string subdomain
    }
    SYS_COMPANY {
        uuid id PK
        string company_code
    }
    MD_CUSTOMER {
        uuid id PK
        string customer_code
    }
    MD_SUPPLIER {
        uuid id PK
        string supplier_code
    }
    MD_ITEM {
        uuid id PK
        string item_code
    }
    MD_WAREHOUSE {
        uuid id PK
        string warehouse_code
    }
    SALES_ORDER {
        uuid id PK
        string naming_series
    }
    INV_DELIVERY_NOTE {
        uuid id PK
        string naming_series
    }
    ACC_SALES_INVOICE {
        uuid id PK
        string naming_series
    }
    PROC_PURCHASE_ORDER {
        uuid id PK
        string naming_series
    }
    INV_PURCHASE_RECEIPT {
        uuid id PK
        string naming_series
    }
    ACC_PURCHASE_INVOICE {
        uuid id PK
        string naming_series
    }
    INV_STOCK_LEDGER_ENTRY {
        uuid id PK
        string voucher_no
    }
    ACC_GL_ENTRY {
        uuid id PK
        string voucher_no
    }
    ACC_PAYMENT_ENTRY {
        uuid id PK
        string naming_series
    }
    ACC_PAYMENT_REFERENCE {
        uuid id PK
        numeric allocated_amount
    }
    MFG_WORK_ORDER {
        uuid id PK
        string naming_series
    }
    PRJ_PROJECT {
        uuid id PK
        string project_code
    }
    HR_EMPLOYEE {
        uuid id PK
        string employee_code
    }
    HR_SALARY_SLIP {
        uuid id PK
        numeric net_pay
    }
    GST_E_INVOICE {
        uuid id PK
        string irn_hash
    }
```

---

## 13. Data Integrity & Constraint Standards

1. **Foreign Key Integrity**:
   * All relations linking transactional documents to master entities enforce `ON DELETE RESTRICT` or `ON DELETE NO ACTION`. Deleting master records with active historical transactions is strictly prohibited.
   * Child line items (e.g., `SALES_ORDER_ITEM` linked to `SALES_ORDER`) enforce `ON DELETE CASCADE` only when the parent document is in `draft` status.
2. **Numeric Precision Standards**:
   * All currency amounts are stored as `numeric(18, 4)` in the database and rendered as `numeric(18, 2)` according to currency configuration.
   * Quantities are stored as `numeric(18, 4)` to support fractional weights, volumes, and bulk conversions without rounding error.
3. **Optimistic Locking**:
   * All state transitions and document updates check `WHERE id = :id AND version = :expected_version` to prevent concurrent write collisions.
4. **Tenant Isolation Enforcement**:
   * Every SQL query automatically injects `WHERE tenant_id = current_setting('app.current_tenant_id')` enforced transparently by PostgreSQL Row-Level Security policies.
