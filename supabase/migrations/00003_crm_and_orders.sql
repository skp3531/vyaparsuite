-- ==============================================================================
-- VyaparSuite Migration 00003: CRM, Quotations, Sales Orders & Purchase Orders
-- Comprehensive transactional schema for Order-to-Cash (O2C) and Procure-to-Pay (P2P)
-- Conforms strictly to docs/DATABASE_SCHEMA.md specifications
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CRM SUBSYSTEM TABLES
-- ------------------------------------------------------------------------------

-- 1.1 Lead Source
CREATE TABLE IF NOT EXISTS lead_source (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    source_name                  TEXT NOT NULL,
    description                  TEXT,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_lead_source PRIMARY KEY (id),
    CONSTRAINT fk_lead_source_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_lead_source_name UNIQUE (tenant_id, source_name)
);

ALTER TABLE lead_source ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON lead_source
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_lead_source_active ON lead_source USING btree (tenant_id, is_active);

-- 1.2 Pipeline Stage
CREATE TABLE IF NOT EXISTS pipeline_stage (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    stage_name                   TEXT NOT NULL,
    probability_percentage       NUMERIC(10,6) NOT NULL DEFAULT 10.000000,
    stage_order                  INTEGER NOT NULL DEFAULT 1,
    is_won_stage                 BOOLEAN NOT NULL DEFAULT false,
    is_lost_stage                BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_pipeline_stage PRIMARY KEY (id),
    CONSTRAINT fk_pipeline_stage_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_pipeline_stage_name UNIQUE (tenant_id, stage_name)
);

ALTER TABLE pipeline_stage ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON pipeline_stage
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_pipeline_stage_order ON pipeline_stage USING btree (tenant_id, stage_order);

-- 1.3 Marketing Campaign
CREATE TABLE IF NOT EXISTS campaign (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    campaign_name                TEXT NOT NULL,
    campaign_type                TEXT,
    start_date                   DATE,
    end_date                     DATE,
    budget_allocated             NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    actual_cost                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_campaign PRIMARY KEY (id),
    CONSTRAINT fk_campaign_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_campaign_name UNIQUE (tenant_id, campaign_name)
);

ALTER TABLE campaign ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON campaign
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

-- 1.4 Sales Territory
CREATE TABLE IF NOT EXISTS sales_territory (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    territory_name               TEXT NOT NULL,
    parent_territory_id          UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    manager_id                   UUID,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_sales_territory PRIMARY KEY (id),
    CONSTRAINT fk_sales_territory_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_territory_parent FOREIGN KEY (parent_territory_id) REFERENCES sales_territory(id) ON DELETE RESTRICT,
    CONSTRAINT uq_sales_territory_name UNIQUE (tenant_id, territory_name)
);

ALTER TABLE sales_territory ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON sales_territory
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

-- 1.5 Sales Person
CREATE TABLE IF NOT EXISTS sales_person (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    sales_person_name            TEXT NOT NULL,
    user_id                      UUID,
    territory_id                 UUID,
    commission_rate              NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_sales_person PRIMARY KEY (id),
    CONSTRAINT fk_sales_person_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_person_territory FOREIGN KEY (territory_id) REFERENCES sales_territory(id) ON DELETE SET NULL,
    CONSTRAINT uq_sales_person_name UNIQUE (tenant_id, sales_person_name)
);

ALTER TABLE sales_person ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON sales_person
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

-- 1.6 Lead
CREATE TABLE IF NOT EXISTS lead (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    lead_name                    TEXT NOT NULL,
    company_name                 TEXT,
    email                        TEXT,
    phone                        TEXT,
    mobile_no                    TEXT,
    lead_source_id               UUID,
    campaign_id                  UUID,
    territory_id                 UUID,
    status                       TEXT NOT NULL DEFAULT 'Open',
    qualification_status         TEXT,
    lead_score                   INTEGER NOT NULL DEFAULT 0,
    assigned_to_id               UUID,
    annual_revenue               NUMERIC(20,6),
    no_of_employees              INTEGER,
    industry                     TEXT,
    website                      TEXT,
    notes                        TEXT,
    converted_customer_id        UUID,
    converted_at                 TIMESTAMPTZ,
    CONSTRAINT pk_lead PRIMARY KEY (id),
    CONSTRAINT fk_lead_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_lead_lead_source_id FOREIGN KEY (lead_source_id) REFERENCES lead_source(id) ON DELETE SET NULL,
    CONSTRAINT fk_lead_campaign_id FOREIGN KEY (campaign_id) REFERENCES campaign(id) ON DELETE SET NULL,
    CONSTRAINT fk_lead_territory_id FOREIGN KEY (territory_id) REFERENCES sales_territory(id) ON DELETE SET NULL,
    CONSTRAINT fk_lead_customer FOREIGN KEY (converted_customer_id) REFERENCES customer(id) ON DELETE SET NULL,
    CONSTRAINT chk_lead_status CHECK (status IN ('Open','Contacted','Qualified','Unqualified','Converted','Lost'))
);

