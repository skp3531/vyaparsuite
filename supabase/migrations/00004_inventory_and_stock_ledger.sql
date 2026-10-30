-- ==============================================================================
-- VyaparSuite Migration 00004: Inventory Engine & Stock Ledger
-- Modules: Batch, Serial Number, Immutable Stock Ledger, Stock Balances (Bin),
--          Stock Transfers, Stock Reconciliations, Delivery Notes, Purchase Receipts
-- ==============================================================================

-- 1. Ledger Immutability Enforcement Function
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Immutable Ledger Violation: Updates and deletions are strictly prohibited on % (ID: %). Financial/Stock corrections must be performed using reversing transactions.', TG_TABLE_NAME, OLD.id;
END;
$$ LANGUAGE plpgsql;

-- 2. Item Batches
CREATE TABLE IF NOT EXISTS batch (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    batch_id_code                TEXT NOT NULL,
    item_id                      UUID NOT NULL,
    manufacturing_date           DATE,
    expiry_date                  DATE,
    batch_qty                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    description                  TEXT,
    is_disabled                  BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_batch PRIMARY KEY (id),
    CONSTRAINT fk_batch_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_batch_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT uq_batch_item_code UNIQUE (tenant_id, item_id, batch_id_code),
    CONSTRAINT chk_batch_dates CHECK (expiry_date IS NULL OR manufacturing_date IS NULL OR expiry_date >= manufacturing_date)
);

ALTER TABLE batch ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON batch
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_batch_item_exp ON batch USING btree (tenant_id, item_id, expiry_date);

-- 3. Item Serial Numbers
CREATE TABLE IF NOT EXISTS serial_number (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    serial_no                    TEXT NOT NULL,
    item_id                      UUID NOT NULL,
    warehouse_id                 UUID,
    status                       TEXT NOT NULL DEFAULT 'Active',
    batch_id                     UUID,
    purchase_document_type       TEXT,
    purchase_document_id         UUID,
    delivery_document_type       TEXT,
    delivery_document_id         UUID,
    warranty_expiry_date         DATE,
    CONSTRAINT pk_serial_number PRIMARY KEY (id),
    CONSTRAINT fk_serial_number_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_serial_number_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_serial_number_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE SET NULL,
    CONSTRAINT fk_serial_number_batch_id FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE SET NULL,
    CONSTRAINT uq_serial_item_no UNIQUE (tenant_id, item_id, serial_no),
    CONSTRAINT chk_serial_status CHECK (status IN ('Active','Delivered','Under Repair','Expired','Scrapped'))
);

ALTER TABLE serial_number ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON serial_number
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_serial_lookup ON serial_number USING btree (tenant_id, serial_no);

-- 4. Immutable Stock Ledger Entry (Append-Only)
CREATE TABLE IF NOT EXISTS stock_ledger_entry (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    item_id                      UUID NOT NULL,
    warehouse_id                 UUID NOT NULL,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    posting_time                 TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    actual_qty                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    qty_after_transaction        NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    incoming_rate                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    valuation_rate               NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    stock_value                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    stock_value_difference       NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    voucher_type                 TEXT NOT NULL,
    voucher_id                   UUID NOT NULL,
    voucher_detail_id            UUID,
    batch_id                     UUID,
    serial_no                    TEXT,
    company_id                   UUID NOT NULL,
    is_cancelled                 BOOLEAN NOT NULL DEFAULT false,
    fiscal_year_id               UUID,
    CONSTRAINT pk_stock_ledger_entry PRIMARY KEY (id),
    CONSTRAINT fk_stock_ledger_entry_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_ledger_entry_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_ledger_entry_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_ledger_entry_batch_id FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE SET NULL,
    CONSTRAINT fk_stock_ledger_entry_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT
);

ALTER TABLE stock_ledger_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON stock_ledger_entry
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_sle_item_wh_posting ON stock_ledger_entry USING btree (tenant_id, item_id, warehouse_id, posting_time DESC);
CREATE INDEX IF NOT EXISTS idx_sle_voucher ON stock_ledger_entry USING btree (voucher_type, voucher_id);

-- Attach Immutability Trigger
CREATE TRIGGER trg_prevent_mutation_stock_ledger_entry
    BEFORE UPDATE OR DELETE ON stock_ledger_entry
    FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- 5. Real-Time Stock Balance (Bin) Cache Table
CREATE TABLE IF NOT EXISTS stock_balance (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    item_id                      UUID NOT NULL,
    warehouse_id                 UUID NOT NULL,
    actual_qty                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    reserved_qty                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    ordered_qty                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    indented_qty                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    projected_qty                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    valuation_rate               NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    stock_value                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_stock_balance PRIMARY KEY (id),
    CONSTRAINT fk_stock_balance_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_balance_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_balance_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT uq_stock_balance_item_wh UNIQUE (tenant_id, item_id, warehouse_id)
);

