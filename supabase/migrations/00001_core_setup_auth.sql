-- =============================================================================
-- Migration: 00001_core_setup_auth.sql
-- Description: Phase 1 — Core Platform, Tenancy, Identity, RBAC, Activity & Audit Architecture
-- Dialect: PostgreSQL 15+ (Supabase PaaS / Enterprise Self-Hosted)
-- Target Platform: VyaparSuite Production ERP
-- Author: VyaparSuite Engineering Group
-- Classification: Canonical Foundation Schema Migration
-- =============================================================================

-- =============================================================================
-- SECTION 1: EXTENSIONS & COMPATIBILITY ENVIRONMENT
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Portability stub for Supabase auth schema if executing in vanilla PostgreSQL
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- Fallback JWT parser if auth.jwt() is absent outside Supabase environment
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'auth' AND p.proname = 'jwt'
    ) THEN
        EXECUTE 'CREATE OR REPLACE FUNCTION auth.jwt() RETURNS jsonb AS $fn$ BEGIN RETURN NULLIF(current_setting(''request.jwt.claims'', true), '''')::jsonb; EXCEPTION WHEN OTHERS THEN RETURN NULL::jsonb; END; $fn$ LANGUAGE plpgsql STABLE;';
    END IF;
END $$;

-- =============================================================================
-- SECTION 2: SYSTEM HELPER FUNCTIONS
-- =============================================================================

-- 2.1 Set Tenant Session Context
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id uuid)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION set_tenant_context(uuid) IS 'Sets active tenant session context for database RLS isolation';

-- 2.2 Get Current Tenant Context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS uuid AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), '')::uuid,
        (NULLIF(auth.jwt() ->> 'tenant_id', ''))::uuid
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_current_tenant_id() IS 'Extracts active tenant UUID from session settings or Supabase JWT claims';

-- 2.3 Automated updated_at Column Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = clock_timestamp();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger handler updating updated_at timestamp upon row mutation';

-- 2.4 Immutable Audit & Ledger Guard Trigger Function (CARO 2020 Compliance)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Modifications or deletions to audit logs and immutable ledger entries are strictly prohibited by CARO 2020 / MCA statutory regulations';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION prevent_audit_modification() IS 'Trigger handler guaranteeing append-only immutability for statutory audit records';

-- =============================================================================
-- SECTION 3: CORE ORGANIZATION & TENANCY TABLES (23 TABLES)
-- =============================================================================

-- 3.1 Table: tenant
CREATE TABLE IF NOT EXISTS tenant (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    name                         TEXT NOT NULL,
    subdomain                    TEXT NOT NULL,
    custom_domain                TEXT,
    status                       TEXT NOT NULL DEFAULT 'active',
    edition                      TEXT NOT NULL DEFAULT 'standard',
    storage_limit_bytes          BIGINT NOT NULL DEFAULT 5368709120,
    storage_used_bytes           BIGINT NOT NULL DEFAULT 0,
    max_users                    INTEGER NOT NULL DEFAULT 10,
    subscription_ends_at         TIMESTAMPTZ,
    primary_contact_email        TEXT NOT NULL,
    primary_contact_phone        TEXT,
    metadata                     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    CONSTRAINT pk_tenant PRIMARY KEY (id),
    CONSTRAINT uq_tenant_subdomain UNIQUE (subdomain),
    CONSTRAINT uq_tenant_custom_domain UNIQUE (custom_domain),
    CONSTRAINT chk_tenant_status CHECK (status IN ('trialing','active','suspended','cancelled','archived')),
    CONSTRAINT chk_tenant_storage CHECK (storage_used_bytes >= 0 AND storage_limit_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_tenant_subdomain ON tenant USING btree (subdomain);
CREATE INDEX IF NOT EXISTS idx_tenant_status ON tenant USING btree (status);

-- 3.2 Table: company
CREATE TABLE IF NOT EXISTS company (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_name                 TEXT NOT NULL,
    abbr                         TEXT NOT NULL,
    default_currency             TEXT NOT NULL DEFAULT 'INR',
    country                      TEXT NOT NULL DEFAULT 'India',
    tax_id                       TEXT,
    cin                          TEXT,
    parent_company_id            UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    chart_of_accounts_template   TEXT,
    default_receivable_account_id UUID,
    default_payable_account_id   UUID,
    default_cost_centre_id       UUID,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    metadata                     JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT pk_company PRIMARY KEY (id),
    CONSTRAINT fk_company_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_company_parent_company_id FOREIGN KEY (parent_company_id) REFERENCES company(id) ON DELETE RESTRICT,
    CONSTRAINT uq_company_tenant_name UNIQUE (tenant_id, company_name),
    CONSTRAINT uq_company_tenant_abbr UNIQUE (tenant_id, abbr),
    CONSTRAINT chk_company_abbr_length CHECK (char_length(abbr) <= 10)
);

CREATE INDEX IF NOT EXISTS idx_company_tenant_id ON company USING btree (tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_parent ON company USING btree (tenant_id, parent_company_id);

-- 3.3 Table: branch
CREATE TABLE IF NOT EXISTS branch (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    branch_name                  TEXT NOT NULL,
    branch_code                  TEXT NOT NULL,
    gstin                        TEXT,
    email                        TEXT,
    phone                        TEXT,
    address_id                   UUID,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_branch PRIMARY KEY (id),
    CONSTRAINT fk_branch_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_branch_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_branch_company_code UNIQUE (company_id, branch_code)
);

CREATE INDEX IF NOT EXISTS idx_branch_company ON branch USING btree (company_id, is_active);

-- 3.4 Table: department
CREATE TABLE IF NOT EXISTS department (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    department_name              TEXT NOT NULL,
    parent_department_id         UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_department PRIMARY KEY (id),
    CONSTRAINT fk_department_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_department_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_department_parent_department_id FOREIGN KEY (parent_department_id) REFERENCES department(id) ON DELETE RESTRICT,
    CONSTRAINT uq_dept_company_name UNIQUE (company_id, department_name)
);

CREATE INDEX IF NOT EXISTS idx_dept_company ON department USING btree (company_id);

-- 3.5 Table: cost_centre
CREATE TABLE IF NOT EXISTS cost_centre (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    cost_centre_name             TEXT NOT NULL,
    cost_centre_code             TEXT,
    parent_cost_centre_id        UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_cost_centre PRIMARY KEY (id),
    CONSTRAINT fk_cost_centre_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cost_centre_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_cost_centre_parent_cost_centre_id FOREIGN KEY (parent_cost_centre_id) REFERENCES cost_centre(id) ON DELETE RESTRICT,
    CONSTRAINT uq_cc_company_name UNIQUE (company_id, cost_centre_name)
);

CREATE INDEX IF NOT EXISTS idx_cost_centre_company ON cost_centre USING btree (company_id, is_active);

-- 3.6 Table: profit_centre
CREATE TABLE IF NOT EXISTS profit_centre (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    profit_centre_name           TEXT NOT NULL,
    profit_centre_code           TEXT,
    parent_profit_centre_id      UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_profit_centre PRIMARY KEY (id),
    CONSTRAINT fk_profit_centre_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_profit_centre_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_profit_centre_parent_profit_centre_id FOREIGN KEY (parent_profit_centre_id) REFERENCES profit_centre(id) ON DELETE RESTRICT,
    CONSTRAINT uq_pc_company_name UNIQUE (company_id, profit_centre_name)
);

CREATE INDEX IF NOT EXISTS idx_profit_centre_company ON profit_centre USING btree (company_id, is_active);

-- 3.7 Table: fiscal_year
CREATE TABLE IF NOT EXISTS fiscal_year (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    year_name                    TEXT NOT NULL,
    start_date                   DATE NOT NULL,
    end_date                     DATE NOT NULL,
    is_closed                    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_fiscal_year PRIMARY KEY (id),
    CONSTRAINT fk_fiscal_year_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fiscal_year_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_fy_company_name UNIQUE (company_id, year_name),
    CONSTRAINT chk_fy_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_fy_company_dates ON fiscal_year USING btree (company_id, start_date, end_date);

-- 3.8 Table: accounting_period
CREATE TABLE IF NOT EXISTS accounting_period (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    fiscal_year_id               UUID NOT NULL,
    period_name                  TEXT NOT NULL,
    start_date                   DATE NOT NULL,
    end_date                     DATE NOT NULL,
    is_closed                    BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_accounting_period PRIMARY KEY (id),
    CONSTRAINT fk_accounting_period_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_accounting_period_fiscal_year_id FOREIGN KEY (fiscal_year_id) REFERENCES fiscal_year(id) ON DELETE CASCADE,
    CONSTRAINT uq_period_fy_name UNIQUE (fiscal_year_id, period_name),
    CONSTRAINT chk_period_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_period_dates ON accounting_period USING btree (fiscal_year_id, start_date, end_date);

-- 3.9 Table: currency
CREATE TABLE IF NOT EXISTS currency (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    currency_code                TEXT NOT NULL,
    currency_name                TEXT NOT NULL,
    symbol                       TEXT NOT NULL,
    fraction_name                TEXT,
    fraction_units               INTEGER NOT NULL DEFAULT 100,
    symbol_on_right              BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_currency PRIMARY KEY (id),
    CONSTRAINT fk_currency_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_currency_tenant_code UNIQUE (tenant_id, currency_code),
    CONSTRAINT chk_cur_fraction_positive CHECK (fraction_units > 0)
);

CREATE INDEX IF NOT EXISTS idx_currency_code ON currency USING btree (tenant_id, currency_code);

-- 3.10 Table: exchange_rate
CREATE TABLE IF NOT EXISTS exchange_rate (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    from_currency                TEXT NOT NULL,
    to_currency                  TEXT NOT NULL,
    rate                         NUMERIC(20,6) NOT NULL DEFAULT 1.000000,
    effective_date               DATE NOT NULL DEFAULT CURRENT_DATE,
    source                       TEXT DEFAULT 'manual',
    CONSTRAINT pk_exchange_rate PRIMARY KEY (id),
    CONSTRAINT fk_exchange_rate_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_exchange_pair_date UNIQUE (tenant_id, from_currency, to_currency, effective_date),
    CONSTRAINT chk_exchange_rate_positive CHECK (rate > 0)
);

CREATE INDEX IF NOT EXISTS idx_exchange_lookup ON exchange_rate USING btree (tenant_id, from_currency, to_currency, effective_date DESC);

-- 3.11 Table: country
CREATE TABLE IF NOT EXISTS country (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    country_name                 TEXT NOT NULL,
    country_code                 TEXT NOT NULL,
    iso_alpha3                   TEXT NOT NULL,
    currency_code                TEXT,
    calling_code                 TEXT,
    CONSTRAINT pk_country PRIMARY KEY (id),
    CONSTRAINT fk_country_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_country_code UNIQUE (tenant_id, country_code)
);

CREATE INDEX IF NOT EXISTS idx_country_name ON country USING btree (tenant_id, country_name);

-- 3.12 Table: state_province
CREATE TABLE IF NOT EXISTS state_province (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    country_code                 TEXT NOT NULL,
    state_name                   TEXT NOT NULL,
    state_code                   TEXT NOT NULL,
    gst_state_code               TEXT,
    is_union_territory           BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_state_province PRIMARY KEY (id),
    CONSTRAINT fk_state_province_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_state_code_country UNIQUE (tenant_id, country_code, state_code),
    CONSTRAINT uq_state_gst_code UNIQUE (tenant_id, country_code, gst_state_code)
);

CREATE INDEX IF NOT EXISTS idx_state_gst_code ON state_province USING btree (tenant_id, gst_state_code);

-- 3.13 Table: warehouse
CREATE TABLE IF NOT EXISTS warehouse (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    branch_id                    UUID,
    warehouse_name               TEXT NOT NULL,
    warehouse_code               TEXT NOT NULL,
    parent_warehouse_id          UUID,
    is_group                     BOOLEAN NOT NULL DEFAULT false,
    warehouse_type               TEXT NOT NULL DEFAULT 'regular',
    account_id                   UUID,
    address_id                   UUID,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_warehouse PRIMARY KEY (id),
    CONSTRAINT fk_warehouse_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT fk_warehouse_branch_id FOREIGN KEY (branch_id) REFERENCES branch(id) ON DELETE SET NULL,
    CONSTRAINT fk_warehouse_parent_warehouse_id FOREIGN KEY (parent_warehouse_id) REFERENCES warehouse(id) ON DELETE RESTRICT,
    CONSTRAINT uq_warehouse_company_code UNIQUE (company_id, warehouse_code),
    CONSTRAINT chk_wh_type CHECK (warehouse_type IN ('regular','transit','bonded','quarantine','scrap','consignment'))
);

CREATE INDEX IF NOT EXISTS idx_warehouse_company ON warehouse USING btree (company_id, is_active);

-- 3.14 Table: warehouse_location
CREATE TABLE IF NOT EXISTS warehouse_location (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    warehouse_id                 UUID NOT NULL,
    location_name                TEXT NOT NULL,
    location_code                TEXT NOT NULL,
    aisle                        TEXT,
    rack                         TEXT,
    shelf                        TEXT,
    bin                          TEXT,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_warehouse_location PRIMARY KEY (id),
    CONSTRAINT fk_warehouse_location_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_warehouse_location_warehouse_id FOREIGN KEY (warehouse_id) REFERENCES warehouse(id) ON DELETE CASCADE,
    CONSTRAINT uq_wh_loc_code UNIQUE (warehouse_id, location_code)
);

CREATE INDEX IF NOT EXISTS idx_wh_loc_code ON warehouse_location USING btree (warehouse_id, location_code);

-- 3.15 Table: naming_series
CREATE TABLE IF NOT EXISTS naming_series (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID,
    doctype                      TEXT NOT NULL,
    prefix                       TEXT NOT NULL,
    current_value                BIGINT NOT NULL DEFAULT 0,
    padding_digits               INTEGER NOT NULL DEFAULT 5,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_naming_series PRIMARY KEY (id),
    CONSTRAINT fk_naming_series_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_naming_series_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_naming_series_doc_prefix UNIQUE (tenant_id, doctype, prefix),
    CONSTRAINT chk_ns_current_positive CHECK (current_value >= 0)
);

CREATE INDEX IF NOT EXISTS idx_naming_series_lookup ON naming_series USING btree (tenant_id, doctype, is_active);

-- 3.16 Table: global_default
CREATE TABLE IF NOT EXISTS global_default (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    key_name                     TEXT NOT NULL,
    value_data                   TEXT NOT NULL,
    data_type                    TEXT NOT NULL DEFAULT 'string',
    CONSTRAINT pk_global_default PRIMARY KEY (id),
    CONSTRAINT fk_global_default_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_global_default_key UNIQUE (tenant_id, key_name)
);

CREATE INDEX IF NOT EXISTS idx_global_default_key ON global_default USING btree (tenant_id, key_name);

-- 3.17 Table: company_default
CREATE TABLE IF NOT EXISTS company_default (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID NOT NULL,
    key_name                     TEXT NOT NULL,
    value_data                   TEXT NOT NULL,
    data_type                    TEXT NOT NULL DEFAULT 'string',
    CONSTRAINT pk_company_default PRIMARY KEY (id),
    CONSTRAINT fk_company_default_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_company_default_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_company_default_key UNIQUE (company_id, key_name)
);

CREATE INDEX IF NOT EXISTS idx_company_default_lookup ON company_default USING btree (company_id, key_name);

-- 3.18 Table: terms_and_conditions
CREATE TABLE IF NOT EXISTS terms_and_conditions (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    title                        TEXT NOT NULL,
    terms_text                   TEXT NOT NULL,
    is_default                   BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_terms_and_conditions PRIMARY KEY (id),
    CONSTRAINT fk_terms_and_conditions_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_tc_title UNIQUE (tenant_id, title)
);

CREATE INDEX IF NOT EXISTS idx_tc_active ON terms_and_conditions USING btree (tenant_id, is_active);

-- 3.19 Table: letterhead
CREATE TABLE IF NOT EXISTS letterhead (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    company_id                   UUID,
    name                         TEXT NOT NULL,
    header_html                  TEXT,
    footer_html                  TEXT,
    image_url                    TEXT,
    is_default                   BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_letterhead PRIMARY KEY (id),
    CONSTRAINT fk_letterhead_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_letterhead_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    CONSTRAINT uq_lh_company_name UNIQUE (tenant_id, company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_lh_default ON letterhead USING btree (tenant_id, company_id, is_default);

-- 3.20 Table: email_template
CREATE TABLE IF NOT EXISTS email_template (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    template_name                TEXT NOT NULL,
    subject                      TEXT NOT NULL,
    body_html                    TEXT NOT NULL,
    body_text                    TEXT,
    doctype                      TEXT,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_email_template PRIMARY KEY (id),
    CONSTRAINT fk_email_template_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_email_template_name UNIQUE (tenant_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_email_template_doctype ON email_template USING btree (tenant_id, doctype);

-- 3.21 Table: print_template
CREATE TABLE IF NOT EXISTS print_template (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    template_name                TEXT NOT NULL,
    doctype                      TEXT NOT NULL,
    format_type                  TEXT NOT NULL DEFAULT 'jinja',
    template_content             TEXT NOT NULL,
    css_styles                   TEXT,
    is_default                   BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_print_template PRIMARY KEY (id),
    CONSTRAINT fk_print_template_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_print_template_doc_name UNIQUE (tenant_id, doctype, template_name)
);

CREATE INDEX IF NOT EXISTS idx_print_template_doctype ON print_template USING btree (tenant_id, doctype, is_default);

-- 3.22 Table: feature_flag
CREATE TABLE IF NOT EXISTS feature_flag (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    flag_key                     TEXT NOT NULL,
    is_enabled                   BOOLEAN NOT NULL DEFAULT false,
    rules                        JSONB NOT NULL DEFAULT '{}'::jsonb,
    description                  TEXT,
    CONSTRAINT pk_feature_flag PRIMARY KEY (id),
    CONSTRAINT fk_feature_flag_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_feature_flag_key UNIQUE (tenant_id, flag_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flag_key ON feature_flag USING btree (tenant_id, flag_key);

-- 3.23 Table: module_activation
CREATE TABLE IF NOT EXISTS module_activation (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    module_key                   TEXT NOT NULL,
    is_active                    BOOLEAN NOT NULL DEFAULT false,
    activated_at                 TIMESTAMPTZ,
    configuration                JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT pk_module_activation PRIMARY KEY (id),
    CONSTRAINT fk_module_activation_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_module_act_key UNIQUE (tenant_id, module_key)
);

CREATE INDEX IF NOT EXISTS idx_module_activation ON module_activation USING btree (tenant_id, module_key, is_active);

-- =============================================================================
-- SECTION 4: IDENTITY, RBAC & SECURITY TABLES (12 TABLES)
-- =============================================================================

-- 4.1 Table: user_profile
CREATE TABLE IF NOT EXISTS user_profile (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    auth_user_id                 UUID NOT NULL,
    email                        TEXT NOT NULL,
    first_name                   TEXT NOT NULL,
    last_name                    TEXT,
    phone                        TEXT,
    avatar_url                   TEXT,
    default_company_id           UUID,
    default_branch_id            UUID,
    is_system_admin              BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    preferences                  JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT pk_user_profile PRIMARY KEY (id),
    CONSTRAINT fk_user_profile_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_profile_auth_user_id FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_profile_default_company_id FOREIGN KEY (default_company_id) REFERENCES company(id) ON DELETE SET NULL,
    CONSTRAINT fk_user_profile_default_branch_id FOREIGN KEY (default_branch_id) REFERENCES branch(id) ON DELETE SET NULL,
    CONSTRAINT uq_user_profile_tenant_auth UNIQUE (tenant_id, auth_user_id),
    CONSTRAINT uq_user_profile_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_user_profile_auth_user ON user_profile USING btree (auth_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profile_email ON user_profile USING btree (tenant_id, email);

-- 4.2 Table: role
CREATE TABLE IF NOT EXISTS role (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    role_name                    TEXT NOT NULL,
    description                  TEXT,
    is_system                    BOOLEAN NOT NULL DEFAULT false,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_role PRIMARY KEY (id),
    CONSTRAINT fk_role_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_role_tenant_name UNIQUE (tenant_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_role_active ON role USING btree (tenant_id, is_active);

-- 4.3 Table: role_profile
CREATE TABLE IF NOT EXISTS role_profile (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    role_profile_name            TEXT NOT NULL,
    roles                        JSONB NOT NULL DEFAULT '[]'::jsonb,
    description                  TEXT,
    CONSTRAINT pk_role_profile PRIMARY KEY (id),
    CONSTRAINT fk_role_profile_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_role_profile_name UNIQUE (tenant_id, role_profile_name)
);

CREATE INDEX IF NOT EXISTS idx_role_profile_name ON role_profile USING btree (tenant_id, role_profile_name);

-- 4.4 Table: role_profile_role
CREATE TABLE IF NOT EXISTS role_profile_role (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    role_profile_id              UUID NOT NULL,
    role_id                      UUID NOT NULL,
    CONSTRAINT pk_role_profile_role PRIMARY KEY (id),
    CONSTRAINT fk_role_profile_role_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_role_profile_role_profile_id FOREIGN KEY (role_profile_id) REFERENCES role_profile(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_profile_role_role_id FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    CONSTRAINT uq_role_profile_role UNIQUE (tenant_id, role_profile_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_role_profile_role_profile ON role_profile_role USING btree (tenant_id, role_profile_id);
CREATE INDEX IF NOT EXISTS idx_role_profile_role_role ON role_profile_role USING btree (tenant_id, role_id);

-- 4.5 Table: user_role
CREATE TABLE IF NOT EXISTS user_role (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_id                      UUID NOT NULL,
    role_id                      UUID NOT NULL,
    CONSTRAINT pk_user_role PRIMARY KEY (id),
    CONSTRAINT fk_user_role_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_role_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_role_role_id FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_role_assignment UNIQUE (tenant_id, user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_role_user ON user_role USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_role ON user_role USING btree (role_id);

-- 4.6 Table: user_group
CREATE TABLE IF NOT EXISTS user_group (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    group_name                   TEXT NOT NULL,
    description                  TEXT,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_user_group PRIMARY KEY (id),
    CONSTRAINT fk_user_group_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_user_group_name UNIQUE (tenant_id, group_name)
);

CREATE INDEX IF NOT EXISTS idx_user_group_active ON user_group USING btree (tenant_id, is_active);

-- 4.7 Table: user_group_member
CREATE TABLE IF NOT EXISTS user_group_member (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_group_id                UUID NOT NULL,
    user_id                      UUID NOT NULL,
    CONSTRAINT pk_user_group_member PRIMARY KEY (id),
    CONSTRAINT fk_user_group_member_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_group_member_user_group_id FOREIGN KEY (user_group_id) REFERENCES user_group(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_group_member_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_group_member UNIQUE (tenant_id, user_group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ugm_group ON user_group_member USING btree (user_group_id);
CREATE INDEX IF NOT EXISTS idx_ugm_user ON user_group_member USING btree (user_id);

-- 4.8 Table: user_permission
CREATE TABLE IF NOT EXISTS user_permission (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_id                      UUID NOT NULL,
    allow_doctype                TEXT NOT NULL,
    for_value                    UUID NOT NULL,
    is_default                   BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_user_permission PRIMARY KEY (id),
    CONSTRAINT fk_user_permission_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_permission_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_perm_rule UNIQUE (tenant_id, user_id, allow_doctype, for_value)
);

CREATE INDEX IF NOT EXISTS idx_user_perm_lookup ON user_permission USING btree (user_id, allow_doctype, for_value);

-- 4.9 Table: permission_rule
CREATE TABLE IF NOT EXISTS permission_rule (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    role_id                      UUID NOT NULL,
    doctype                      TEXT NOT NULL,
    can_read                     BOOLEAN NOT NULL DEFAULT true,
    can_write                    BOOLEAN NOT NULL DEFAULT false,
    can_create                   BOOLEAN NOT NULL DEFAULT false,
    can_delete                   BOOLEAN NOT NULL DEFAULT false,
    can_submit                   BOOLEAN NOT NULL DEFAULT false,
    can_cancel                   BOOLEAN NOT NULL DEFAULT false,
    can_amend                    BOOLEAN NOT NULL DEFAULT false,
    can_export                   BOOLEAN NOT NULL DEFAULT false,
    can_import                   BOOLEAN NOT NULL DEFAULT false,
    condition_script             TEXT,
    CONSTRAINT pk_permission_rule PRIMARY KEY (id),
    CONSTRAINT fk_permission_rule_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_permission_rule_role_id FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    CONSTRAINT uq_permission_rule_role_doctype UNIQUE (tenant_id, role_id, doctype)
);

CREATE INDEX IF NOT EXISTS idx_perm_rule_role_doc ON permission_rule USING btree (role_id, doctype);

-- 4.10 Table: approval_limit
CREATE TABLE IF NOT EXISTS approval_limit (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    role_id                      UUID,
    user_id                      UUID,
    doctype                      TEXT NOT NULL,
    currency                     TEXT NOT NULL DEFAULT 'INR',
    max_approval_amount          NUMERIC(20,6) NOT NULL DEFAULT 0.000000,
    CONSTRAINT pk_approval_limit PRIMARY KEY (id),
    CONSTRAINT fk_approval_limit_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_approval_limit_role_id FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
    CONSTRAINT fk_approval_limit_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT chk_approval_amount_nonneg CHECK (max_approval_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_approval_limit_lookup ON approval_limit USING btree (tenant_id, doctype, role_id, user_id);

-- 4.11 Table: login_audit
CREATE TABLE IF NOT EXISTS login_audit (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_id                      UUID,
    email_attempted              TEXT NOT NULL,
    login_status                 TEXT NOT NULL,
    ip_address                   INET,
    user_agent                   TEXT,
    failure_reason               TEXT,
    logged_at                    TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT pk_login_audit PRIMARY KEY (id),
    CONSTRAINT fk_login_audit_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_login_audit_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE SET NULL,
    CONSTRAINT chk_login_status CHECK (login_status IN ('success','failed','blocked','mfa_challenge'))
);

CREATE INDEX IF NOT EXISTS idx_login_audit_user_time ON login_audit USING btree (tenant_id, user_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_ip ON login_audit USING btree (ip_address, logged_at DESC);

-- 4.12 Table: session_audit
CREATE TABLE IF NOT EXISTS session_audit (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_id                      UUID NOT NULL,
    session_token_hash           TEXT NOT NULL,
    ip_address                   INET,
    user_agent                   TEXT,
    started_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    last_activity_at             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    revoked_at                   TIMESTAMPTZ,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_session_audit PRIMARY KEY (id),
    CONSTRAINT fk_session_audit_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_session_audit_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_session_token_hash UNIQUE (session_token_hash)
);

CREATE INDEX IF NOT EXISTS idx_session_user_active ON session_audit USING btree (user_id, is_active);

-- =============================================================================
-- SECTION 5: AUDIT, ACTIVITY, WORKFLOW & COLLABORATION TABLES (22 TABLES)
-- =============================================================================

-- 5.1 Table: audit_log
CREATE TABLE IF NOT EXISTS audit_log (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    event_type                   TEXT NOT NULL,
    doctype                      TEXT NOT NULL,
    doc_id                       UUID NOT NULL,
    doc_name                     TEXT,
    user_id                      UUID,
    ip_address                   INET,
    old_values                   JSONB,
    new_values                   JSONB,
    action_timestamp             TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT pk_audit_log PRIMARY KEY (id),
    CONSTRAINT fk_audit_log_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_log_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE SET NULL,
    CONSTRAINT chk_audit_event CHECK (event_type IN ('INSERT','UPDATE','DELETE','SUBMIT','CANCEL','AMEND','EXPORT'))
);

CREATE INDEX IF NOT EXISTS idx_audit_doc ON audit_log USING btree (tenant_id, doctype, doc_id, action_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log USING btree (tenant_id, user_id, action_timestamp DESC);

-- 5.2 Table: field_change_log
CREATE TABLE IF NOT EXISTS field_change_log (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    audit_log_id                 UUID NOT NULL,
    doctype                      TEXT NOT NULL,
    doc_id                       UUID NOT NULL,
    field_name                   TEXT NOT NULL,
    old_value                    TEXT,
    new_value                    TEXT,
    changed_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT pk_field_change_log PRIMARY KEY (id),
    CONSTRAINT fk_field_change_log_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_field_change_log_audit_log_id FOREIGN KEY (audit_log_id) REFERENCES audit_log(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fcl_doc_field ON field_change_log USING btree (tenant_id, doctype, doc_id, field_name);

-- 5.3 Table: workflow
CREATE TABLE IF NOT EXISTS workflow (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    workflow_name                TEXT NOT NULL,
    document_type                TEXT NOT NULL,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_workflow PRIMARY KEY (id),
    CONSTRAINT fk_workflow_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_workflow_doc_type UNIQUE (tenant_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_wf_doctype ON workflow USING btree (tenant_id, document_type, is_active);

-- 5.4 Table: workflow_state
CREATE TABLE IF NOT EXISTS workflow_state (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    workflow_id                  UUID NOT NULL,
    state_name                   TEXT NOT NULL,
    doc_status                   INTEGER NOT NULL DEFAULT 0,
    is_optional_state            BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_workflow_state PRIMARY KEY (id),
    CONSTRAINT fk_workflow_state_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_state_workflow_id FOREIGN KEY (workflow_id) REFERENCES workflow(id) ON DELETE CASCADE,
    CONSTRAINT uq_wfs_flow_state UNIQUE (workflow_id, state_name)
);

CREATE INDEX IF NOT EXISTS idx_wfs_workflow_id ON workflow_state USING btree (workflow_id);

-- 5.5 Table: workflow_transition
CREATE TABLE IF NOT EXISTS workflow_transition (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    workflow_id                  UUID NOT NULL,
    from_state_id                UUID NOT NULL,
    action                       TEXT NOT NULL,
    to_state_id                  UUID NOT NULL,
    allowed_role_id              UUID NOT NULL,
    CONSTRAINT pk_workflow_transition PRIMARY KEY (id),
    CONSTRAINT fk_workflow_transition_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_transition_workflow_id FOREIGN KEY (workflow_id) REFERENCES workflow(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_transition_from_state_id FOREIGN KEY (from_state_id) REFERENCES workflow_state(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_transition_to_state_id FOREIGN KEY (to_state_id) REFERENCES workflow_state(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_transition_allowed_role_id FOREIGN KEY (allowed_role_id) REFERENCES role(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_wft_state_action ON workflow_transition USING btree (from_state_id, action);

-- 5.6 Table: workflow_action_log
CREATE TABLE IF NOT EXISTS workflow_action_log (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    workflow_id                  UUID NOT NULL,
    document_type                TEXT NOT NULL,
    document_id                  UUID NOT NULL,
    from_state_id                UUID NOT NULL,
    to_state_id                  UUID NOT NULL,
    action_taken                 TEXT NOT NULL,
    action_by_id                 UUID NOT NULL,
    comments                     TEXT,
    CONSTRAINT pk_workflow_action_log PRIMARY KEY (id),
    CONSTRAINT fk_workflow_action_log_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_action_log_workflow_id FOREIGN KEY (workflow_id) REFERENCES workflow(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_action_log_from_state_id FOREIGN KEY (from_state_id) REFERENCES workflow_state(id) ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_action_log_to_state_id FOREIGN KEY (to_state_id) REFERENCES workflow_state(id) ON DELETE RESTRICT,
    CONSTRAINT fk_workflow_action_log_action_by_id FOREIGN KEY (action_by_id) REFERENCES user_profile(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_wfal_doc ON workflow_action_log USING btree (tenant_id, document_type, document_id);

-- 5.7 Table: notification_rule
CREATE TABLE IF NOT EXISTS notification_rule (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    rule_name                    TEXT NOT NULL,
    document_type                TEXT NOT NULL,
    event_type                   TEXT NOT NULL DEFAULT 'On Submit',
    channel                      TEXT NOT NULL DEFAULT 'In-App',
    template_id                  UUID,
    recipient_type               TEXT NOT NULL DEFAULT 'Role',
    recipient_value              TEXT NOT NULL,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_notification_rule PRIMARY KEY (id),
    CONSTRAINT fk_notification_rule_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_notification_rule_template_id FOREIGN KEY (template_id) REFERENCES email_template(id) ON DELETE SET NULL,
    CONSTRAINT uq_notification_rule_name UNIQUE (tenant_id, rule_name)
);

CREATE INDEX IF NOT EXISTS idx_nr_doc_event ON notification_rule USING btree (tenant_id, document_type, event_type, is_active);

-- 5.8 Table: notification_log
CREATE TABLE IF NOT EXISTS notification_log (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_id                      UUID NOT NULL,
    title                        TEXT NOT NULL,
    content_text                 TEXT NOT NULL,
    document_type                TEXT,
    document_id                  UUID,
    is_read                      BOOLEAN NOT NULL DEFAULT false,
    read_at                      TIMESTAMPTZ,
    CONSTRAINT pk_notification_log PRIMARY KEY (id),
    CONSTRAINT fk_notification_log_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_notification_log_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_nl_user_unread ON notification_log USING btree (user_id, is_read, created_at DESC);

-- 5.9 Table: notification_preference
CREATE TABLE IF NOT EXISTS notification_preference (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_id                      UUID NOT NULL,
    category_key                 TEXT NOT NULL,
    channel                      TEXT NOT NULL DEFAULT 'In-App',
    is_enabled                   BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_notification_preference PRIMARY KEY (id),
    CONSTRAINT fk_notification_preference_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_notification_preference_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_npref_user_cat_chan UNIQUE (user_id, category_key, channel)
);

CREATE INDEX IF NOT EXISTS idx_npref_user ON notification_preference USING btree (user_id);

-- 5.10 Table: comment
CREATE TABLE IF NOT EXISTS comment (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    reference_doctype            TEXT NOT NULL,
    reference_id                 UUID NOT NULL,
    comment_type                 TEXT NOT NULL DEFAULT 'Comment',
    content_text                 TEXT NOT NULL,
    CONSTRAINT pk_comment PRIMARY KEY (id),
    CONSTRAINT fk_comment_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_comment_ref ON comment USING btree (tenant_id, reference_doctype, reference_id, created_at ASC);

-- 5.11 Table: assignment
CREATE TABLE IF NOT EXISTS assignment (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    reference_doctype            TEXT NOT NULL,
    reference_id                 UUID NOT NULL,
    assigned_to_id               UUID NOT NULL,
    description                  TEXT,
    status                       TEXT NOT NULL DEFAULT 'Open',
    CONSTRAINT pk_assignment PRIMARY KEY (id),
    CONSTRAINT fk_assignment_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_assignment_assigned_to_id FOREIGN KEY (assigned_to_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_asg_doc_user UNIQUE (reference_doctype, reference_id, assigned_to_id)
);

CREATE INDEX IF NOT EXISTS idx_asg_user_status ON assignment USING btree (assigned_to_id, status);

-- 5.12 Table: todo
CREATE TABLE IF NOT EXISTS todo (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_id                      UUID NOT NULL,
    description                  TEXT NOT NULL,
    status                       TEXT NOT NULL DEFAULT 'Open',
    priority                     TEXT NOT NULL DEFAULT 'Medium',
    due_date                     DATE,
    CONSTRAINT pk_todo PRIMARY KEY (id),
    CONSTRAINT fk_todo_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_todo_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_todo_user_status ON todo USING btree (user_id, status, due_date);

-- 5.13 Table: follower
CREATE TABLE IF NOT EXISTS follower (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    reference_doctype            TEXT NOT NULL,
    reference_id                 UUID NOT NULL,
    user_id                      UUID NOT NULL,
    CONSTRAINT pk_follower PRIMARY KEY (id),
    CONSTRAINT fk_follower_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_follower_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_follower_doc_user UNIQUE (reference_doctype, reference_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_foll_doc ON follower USING btree (reference_doctype, reference_id);

-- 5.14 Table: document_share
CREATE TABLE IF NOT EXISTS document_share (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    reference_doctype            TEXT NOT NULL,
    reference_id                 UUID NOT NULL,
    user_id                      UUID NOT NULL,
    read_perm                    BOOLEAN NOT NULL DEFAULT true,
    write_perm                   BOOLEAN NOT NULL DEFAULT false,
    share_perm                   BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT pk_document_share PRIMARY KEY (id),
    CONSTRAINT fk_document_share_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_share_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_dshare_doc_user UNIQUE (reference_doctype, reference_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dshare_user ON document_share USING btree (user_id, reference_doctype);

-- 5.15 Table: tag
CREATE TABLE IF NOT EXISTS tag (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    tag_name                     TEXT NOT NULL,
    CONSTRAINT pk_tag PRIMARY KEY (id),
    CONSTRAINT fk_tag_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_tag_tenant_name UNIQUE (tenant_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_tag_name ON tag USING btree (tenant_id, tag_name);

-- 5.16 Table: document_tag
CREATE TABLE IF NOT EXISTS document_tag (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    tag_id                       UUID NOT NULL,
    reference_doctype            TEXT NOT NULL,
    reference_id                 UUID NOT NULL,
    CONSTRAINT pk_document_tag PRIMARY KEY (id),
    CONSTRAINT fk_document_tag_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_document_tag_tag_id FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE,
    CONSTRAINT uq_document_tag_pair UNIQUE (tag_id, reference_doctype, reference_id)
);

CREATE INDEX IF NOT EXISTS idx_dtag_ref ON document_tag USING btree (reference_doctype, reference_id);

-- 5.17 Table: attachment
CREATE TABLE IF NOT EXISTS attachment (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    company_id                   UUID,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    reference_doctype            TEXT NOT NULL,
    reference_id                 UUID NOT NULL,
    file_name                    TEXT NOT NULL,
    file_url                     TEXT NOT NULL,
    file_size                    BIGINT NOT NULL DEFAULT 0,
    file_type                    TEXT,
    mime_type                    TEXT,
    is_private                   BOOLEAN NOT NULL DEFAULT false,
    folder                       TEXT,
    description                  TEXT,
    metadata                     JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT pk_attachment PRIMARY KEY (id),
    CONSTRAINT fk_attachment_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_attachment_company_id FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_attachment_ref ON attachment USING btree (tenant_id, reference_doctype, reference_id);
CREATE INDEX IF NOT EXISTS idx_attachment_created ON attachment USING btree (tenant_id, created_at DESC);

-- 5.18 Table: custom_field
CREATE TABLE IF NOT EXISTS custom_field (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    document_type                TEXT NOT NULL,
    field_name                   TEXT NOT NULL,
    field_label                  TEXT NOT NULL,
    field_type                   TEXT NOT NULL DEFAULT 'Data',
    options                      TEXT,
    is_mandatory                 BOOLEAN NOT NULL DEFAULT false,
    is_read_only                 BOOLEAN NOT NULL DEFAULT false,
    default_value                TEXT,
    sequence_order               INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT pk_custom_field PRIMARY KEY (id),
    CONSTRAINT fk_custom_field_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_cf_doc_field UNIQUE (tenant_id, document_type, field_name)
);

CREATE INDEX IF NOT EXISTS idx_cf_doctype ON custom_field USING btree (tenant_id, document_type, sequence_order);

-- 5.19 Table: api_key
CREATE TABLE IF NOT EXISTS api_key (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    user_id                      UUID NOT NULL,
    key_name                     TEXT NOT NULL,
    api_key                      TEXT NOT NULL,
    api_secret_hash              TEXT NOT NULL,
    expires_at                   TIMESTAMPTZ,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_api_key PRIMARY KEY (id),
    CONSTRAINT fk_api_key_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_api_key_user_id FOREIGN KEY (user_id) REFERENCES user_profile(id) ON DELETE CASCADE,
    CONSTRAINT uq_api_key_string UNIQUE (api_key)
);

CREATE INDEX IF NOT EXISTS idx_api_key_lookup ON api_key USING btree (api_key, is_active);

-- 5.20 Table: webhook
CREATE TABLE IF NOT EXISTS webhook (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    webhook_name                 TEXT NOT NULL,
    document_type                TEXT NOT NULL,
    event_type                   TEXT NOT NULL DEFAULT 'On Submit',
    target_url                   TEXT NOT NULL,
    secret_token_enc             TEXT,
    headers_json                 JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active                    BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT pk_webhook PRIMARY KEY (id),
    CONSTRAINT fk_webhook_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT uq_webhook_name UNIQUE (tenant_id, webhook_name)
);

CREATE INDEX IF NOT EXISTS idx_wh_doc_event ON webhook USING btree (tenant_id, document_type, event_type, is_active);

-- 5.21 Table: webhook_log
CREATE TABLE IF NOT EXISTS webhook_log (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    webhook_id                   UUID NOT NULL,
    event_type                   TEXT NOT NULL,
    request_payload              JSONB NOT NULL,
    response_status_code         INTEGER,
    response_body                TEXT,
    execution_time_ms            INTEGER,
    status                       TEXT NOT NULL DEFAULT 'Success',
    CONSTRAINT pk_webhook_log PRIMARY KEY (id),
    CONSTRAINT fk_webhook_log_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT,
    CONSTRAINT fk_webhook_log_webhook_id FOREIGN KEY (webhook_id) REFERENCES webhook(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_whl_webhook_time ON webhook_log USING btree (webhook_id, created_at DESC);

-- 5.22 Table: integration_log
CREATE TABLE IF NOT EXISTS integration_log (
    id                           UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id                    UUID NOT NULL,
    created_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at                   TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    created_by                   UUID,
    updated_by                   UUID,
    integration_service          TEXT NOT NULL,
    endpoint_url                 TEXT NOT NULL,
    request_method               TEXT NOT NULL DEFAULT 'POST',
    request_payload_redacted     JSONB,
    response_status              INTEGER,
    response_payload_redacted    JSONB,
    error_message                TEXT,
    execution_time_ms            INTEGER,
    CONSTRAINT pk_integration_log PRIMARY KEY (id),
    CONSTRAINT fk_integration_log_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_il_service_time ON integration_log USING btree (tenant_id, integration_service, created_at DESC);

-- =============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE company ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch ENABLE ROW LEVEL SECURITY;
ALTER TABLE department ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_centre ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_centre ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_period ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rate ENABLE ROW LEVEL SECURITY;
ALTER TABLE country ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_province ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE naming_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_default ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_default ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_and_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE letterhead ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE print_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_activation ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE role ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_profile_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permission ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_limit ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_action_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rule ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_share ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_field ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_log ENABLE ROW LEVEL SECURITY;

-- 6.1 Tenant Table Isolation Policy
CREATE POLICY tenant_isolation_policy ON tenant
    FOR ALL USING (id = get_current_tenant_id());

-- 6.2 Master Reference Policy (currency)
CREATE POLICY tenant_isolation_policy ON currency
    FOR ALL USING (
        tenant_id = get_current_tenant_id() OR
        tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- 6.2 Master Reference Policy (country)
CREATE POLICY tenant_isolation_policy ON country
    FOR ALL USING (
        tenant_id = get_current_tenant_id() OR
        tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- 6.2 Master Reference Policy (state_province)
CREATE POLICY tenant_isolation_policy ON state_province
    FOR ALL USING (
        tenant_id = get_current_tenant_id() OR
        tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- 6.2 Master Reference Policy (role)
CREATE POLICY tenant_isolation_policy ON role
    FOR ALL USING (
        tenant_id = get_current_tenant_id() OR
        tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

-- 6.2 Master Reference Policy (module_activation)
CREATE POLICY tenant_isolation_policy ON module_activation
    FOR ALL USING (
        tenant_id = get_current_tenant_id() OR
        tenant_id = '00000000-0000-0000-0000-000000000000'::uuid
    );

CREATE POLICY tenant_isolation_policy ON company FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON branch FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON department FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON cost_centre FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON profit_centre FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON fiscal_year FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON accounting_period FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON exchange_rate FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON warehouse FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON warehouse_location FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON naming_series FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON global_default FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON company_default FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON terms_and_conditions FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON letterhead FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON email_template FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON print_template FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON feature_flag FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON user_profile FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON role_profile FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON role_profile_role FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON user_role FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON user_group FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON user_group_member FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON user_permission FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON permission_rule FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON approval_limit FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON login_audit FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON session_audit FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON audit_log FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON field_change_log FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON workflow FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON workflow_state FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON workflow_transition FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON workflow_action_log FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON notification_rule FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON notification_log FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON notification_preference FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON comment FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON assignment FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON todo FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON follower FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON document_share FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON tag FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON document_tag FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON attachment FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON custom_field FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON api_key FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON webhook FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON webhook_log FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_policy ON integration_log FOR ALL USING (tenant_id = get_current_tenant_id());

-- =============================================================================
-- SECTION 7: TRIGGERS (AUDIT IMMUTABILITY & UPDATED_AT TIMESTAMP)
-- =============================================================================

-- 7.1 Append-Only Audit & Activity Ledger Immutability Triggers
DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON audit_log;
CREATE TRIGGER trg_prevent_audit_log_modification
    BEFORE UPDATE OR DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS trg_prevent_field_change_log_modification ON field_change_log;
CREATE TRIGGER trg_prevent_field_change_log_modification
    BEFORE UPDATE OR DELETE ON field_change_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

DROP TRIGGER IF EXISTS trg_prevent_workflow_action_log_modification ON workflow_action_log;
CREATE TRIGGER trg_prevent_workflow_action_log_modification
    BEFORE UPDATE OR DELETE ON workflow_action_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- 7.2 Updated_at Automatic Timestamp Triggers

DROP TRIGGER IF EXISTS trg_tenant_updated_at ON tenant;
CREATE TRIGGER trg_tenant_updated_at
    BEFORE UPDATE ON tenant
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_company_updated_at ON company;
CREATE TRIGGER trg_company_updated_at
    BEFORE UPDATE ON company
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_branch_updated_at ON branch;
CREATE TRIGGER trg_branch_updated_at
    BEFORE UPDATE ON branch
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_department_updated_at ON department;
CREATE TRIGGER trg_department_updated_at
    BEFORE UPDATE ON department
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_cost_centre_updated_at ON cost_centre;
CREATE TRIGGER trg_cost_centre_updated_at
    BEFORE UPDATE ON cost_centre
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profit_centre_updated_at ON profit_centre;
CREATE TRIGGER trg_profit_centre_updated_at
    BEFORE UPDATE ON profit_centre
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_fiscal_year_updated_at ON fiscal_year;
CREATE TRIGGER trg_fiscal_year_updated_at
    BEFORE UPDATE ON fiscal_year
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_accounting_period_updated_at ON accounting_period;
CREATE TRIGGER trg_accounting_period_updated_at
    BEFORE UPDATE ON accounting_period
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_currency_updated_at ON currency;
CREATE TRIGGER trg_currency_updated_at
    BEFORE UPDATE ON currency
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_exchange_rate_updated_at ON exchange_rate;
CREATE TRIGGER trg_exchange_rate_updated_at
    BEFORE UPDATE ON exchange_rate
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_country_updated_at ON country;
CREATE TRIGGER trg_country_updated_at
    BEFORE UPDATE ON country
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_state_province_updated_at ON state_province;
CREATE TRIGGER trg_state_province_updated_at
    BEFORE UPDATE ON state_province
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_warehouse_updated_at ON warehouse;
CREATE TRIGGER trg_warehouse_updated_at
    BEFORE UPDATE ON warehouse
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_warehouse_location_updated_at ON warehouse_location;
CREATE TRIGGER trg_warehouse_location_updated_at
    BEFORE UPDATE ON warehouse_location
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_naming_series_updated_at ON naming_series;
CREATE TRIGGER trg_naming_series_updated_at
    BEFORE UPDATE ON naming_series
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_global_default_updated_at ON global_default;
CREATE TRIGGER trg_global_default_updated_at
    BEFORE UPDATE ON global_default
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_company_default_updated_at ON company_default;
CREATE TRIGGER trg_company_default_updated_at
    BEFORE UPDATE ON company_default
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_terms_and_conditions_updated_at ON terms_and_conditions;
CREATE TRIGGER trg_terms_and_conditions_updated_at
    BEFORE UPDATE ON terms_and_conditions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_letterhead_updated_at ON letterhead;
CREATE TRIGGER trg_letterhead_updated_at
    BEFORE UPDATE ON letterhead
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_email_template_updated_at ON email_template;
CREATE TRIGGER trg_email_template_updated_at
    BEFORE UPDATE ON email_template
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_print_template_updated_at ON print_template;
CREATE TRIGGER trg_print_template_updated_at
    BEFORE UPDATE ON print_template
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_feature_flag_updated_at ON feature_flag;
CREATE TRIGGER trg_feature_flag_updated_at
    BEFORE UPDATE ON feature_flag
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_module_activation_updated_at ON module_activation;
CREATE TRIGGER trg_module_activation_updated_at
    BEFORE UPDATE ON module_activation
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_profile_updated_at ON user_profile;
CREATE TRIGGER trg_user_profile_updated_at
    BEFORE UPDATE ON user_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_role_updated_at ON role;
CREATE TRIGGER trg_role_updated_at
    BEFORE UPDATE ON role
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_role_profile_updated_at ON role_profile;
CREATE TRIGGER trg_role_profile_updated_at
    BEFORE UPDATE ON role_profile
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_role_profile_role_updated_at ON role_profile_role;
CREATE TRIGGER trg_role_profile_role_updated_at
    BEFORE UPDATE ON role_profile_role
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_role_updated_at ON user_role;
CREATE TRIGGER trg_user_role_updated_at
    BEFORE UPDATE ON user_role
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_group_updated_at ON user_group;
CREATE TRIGGER trg_user_group_updated_at
    BEFORE UPDATE ON user_group
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_group_member_updated_at ON user_group_member;
CREATE TRIGGER trg_user_group_member_updated_at
    BEFORE UPDATE ON user_group_member
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_permission_updated_at ON user_permission;
CREATE TRIGGER trg_user_permission_updated_at
    BEFORE UPDATE ON user_permission
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_permission_rule_updated_at ON permission_rule;
CREATE TRIGGER trg_permission_rule_updated_at
    BEFORE UPDATE ON permission_rule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_approval_limit_updated_at ON approval_limit;
CREATE TRIGGER trg_approval_limit_updated_at
    BEFORE UPDATE ON approval_limit
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_login_audit_updated_at ON login_audit;
CREATE TRIGGER trg_login_audit_updated_at
    BEFORE UPDATE ON login_audit
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_session_audit_updated_at ON session_audit;
CREATE TRIGGER trg_session_audit_updated_at
    BEFORE UPDATE ON session_audit
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_workflow_updated_at ON workflow;
CREATE TRIGGER trg_workflow_updated_at
    BEFORE UPDATE ON workflow
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_workflow_state_updated_at ON workflow_state;
CREATE TRIGGER trg_workflow_state_updated_at
    BEFORE UPDATE ON workflow_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_workflow_transition_updated_at ON workflow_transition;
CREATE TRIGGER trg_workflow_transition_updated_at
    BEFORE UPDATE ON workflow_transition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_notification_rule_updated_at ON notification_rule;
CREATE TRIGGER trg_notification_rule_updated_at
    BEFORE UPDATE ON notification_rule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_notification_log_updated_at ON notification_log;
CREATE TRIGGER trg_notification_log_updated_at
    BEFORE UPDATE ON notification_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_notification_preference_updated_at ON notification_preference;
CREATE TRIGGER trg_notification_preference_updated_at
    BEFORE UPDATE ON notification_preference
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_comment_updated_at ON comment;
CREATE TRIGGER trg_comment_updated_at
    BEFORE UPDATE ON comment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_assignment_updated_at ON assignment;
CREATE TRIGGER trg_assignment_updated_at
    BEFORE UPDATE ON assignment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_todo_updated_at ON todo;
CREATE TRIGGER trg_todo_updated_at
    BEFORE UPDATE ON todo
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_follower_updated_at ON follower;
CREATE TRIGGER trg_follower_updated_at
    BEFORE UPDATE ON follower
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_document_share_updated_at ON document_share;
CREATE TRIGGER trg_document_share_updated_at
    BEFORE UPDATE ON document_share
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tag_updated_at ON tag;
CREATE TRIGGER trg_tag_updated_at
    BEFORE UPDATE ON tag
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_document_tag_updated_at ON document_tag;
CREATE TRIGGER trg_document_tag_updated_at
    BEFORE UPDATE ON document_tag
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_attachment_updated_at ON attachment;
CREATE TRIGGER trg_attachment_updated_at
    BEFORE UPDATE ON attachment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_custom_field_updated_at ON custom_field;
CREATE TRIGGER trg_custom_field_updated_at
    BEFORE UPDATE ON custom_field
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_api_key_updated_at ON api_key;
CREATE TRIGGER trg_api_key_updated_at
    BEFORE UPDATE ON api_key
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_webhook_updated_at ON webhook;
CREATE TRIGGER trg_webhook_updated_at
    BEFORE UPDATE ON webhook
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_webhook_log_updated_at ON webhook_log;
CREATE TRIGGER trg_webhook_log_updated_at
    BEFORE UPDATE ON webhook_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_integration_log_updated_at ON integration_log;
CREATE TRIGGER trg_integration_log_updated_at
    BEFORE UPDATE ON integration_log
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SECTION 8: CANONICAL BASELINE SEED DATA
-- =============================================================================

-- Temporarily configure seed context
SELECT set_tenant_context('00000000-0000-0000-0000-000000000000'::uuid);

-- 8.1 System Template Tenant
INSERT INTO tenant (
    id,
    name,
    subdomain,
    status,
    edition,
    primary_contact_email,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'System Organization',
    'system',
    'active',
    'enterprise',
    'admin@vyaparsuite.local',
    '{"is_system": true, "description": "Global master template tenant for baseline system seeds"}'::jsonb
) ON CONFLICT (subdomain) DO NOTHING;

-- 8.2 Baseline Country: India
INSERT INTO country (
    id,
    tenant_id,
    country_name,
    country_code,
    iso_alpha3,
    currency_code,
    calling_code
) VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'India',
    'IN',
    'IND',
    'INR',
    '+91'
) ON CONFLICT (tenant_id, country_code) DO NOTHING;

-- 8.3 Indian States & Union Territories (28 States + 8 UTs with official 2-digit GST state codes)
INSERT INTO state_province (
    tenant_id,
    country_code,
    state_name,
    state_code,
    gst_state_code,
    is_union_territory
) VALUES
-- 28 States
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Himachal Pradesh', 'HP', '02', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Punjab', 'PB', '03', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Uttarakhand', 'UK', '05', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Haryana', 'HR', '06', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Rajasthan', 'RJ', '08', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Uttar Pradesh', 'UP', '09', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Bihar', 'BR', '10', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Sikkim', 'SK', '11', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Arunachal Pradesh', 'AR', '12', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Nagaland', 'NL', '13', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Manipur', 'MN', '14', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Mizoram', 'MZ', '15', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Tripura', 'TR', '16', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Meghalaya', 'ML', '17', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Assam', 'AS', '18', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'West Bengal', 'WB', '19', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Jharkhand', 'JH', '20', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Odisha', 'OD', '21', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Chhattisgarh', 'CG', '22', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Madhya Pradesh', 'MP', '23', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Gujarat', 'GJ', '24', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Maharashtra', 'MH', '27', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Karnataka', 'KA', '29', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Goa', 'GA', '30', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Kerala', 'KL', '32', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Tamil Nadu', 'TN', '33', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Telangana', 'TS', '36', false),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Andhra Pradesh', 'AP', '37', false),

-- 8 Union Territories
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Jammu and Kashmir', 'JK', '01', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Chandigarh', 'CH', '04', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Dadra and Nagar Haveli and Daman and Diu', 'DH', '26', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Delhi', 'DL', '07', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Ladakh', 'LA', '38', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Lakshadweep', 'LD', '31', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Puducherry', 'PY', '34', true),
('00000000-0000-0000-0000-000000000000'::uuid, 'IN', 'Andaman and Nicobar Islands', 'AN', '35', true)
ON CONFLICT (tenant_id, country_code, state_code) DO NOTHING;

-- 8.4 Major Currencies
INSERT INTO currency (
    tenant_id,
    currency_code,
    currency_name,
    symbol,
    fraction,
    fraction_units,
    smallest_currency_fraction_value,
    symbol_on_right,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'INR', 'Indian Rupee', '₹', 'Paisa', 100, 0.010000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'USD', 'US Dollar', '$', 'Cent', 100, 0.010000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'EUR', 'Euro', '€', 'Cent', 100, 0.010000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'GBP', 'British Pound', '£', 'Penny', 100, 0.010000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'AED', 'UAE Dirham', 'د.إ', 'Fils', 100, 0.010000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'SGD', 'Singapore Dollar', 'S$', 'Cent', 100, 0.010000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'JPY', 'Japanese Yen', '¥', 'Sen', 1, 1.000000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'AUD', 'Australian Dollar', 'A$', 'Cent', 100, 0.010000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'CAD', 'Canadian Dollar', 'C$', 'Cent', 100, 0.010000, false, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'CHF', 'Swiss Franc', 'CHF', 'Rappen', 100, 0.010000, false, true)
ON CONFLICT (tenant_id, currency_code) DO NOTHING;

-- 8.5 25 Standard Default ERP Roles
INSERT INTO role (
    tenant_id,
    role_name,
    description,
    is_system,
    is_active
) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'Platform Owner', 'Root platform administrator with full global operational access and multi-tenant provisioning rights.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Org Owner', 'Primary organization owner with authority over tenant subscriptions, billing, and entity creation.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'System Admin', 'System and IT administrator managing security configurations, integrations, and user provisioning.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Company Admin', 'Company administrator overseeing company masters, branch settings, fiscal calendars, and defaults.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Finance Manager', 'Finance department lead approving journal entries, bank reconciliations, and financial closings.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Accountant', 'Operational accountant managing AP/AR invoicing, voucher entries, and vendor bill bookings.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Auditor', 'Compliance auditor with strict read-only access to all financial records, audit logs, and tax filings.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Sales Manager', 'Commercial head approving sales orders, price exceptions, discount rules, and customer credit limits.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Sales User', 'Sales executive generating quotations, managing CRM opportunities, and booking customer orders.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Purchase Manager', 'Procurement lead managing vendor evaluations, purchase agreements, and RFQ authorizations.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Purchase User', 'Buyer executing material requisitions, purchase orders, and supplier communications.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Inventory Manager', 'Logistics director overseeing multi-warehouse stock balances, valuation policies, and reconciliations.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Warehouse User', 'Storekeeper executing goods receipts, material dispatches, bin transfers, and pick-pack-ship operations.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Manufacturing Manager', 'Plant manager scheduling production runs, maintaining Bills of Materials, and supervising work centers.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Production User', 'Shop floor technician executing job cards, logging workstation hours, and recording scrap.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Quality Manager', 'Quality assurance director formulating inspection templates, approving deviations, and managing CAPA.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Quality Inspector', 'Inspector testing inward raw materials, in-process production, and final pre-dispatch shipments.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Project Manager', 'Project director tracking Work Breakdown Structures, milestones, project budgets, and timesheets.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'HR Manager', 'People operations head managing organizational hierarchy, employee records, and HR policies.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Payroll Manager', 'Payroll administrator computing monthly payroll runs, statutory deductions, and disbursement batches.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Support Manager', 'Customer service manager governing SLA rules, support queues, and customer satisfaction metrics.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Support User', 'Helpdesk support agent handling customer inquiries, ticket troubleshooting, and knowledge base updates.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'POS Manager', 'Retail branch supervisor overseeing cashier shifts, price overrides, and daily store closings.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'POS Cashier', 'Point of sale cashier processing counter sales, scanning items, and accepting split tender payments.', true, true),
('00000000-0000-0000-0000-000000000000'::uuid, 'Read-Only User', 'General stakeholder with read-only access to standard dashboards and analytical reports.', true, true)
ON CONFLICT (tenant_id, role_name) DO NOTHING;

-- 8.6 Initial Module Activations for all 22 System Modules
INSERT INTO module_activation (
    tenant_id,
    module_key,
    is_active,
    activated_at,
    configuration
) VALUES
('00000000-0000-0000-0000-000000000000'::uuid, 'setup', true, clock_timestamp(), '{"module_name": "Setup & Master Data", "tier": 0, "is_core": true}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'iam', true, clock_timestamp(), '{"module_name": "Identity, Access & Security", "tier": 0, "is_core": true}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'crm', true, clock_timestamp(), '{"module_name": "CRM & Lead Management", "tier": 2, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'sales', true, clock_timestamp(), '{"module_name": "Sales & Order Management", "tier": 2, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'procure', true, clock_timestamp(), '{"module_name": "Procurement & Vendor Management", "tier": 2, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'inventory', true, clock_timestamp(), '{"module_name": "Inventory & Warehouse Management", "tier": 2, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'accounting', true, clock_timestamp(), '{"module_name": "Financial Accounting & General Ledger", "tier": 2, "is_core": true}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'compliance', true, clock_timestamp(), '{"module_name": "India Statutory Compliance & Tax Engine", "tier": 3, "is_core": true}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'pos', true, clock_timestamp(), '{"module_name": "Point of Sale (POS)", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'mfg', true, clock_timestamp(), '{"module_name": "Manufacturing & Production", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'quality', true, clock_timestamp(), '{"module_name": "Quality Management", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'assets', true, clock_timestamp(), '{"module_name": "Fixed Asset Management & Depreciation", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'projects', true, clock_timestamp(), '{"module_name": "Project Management & Job Costing", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'hrms', true, clock_timestamp(), '{"module_name": "Human Resource Management (HRMS)", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'payroll', true, clock_timestamp(), '{"module_name": "Payroll & Statutory Remittances", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'support', true, clock_timestamp(), '{"module_name": "Customer Support & Helpdesk", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'ecom', true, clock_timestamp(), '{"module_name": "Website & E-Commerce Storefront", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'marketing', true, clock_timestamp(), '{"module_name": "Marketing Automation & Campaigns", "tier": 4, "is_core": false}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'workflow', true, clock_timestamp(), '{"module_name": "Workflow & Approval Engine", "tier": 1, "is_core": true}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'reporting', true, clock_timestamp(), '{"module_name": "Reporting & Business Intelligence", "tier": 5, "is_core": true}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'lowcode', true, clock_timestamp(), '{"module_name": "Low-Code Customization & Studio", "tier": 5, "is_core": true}'::jsonb),
('00000000-0000-0000-0000-000000000000'::uuid, 'api', true, clock_timestamp(), '{"module_name": "API Platform & Integrations", "tier": 5, "is_core": true}'::jsonb)
ON CONFLICT (tenant_id, module_key) DO NOTHING;

-- Reset tenant context
SELECT set_tenant_context(NULL);