ALTER TABLE lead ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON lead
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_lead_status ON lead USING btree (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_assigned ON lead USING btree (tenant_id, assigned_to_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_email ON lead USING btree (tenant_id, email);

-- 1.7 Opportunity
CREATE TABLE IF NOT EXISTS opportunity (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    opportunity_name             TEXT NOT NULL,
    party_type                   TEXT NOT NULL DEFAULT 'Customer',
    party_id                     UUID,
    lead_id                      UUID,
    pipeline_stage_id            UUID NOT NULL,
    expected_closing_date        DATE,
    expected_revenue             NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    probability_percentage       NUMERIC(10,6) NOT NULL DEFAULT 20.000000,
    weighted_revenue             NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    currency                     TEXT NOT NULL DEFAULT 'INR',
    status                       TEXT NOT NULL DEFAULT 'Open',
    assigned_to_id               UUID,
    loss_reason                  TEXT,
    CONSTRAINT pk_opportunity PRIMARY KEY (id),
    CONSTRAINT fk_opportunity_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_opportunity_stage FOREIGN KEY (pipeline_stage_id) REFERENCES pipeline_stage(id) ON DELETE RESTRICT,
    CONSTRAINT fk_opportunity_lead FOREIGN KEY (lead_id) REFERENCES lead(id) ON DELETE SET NULL,
    CONSTRAINT chk_opportunity_status CHECK (status IN ('Open', 'Won', 'Lost', 'On Hold'))
);

ALTER TABLE opportunity ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON opportunity
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_opportunity_stage ON opportunity USING btree (tenant_id, pipeline_stage_id, status);
CREATE INDEX IF NOT EXISTS idx_opportunity_closing ON opportunity USING btree (tenant_id, expected_closing_date);

-- 1.8 Opportunity Item
CREATE TABLE IF NOT EXISTS opportunity_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    opportunity_id               UUID NOT NULL,
    item_id                      UUID NOT NULL,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    amount                       NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_opportunity_item PRIMARY KEY (id),
    CONSTRAINT fk_opp_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_opp_item_opportunity FOREIGN KEY (opportunity_id) REFERENCES opportunity(id) ON DELETE CASCADE,
    CONSTRAINT fk_opp_item_item FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT chk_opp_item_qty CHECK (qty > 0)
);

ALTER TABLE opportunity_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON opportunity_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_opp_item_opp_id ON opportunity_item USING btree (opportunity_id);

-- 1.9 CRM Activity
CREATE TABLE IF NOT EXISTS crm_activity (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    activity_type                TEXT NOT NULL, -- 'Call', 'Meeting', 'Email', 'Task', 'Note'
    subject                      TEXT NOT NULL,
    description                  TEXT,
    due_date                     TIMESTAMPTZ,
    status                       TEXT NOT NULL DEFAULT 'Open', -- 'Open', 'Completed', 'Cancelled'
    reference_doctype            TEXT, -- 'lead', 'opportunity', 'customer'
    reference_id                 UUID,
    assigned_to_id               UUID,
    completed_at                 TIMESTAMPTZ,
    CONSTRAINT pk_crm_activity PRIMARY KEY (id),
    CONSTRAINT fk_crm_activity_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT chk_activity_type CHECK (activity_type IN ('Call', 'Meeting', 'Email', 'Task', 'Note'))
);

ALTER TABLE crm_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON crm_activity
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_crm_activity_ref ON crm_activity USING btree (tenant_id, reference_doctype, reference_id);

-- ------------------------------------------------------------------------------
-- 2. SALES SUBSYSTEM TABLES
-- ------------------------------------------------------------------------------

-- 2.1 Quotation
CREATE TABLE IF NOT EXISTS quotation (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    quotation_number             TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    party_type                   TEXT NOT NULL DEFAULT 'Customer', -- 'Customer' or 'Lead'
    customer_id                  UUID,
    lead_id                      UUID,
    opportunity_id               UUID,
    transaction_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_upto                   DATE,
    status                       TEXT NOT NULL DEFAULT 'Draft',
    currency                     TEXT NOT NULL DEFAULT 'INR',
    exchange_rate                NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    net_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    grand_total                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    rounding_adjustment          NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    rounded_total                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    payment_terms_template_id    UUID,
    terms_and_conditions_id      UUID,
    shipping_address_id          UUID,
    billing_address_id           UUID,
    order_lost_reason            TEXT,
    notes                        TEXT,
    submitted_at                 TIMESTAMPTZ,
    submitted_by                 UUID,
    amended_from_id              UUID,
    CONSTRAINT pk_quotation PRIMARY KEY (id),
    CONSTRAINT fk_quotation_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_quotation_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_quotation_customer_id FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT,
    CONSTRAINT fk_quotation_lead_id FOREIGN KEY (lead_id) REFERENCES lead(id) ON DELETE SET NULL,
    CONSTRAINT fk_quotation_opportunity_id FOREIGN KEY (opportunity_id) REFERENCES opportunity(id) ON DELETE SET NULL,
    CONSTRAINT uq_quotation_number UNIQUE (tenant_id, quotation_number),
    CONSTRAINT chk_quotation_status CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Ordered', 'Lost', 'Cancelled', 'Expired'))
);

ALTER TABLE quotation ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON quotation
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_quotation_customer ON quotation USING btree (customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_status ON quotation USING btree (tenant_id, status);

-- 2.2 Quotation Item
CREATE TABLE IF NOT EXISTS quotation_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    quotation_id                 UUID NOT NULL,
    idx                          INTEGER NOT NULL DEFAULT 1,
    item_id                      UUID NOT NULL,
    item_code                    TEXT NOT NULL,
    item_name                    TEXT NOT NULL,
    description                  TEXT,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    uom_id                       UUID NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    discount_percentage          NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    discount_amount              NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    net_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_template_id              UUID,
    tax_rate                     NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    tax_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    total_amount                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    lead_time_days               INTEGER DEFAULT 0,
    CONSTRAINT pk_quotation_item PRIMARY KEY (id),
    CONSTRAINT fk_quotation_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_quotation_item_quotation_id FOREIGN KEY (quotation_id) REFERENCES quotation(id) ON DELETE CASCADE,
    CONSTRAINT fk_quotation_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_quotation_item_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT chk_qi_qty_pos CHECK (qty > 0)
);

ALTER TABLE quotation_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON quotation_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_qi_quotation_id ON quotation_item USING btree (quotation_id);

-- 2.3 Sales Order
CREATE TABLE IF NOT EXISTS sales_order (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    order_number                 TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    customer_id                  UUID NOT NULL,
    quotation_id                 UUID,
    transaction_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    delivery_date                DATE NOT NULL,
    customer_po_no               TEXT,
    customer_po_date             DATE,
    status                       TEXT NOT NULL DEFAULT 'Draft',
    currency                     TEXT NOT NULL DEFAULT 'INR',
    exchange_rate                NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    net_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    grand_total                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    rounding_adjustment          NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    rounded_total                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    delivered_percent            NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    billed_percent               NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    advance_paid                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    shipping_address_id          UUID,
    billing_address_id           UUID,
    payment_terms_template_id    UUID,
    terms_and_conditions_id      UUID,
    notes                        TEXT,
    submitted_at                 TIMESTAMPTZ,
    submitted_by                 UUID,
    approved_at                  TIMESTAMPTZ,
    approved_by                  UUID,
    amended_from_id              UUID,
    CONSTRAINT pk_sales_order PRIMARY KEY (id),
    CONSTRAINT fk_sales_order_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_order_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_order_customer_id FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_order_quotation_id FOREIGN KEY (quotation_id) REFERENCES quotation(id) ON DELETE SET NULL,
    CONSTRAINT uq_sales_order_number UNIQUE (tenant_id, order_number),
    CONSTRAINT chk_sales_order_status CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'To Deliver and Bill', 'To Deliver', 'To Bill', 'Completed', 'Cancelled', 'On Hold'))
);