ALTER TABLE stock_balance ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON stock_balance
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_stock_bal_lookup ON stock_balance USING btree (tenant_id, item_id, warehouse_id);

-- 6. Delivery Note (Sales Outward Challan)
CREATE TABLE IF NOT EXISTS delivery_note (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    delivery_note_number         TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    customer_id                  UUID NOT NULL,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    posting_time                 TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    status                       TEXT NOT NULL DEFAULT 'Draft',
    transporter_name             TEXT,
    vehicle_no                   TEXT,
    lr_no                        TEXT,
    lr_date                      DATE,
    eway_bill_no                 TEXT,
    eway_bill_validity           TIMESTAMPTZ,
    grand_total                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_delivery_note PRIMARY KEY (id),
    CONSTRAINT fk_delivery_note_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_delivery_note_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_note_customer_id FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT,
    CONSTRAINT uq_delivery_note_number UNIQUE (tenant_id, delivery_note_number),
    CONSTRAINT chk_delivery_note_status CHECK (status IN ('Draft','Submitted','Closed','Cancelled'))
);

ALTER TABLE delivery_note ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON delivery_note
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_dn_customer_date ON delivery_note USING btree (customer_id, posting_date DESC);
CREATE INDEX IF NOT EXISTS idx_dn_eway_bill ON delivery_note USING btree (tenant_id, eway_bill_no);

CREATE TABLE IF NOT EXISTS delivery_note_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    delivery_note_id             UUID NOT NULL,
    item_id                      UUID NOT NULL,
    warehouse_id                 UUID NOT NULL,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    uom_id                       UUID NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    amount                       NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    batch_id                     UUID,
    serial_nos                   TEXT,
    sales_order_id               UUID,
    sales_order_item_id          UUID,
    CONSTRAINT pk_delivery_note_item PRIMARY KEY (id),
    CONSTRAINT fk_delivery_note_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_delivery_note_item_note_id FOREIGN KEY (delivery_note_id) REFERENCES delivery_note(id) ON DELETE CASCADE,
    CONSTRAINT fk_delivery_note_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_delivery_note_item_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_delivery_note_item_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT fk_delivery_note_item_batch_id FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE RESTRICT,
    CONSTRAINT chk_dni_qty_pos CHECK (qty > 0)
);

ALTER TABLE delivery_note_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON delivery_note_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_dni_note_id ON delivery_note_item USING btree (delivery_note_id);

-- 7. Purchase Receipt (Goods Receipt Note - GRN)
CREATE TABLE IF NOT EXISTS purchase_receipt (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    receipt_number               TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    supplier_id                  UUID NOT NULL,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    posting_time                 TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    status                       TEXT NOT NULL DEFAULT 'Draft',
    supplier_delivery_note       TEXT,
    grand_total                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_purchase_receipt PRIMARY KEY (id),
    CONSTRAINT fk_purchase_receipt_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_receipt_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_receipt_supplier_id FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT,
    CONSTRAINT uq_purchase_receipt_number UNIQUE (tenant_id, receipt_number),
    CONSTRAINT chk_purchase_receipt_status CHECK (status IN ('Draft','Submitted','Closed','Cancelled'))
);

ALTER TABLE purchase_receipt ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON purchase_receipt
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_pr_supplier_date ON purchase_receipt USING btree (supplier_id, posting_date DESC);

CREATE TABLE IF NOT EXISTS purchase_receipt_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    purchase_receipt_id          UUID NOT NULL,
    item_id                      UUID NOT NULL,
    warehouse_id                 UUID NOT NULL,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    rejected_qty                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    uom_id                       UUID NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    amount                       NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    batch_id                     UUID,
    serial_nos                   TEXT,
    purchase_order_id            UUID,
    purchase_order_item_id       UUID,
    CONSTRAINT pk_purchase_receipt_item PRIMARY KEY (id),
    CONSTRAINT fk_purchase_receipt_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_receipt_item_receipt_id FOREIGN KEY (purchase_receipt_id) REFERENCES purchase_receipt(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_receipt_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_receipt_item_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_receipt_item_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_receipt_item_batch_id FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE SET NULL,
    CONSTRAINT chk_pri_qty_nonneg CHECK (qty >= 0),
    CONSTRAINT chk_pri_rej_nonneg CHECK (rejected_qty >= 0)
);

ALTER TABLE purchase_receipt_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON purchase_receipt_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_pri_receipt_id ON purchase_receipt_item USING btree (purchase_receipt_id);

