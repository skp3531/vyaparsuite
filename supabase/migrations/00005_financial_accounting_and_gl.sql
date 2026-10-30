-- ==============================================================================
-- VyaparSuite Migration 00005: Financial Accounting & General Ledger Engine
-- Modules: Immutable GL Entry, Journal Entries, Sales Invoices, Purchase Invoices,
--          Payment Entries, Bank Accounts & Transactions
-- ==============================================================================

-- 1. Immutable General Ledger Entry (Append-Only)
CREATE TABLE IF NOT EXISTS gl_entry (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    posting_time                 TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    account_id                   UUID NOT NULL,
    party_type                   TEXT,
    party_id                     UUID,
    cost_centre_id               UUID,
    profit_centre_id             UUID,
    debit                        NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    credit                       NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    account_currency             TEXT NOT NULL DEFAULT 'INR',
    debit_in_account_currency    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    credit_in_account_currency   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    voucher_type                 TEXT NOT NULL,
    voucher_id                   UUID NOT NULL,
    voucher_number               TEXT NOT NULL,
    fiscal_year_id               UUID,
    is_cancelled                 BOOLEAN NOT NULL DEFAULT false,
    remarks                      TEXT,
    CONSTRAINT pk_gl_entry PRIMARY KEY (id),
    CONSTRAINT fk_gl_entry_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_gl_entry_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT,
    CONSTRAINT fk_gl_entry_account_id FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE RESTRICT,
    CONSTRAINT chk_gle_amounts_nonneg CHECK (debit >= 0 AND credit >= 0),
    CONSTRAINT chk_gle_single_side CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0) OR (debit = 0 AND credit = 0))
);

ALTER TABLE gl_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON gl_entry
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_gle_account_posting ON gl_entry USING btree (tenant_id, account_id, posting_date);
CREATE INDEX IF NOT EXISTS idx_gle_party ON gl_entry USING btree (tenant_id, party_type, party_id, posting_date);
CREATE INDEX IF NOT EXISTS idx_gle_voucher ON gl_entry USING btree (voucher_type, voucher_id);

-- Attach Immutability Enforcement Trigger to gl_entry
CREATE TRIGGER trg_prevent_mutation_gl_entry
    BEFORE UPDATE OR DELETE ON gl_entry
    FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- 2. Journal Entry (Vouchers)
CREATE TABLE IF NOT EXISTS journal_entry (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    entry_number                 TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_type                   TEXT NOT NULL DEFAULT 'Journal Entry',
    total_debit                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    total_credit                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    difference                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    status                       TEXT NOT NULL DEFAULT 'Draft',
    user_remark                  TEXT,
    CONSTRAINT pk_journal_entry PRIMARY KEY (id),
    CONSTRAINT fk_journal_entry_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_journal_entry_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_journal_entry_number UNIQUE (tenant_id, entry_number),
    CONSTRAINT chk_je_status CHECK (status IN ('Draft','Submitted','Cancelled'))
);

ALTER TABLE journal_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON journal_entry
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_je_company_date ON journal_entry USING btree (company_id, posting_date DESC);

CREATE TABLE IF NOT EXISTS journal_entry_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    journal_entry_id             UUID NOT NULL,
    account_id                   UUID NOT NULL,
    party_type                   TEXT,
    party_id                     UUID,
    cost_centre_id               UUID,
    debit                        NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    credit                       NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    user_remark                  TEXT,
    CONSTRAINT pk_journal_entry_item PRIMARY KEY (id),
    CONSTRAINT fk_journal_entry_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_journal_entry_item_entry_id FOREIGN KEY (journal_entry_id) REFERENCES journal_entry(id) ON DELETE CASCADE,
    CONSTRAINT fk_journal_entry_item_account_id FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE RESTRICT,
    CONSTRAINT chk_jei_nonneg CHECK (debit >= 0 AND credit >= 0)
);

ALTER TABLE journal_entry_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON journal_entry_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_jei_entry_id ON journal_entry_item USING btree (journal_entry_id);