ALTER TABLE sales_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON sales_order
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_so_customer ON sales_order USING btree (customer_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_so_status ON sales_order USING btree (company_id, status);
CREATE INDEX IF NOT EXISTS idx_so_delivery_date ON sales_order USING btree (tenant_id, delivery_date);

-- 2.4 Sales Order Item
CREATE TABLE IF NOT EXISTS sales_order_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    sales_order_id               UUID NOT NULL,
    idx                          INTEGER NOT NULL DEFAULT 1,
    item_id                      UUID NOT NULL,
    item_code                    TEXT NOT NULL,
    item_name                    TEXT NOT NULL,
    description                  TEXT,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    uom_id                       UUID NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    discount_percentage          NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    discount_amount              NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    net_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_template_id              UUID,
    tax_rate                     NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    tax_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    total_amount                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    delivered_qty                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    billed_qty                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    warehouse_id                 UUID,
    quotation_item_id            UUID,
    CONSTRAINT pk_sales_order_item PRIMARY KEY (id),
    CONSTRAINT fk_sales_order_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_order_item_sales_order_id FOREIGN KEY (sales_order_id) REFERENCES sales_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_sales_order_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_order_item_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sales_order_item_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE SET NULL,
    CONSTRAINT chk_soi_qty_pos CHECK (qty > 0)
);