-- 8. Stock Transfer (Internal Movement / Material Transfer)
CREATE TABLE IF NOT EXISTS stock_transfer (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    transfer_number              TEXT NOT NULL,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    from_warehouse_id            UUID NOT NULL,
    to_warehouse_id              UUID NOT NULL,
    purpose                      TEXT NOT NULL DEFAULT 'Material Transfer',
    status                       TEXT NOT NULL DEFAULT 'Draft',
    remarks                      TEXT,
    CONSTRAINT pk_stock_transfer PRIMARY KEY (id),
    CONSTRAINT fk_stock_transfer_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_transfer_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_from_warehouse_id FOREIGN KEY (from_warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_transfer_to_warehouse_id FOREIGN KEY (to_warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT uq_stock_transfer_number UNIQUE (tenant_id, transfer_number),
    CONSTRAINT chk_stock_transfer_status CHECK (status IN ('Draft','Submitted','Closed','Cancelled')),
    CONSTRAINT chk_stock_transfer_different_wh CHECK (from_warehouse_id <> to_warehouse_id)
);

ALTER TABLE stock_transfer ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON stock_transfer
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_stock_transfer_date ON stock_transfer USING btree (company_id, posting_date DESC);

CREATE TABLE IF NOT EXISTS stock_transfer_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    stock_transfer_id            UUID NOT NULL,
    item_id                      UUID NOT NULL,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    uom_id                       UUID NOT NULL,
    transfer_rate                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    batch_id                     UUID,
    CONSTRAINT pk_stock_transfer_item PRIMARY KEY (id),
    CONSTRAINT fk_stock_transfer_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_transfer_item_stock_transfer_id FOREIGN KEY (stock_transfer_id) REFERENCES stock_transfer(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_transfer_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_transfer_item_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_transfer_item_batch_id FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE SET NULL,
    CONSTRAINT chk_sti_qty_pos CHECK (qty > 0)
);

ALTER TABLE stock_transfer_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON stock_transfer_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_sti_transfer_id ON stock_transfer_item USING btree (stock_transfer_id);

-- 9. Stock Reconciliation (Physical Count Verification & Variance Adjustment)
CREATE TABLE IF NOT EXISTS stock_reconciliation (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    reconciliation_number        TEXT NOT NULL,
    posting_date                 DATE NOT NULL DEFAULT CURRENT_DATE,
    purpose                      TEXT NOT NULL DEFAULT 'Stock Reconciliation',
    status                       TEXT NOT NULL DEFAULT 'Draft',
    remarks                      TEXT,
    CONSTRAINT pk_stock_reconciliation PRIMARY KEY (id),
    CONSTRAINT fk_stock_reconciliation_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_reconciliation_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_sr_reconcile_number UNIQUE (tenant_id, reconciliation_number),
    CONSTRAINT chk_stock_reconciliation_status CHECK (status IN ('Draft','Submitted','Closed','Cancelled'))
);

ALTER TABLE stock_reconciliation ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON stock_reconciliation
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_sr_company_date ON stock_reconciliation USING btree (company_id, posting_date DESC);

CREATE TABLE IF NOT EXISTS stock_reconciliation_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    reconciliation_id            UUID NOT NULL,
    item_id                      UUID NOT NULL,
    warehouse_id                 UUID NOT NULL,
    current_qty                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    counted_qty                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    qty_difference               NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    current_valuation_rate       NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    new_valuation_rate           NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    batch_id                     UUID,
    CONSTRAINT pk_stock_reconciliation_item PRIMARY KEY (id),
    CONSTRAINT fk_stock_reconciliation_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_reconciliation_item_reconciliation_id FOREIGN KEY (reconciliation_id) REFERENCES stock_reconciliation(id) ON DELETE CASCADE,
    CONSTRAINT fk_stock_reconciliation_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_reconciliation_item_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_reconciliation_item_batch_id FOREIGN KEY (batch_id) REFERENCES batch(id) ON DELETE SET NULL
);

ALTER TABLE stock_reconciliation_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON stock_reconciliation_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_sri_parent ON stock_reconciliation_item USING btree (reconciliation_id);

-- 10. Reorder Rules
CREATE TABLE IF NOT EXISTS reorder_rule (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    item_id                      UUID NOT NULL,
    warehouse_id                 UUID NOT NULL,
    reorder_level                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    reorder_qty                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    material_request_type        TEXT NOT NULL DEFAULT 'Purchase',
    CONSTRAINT pk_reorder_rule PRIMARY KEY (id),
    CONSTRAINT fk_reorder_rule_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reorder_rule_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_reorder_rule_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT uq_reorder_rule UNIQUE (tenant_id, item_id, warehouse_id)
);

ALTER TABLE reorder_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON reorder_rule
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);
