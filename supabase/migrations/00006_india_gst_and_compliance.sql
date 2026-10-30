-- ==============================================================================
-- VyaparSuite Migration 00006: India GST & Statutory Compliance Engine
-- Modules: GST Settings, HSN/SAC Master, E-Invoice Records, E-Way Bill Records
-- ==============================================================================

-- 1. GST Settings per Company / Registration
CREATE TABLE IF NOT EXISTS gst_settings (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    gstin                        TEXT NOT NULL,
    registered_legal_name        TEXT NOT NULL,
    registered_trade_name        TEXT,
    state_code                   TEXT NOT NULL, -- 2-digit Indian State Code, e.g., '27' for Maharashtra
    state_name                   TEXT NOT NULL,
    gst_category                 TEXT NOT NULL DEFAULT 'Registered Regular',
    annual_turnover              NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    is_e_invoice_applicable      BOOLEAN NOT NULL DEFAULT false,
    e_invoice_threshold          NUMERIC(20,6) NOT NULL DEFAULT 50000000.000000, -- Default ₹5 Cr
    lut_number                   TEXT, -- Letter of Undertaking for Zero-Rated Exports
    lut_expiry_date              DATE,
    default_eway_bill_threshold  NUMERIC(20,6) NOT NULL DEFAULT 50000.000000, -- Default ₹50,000
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_gst_settings PRIMARY KEY (id),
    CONSTRAINT fk_gst_settings_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_gst_settings_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_gst_settings_gstin UNIQUE (tenant_id, company_id, gstin)
);

ALTER TABLE gst_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON gst_settings
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_gst_settings_company ON gst_settings USING btree (company_id, is_active);

-- 2. HSN / SAC Statutory Codes Master
CREATE TABLE IF NOT EXISTS hsn_sac_code (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    code                         TEXT NOT NULL, -- e.g., '8481', '998314'
    type                         TEXT NOT NULL DEFAULT 'HSN', -- 'HSN' (Goods) or 'SAC' (Services)
    description                  TEXT NOT NULL,
    chapter_number               TEXT,
    default_gst_rate             NUMERIC(10,6) NOT NULL DEFAULT 18.000000,
    cess_rate                    NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    is_rcm_applicable            BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_hsn_sac_code PRIMARY KEY (id),
    CONSTRAINT fk_hsn_sac_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_hsn_sac_code UNIQUE (tenant_id, code),
    CONSTRAINT chk_hsn_sac_type CHECK (type IN ('HSN', 'SAC'))
);

ALTER TABLE hsn_sac_code ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON hsn_sac_code
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_hsn_code ON hsn_sac_code USING btree (tenant_id, code);

-- 3. E-Invoice (IRN) Generation Audit Ledger
CREATE TABLE IF NOT EXISTS e_invoice_log (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    sales_invoice_id             UUID NOT NULL,
    invoice_number               TEXT NOT NULL,
    irn                          TEXT NOT NULL, -- 64-character SHA-256 hash
    ack_number                   TEXT,
    ack_date                     TIMESTAMPTZ,
    signed_invoice_json          TEXT,
    signed_qr_code               TEXT,
    status                       TEXT NOT NULL DEFAULT 'Generated', -- 'Generated', 'Cancelled', 'Failed'
    cancellation_date            TIMESTAMPTZ,
    cancellation_reason          TEXT,
    error_details                JSONB,
    CONSTRAINT pk_e_invoice_log PRIMARY KEY (id),
    CONSTRAINT fk_e_invoice_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_e_invoice_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT,
    CONSTRAINT fk_e_invoice_invoice_id FOREIGN KEY (sales_invoice_id) REFERENCES sales_invoice(id) ON DELETE CASCADE,
    CONSTRAINT uq_e_invoice_irn UNIQUE (tenant_id, irn)
);

ALTER TABLE e_invoice_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON e_invoice_log
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_e_invoice_sales_id ON e_invoice_log USING btree (sales_invoice_id);

-- 4. E-Way Bill (EWB) Tracking
CREATE TABLE IF NOT EXISTS e_way_bill (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    eway_bill_number             TEXT NOT NULL,
    eway_bill_date               TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    valid_upto                   TIMESTAMPTZ NOT NULL,
    document_type                TEXT NOT NULL DEFAULT 'INV', -- 'INV', 'CHL', 'BIL'
    document_id                  UUID NOT NULL,
    document_number              TEXT NOT NULL,
    transporter_id               TEXT, -- Transporter GSTIN or TRANSIN
    transporter_name             TEXT,
    transport_mode               TEXT NOT NULL DEFAULT 'Road', -- 'Road', 'Rail', 'Air', 'Ship'
    vehicle_number               TEXT,
    approximate_distance_km      INTEGER NOT NULL,
    consignment_value            NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    from_pincode                 TEXT NOT NULL,
    to_pincode                   TEXT NOT NULL,
    status                       TEXT NOT NULL DEFAULT 'Active', -- 'Active', 'Cancelled', 'Expired'
    cancellation_reason          TEXT,
    part_a_data                  JSONB NOT NULL,
    part_b_data                  JSONB,
    CONSTRAINT pk_e_way_bill PRIMARY KEY (id),
    CONSTRAINT fk_e_way_bill_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_e_way_bill_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE RESTRICT,
    CONSTRAINT uq_e_way_bill_number UNIQUE (tenant_id, eway_bill_number)
);

ALTER TABLE e_way_bill ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON e_way_bill
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_ewb_doc ON e_way_bill USING btree (document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_ewb_validity ON e_way_bill USING btree (valid_upto, status);