ALTER TABLE sales_order_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON sales_order_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_soi_order_id ON sales_order_item USING btree (sales_order_id);
CREATE INDEX IF NOT EXISTS idx_soi_item_id ON sales_order_item USING btree (tenant_id, item_id);

-- 2.5 Blanket Order
CREATE TABLE IF NOT EXISTS blanket_order (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    blanket_order_number         TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    blanket_order_type           TEXT NOT NULL DEFAULT 'Selling', -- 'Selling' or 'Purchasing'
    party_id                     UUID NOT NULL, -- Customer ID or Supplier ID
    from_date                    DATE NOT NULL,
    to_date                      DATE NOT NULL,
    status                       TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Active', 'Completed', 'Expired'
    currency                     TEXT NOT NULL DEFAULT 'INR',
    CONSTRAINT pk_blanket_order PRIMARY KEY (id),
    CONSTRAINT fk_blanket_order_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_blanket_order_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_blanket_order_number UNIQUE (tenant_id, blanket_order_number)
);

ALTER TABLE blanket_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON blanket_order
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE TABLE IF NOT EXISTS blanket_order_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    blanket_order_id             UUID NOT NULL,
    item_id                      UUID NOT NULL,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    ordered_qty                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_blanket_order_item PRIMARY KEY (id),
    CONSTRAINT fk_boi_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_boi_order_id FOREIGN KEY (blanket_order_id) REFERENCES blanket_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_boi_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT
);

ALTER TABLE blanket_order_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON blanket_order_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

-- ------------------------------------------------------------------------------
-- 3. PROCUREMENT / PURCHASE SUBSYSTEM TABLES
-- ------------------------------------------------------------------------------

-- 3.1 Material Request (Requisition)
CREATE TABLE IF NOT EXISTS material_request (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    request_number               TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    material_request_type        TEXT NOT NULL DEFAULT 'Purchase', -- 'Purchase', 'Material Transfer', 'Material Issue', 'Manufacture'
    transaction_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    schedule_date                DATE,
    status                       TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Submitted', 'Partially Ordered', 'Ordered', 'Issued', 'Transferred', 'Cancelled'
    department_id                UUID,
    per_ordered                  NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    notes                        TEXT,
    submitted_at                 TIMESTAMPTZ,
    submitted_by                 UUID,
    CONSTRAINT pk_material_request PRIMARY KEY (id),
    CONSTRAINT fk_material_request_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_material_request_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_material_request_number UNIQUE (tenant_id, request_number)
);