-- 3. Sales Invoice
CREATE TABLE IF NOT EXISTS sales_invoice (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    invoice_number               TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    customer_id                  UUID NOT NULL,
    customer_name                TEXT,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date                     DATE NOT NULL,
    status                       TEXT NOT NULL DEFAULT 'Draft',
    is_pos                       BOOLEAN NOT NULL DEFAULT false,
    is_return                    BOOLEAN NOT NULL DEFAULT false,
    return_against_id            UUID,
    currency                     TEXT NOT NULL DEFAULT 'INR',
    exchange_rate                NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    net_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    grand_total                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    outstanding_amount           NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    paid_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    irn                          TEXT,
    signed_qr_code               TEXT,
    ack_no                       TEXT,
    ack_date                     TIMESTAMPTZ,
    debit_to_account_id          UUID,
    cost_centre_id               UUID,
    remarks                      TEXT,
    CONSTRAINT pk_sales_invoice PRIMARY KEY (id),
    CONSTRAINT fk_sales_invoice_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_invoice_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_invoice_customer_id FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_invoice_return_against_id FOREIGN KEY (return_against_id) REFERENCES sales_invoice(id) ON DELETE SET NULL,
    CONSTRAINT uq_sales_invoice_number UNIQUE (tenant_id, company_id, invoice_number),
    CONSTRAINT chk_sales_invoice_status CHECK (status IN ('Draft','Submitted','Paid','Partially Paid','Overdue','Cancelled'))
);

