-- =============================================================================
-- Migration: 00002_master_data.sql
-- Description: Phase 2 — Master Data Subsystems
-- Dialect: PostgreSQL 15+ (Supabase PaaS / Enterprise Vanilla PostgreSQL)
-- Target Platform: VyaparSuite Production ERP
-- Author: VyaparSuite Core Architecture Group
-- Classification: Production Master Data DDL & Seed Specification
-- =============================================================================

-- =============================================================================
-- SECTION 1: UNITS OF MEASURE & CONVERSIONS
-- =============================================================================

-- 1.1 Table: uom (Unit of Measure)
CREATE TABLE IF NOT EXISTS uom (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    uom_name                     TEXT,
    must_be_whole_number         BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_uom PRIMARY KEY (id),
    CONSTRAINT fk_uom_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_uom_tenant_name UNIQUE (tenant_id, name)
);

COMMENT ON TABLE uom IS 'Standard units of measure for inventory stocking, procurement, and billing';

-- 1.2 Table: uom_conversion
CREATE TABLE IF NOT EXISTS uom_conversion (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    item_id                      UUID, -- Optional SKU-specific conversion override
    from_uom_id                  UUID NOT NULL,
    to_uom_id                    UUID NOT NULL,
    conversion_factor            NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    CONSTRAINT pk_uom_conversion PRIMARY KEY (id),
    CONSTRAINT fk_uom_conversion_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_uom_conversion_from_uom_id FOREIGN KEY (from_uom_id) REFERENCES uom(id) ON DELETE CASCADE,
    CONSTRAINT fk_uom_conversion_to_uom_id FOREIGN KEY (to_uom_id) REFERENCES uom(id) ON DELETE CASCADE,
    CONSTRAINT chk_uom_factor_pos CHECK (conversion_factor > 0)
);

COMMENT ON TABLE uom_conversion IS 'Mathematical multipliers between packaging/transactional units and base inventory units';

-- =============================================================================
-- SECTION 2: CATALOG MASTER, ATTRIBUTES, VARIANTS & PRICING
-- =============================================================================

-- 2.1 Table: brand
CREATE TABLE IF NOT EXISTS brand (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    brand_name                   TEXT,
    description                  TEXT,
    logo_url                     TEXT,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_brand PRIMARY KEY (id),
    CONSTRAINT fk_brand_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_brand_tenant_name UNIQUE (tenant_id, name)
);

COMMENT ON TABLE brand IS 'Manufacturer and trade brands associated with catalog products';

-- 2.2 Table: item_group
CREATE TABLE IF NOT EXISTS item_group (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    item_group_name              TEXT,
    parent_group_id              UUID,
    parent_item_group_id         UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_item_group PRIMARY KEY (id),
    CONSTRAINT fk_item_group_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_item_group_parent_group_id FOREIGN KEY (parent_group_id) REFERENCES item_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_item_group_parent_item_group_id FOREIGN KEY (parent_item_group_id) REFERENCES item_group(id) ON DELETE RESTRICT,
    CONSTRAINT uq_item_group_name UNIQUE (tenant_id, name)
);

COMMENT ON TABLE item_group IS 'Hierarchical classification tree for inventory items and financial rollups';

-- 2.3 Table: item_attribute
CREATE TABLE IF NOT EXISTS item_attribute (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    attribute_name               TEXT,
    values                       TEXT[],
    attribute_values             JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_item_attribute PRIMARY KEY (id),
    CONSTRAINT fk_item_attribute_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_item_attribute_name UNIQUE (tenant_id, name)
);

COMMENT ON TABLE item_attribute IS 'Configurable variant dimensions such as Size, Color, Grade, and Voltage';