ALTER TABLE material_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON material_request
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE TABLE IF NOT EXISTS material_request_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    material_request_id          UUID NOT NULL,
    idx                          INTEGER NOT NULL DEFAULT 1,
    item_id                      UUID NOT NULL,
    item_code                    TEXT NOT NULL,
    item_name                    TEXT NOT NULL,
    description                  TEXT,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    ordered_qty                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    uom_id                       UUID NOT NULL,
    required_date                DATE,
    warehouse_id                 UUID,
    CONSTRAINT pk_material_request_item PRIMARY KEY (id),
    CONSTRAINT fk_mri_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mri_request_id FOREIGN KEY (material_request_id) REFERENCES material_request(id) ON DELETE CASCADE,
    CONSTRAINT fk_mri_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mri_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT fk_mri_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE SET NULL,
    CONSTRAINT chk_mri_qty_pos CHECK (qty > 0)
);

ALTER TABLE material_request_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON material_request_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

-- 3.2 Request for Quotation (RFQ)
CREATE TABLE IF NOT EXISTS request_for_quotation (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    rfq_number                   TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    transaction_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    status                       TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Submitted', 'Received', 'Cancelled'
    material_request_id          UUID,
    notes                        TEXT,
    submitted_at                 TIMESTAMPTZ,
    submitted_by                 UUID,
    CONSTRAINT pk_request_for_quotation PRIMARY KEY (id),
    CONSTRAINT fk_rfq_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_rfq_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_rfq_number UNIQUE (tenant_id, rfq_number)
);

ALTER TABLE request_for_quotation ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON request_for_quotation
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

-- 3.3 Supplier Quotation
CREATE TABLE IF NOT EXISTS supplier_quotation (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    quotation_number             TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    supplier_id                  UUID NOT NULL,
    rfq_id                       UUID,
    transaction_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_upto                   DATE,
    status                       TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Submitted', 'Accepted', 'Rejected', 'Cancelled'
    currency                     TEXT NOT NULL DEFAULT 'INR',
    exchange_rate                NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    net_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    grand_total                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    submitted_at                 TIMESTAMPTZ,
    submitted_by                 UUID,
    CONSTRAINT pk_supplier_quotation PRIMARY KEY (id),
    CONSTRAINT fk_sq_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sq_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_sq_supplier_id FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT,
    CONSTRAINT uq_supplier_quotation_number UNIQUE (tenant_id, quotation_number)
);

ALTER TABLE supplier_quotation ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON supplier_quotation
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE TABLE IF NOT EXISTS supplier_quotation_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    supplier_quotation_id        UUID NOT NULL,
    idx                          INTEGER NOT NULL DEFAULT 1,
    item_id                      UUID NOT NULL,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    uom_id                       UUID NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    discount_percentage          NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    net_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_rate                     NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    tax_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    total_amount                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_supplier_quotation_item PRIMARY KEY (id),
    CONSTRAINT fk_sqi_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sqi_quote_id FOREIGN KEY (supplier_quotation_id) REFERENCES supplier_quotation(id) ON DELETE CASCADE,
    CONSTRAINT fk_sqi_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sqi_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT chk_sqi_qty_pos CHECK (qty > 0)
);

ALTER TABLE supplier_quotation_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON supplier_quotation_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

-- 3.4 Purchase Order
CREATE TABLE IF NOT EXISTS purchase_order (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    purchase_order_number        TEXT NOT NULL,
    company_id                   UUID NOT NULL,
    supplier_id                  UUID NOT NULL,
    supplier_quotation_id        UUID,
    transaction_date             DATE NOT NULL DEFAULT CURRENT_DATE,
    schedule_date                DATE NOT NULL,
    status                       TEXT NOT NULL DEFAULT 'Draft',
    currency                     TEXT NOT NULL DEFAULT 'INR',
    exchange_rate                NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    net_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_total                    NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    grand_total                  NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    rounding_adjustment          NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    rounded_total                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    received_percent             NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    billed_percent               NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    is_subcontracted             BOOLEAN NOT NULL DEFAULT false,
    payment_terms_template_id    UUID,
    terms_and_conditions_id      UUID,
    shipping_address_id          UUID,
    billing_address_id           UUID,
    notes                        TEXT,
    submitted_at                 TIMESTAMPTZ,
    submitted_by                 UUID,
    approved_at                  TIMESTAMPTZ,
    approved_by                  UUID,
    amended_from_id              UUID,
    CONSTRAINT pk_purchase_order PRIMARY KEY (id),
    CONSTRAINT fk_purchase_order_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_order_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_order_supplier_id FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_order_quotation_id FOREIGN KEY (supplier_quotation_id) REFERENCES supplier_quotation(id) ON DELETE SET NULL,
    CONSTRAINT uq_purchase_order_number UNIQUE (tenant_id, purchase_order_number),
    CONSTRAINT chk_purchase_order_status CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'To Receive and Bill', 'To Receive', 'To Bill', 'Completed', 'Cancelled', 'On Hold'))
);