ALTER TABLE sales_invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON sales_invoice
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_si_customer_due ON sales_invoice USING btree (customer_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_si_irn ON sales_invoice USING btree (tenant_id, irn);

CREATE TABLE IF NOT EXISTS sales_invoice_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    sales_invoice_id             UUID NOT NULL,
    item_id                      UUID NOT NULL,
    item_code                    TEXT NOT NULL,
    item_name                    TEXT NOT NULL,
    hsn_sac_code                 TEXT,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    uom_id                       UUID NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    discount_percentage          NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    net_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    income_account_id            UUID,
    cgst_rate                    NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    cgst_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    sgst_rate                    NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    sgst_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    igst_rate                    NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    igst_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    cess_rate                    NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    cess_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    total_amount                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    sales_order_id               UUID,
    sales_order_item_id          UUID,
    delivery_note_id             UUID,
    CONSTRAINT pk_sales_invoice_item PRIMARY KEY (id),
    CONSTRAINT fk_sales_invoice_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_invoice_item_invoice_id FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoice(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_invoice_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_invoice_item_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT
);

ALTER TABLE sales_invoice_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON sales_invoice_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_sii_invoice_id ON sales_invoice_item USING btree (sales_invoice_id);

-- 4. Purchase Invoice (Vendor Bill)
CREATE TABLE IF NOT EXISTS purchase_invoice (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    invoice_number               TEXT NOT NULL,
    bill_number                  TEXT,
    bill_date                    DATE,
    company_id                   UUID NOT NULL,
    supplier_id                  UUID NOT NULL,
    supplier_name                TEXT,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date                     DATE NOT NULL,
    status                       TEXT NOT NULL DEFAULT 'Draft',
    currency                     TEXT NOT NULL DEFAULT 'INR',
    exchange_rate                NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    net_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    grand_total                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    outstanding_amount           NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    paid_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tds_category_id              UUID,
    tds_rate                     NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    tds_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    credit_to_account_id         UUID,
    remarks                      TEXT,
    CONSTRAINT pk_purchase_invoice PRIMARY KEY (id),
    CONSTRAINT fk_purchase_invoice_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_invoice_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_invoice_supplier_id FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT,
    CONSTRAINT uq_purchase_invoice_number UNIQUE (tenant_id, company_id, invoice_number),
    CONSTRAINT chk_purchase_invoice_status CHECK (status IN ('Draft','Submitted','Paid','Partially Paid','Overdue','Cancelled'))
);

ALTER TABLE purchase_invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON purchase_invoice
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_pi_supplier_due ON purchase_invoice USING btree (supplier_id, due_date, status);

CREATE TABLE IF NOT EXISTS purchase_invoice_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    purchase_invoice_id          UUID NOT NULL,
    item_id                      UUID NOT NULL,
    item_code                    TEXT NOT NULL,
    item_name                    TEXT NOT NULL,
    hsn_sac_code                 TEXT,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    uom_id                       UUID NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    discount_percentage          NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    net_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    expense_account_id           UUID,
    cgst_rate                    NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    cgst_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    sgst_rate                    NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    sgst_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    igst_rate                    NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    igst_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    total_amount                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    purchase_order_id            UUID,
    purchase_order_item_id       UUID,
    purchase_receipt_id          UUID,
    CONSTRAINT pk_purchase_invoice_item PRIMARY KEY (id),
    CONSTRAINT fk_purchase_invoice_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_invoice_item_invoice_id FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoice(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_invoice_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_invoice_item_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT
);

ALTER TABLE purchase_invoice_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON purchase_invoice_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_pii_invoice_id ON purchase_invoice_item USING btree (purchase_invoice_id);

-- 5. Payment Entry (Customer Receipts, Vendor Payments, Contra Transfers)
CREATE TABLE IF NOT EXISTS payment_entry (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    payment_number               TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    payment_type                 TEXT NOT NULL DEFAULT 'Receive',
    party_type                   TEXT,
    party_id                     UUID,
    party_name                   TEXT,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    paid_from_account_id         UUID NOT NULL,
    paid_to_account_id           UUID NOT NULL,
    paid_amount                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    received_amount              NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    unallocated_amount           NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    mode_of_payment              TEXT NOT NULL DEFAULT 'Bank Transfer',
    reference_no                 TEXT,
    reference_date               DATE,
    status                       TEXT NOT NULL DEFAULT 'Draft',
    user_remark                  TEXT,
    CONSTRAINT pk_payment_entry PRIMARY KEY (id),
    CONSTRAINT fk_payment_entry_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_entry_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_entry_paid_from FOREIGN KEY (paid_from_account_id) REFERENCES account(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_entry_paid_to FOREIGN KEY (paid_to_account_id) REFERENCES account(id) ON DELETE RESTRICT,
    CONSTRAINT uq_payment_entry_number UNIQUE (tenant_id, payment_number),
    CONSTRAINT chk_pe_payment_type CHECK (payment_type IN ('Receive','Pay','Internal Transfer')),
    CONSTRAINT chk_pe_status CHECK (status IN ('Draft','Submitted','Cancelled'))
);

ALTER TABLE payment_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON payment_entry
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_pe_party_date ON payment_entry USING btree (tenant_id, party_type, party_id, posting_date DESC);

CREATE TABLE IF NOT EXISTS payment_entry_reference (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    payment_entry_id             UUID NOT NULL,
    reference_doctype            TEXT NOT NULL,
    reference_id                 UUID NOT NULL,
    total_amount                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    outstanding_amount           NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    allocated_amount             NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_payment_entry_reference PRIMARY KEY (id),
    CONSTRAINT fk_payment_entry_ref_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_payment_entry_ref_payment_id FOREIGN KEY (payment_entry_id) REFERENCES payment_entry(id) ON DELETE CASCADE,
    CONSTRAINT chk_per_allocated_pos CHECK (allocated_amount > 0)
);

ALTER TABLE payment_entry_reference ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON payment_entry_reference
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_per_doc_ref ON payment_entry_reference USING btree (reference_doctype, reference_id);

-- 6. Bank Account & Bank Transactions
CREATE TABLE IF NOT EXISTS bank_account (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    account_name                 TEXT NOT NULL,
    bank_name                    TEXT NOT NULL,
    account_number               TEXT NOT NULL,
    ifsc_code                    TEXT,
    swift_code                   TEXT,
    branch_name                  TEXT,
    gl_account_id                UUID NOT NULL,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_bank_account PRIMARY KEY (id),
    CONSTRAINT fk_bank_account_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_bank_account_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_bank_account_gl_id FOREIGN KEY (gl_account_id) REFERENCES account(id) ON DELETE RESTRICT,
    CONSTRAINT uq_bank_account_no UNIQUE (tenant_id, company_id, account_number)
);

ALTER TABLE bank_account ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON bank_account
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);