-- 2.4 Table: item (SKU / Product Master)
CREATE TABLE IF NOT EXISTS item (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    item_code                    TEXT NOT NULL,
    item_name                    TEXT NOT NULL,
    item_group_id                UUID NOT NULL,
    brand_id                     UUID,
    stock_uom_id                 UUID NOT NULL,
    is_stock_item                BOOLEAN NOT NULL DEFAULT true,
    is_sales_item                BOOLEAN NOT NULL DEFAULT true,
    is_purchase_item             BOOLEAN NOT NULL DEFAULT true,
    is_sub_contracted_item       BOOLEAN NOT NULL DEFAULT false,
    is_fixed_asset               BOOLEAN NOT NULL DEFAULT false,
    has_variants                 BOOLEAN NOT NULL DEFAULT false,
    variant_of                   UUID,
    variant_of_id                UUID,
    has_batch_no                 BOOLEAN NOT NULL DEFAULT false,
    has_serial_no                BOOLEAN NOT NULL DEFAULT false,
    valuation_method             TEXT NOT NULL DEFAULT 'FIFO',
    standard_rate                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    opening_stock                NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    safety_stock                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    lead_time_days               INTEGER NOT NULL DEFAULT 0,
    hsn_sac_code                 TEXT,
    default_warehouse_id         UUID,
    image_url                    TEXT,
    description                  TEXT,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    metadata                     JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT pk_item PRIMARY KEY (id),
    CONSTRAINT fk_item_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_item_item_group_id FOREIGN KEY (item_group_id) REFERENCES item_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_item_brand_id FOREIGN KEY (brand_id) REFERENCES brand(id) ON DELETE SET NULL,
    CONSTRAINT fk_item_stock_uom_id FOREIGN KEY (stock_uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT fk_item_variant_of FOREIGN KEY (variant_of) REFERENCES item(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_variant_of_id FOREIGN KEY (variant_of_id) REFERENCES item(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_default_warehouse_id FOREIGN KEY (default_warehouse_id) REFERENCES warehouse(id) ON DELETE SET NULL,
    CONSTRAINT uq_item_tenant_code UNIQUE (tenant_id, item_code),
    CONSTRAINT chk_item_val_method CHECK (valuation_method IN ('FIFO','Moving Average')),
    CONSTRAINT chk_item_lead_time_nonneg CHECK (lead_time_days >= 0),
    CONSTRAINT chk_item_rates_nonneg CHECK (standard_rate >= 0 AND opening_stock >= 0 AND safety_stock >= 0)
);

COMMENT ON TABLE item IS 'Central catalog master for trade merchandise, raw materials, components, and services';

-- Add foreign key from uom_conversion back to item
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_uom_conversion_item_id'
    ) THEN
        ALTER TABLE uom_conversion
            ADD CONSTRAINT fk_uom_conversion_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2.5 Table: item_variant
CREATE TABLE IF NOT EXISTS item_variant (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    item_id                      UUID NOT NULL,
    variant_item_id              UUID,
    template_item_id             UUID,
    attribute_id                 UUID NOT NULL,
    attribute_value              TEXT NOT NULL,
    CONSTRAINT pk_item_variant PRIMARY KEY (id),
    CONSTRAINT fk_item_variant_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_item_variant_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_variant_variant_item_id FOREIGN KEY (variant_item_id) REFERENCES item(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_variant_template_item_id FOREIGN KEY (template_item_id) REFERENCES item(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_variant_attribute_id FOREIGN KEY (attribute_id) REFERENCES item_attribute(id) ON DELETE RESTRICT,
    CONSTRAINT uq_item_variant_item_attr UNIQUE (item_id, attribute_id)
);

COMMENT ON TABLE item_variant IS 'Concrete SKU mappings linking variant attributes back to parent template items';

-- 2.6 Table: price_list
CREATE TABLE IF NOT EXISTS price_list (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    price_list_name              TEXT,
    currency                     TEXT NOT NULL DEFAULT 'INR',
    buying                       BOOLEAN NOT NULL DEFAULT false,
    selling                      BOOLEAN NOT NULL DEFAULT true,
    buying_or_selling            TEXT NOT NULL DEFAULT 'Selling',
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_price_list PRIMARY KEY (id),
    CONSTRAINT fk_price_list_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_price_list_name UNIQUE (tenant_id, name),
    CONSTRAINT chk_pl_buying_selling CHECK (buying_or_selling IN ('Buying','Selling'))
);

COMMENT ON TABLE price_list IS 'Pricing catalogs governing tier, contract, distributor, and retail selling/buying rates';

-- 2.7 Table: item_price
CREATE TABLE IF NOT EXISTS item_price (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    price_list_id                UUID NOT NULL,
    item_id                      UUID NOT NULL,
    uom_id                       UUID NOT NULL,
    price_list_rate              NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    price_rate                   NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    min_qty                      NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    valid_from                   DATE,
    valid_upto                   DATE,
    CONSTRAINT pk_item_price PRIMARY KEY (id),
    CONSTRAINT fk_item_price_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_item_price_price_list_id FOREIGN KEY (price_list_id) REFERENCES price_list(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_price_item_id FOREIGN KEY (item_id) REFERENCES item(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_price_uom_id FOREIGN KEY (uom_id) REFERENCES uom(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ip_rate_nonneg CHECK (price_list_rate >= 0 AND price_rate >= 0),
    CONSTRAINT chk_ip_min_qty_pos CHECK (min_qty > 0)
);

COMMENT ON TABLE item_price IS 'Priced item schedule with volume-break quantities and validity date windows';

-- =============================================================================
-- SECTION 3: CONTACT & ADDRESS DIRECTORY
-- =============================================================================

-- 3.1 Table: contact
CREATE TABLE IF NOT EXISTS contact (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name                   TEXT NOT NULL,
    last_name                    TEXT,
    email                        TEXT,
    email_id                     TEXT,
    phone                        TEXT,
    mobile                       TEXT,
    mobile_no                    TEXT,
    designation                  TEXT,
    department                   TEXT,
    company_name                 TEXT,
    gender                       TEXT,
    is_primary                   BOOLEAN NOT NULL DEFAULT false,
    is_primary_contact           BOOLEAN NOT NULL DEFAULT false,
    is_billing                   BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_contact PRIMARY KEY (id),
    CONSTRAINT fk_contact_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT
);

COMMENT ON TABLE contact IS 'Polymorphic person directory linking individuals to customers, suppliers, and leads';

-- 3.2 Table: contact_link
CREATE TABLE IF NOT EXISTS contact_link (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    contact_id                   UUID NOT NULL,
    link_doctype                 TEXT NOT NULL,
    link_name                    TEXT,
    link_id                      UUID,
    link_title                   TEXT,
    CONSTRAINT pk_contact_link PRIMARY KEY (id),
    CONSTRAINT fk_contact_link_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_contact_link_contact_id FOREIGN KEY (contact_id) REFERENCES contact(id) ON DELETE CASCADE
);

COMMENT ON TABLE contact_link IS 'Polymorphic association junction mapping individual contacts to parent commercial records';

-- 3.3 Table: address
CREATE TABLE IF NOT EXISTS address (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    address_title                TEXT NOT NULL,
    address_type                 TEXT NOT NULL DEFAULT 'Billing',
    address_line1                TEXT NOT NULL,
    address_line2                TEXT,
    city                         TEXT NOT NULL,
    state                        TEXT NOT NULL,
    gst_state_code               TEXT,
    country                      TEXT NOT NULL DEFAULT 'India',
    postal_code                  TEXT NOT NULL,
    gstin                        TEXT,
    phone                        TEXT,
    email                        TEXT,
    email_id                     TEXT,
    is_primary_address           BOOLEAN NOT NULL DEFAULT false,
    is_shipping_address          BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_address PRIMARY KEY (id),
    CONSTRAINT fk_address_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT chk_address_type CHECK (address_type IN ('Billing','Shipping','Office','Personal','Plant','Warehouse'))
);

COMMENT ON TABLE address IS 'Postal, billing, and shipping locations with state GST codes and premise GSTINs';

-- 3.4 Table: address_link
CREATE TABLE IF NOT EXISTS address_link (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    address_id                   UUID NOT NULL,
    link_doctype                 TEXT NOT NULL,
    link_name                    TEXT,
    link_id                      UUID,
    link_title                   TEXT,
    CONSTRAINT pk_address_link PRIMARY KEY (id),
    CONSTRAINT fk_address_link_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_address_link_address_id FOREIGN KEY (address_id) REFERENCES address(id) ON DELETE CASCADE
);

COMMENT ON TABLE address_link IS 'Polymorphic association connecting addresses to companies, customers, and warehouses';

-- =============================================================================
-- SECTION 4: CUSTOMER MASTER & SEGMENTATION
-- =============================================================================

-- 4.1 Table: customer_group
CREATE TABLE IF NOT EXISTS customer_group (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    customer_group_name          TEXT,
    parent_group_id              UUID,
    parent_customer_group_id     UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    default_price_list_id        UUID,
    default_payment_terms_id     UUID,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_customer_group PRIMARY KEY (id),
    CONSTRAINT fk_customer_group_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_group_parent_group_id FOREIGN KEY (parent_group_id) REFERENCES customer_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_group_parent_customer_group_id FOREIGN KEY (parent_customer_group_id) REFERENCES customer_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_group_default_price_list_id FOREIGN KEY (default_price_list_id) REFERENCES price_list(id) ON DELETE SET NULL,
    CONSTRAINT uq_customer_group_name UNIQUE (tenant_id, name)
);

COMMENT ON TABLE customer_group IS 'Customer classification categories for tier pricing, credit terms, and sales reports';

-- 4.2 Table: customer
CREATE TABLE IF NOT EXISTS customer (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name                TEXT NOT NULL,
    customer_code                TEXT,
    customer_group_id            UUID NOT NULL,
    customer_type                TEXT NOT NULL DEFAULT 'Company',
    pan                          TEXT,
    gstin                        TEXT,
    gst_category                 TEXT NOT NULL DEFAULT 'Registered Regular',
    tax_id                       TEXT,
    default_currency             TEXT NOT NULL DEFAULT 'INR',
    default_price_list_id        UUID,
    default_payment_terms_id     UUID,
    credit_limit                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    credit_days                  INTEGER NOT NULL DEFAULT 30,
    is_frozen                    BOOLEAN NOT NULL DEFAULT false,
    is_credit_freeze             BOOLEAN NOT NULL DEFAULT false,
    status                       TEXT NOT NULL DEFAULT 'Active',
    primary_contact_id           UUID,
    primary_address_id           UUID,
    territory_id                 UUID,
    account_manager_id           UUID,
    total_unbilled               NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    total_outstanding            NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    metadata                     JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT pk_customer PRIMARY KEY (id),
    CONSTRAINT fk_customer_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_customer_group_id FOREIGN KEY (customer_group_id) REFERENCES customer_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_default_price_list_id FOREIGN KEY (default_price_list_id) REFERENCES price_list(id) ON DELETE SET NULL,
    CONSTRAINT fk_customer_primary_contact_id FOREIGN KEY (primary_contact_id) REFERENCES contact(id) ON DELETE SET NULL,
    CONSTRAINT fk_customer_primary_address_id FOREIGN KEY (primary_address_id) REFERENCES address(id) ON DELETE SET NULL,
    CONSTRAINT chk_customer_type CHECK (lower(customer_type) IN ('company','individual')),
    CONSTRAINT chk_customer_credit_limit CHECK (credit_limit >= 0),
    CONSTRAINT chk_customer_credit_days CHECK (credit_days >= 0),
    CONSTRAINT chk_customer_total_unbilled CHECK (total_unbilled >= 0)
);

COMMENT ON TABLE customer IS 'Master client database recording GST registrations, credit exposure, and billing links';

-- =============================================================================
-- SECTION 5: SUPPLIER MASTER & SEGMENTATION
-- =============================================================================

-- 5.1 Table: supplier_group
CREATE TABLE IF NOT EXISTS supplier_group (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    supplier_group_name          TEXT,
    parent_group_id              UUID,
    parent_supplier_group_id     UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    default_payment_terms_id     UUID,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_supplier_group PRIMARY KEY (id),
    CONSTRAINT fk_supplier_group_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_supplier_group_parent_group_id FOREIGN KEY (parent_group_id) REFERENCES supplier_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_supplier_group_parent_supplier_group_id FOREIGN KEY (parent_supplier_group_id) REFERENCES supplier_group(id) ON DELETE RESTRICT,
    CONSTRAINT uq_supplier_group_name UNIQUE (tenant_id, name)
);

COMMENT ON TABLE supplier_group IS 'Vendor segmentation categories for procurement terms and purchase analytics';

-- 5.2 Table: supplier
CREATE TABLE IF NOT EXISTS supplier (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    supplier_name                TEXT NOT NULL,
    supplier_code                TEXT,
    supplier_group_id            UUID NOT NULL,
    supplier_type                TEXT NOT NULL DEFAULT 'Company',
    pan                          TEXT,
    gstin                        TEXT,
    gst_category                 TEXT NOT NULL DEFAULT 'Registered Regular',
    tax_id                       TEXT,
    default_currency             TEXT NOT NULL DEFAULT 'INR',
    default_payment_terms_id     UUID,
    payment_terms_days           INTEGER NOT NULL DEFAULT 30,
    is_transporter               BOOLEAN NOT NULL DEFAULT false,
    is_msme_registered           BOOLEAN NOT NULL DEFAULT false,
    msme_registration_no         TEXT,
    is_frozen                    BOOLEAN NOT NULL DEFAULT false,
    status                       TEXT NOT NULL DEFAULT 'Active',
    primary_contact_id           UUID,
    primary_address_id           UUID,
    total_unpaid                 NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    metadata                     JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT pk_supplier PRIMARY KEY (id),
    CONSTRAINT fk_supplier_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_supplier_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_supplier_supplier_group_id FOREIGN KEY (supplier_group_id) REFERENCES supplier_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_supplier_primary_contact_id FOREIGN KEY (primary_contact_id) REFERENCES contact(id) ON DELETE SET NULL,
    CONSTRAINT fk_supplier_primary_address_id FOREIGN KEY (primary_address_id) REFERENCES address(id) ON DELETE SET NULL,
    CONSTRAINT chk_supplier_type CHECK (lower(supplier_type) IN ('company','individual')),
    CONSTRAINT chk_supplier_pay_days CHECK (payment_terms_days >= 0),
    CONSTRAINT chk_supplier_total_unpaid CHECK (total_unpaid >= 0)
);

COMMENT ON TABLE supplier IS 'Vendor master records including MSME Section 43B(h) compliance, PAN, and payment terms';

-- =============================================================================
-- SECTION 6: CHART OF ACCOUNTS & GENERAL LEDGER STRUCTURE
-- =============================================================================

-- 6.1 Table: account_group
CREATE TABLE IF NOT EXISTS account_group (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    group_name                   TEXT,
    root_type                    TEXT NOT NULL DEFAULT 'Asset',
    parent_id                    UUID,
    parent_group_id              UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    report_type                  TEXT,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_account_group PRIMARY KEY (id),
    CONSTRAINT fk_account_group_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_group_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_account_group_parent_id FOREIGN KEY (parent_id) REFERENCES account_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_group_parent_group_id FOREIGN KEY (parent_group_id) REFERENCES account_group(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ag_root_type CHECK (root_type IN ('Asset','Liability','Equity','Income','Expense')),
    CONSTRAINT chk_ag_report_type CHECK (report_type IS NULL OR report_type IN ('Balance Sheet','Profit and Loss'))
);

COMMENT ON TABLE account_group IS 'Chart of Accounts grouping tree establishing the statutory Balance Sheet and P&L hierarchy';

-- 6.2 Table: account
CREATE TABLE IF NOT EXISTS account (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    account_number               TEXT,
    account_name                 TEXT NOT NULL,
    account_group_id             UUID NOT NULL,
    root_type                    TEXT NOT NULL DEFAULT 'Asset',
    account_type                 TEXT,
    currency                     TEXT NOT NULL DEFAULT 'INR',
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    parent_account_id            UUID,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    opening_balance              NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    current_balance              NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_account PRIMARY KEY (id),
    CONSTRAINT fk_account_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_account_account_group_id FOREIGN KEY (account_group_id) REFERENCES account_group(id) ON DELETE RESTRICT,
    CONSTRAINT fk_account_parent_account_id FOREIGN KEY (parent_account_id) REFERENCES account(id) ON DELETE RESTRICT,
    CONSTRAINT chk_account_root_type CHECK (root_type IN ('Asset','Liability','Equity','Income','Expense')),
    CONSTRAINT chk_account_type CHECK (account_type IS NULL OR account_type IN (
        'Accumulated Depreciation','Bank','Cash','Chargeable','Cost of Goods Sold',
        'Depreciation','Equity','Expense Account','Expenses Included In Valuation',
        'Fixed Asset','Income Account','Payable','Receivable','Round Off',
        'Stock','Stock Adjustment','Stock Received But Not Billed','Tax','Temporary'
    ))
);

COMMENT ON TABLE account IS 'Chart of Accounts ledger master for all double-entry debit and credit journal postings';

-- =============================================================================
-- SECTION 7: TAX ENGINE & RULES
-- =============================================================================

-- 7.1 Table: tax_category
CREATE TABLE IF NOT EXISTS tax_category (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    category_name                TEXT,
    is_inter_state               BOOLEAN NOT NULL DEFAULT false,
    is_reverse_charge            BOOLEAN NOT NULL DEFAULT false,
    description                  TEXT,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_tax_category PRIMARY KEY (id),
    CONSTRAINT fk_tax_category_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_tax_category_name UNIQUE (tenant_id, name)
);

COMMENT ON TABLE tax_category IS 'Classification of tax rules based on geography, trade regime, and reverse charge mechanisms';

-- 7.2 Table: tax_template
CREATE TABLE IF NOT EXISTS tax_template (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name                         TEXT NOT NULL,
    title                        TEXT,
    tax_type                     TEXT NOT NULL DEFAULT 'Sales',
    is_default                   BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_tax_template PRIMARY KEY (id),
    CONSTRAINT fk_tax_template_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tax_template_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT chk_tax_template_type CHECK (tax_type IN ('Sales','Purchase'))
);

COMMENT ON TABLE tax_template IS 'Sales and purchase tax templates defining standard GST and statutory tax compositions';

-- 7.3 Table: tax_template_detail
CREATE TABLE IF NOT EXISTS tax_template_detail (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by                   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    tax_template_id              UUID NOT NULL,
    template_id                  UUID,
    account_id                   UUID NOT NULL,
    tax_rate                     NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    rate_percent                 NUMERIC(10,6) NOT NULL DEFAULT 0.000000,
    tax_name                     TEXT,
    description                  TEXT,
    CONSTRAINT pk_tax_template_detail PRIMARY KEY (id),
    CONSTRAINT fk_tax_template_detail_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tax_template_detail_tax_template_id FOREIGN KEY (tax_template_id) REFERENCES tax_template(id) ON DELETE CASCADE,
    CONSTRAINT fk_tax_template_detail_template_id FOREIGN KEY (template_id) REFERENCES tax_template(id) ON DELETE CASCADE,
    CONSTRAINT fk_tax_template_detail_account_id FOREIGN KEY (account_id) REFERENCES account(id) ON DELETE RESTRICT,
    CONSTRAINT chk_ttd_rate_pos CHECK (tax_rate >= 0.000000 AND rate_percent >= 0.000000)
);

COMMENT ON TABLE tax_template_detail IS 'Individual tax components linking statutory rates to corresponding GL accounts';

-- =============================================================================
-- SECTION 8: ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on all Phase 2 Master Data tables
ALTER TABLE uom ENABLE ROW LEVEL SECURITY;
ALTER TABLE uom_conversion ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_attribute ENABLE ROW LEVEL SECURITY;
ALTER TABLE item ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_variant ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_price ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE address ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_link ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE account ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_category ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_template_detail ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policy Bindings
DROP POLICY IF EXISTS tenant_isolation_policy ON uom;
CREATE POLICY tenant_isolation_policy ON uom
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON uom_conversion;
CREATE POLICY tenant_isolation_policy ON uom_conversion
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON brand;
CREATE POLICY tenant_isolation_policy ON brand
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON item_group;
CREATE POLICY tenant_isolation_policy ON item_group
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON item_attribute;
CREATE POLICY tenant_isolation_policy ON item_attribute
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON item;
CREATE POLICY tenant_isolation_policy ON item
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON item_variant;
CREATE POLICY tenant_isolation_policy ON item_variant
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON price_list;
CREATE POLICY tenant_isolation_policy ON price_list
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON item_price;
CREATE POLICY tenant_isolation_policy ON item_price
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON contact;
CREATE POLICY tenant_isolation_policy ON contact
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON contact_link;
CREATE POLICY tenant_isolation_policy ON contact_link
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON address;
CREATE POLICY tenant_isolation_policy ON address
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON address_link;
CREATE POLICY tenant_isolation_policy ON address_link
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON customer_group;
CREATE POLICY tenant_isolation_policy ON customer_group
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON customer;
CREATE POLICY tenant_isolation_policy ON customer
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON supplier_group;
CREATE POLICY tenant_isolation_policy ON supplier_group
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON supplier;
CREATE POLICY tenant_isolation_policy ON supplier
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON account_group;
CREATE POLICY tenant_isolation_policy ON account_group
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON account;
CREATE POLICY tenant_isolation_policy ON account
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON tax_category;
CREATE POLICY tenant_isolation_policy ON tax_category
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON tax_template;
CREATE POLICY tenant_isolation_policy ON tax_template
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_policy ON tax_template_detail;
CREATE POLICY tenant_isolation_policy ON tax_template_detail
    FOR ALL USING (tenant_id = get_current_tenant_id());

-- =============================================================================
-- SECTION 9: PERFORMANCE & SEARCH INDEXES
-- =============================================================================

-- UOM Indexes
CREATE INDEX IF NOT EXISTS idx_uom_name ON uom USING btree (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_uom_active ON uom USING btree (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_uom_conversion_pair ON uom_conversion USING btree (tenant_id, from_uom_id, to_uom_id);
CREATE INDEX IF NOT EXISTS idx_uom_conversion_item ON uom_conversion USING btree (tenant_id, item_id) WHERE item_id IS NOT NULL;

-- Brand & Item Group Indexes
CREATE INDEX IF NOT EXISTS idx_brand_name ON brand USING btree (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_brand_active ON brand USING btree (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_item_group_parent ON item_group USING btree (tenant_id, parent_group_id);
CREATE INDEX IF NOT EXISTS idx_item_group_active ON item_group USING btree (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_item_attribute_name ON item_attribute USING btree (tenant_id, name);

-- Item & Variant Indexes
CREATE INDEX IF NOT EXISTS idx_item_code ON item USING btree (tenant_id, item_code);
CREATE INDEX IF NOT EXISTS idx_item_name ON item USING btree (tenant_id, item_name);
CREATE INDEX IF NOT EXISTS idx_item_group ON item USING btree (tenant_id, item_group_id);
CREATE INDEX IF NOT EXISTS idx_item_brand ON item USING btree (tenant_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_item_uom ON item USING btree (tenant_id, stock_uom_id);
CREATE INDEX IF NOT EXISTS idx_item_hsn ON item USING btree (tenant_id, hsn_sac_code);
CREATE INDEX IF NOT EXISTS idx_item_active ON item USING btree (tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_item_variant_parent ON item USING btree (tenant_id, variant_of) WHERE variant_of IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_item_variant_item ON item_variant USING btree (tenant_id, item_id);
CREATE INDEX IF NOT EXISTS idx_item_variant_attr ON item_variant USING btree (tenant_id, attribute_id);
CREATE INDEX IF NOT EXISTS idx_item_variant_template ON item_variant USING btree (tenant_id, template_item_id) WHERE template_item_id IS NOT NULL;

-- Price List & Item Price Indexes
CREATE INDEX IF NOT EXISTS idx_price_list_name ON price_list USING btree (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_price_list_type ON price_list USING btree (tenant_id, buying_or_selling, is_active);
CREATE INDEX IF NOT EXISTS idx_item_price_lookup ON item_price USING btree (tenant_id, price_list_id, item_id, uom_id, min_qty);
CREATE INDEX IF NOT EXISTS idx_item_price_dates ON item_price USING btree (tenant_id, item_id, valid_from, valid_upto);

-- Contact & Address Indexes
CREATE INDEX IF NOT EXISTS idx_contact_email ON contact USING btree (tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_contact_mobile ON contact USING btree (tenant_id, mobile);
CREATE INDEX IF NOT EXISTS idx_contact_name ON contact USING btree (tenant_id, first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_contact_link_doc ON contact_link USING btree (tenant_id, link_doctype, link_name);
CREATE INDEX IF NOT EXISTS idx_contact_link_contact ON contact_link USING btree (tenant_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_link_id ON contact_link USING btree (tenant_id, link_doctype, link_id) WHERE link_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_address_pincode ON address USING btree (tenant_id, postal_code);
CREATE INDEX IF NOT EXISTS idx_address_city_state ON address USING btree (tenant_id, state, city);
CREATE INDEX IF NOT EXISTS idx_address_gstin ON address USING btree (tenant_id, gstin) WHERE gstin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_address_link_doc ON address_link USING btree (tenant_id, link_doctype, link_name);
CREATE INDEX IF NOT EXISTS idx_address_link_addr ON address_link USING btree (tenant_id, address_id);
CREATE INDEX IF NOT EXISTS idx_address_link_id ON address_link USING btree (tenant_id, link_doctype, link_id) WHERE link_id IS NOT NULL;

-- Customer Indexes
CREATE INDEX IF NOT EXISTS idx_customer_group_parent ON customer_group USING btree (tenant_id, parent_group_id);
CREATE INDEX IF NOT EXISTS idx_customer_code ON customer USING btree (tenant_id, customer_code);
CREATE INDEX IF NOT EXISTS idx_customer_name ON customer USING btree (tenant_id, customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_company ON customer USING btree (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_customer_group ON customer USING btree (tenant_id, customer_group_id);
CREATE INDEX IF NOT EXISTS idx_customer_gstin ON customer USING btree (tenant_id, gstin) WHERE gstin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_pan ON customer USING btree (tenant_id, pan) WHERE pan IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customer_status ON customer USING btree (tenant_id, status, is_active);

-- Supplier Indexes
CREATE INDEX IF NOT EXISTS idx_supplier_group_parent ON supplier_group USING btree (tenant_id, parent_group_id);
CREATE INDEX IF NOT EXISTS idx_supplier_code ON supplier USING btree (tenant_id, supplier_code);
CREATE INDEX IF NOT EXISTS idx_supplier_name ON supplier USING btree (tenant_id, supplier_name);
CREATE INDEX IF NOT EXISTS idx_supplier_company ON supplier USING btree (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_supplier_group ON supplier USING btree (tenant_id, supplier_group_id);
CREATE INDEX IF NOT EXISTS idx_supplier_gstin ON supplier USING btree (tenant_id, gstin) WHERE gstin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_pan ON supplier USING btree (tenant_id, pan) WHERE pan IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supplier_msme ON supplier USING btree (tenant_id, is_msme_registered) WHERE is_msme_registered = true;
CREATE INDEX IF NOT EXISTS idx_supplier_status ON supplier USING btree (tenant_id, status, is_active);

-- Chart of Accounts Indexes
CREATE INDEX IF NOT EXISTS idx_account_group_comp ON account_group USING btree (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_account_group_parent ON account_group USING btree (tenant_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_account_group_root ON account_group USING btree (tenant_id, root_type);
CREATE INDEX IF NOT EXISTS idx_account_comp ON account USING btree (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_account_group_fk ON account USING btree (tenant_id, account_group_id);
CREATE INDEX IF NOT EXISTS idx_account_type ON account USING btree (tenant_id, account_type);
CREATE INDEX IF NOT EXISTS idx_account_number ON account USING btree (tenant_id, account_number);
CREATE INDEX IF NOT EXISTS idx_account_active ON account USING btree (tenant_id, is_active);

-- Tax Engine Indexes
CREATE INDEX IF NOT EXISTS idx_tax_category_name ON tax_category USING btree (tenant_id, name);
CREATE INDEX IF NOT EXISTS idx_tax_template_comp ON tax_template USING btree (tenant_id, company_id);
CREATE INDEX IF NOT EXISTS idx_tax_template_type ON tax_template USING btree (tenant_id, tax_type, is_active);
CREATE INDEX IF NOT EXISTS idx_tax_detail_template ON tax_template_detail USING btree (tax_template_id);
CREATE INDEX IF NOT EXISTS idx_tax_detail_account ON tax_template_detail USING btree (account_id);

-- =============================================================================
-- SECTION 10: AUTOMATED SYNCHRONIZATION TRIGGERS
-- =============================================================================

-- 10.1 Generic updated_at Triggers
DROP TRIGGER IF EXISTS trg_uom_updated_at ON uom;
CREATE TRIGGER trg_uom_updated_at BEFORE UPDATE ON uom FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_uom_conversion_updated_at ON uom_conversion;
CREATE TRIGGER trg_uom_conversion_updated_at BEFORE UPDATE ON uom_conversion FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_brand_updated_at ON brand;
CREATE TRIGGER trg_brand_updated_at BEFORE UPDATE ON brand FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_item_group_updated_at ON item_group;
CREATE TRIGGER trg_item_group_updated_at BEFORE UPDATE ON item_group FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_item_attribute_updated_at ON item_attribute;
CREATE TRIGGER trg_item_attribute_updated_at BEFORE UPDATE ON item_attribute FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_item_updated_at ON item;
CREATE TRIGGER trg_item_updated_at BEFORE UPDATE ON item FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_item_variant_updated_at ON item_variant;
CREATE TRIGGER trg_item_variant_updated_at BEFORE UPDATE ON item_variant FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_price_list_updated_at ON price_list;
CREATE TRIGGER trg_price_list_updated_at BEFORE UPDATE ON price_list FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_item_price_updated_at ON item_price;
CREATE TRIGGER trg_item_price_updated_at BEFORE UPDATE ON item_price FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contact_updated_at ON contact;
CREATE TRIGGER trg_contact_updated_at BEFORE UPDATE ON contact FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contact_link_updated_at ON contact_link;
CREATE TRIGGER trg_contact_link_updated_at BEFORE UPDATE ON contact_link FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_address_updated_at ON address;
CREATE TRIGGER trg_address_updated_at BEFORE UPDATE ON address FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_address_link_updated_at ON address_link;
CREATE TRIGGER trg_address_link_updated_at BEFORE UPDATE ON address_link FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customer_group_updated_at ON customer_group;
CREATE TRIGGER trg_customer_group_updated_at BEFORE UPDATE ON customer_group FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_customer_updated_at ON customer;
CREATE TRIGGER trg_customer_updated_at BEFORE UPDATE ON customer FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_supplier_group_updated_at ON supplier_group;
CREATE TRIGGER trg_supplier_group_updated_at BEFORE UPDATE ON supplier_group FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_supplier_updated_at ON supplier;
CREATE TRIGGER trg_supplier_updated_at BEFORE UPDATE ON supplier FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_account_group_updated_at ON account_group;
CREATE TRIGGER trg_account_group_updated_at BEFORE UPDATE ON account_group FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_account_updated_at ON account;
CREATE TRIGGER trg_account_updated_at BEFORE UPDATE ON account FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tax_category_updated_at ON tax_category;
CREATE TRIGGER trg_tax_category_updated_at BEFORE UPDATE ON tax_category FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tax_template_updated_at ON tax_template;
CREATE TRIGGER trg_tax_template_updated_at BEFORE UPDATE ON tax_template FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tax_template_detail_updated_at ON tax_template_detail;
CREATE TRIGGER trg_tax_template_detail_updated_at BEFORE UPDATE ON tax_template_detail FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10.2 UOM Column Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_uom_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.uom_name);
    NEW.uom_name = COALESCE(NEW.uom_name, NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_uom_sync ON uom;
CREATE TRIGGER trg_uom_sync
    BEFORE INSERT OR UPDATE ON uom
    FOR EACH ROW EXECUTE FUNCTION sync_uom_columns();

-- 10.3 Brand Column Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_brand_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.brand_name);
    NEW.brand_name = COALESCE(NEW.brand_name, NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_brand_sync ON brand;
CREATE TRIGGER trg_brand_sync
    BEFORE INSERT OR UPDATE ON brand
    FOR EACH ROW EXECUTE FUNCTION sync_brand_columns();

-- 10.4 Item Group Column Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_item_group_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.item_group_name);
    NEW.item_group_name = COALESCE(NEW.item_group_name, NEW.name);
    NEW.parent_group_id = COALESCE(NEW.parent_group_id, NEW.parent_item_group_id);
    NEW.parent_item_group_id = COALESCE(NEW.parent_item_group_id, NEW.parent_group_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_item_group_sync ON item_group;
CREATE TRIGGER trg_item_group_sync
    BEFORE INSERT OR UPDATE ON item_group
    FOR EACH ROW EXECUTE FUNCTION sync_item_group_columns();

-- 10.5 Item Attribute Column Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_item_attribute_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.attribute_name);
    NEW.attribute_name = COALESCE(NEW.attribute_name, NEW.name);
    IF NEW.values IS NOT NULL AND NEW.attribute_values = '[]'::jsonb THEN
        NEW.attribute_values = to_jsonb(NEW.values);
    ELSIF NEW.attribute_values <> '[]'::jsonb AND NEW.values IS NULL THEN
        SELECT array_agg(x::text) INTO NEW.values FROM jsonb_array_elements_text(NEW.attribute_values) x;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_item_attribute_sync ON item_attribute;
CREATE TRIGGER trg_item_attribute_sync
    BEFORE INSERT OR UPDATE ON item_attribute
    FOR EACH ROW EXECUTE FUNCTION sync_item_attribute_columns();

-- 10.6 Item Column Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_item_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.variant_of = COALESCE(NEW.variant_of, NEW.variant_of_id);
    NEW.variant_of_id = COALESCE(NEW.variant_of_id, NEW.variant_of);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_item_sync ON item;
CREATE TRIGGER trg_item_sync
    BEFORE INSERT OR UPDATE ON item
    FOR EACH ROW EXECUTE FUNCTION sync_item_columns();

-- 10.7 Item Variant Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_item_variant_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.item_id = COALESCE(NEW.item_id, NEW.variant_item_id);
    NEW.variant_item_id = COALESCE(NEW.variant_item_id, NEW.item_id);
    IF NEW.template_item_id IS NULL AND NEW.item_id IS NOT NULL THEN
        SELECT variant_of INTO NEW.template_item_id FROM item WHERE id = NEW.item_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_item_variant_sync ON item_variant;
CREATE TRIGGER trg_item_variant_sync
    BEFORE INSERT OR UPDATE ON item_variant
    FOR EACH ROW EXECUTE FUNCTION sync_item_variant_columns();

-- 10.8 Price List Column Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_price_list_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.price_list_name);
    NEW.price_list_name = COALESCE(NEW.price_list_name, NEW.name);
    IF NEW.buying IS TRUE AND NEW.selling IS FALSE THEN
        NEW.buying_or_selling = 'Buying';
    ELSIF NEW.selling IS TRUE AND NEW.buying IS FALSE THEN
        NEW.buying_or_selling = 'Selling';
    ELSIF NEW.buying_or_selling = 'Buying' THEN
        NEW.buying = true;
        NEW.selling = false;
    ELSE
        NEW.buying = false;
        NEW.selling = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_price_list_sync ON price_list;
CREATE TRIGGER trg_price_list_sync
    BEFORE INSERT OR UPDATE ON price_list
    FOR EACH ROW EXECUTE FUNCTION sync_price_list_columns();

-- 10.9 Item Price Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_item_price_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.price_list_rate = COALESCE(NULLIF(NEW.price_list_rate, 0.000000), NEW.price_rate, 0.000000);
    NEW.price_rate = COALESCE(NULLIF(NEW.price_rate, 0.000000), NEW.price_list_rate, 0.000000);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_item_price_sync ON item_price;
CREATE TRIGGER trg_item_price_sync
    BEFORE INSERT OR UPDATE ON item_price
    FOR EACH ROW EXECUTE FUNCTION sync_item_price_columns();

-- 10.10 Contact Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_contact_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email = COALESCE(NEW.email, NEW.email_id);
    NEW.email_id = COALESCE(NEW.email_id, NEW.email);
    NEW.mobile = COALESCE(NEW.mobile, NEW.mobile_no);
    NEW.mobile_no = COALESCE(NEW.mobile_no, NEW.mobile);
    IF NEW.is_primary IS TRUE THEN
        NEW.is_primary_contact = TRUE;
    ELSIF NEW.is_primary_contact IS TRUE THEN
        NEW.is_primary = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contact_sync ON contact;
CREATE TRIGGER trg_contact_sync
    BEFORE INSERT OR UPDATE ON contact
    FOR EACH ROW EXECUTE FUNCTION sync_contact_columns();

-- 10.11 Contact Link Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_contact_link_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.link_name IS NULL AND NEW.link_id IS NOT NULL THEN
        NEW.link_name = NEW.link_id::text;
    ELSIF NEW.link_id IS NULL AND NEW.link_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        NEW.link_id = NEW.link_name::uuid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contact_link_sync ON contact_link;
CREATE TRIGGER trg_contact_link_sync
    BEFORE INSERT OR UPDATE ON contact_link
    FOR EACH ROW EXECUTE FUNCTION sync_contact_link_columns();

-- 10.12 Address Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_address_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email = COALESCE(NEW.email, NEW.email_id);
    NEW.email_id = COALESCE(NEW.email_id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_address_sync ON address;
CREATE TRIGGER trg_address_sync
    BEFORE INSERT OR UPDATE ON address
    FOR EACH ROW EXECUTE FUNCTION sync_address_columns();

-- 10.13 Address Link Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_address_link_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.link_name IS NULL AND NEW.link_id IS NOT NULL THEN
        NEW.link_name = NEW.link_id::text;
    ELSIF NEW.link_id IS NULL AND NEW.link_name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        NEW.link_id = NEW.link_name::uuid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_address_link_sync ON address_link;
CREATE TRIGGER trg_address_link_sync
    BEFORE INSERT OR UPDATE ON address_link
    FOR EACH ROW EXECUTE FUNCTION sync_address_link_columns();

-- 10.14 Customer Group Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_customer_group_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.customer_group_name);
    NEW.customer_group_name = COALESCE(NEW.customer_group_name, NEW.name);
    NEW.parent_group_id = COALESCE(NEW.parent_group_id, NEW.parent_customer_group_id);
    NEW.parent_customer_group_id = COALESCE(NEW.parent_customer_group_id, NEW.parent_group_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_group_sync ON customer_group;
CREATE TRIGGER trg_customer_group_sync
    BEFORE INSERT OR UPDATE ON customer_group
    FOR EACH ROW EXECUTE FUNCTION sync_customer_group_columns();

-- 10.15 Customer Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_customer_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_code IS NULL OR trim(NEW.customer_code) = '' THEN
        NEW.customer_code = 'CUST-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    END IF;
    IF NEW.is_frozen IS TRUE THEN
        NEW.is_credit_freeze = TRUE;
    ELSIF NEW.is_credit_freeze IS TRUE THEN
        NEW.is_frozen = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_sync ON customer;
CREATE TRIGGER trg_customer_sync
    BEFORE INSERT OR UPDATE ON customer
    FOR EACH ROW EXECUTE FUNCTION sync_customer_columns();

-- 10.16 Supplier Group Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_supplier_group_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.supplier_group_name);
    NEW.supplier_group_name = COALESCE(NEW.supplier_group_name, NEW.name);
    NEW.parent_group_id = COALESCE(NEW.parent_group_id, NEW.parent_supplier_group_id);
    NEW.parent_supplier_group_id = COALESCE(NEW.parent_supplier_group_id, NEW.parent_group_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_supplier_group_sync ON supplier_group;
CREATE TRIGGER trg_supplier_group_sync
    BEFORE INSERT OR UPDATE ON supplier_group
    FOR EACH ROW EXECUTE FUNCTION sync_supplier_group_columns();

-- 10.17 Supplier Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_supplier_columns()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.supplier_code IS NULL OR trim(NEW.supplier_code) = '' THEN
        NEW.supplier_code = 'SUPP-' || upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_supplier_sync ON supplier;
CREATE TRIGGER trg_supplier_sync
    BEFORE INSERT OR UPDATE ON supplier
    FOR EACH ROW EXECUTE FUNCTION sync_supplier_columns();

-- 10.18 Account Group Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_account_group_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.group_name);
    NEW.group_name = COALESCE(NEW.group_name, NEW.name);
    NEW.parent_id = COALESCE(NEW.parent_id, NEW.parent_group_id);
    NEW.parent_group_id = COALESCE(NEW.parent_group_id, NEW.parent_id);
    IF NEW.report_type IS NULL THEN
        IF NEW.root_type IN ('Asset', 'Liability', 'Equity') THEN
            NEW.report_type = 'Balance Sheet';
        ELSE
            NEW.report_type = 'Profit and Loss';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_account_group_sync ON account_group;
CREATE TRIGGER trg_account_group_sync
    BEFORE INSERT OR UPDATE ON account_group
    FOR EACH ROW EXECUTE FUNCTION sync_account_group_columns();

-- 10.19 Tax Category Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_tax_category_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.category_name);
    NEW.category_name = COALESCE(NEW.category_name, NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tax_category_sync ON tax_category;
CREATE TRIGGER trg_tax_category_sync
    BEFORE INSERT OR UPDATE ON tax_category
    FOR EACH ROW EXECUTE FUNCTION sync_tax_category_columns();

-- 10.20 Tax Template Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_tax_template_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name = COALESCE(NEW.name, NEW.title);
    NEW.title = COALESCE(NEW.title, NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tax_template_sync ON tax_template;
CREATE TRIGGER trg_tax_template_sync
    BEFORE INSERT OR UPDATE ON tax_template
    FOR EACH ROW EXECUTE FUNCTION sync_tax_template_columns();

-- 10.21 Tax Template Detail Alignment Trigger Handler
CREATE OR REPLACE FUNCTION sync_tax_template_detail_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tax_template_id = COALESCE(NEW.tax_template_id, NEW.template_id);
    NEW.template_id = COALESCE(NEW.template_id, NEW.tax_template_id);
    NEW.tax_rate = COALESCE(NULLIF(NEW.tax_rate, 0.000000), NEW.rate_percent, 0.000000);
    NEW.rate_percent = COALESCE(NULLIF(NEW.rate_percent, 0.000000), NEW.tax_rate, 0.000000);
    NEW.tax_name = COALESCE(NEW.tax_name, NEW.description);
    NEW.description = COALESCE(NEW.description, NEW.tax_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tax_template_detail_sync ON tax_template_detail;
CREATE TRIGGER trg_tax_template_detail_sync
    BEFORE INSERT OR UPDATE ON tax_template_detail
    FOR EACH ROW EXECUTE FUNCTION sync_tax_template_detail_columns();

-- =============================================================================
-- SECTION 11: CANONICAL COMPANY CHART OF ACCOUNTS PROVISIONING PROCEDURE
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_company_chart_of_accounts(p_company_id UUID)
RETURNS void AS $$
DECLARE
    v_tenant_id UUID;
    -- Root groups
    v_grp_assets UUID;
    v_grp_liabilities UUID;
    v_grp_equity UUID;
    v_grp_income UUID;
    v_grp_expenses UUID;
    -- Sub-groups
    v_grp_curr_assets UUID;
    v_grp_non_curr_assets UUID;
    v_grp_curr_liab UUID;
    v_grp_duties_taxes UUID;
    v_grp_direct_income UUID;
    v_grp_indirect_income UUID;
    v_grp_cogs UUID;
    v_grp_operating_exp UUID;
    v_grp_finance_exp UUID;
    -- Specific accounts
    v_acc_cash UUID;
    v_acc_bank UUID;
    v_acc_debtors UUID;
    v_acc_stock UUID;
    v_acc_cgst_in UUID;
    v_acc_sgst_in UUID;
    v_acc_igst_in UUID;
    v_acc_creditors UUID;
    v_acc_cgst_out UUID;
    v_acc_sgst_out UUID;
    v_acc_igst_out UUID;
    v_acc_share_capital UUID;
    v_acc_retained_earnings UUID;
    v_acc_sales UUID;
    v_acc_other_income UUID;
    v_acc_cogs UUID;
    v_acc_purchase_exp UUID;
    v_acc_salaries UUID;
    v_acc_rent UUID;
    v_acc_utilities UUID;
    v_acc_round_off UUID;
    -- Tax templates
    v_tpl_gst18_sales UUID;
    v_tpl_gst18_purch UUID;
    v_tpl_gst12_sales UUID;
    v_tpl_gst5_sales UUID;
    v_tpl_gst28_sales UUID;
    v_tpl_gst0_sales UUID;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM company WHERE id = p_company_id;
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Company with id % does not exist', p_company_id;
    END IF;

    -- 1. Root Groups (Schedule III / CARO 2020)
    INSERT INTO account_group (tenant_id, company_id, name, root_type, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Application of Funds (Assets)', 'Asset', true, 'Balance Sheet')
    RETURNING id INTO v_grp_assets;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Source of Funds (Liabilities)', 'Liability', true, 'Balance Sheet')
    RETURNING id INTO v_grp_liabilities;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Shareholders Funds (Equity)', 'Equity', true, 'Balance Sheet')
    RETURNING id INTO v_grp_equity;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Income', 'Income', true, 'Profit and Loss')
    RETURNING id INTO v_grp_income;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Expenses', 'Expense', true, 'Profit and Loss')
    RETURNING id INTO v_grp_expenses;

    -- 2. Sub-Groups
    -- Asset sub-groups
    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Current Assets', 'Asset', v_grp_assets, true, 'Balance Sheet')
    RETURNING id INTO v_grp_curr_assets;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Non-Current Assets', 'Asset', v_grp_assets, true, 'Balance Sheet')
    RETURNING id INTO v_grp_non_curr_assets;

    -- Liability sub-groups
    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Current Liabilities', 'Liability', v_grp_liabilities, true, 'Balance Sheet')
    RETURNING id INTO v_grp_curr_liab;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Duties and Taxes', 'Liability', v_grp_curr_liab, true, 'Balance Sheet')
    RETURNING id INTO v_grp_duties_taxes;

    -- Income sub-groups
    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Revenue From Operations', 'Income', v_grp_income, true, 'Profit and Loss')
    RETURNING id INTO v_grp_direct_income;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Other Operating Income', 'Income', v_grp_income, true, 'Profit and Loss')
    RETURNING id INTO v_grp_indirect_income;

    -- Expense sub-groups
    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Cost of Goods Sold', 'Expense', v_grp_expenses, true, 'Profit and Loss')
    RETURNING id INTO v_grp_cogs;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Operating & Administrative Expenses', 'Expense', v_grp_expenses, true, 'Profit and Loss')
    RETURNING id INTO v_grp_operating_exp;

    INSERT INTO account_group (tenant_id, company_id, name, root_type, parent_id, is_group, report_type)
    VALUES (v_tenant_id, p_company_id, 'Financial & Indirect Expenses', 'Expense', v_grp_expenses, true, 'Profit and Loss')
    RETURNING id INTO v_grp_finance_exp;

    -- 3. Transacting Leaf Accounts (Schedule III)
    -- Asset Accounts
    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '111000', 'Cash in Hand', v_grp_curr_assets, 'Asset', 'Cash', 'INR', false)
    RETURNING id INTO v_acc_cash;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '112000', 'Bank Account', v_grp_curr_assets, 'Asset', 'Bank', 'INR', false)
    RETURNING id INTO v_acc_bank;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '113000', 'Debtors (Accounts Receivable)', v_grp_curr_assets, 'Asset', 'Receivable', 'INR', false)
    RETURNING id INTO v_acc_debtors;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '114000', 'Stock In Hand', v_grp_curr_assets, 'Asset', 'Stock', 'INR', false)
    RETURNING id INTO v_acc_stock;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '115100', 'CGST Input Account', v_grp_curr_assets, 'Asset', 'Tax', 'INR', false)
    RETURNING id INTO v_acc_cgst_in;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '115200', 'SGST Input Account', v_grp_curr_assets, 'Asset', 'Tax', 'INR', false)
    RETURNING id INTO v_acc_sgst_in;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '115300', 'IGST Input Account', v_grp_curr_assets, 'Asset', 'Tax', 'INR', false)
    RETURNING id INTO v_acc_igst_in;

    -- Liability Accounts
    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '211000', 'Creditors (Accounts Payable)', v_grp_curr_liab, 'Liability', 'Payable', 'INR', false)
    RETURNING id INTO v_acc_creditors;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '212100', 'CGST Output Account', v_grp_duties_taxes, 'Liability', 'Tax', 'INR', false)
    RETURNING id INTO v_acc_cgst_out;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '212200', 'SGST Output Account', v_grp_duties_taxes, 'Liability', 'Tax', 'INR', false)
    RETURNING id INTO v_acc_sgst_out;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '212300', 'IGST Output Account', v_grp_duties_taxes, 'Liability', 'Tax', 'INR', false)
    RETURNING id INTO v_acc_igst_out;

    -- Equity Accounts
    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '311000', 'Share Capital', v_grp_equity, 'Equity', 'Equity', 'INR', false)
    RETURNING id INTO v_acc_share_capital;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '312000', 'Retained Earnings', v_grp_equity, 'Equity', 'Equity', 'INR', false)
    RETURNING id INTO v_acc_retained_earnings;

    -- Income Accounts
    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '411000', 'Sales Revenue', v_grp_direct_income, 'Income', 'Income Account', 'INR', false)
    RETURNING id INTO v_acc_sales;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '412000', 'Other Operating Income', v_grp_indirect_income, 'Income', 'Income Account', 'INR', false)
    RETURNING id INTO v_acc_other_income;

    -- Expense Accounts
    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '511000', 'Cost of Goods Sold', v_grp_cogs, 'Expense', 'Cost of Goods Sold', 'INR', false)
    RETURNING id INTO v_acc_cogs;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '512000', 'Purchase Expense', v_grp_cogs, 'Expense', 'Expense Account', 'INR', false)
    RETURNING id INTO v_acc_purchase_exp;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '521000', 'Salaries and Wages', v_grp_operating_exp, 'Expense', 'Expense Account', 'INR', false)
    RETURNING id INTO v_acc_salaries;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '522000', 'Rent Expense', v_grp_operating_exp, 'Expense', 'Expense Account', 'INR', false)
    RETURNING id INTO v_acc_rent;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '523000', 'Utilities Expense', v_grp_operating_exp, 'Expense', 'Expense Account', 'INR', false)
    RETURNING id INTO v_acc_utilities;

    INSERT INTO account (tenant_id, company_id, account_number, account_name, account_group_id, root_type, account_type, currency, is_group)
    VALUES (v_tenant_id, p_company_id, '531000', 'Round Off Expense', v_grp_finance_exp, 'Expense', 'Round Off', 'INR', false)
    RETURNING id INTO v_acc_round_off;

    -- Update company default control accounts
    UPDATE company
    SET default_receivable_account_id = v_acc_debtors,
        default_payable_account_id = v_acc_creditors
    WHERE id = p_company_id;

    -- 4. Standard GST Tax Templates for this Company
    -- GST 18% Sales (Default)
    INSERT INTO tax_template (tenant_id, company_id, name, tax_type, is_default, is_active)
    VALUES (v_tenant_id, p_company_id, 'GST 18% (CGST 9% + SGST 9%)', 'Sales', true, true)
    RETURNING id INTO v_tpl_gst18_sales;

    INSERT INTO tax_template_detail (tenant_id, tax_template_id, account_id, tax_rate, tax_name)
    VALUES
        (v_tenant_id, v_tpl_gst18_sales, v_acc_cgst_out, 9.000000, 'CGST 9%'),
        (v_tenant_id, v_tpl_gst18_sales, v_acc_sgst_out, 9.000000, 'SGST 9%');

    -- GST 18% Purchase
    INSERT INTO tax_template (tenant_id, company_id, name, tax_type, is_default, is_active)
    VALUES (v_tenant_id, p_company_id, 'GST 18% Inward (CGST 9% + SGST 9%)', 'Purchase', true, true)
    RETURNING id INTO v_tpl_gst18_purch;

    INSERT INTO tax_template_detail (tenant_id, tax_template_id, account_id, tax_rate, tax_name)
    VALUES
        (v_tenant_id, v_tpl_gst18_purch, v_acc_cgst_in, 9.000000, 'CGST Input 9%'),
        (v_tenant_id, v_tpl_gst18_purch, v_acc_sgst_in, 9.000000, 'SGST Input 9%');

    -- GST 12% Sales
    INSERT INTO tax_template (tenant_id, company_id, name, tax_type, is_default, is_active)
    VALUES (v_tenant_id, p_company_id, 'GST 12% (CGST 6% + SGST 6%)', 'Sales', false, true)
    RETURNING id INTO v_tpl_gst12_sales;

    INSERT INTO tax_template_detail (tenant_id, tax_template_id, account_id, tax_rate, tax_name)
    VALUES
        (v_tenant_id, v_tpl_gst12_sales, v_acc_cgst_out, 6.000000, 'CGST 6%'),
        (v_tenant_id, v_tpl_gst12_sales, v_acc_sgst_out, 6.000000, 'SGST 6%');

    -- GST 5% Sales
    INSERT INTO tax_template (tenant_id, company_id, name, tax_type, is_default, is_active)
    VALUES (v_tenant_id, p_company_id, 'GST 5% (CGST 2.5% + SGST 2.5%)', 'Sales', false, true)
    RETURNING id INTO v_tpl_gst5_sales;

    INSERT INTO tax_template_detail (tenant_id, tax_template_id, account_id, tax_rate, tax_name)
    VALUES
        (v_tenant_id, v_tpl_gst5_sales, v_acc_cgst_out, 2.500000, 'CGST 2.5%'),
        (v_tenant_id, v_tpl_gst5_sales, v_acc_sgst_out, 2.500000, 'SGST 2.5%');

    -- GST 28% Sales
    INSERT INTO tax_template (tenant_id, company_id, name, tax_type, is_default, is_active)
    VALUES (v_tenant_id, p_company_id, 'GST 28% (CGST 14% + SGST 14%)', 'Sales', false, true)
    RETURNING id INTO v_tpl_gst28_sales;

    INSERT INTO tax_template_detail (tenant_id, tax_template_id, account_id, tax_rate, tax_name)
    VALUES
        (v_tenant_id, v_tpl_gst28_sales, v_acc_cgst_out, 14.000000, 'CGST 14%'),
        (v_tenant_id, v_tpl_gst28_sales, v_acc_sgst_out, 14.000000, 'SGST 14%');

    -- GST Nil (0%)
    INSERT INTO tax_template (tenant_id, company_id, name, tax_type, is_default, is_active)
    VALUES (v_tenant_id, p_company_id, 'GST Nil (0% Exempt)', 'Sales', false, true)
    RETURNING id INTO v_tpl_gst0_sales;

    INSERT INTO tax_template_detail (tenant_id, tax_template_id, account_id, tax_rate, tax_name)
    VALUES
        (v_tenant_id, v_tpl_gst0_sales, v_acc_sales, 0.000000, 'Exempt / Nil Rated (0%)');

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION seed_company_chart_of_accounts(UUID) IS 'Provisions canonical Schedule III Chart of Accounts and GST tax templates for a company';

-- =============================================================================
-- SECTION 12: BASELINE SEED DATA
-- =============================================================================

-- Temporarily configure seed context to system tenant
SELECT set_tenant_context('00000000-0000-0000-0000-000000000000'::uuid);

-- 12.1 Standard Units of Measure (UOM)
INSERT INTO uom (
    tenant_id,
    name,
    must_be_whole_number,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'Nos', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Box', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Kg', false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Gram', false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Metre', false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Litre', false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Hour', false, true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- Standard UOM Conversions (1 Kg = 1000 Gram)
INSERT INTO uom_conversion (
    tenant_id,
    from_uom_id,
    to_uom_id,
    conversion_factor
)
SELECT
    '00000000-0000-0000-0000-000000000000'::uuid,
    u_kg.id,
    u_gm.id,
    1000.000000
FROM uom u_kg, uom u_gm
WHERE u_kg.tenant_id = '00000000-0000-0000-0000-000000000000'::uuid AND u_kg.name = 'Kg'
  AND u_gm.tenant_id = '00000000-0000-0000-0000-000000000000'::uuid AND u_gm.name = 'Gram'
ON CONFLICT DO NOTHING;

-- 12.2 Default Price Lists
INSERT INTO price_list (
    id,
    tenant_id,
    name,
    currency,
    buying,
    selling,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000010'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'Standard Selling', 'INR', false, true, true),
('00000000-0000-0000-0000-000000000011'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'Standard Buying', 'INR', true, false, true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 12.3 Default Customer Groups
INSERT INTO customer_group (
    id,
    tenant_id,
    name,
    is_group,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000020'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'All Customer Groups', true, true)
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO customer_group (
    tenant_id,
    name,
    parent_group_id,
    is_group,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'Commercial', '00000000-0000-0000-0000-000000000020'::uuid, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Retail', '00000000-0000-0000-0000-000000000020'::uuid, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Government', '00000000-0000-0000-0000-000000000020'::uuid, false, true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 12.4 Default Supplier Groups
INSERT INTO supplier_group (
    id,
    tenant_id,
    name,
    is_group,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000030'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'All Supplier Groups', true, true)
ON CONFLICT (tenant_id, name) DO NOTHING;

INSERT INTO supplier_group (
    tenant_id,
    name,
    parent_group_id,
    is_group,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'Raw Material', '00000000-0000-0000-0000-000000000030'::uuid, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Services', '00000000-0000-0000-0000-000000000030'::uuid, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Distributors', '00000000-0000-0000-0000-000000000030'::uuid, false, true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 12.5 Default Tax Categories
INSERT INTO tax_category (
    tenant_id,
    name,
    is_inter_state,
    is_reverse_charge,
    description,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'In-State GST', false, false, 'Intra-state trade within same state (CGST + SGST)', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Out-of-State GST', true, false, 'Inter-state trade across different states (IGST)', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Export / SEZ Zero-Rated', true, false, 'Export transactions and SEZ supply without tax or with bond', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Reverse Charge (RCM)', false, true, 'Inward procurement subject to Reverse Charge Mechanism', true)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- 12.6 System Template Company & Seeded Chart of Accounts
-- Insert canonical template company
INSERT INTO company (
    id,
    tenant_id,
    company_name,
    abbr,
    default_currency,
    country,
    is_active,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'VyaparSuite Template Company',
    'VTC',
    'INR',
    'India',
    true,
    '{"is_system_template": true}'::jsonb
) ON CONFLICT (tenant_id, company_name) DO NOTHING;

-- Provision the complete Schedule III Chart of Accounts and GST Tax Templates for the Template Company
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM company WHERE id = '00000000-0000-0000-0000-000000000001'::uuid
    ) AND NOT EXISTS (
        SELECT 1 FROM account_group WHERE company_id = '00000000-0000-0000-0000-000000000001'::uuid
    ) THEN
        PERFORM seed_company_chart_of_accounts('00000000-0000-0000-0000-000000000001'::uuid);
    END IF;
END $$;

-- Reset tenant context
SELECT set_tenant_context(NULL);

-- =============================================================================
-- END OF MIGRATION 00002_master_data.sql
-- =============================================================================