ALTER TABLE purchase_order ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON purchase_order
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_po_supplier_date ON purchase_order USING btree (supplier_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_order USING btree (company_id, status);
CREATE INDEX IF NOT EXISTS idx_po_schedule_date ON purchase_order USING btree (tenant_id, schedule_date);

-- 3.5 Purchase Order Item
CREATE TABLE IF NOT EXISTS purchase_order_item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    purchase_order_id            UUID NOT NULL,
    idx                          INTEGER NOT NULL DEFAULT 1,
    item_id                      UUID NOT NULL,
    item_code                    TEXT NOT NULL,
    item_name                    TEXT NOT NULL,
    description                  TEXT,
    qty                          NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    uom_id                       UUID NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    discount_percentage          NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    discount_amount              NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    net_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    tax_template_id              UUID,
    tax_rate                     NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    tax_amount                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    total_amount                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    received_qty                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    billed_qty                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    warehouse_id                 UUID,
    material_request_item_id     UUID,
    CONSTRAINT pk_purchase_order_item PRIMARY KEY (id),
    CONSTRAINT fk_purchase_order_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_order_item_purchase_order_id FOREIGN KEY (purchase_order_id) REFERENCES purchase_order(id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_order_item_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_order_item_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_order_item_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE SET NULL,
    CONSTRAINT chk_poi_qty_pos CHECK (qty > 0)
);

ALTER TABLE purchase_order_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON purchase_order_item
    FOR ALL USING (tenant_id = (NULLIF(current_setting('app.current_tenant_id', true), ''))::uuid);

CREATE INDEX IF NOT EXISTS idx_poi_order_id ON purchase_order_item USING btree (purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_poi_item_id ON purchase_order_item USING btree (tenant_id, item_id);

-- ------------------------------------------------------------------------------
-- 4. DEFAULT SEED DATA HELPER FOR PHASE 3
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION seed_crm_defaults(p_tenant_id UUID)
RETURNS void AS $$
BEGIN
    -- Seed Default Lead Sources
    INSERT INTO lead_source (tenant_id, source_name, description) VALUES
    (p_tenant_id, 'Website Inbound', 'Organic inbound lead via company website'),
    (p_tenant_id, 'Cold Call', 'Outbound tele-sales prospecting'),
    (p_tenant_id, 'Referral', 'Existing customer or partner recommendation'),
    (p_tenant_id, 'Trade Show / Expo', 'Industry conference and exhibition lead'),
    (p_tenant_id, 'Email Campaign', 'Direct marketing email outreach'),
    (p_tenant_id, 'Channel Partner', 'Authorized distribution partner lead')
    ON CONFLICT (tenant_id, source_name) DO NOTHING;

    -- Seed Default Pipeline Stages
    INSERT INTO pipeline_stage (tenant_id, stage_name, probability_percentage, stage_order, is_won_stage, is_lost_stage) VALUES
    (p_tenant_id, 'Prospecting', 10.000000, 1, false, false),
    (p_tenant_id, 'Qualification', 25.000000, 2, false, false),
    (p_tenant_id, 'Proposal / Quote', 50.000000, 3, false, false),
    (p_tenant_id, 'Negotiation', 75.000000, 4, false, false),
    (p_tenant_id, 'Closed Won', 100.000000, 5, true, false),
    (p_tenant_id, 'Closed Lost', 0.000000, 6, false, true)
    ON CONFLICT (tenant_id, stage_name) DO NOTHING;

    -- Seed Default Sales Territories
    INSERT INTO sales_territory (tenant_id, territory_name, is_group) VALUES
    (p_tenant_id, 'All Territories', true),
    (p_tenant_id, 'North India', false),
    (p_tenant_id, 'West India', false),
    (p_tenant_id, 'South India', false),
    (p_tenant_id, 'East India', false),
    (p_tenant_id, 'International / Export', false)
    ON CONFLICT (tenant_id, territory_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
