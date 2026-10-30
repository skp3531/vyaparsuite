# VyaparSuite ERP — Complete Feature Inventory & Implementation Tracker

> **Platform**: VyaparSuite ERP (Next-Generation Enterprise ERP for Indian MSMEs & Global Business)
> **Architecture**: Next.js 15 (TypeScript, App Router, Server Actions), Tailwind CSS, Shadcn UI, Supabase (PostgreSQL 16, Auth, Row-Level Security, Storage, Realtime), Redis Caching, Vercel / Docker Infrastructure
> **Document Version**: 1.0.0 | **Last Updated**: October 2026 | **Total Modules**: 22 | **Total Features Tracked**: 702

---

## 1. Executive Summary & Architecture Overview

VyaparSuite is an enterprise-grade, cloud-native ERP platform architected to combine the modular depth of ERPNext and Odoo with the speed, developer ergonomics, and reactive user experience of modern web technology stacks (Next.js, Tailwind CSS, Supabase PostgreSQL).

The platform is engineered specifically to address the unique complexities of **Indian MSMEs**—including multi-tier GST compliance, E-Invoicing (NIC), E-Way Bills, Section 43B(h) MSME payment compliance, Indian payroll regulations (PF, ESIC, PT, TDS)—while retaining complete architectural elasticity for international multi-company, multi-currency, and multi-jurisdiction operations.

### Implementation Status Schema
Every feature across all 22 modules is tracked against a standardized 8-stage lifecycle status:

| Status | Definition | Acceptance Gate |
| :--- | :--- | :--- |
| **Not Started** | Feature scoped and cataloged in the inventory | Backlog candidate |
| **Analysed** | Business requirements, domain rules, edge cases, and compliance laws analyzed | PRD / Technical Spec complete |
| **Designed** | Schema, PostgreSQL RLS policies, Zod validation, and UI wireframes finalized | Architecture & UI sign-off |
| **Partially Implemented** | Database migrations applied, partial server actions / UI components constructed | In-progress PR |
| **Implemented** | End-to-end functionality built (schema, server actions/API, dynamic UI form/list) | Code complete & merged to staging |
| **Tested** | Unit, integration, automated E2E tests, and statutory compliance checks pass | QA verification sign-off |
| **Production Ready** | Hardened, audited, performance-optimized, telemetry active, user docs complete | Approved for production release |
| **Blocked** | Development paused due to external API dependency, compliance clarification, etc. | Impediment logged in Notes |

---

## 2. Global Inventory Metrics & Status Tracking Summary

### 2.1 Status Distribution

| Status | Count | Percentage |
| :--- | :--- | :--- |
| **Not Started** | 702 | 100.0% |
| **Analysed** | 0 | 0.0% |
| **Designed** | 0 | 0.0% |
| **Partially Implemented** | 0 | 0.0% |
| **Implemented** | 0 | 0.0% |
| **Tested** | 0 | 0.0% |
| **Production Ready** | 0 | 0.0% |
| **Blocked** | 0 | 0.0% |
| **Total Features** | **702** | **100.0%** |

### 2.2 Priority Breakdown

| Priority | Description | Count | Percentage |
| :--- | :--- | :--- | :--- |
| **Critical** | Core functionality required for MVP / statutory legal operations | 289 | 41.2% |
| **High** | Key commercial and operational features required for standard business operations | 314 | 44.7% |
| **Medium** | Operational enhancements, automation rules, and secondary integrations | 92 | 13.1% |
| **Low** | Quality-of-life improvements, advanced analytics, and specialized edge cases | 7 | 1.0% |

### 2.3 Phasing Breakdown

| Phase | Target Scope | Focus Modules | Feature Count |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Foundation & Core Financial Spine | Core Platform, Setup, Identity, Sales, Procurement, Inventory, Accounting, India Compliance | 326 |
| **Phase 2** | Operations, HR & Retail Expansion | CRM, POS, Manufacturing, Quality, Assets, Projects, HRMS, Support, Web Store, Reporting, Customization | 331 |
| **Phase 3** | Advanced Enterprise & Integrations | Deep Manufacturing, EVM Projects, Advanced Quality, Marketing Drips, Cloud Connectors | 45 |
| **Phase 4** | Scale, AI Intelligence & Ecosystem | Global Multi-Region, AI Forecasting, Third-Party App Store Ecosystem | 0 |

---

## 3. Module Breakdown Summary

| Module # | Module Name | Code | Total Features | Critical | High | Medium | Target Phase | Baseline Status |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 01 | **Core Platform** | `CORE` | 52 | 18 | 24 | 8 | Phase 1 | Not Started |
| 02 | **Setup & Organization** | `SETUP` | 42 | 17 | 18 | 6 | Phase 1 | Not Started |
| 03 | **Identity & Security** | `SEC` | 42 | 19 | 16 | 7 | Phase 1 | Not Started |
| 04 | **UX & Design System** | `UX` | 32 | 10 | 17 | 5 | Phase 1 | Not Started |
| 05 | **CRM** | `CRM` | 32 | 7 | 16 | 9 | Phase 1 | Not Started |
| 06 | **Sales** | `SALES` | 42 | 10 | 25 | 7 | Phase 1 | Not Started |
| 07 | **Procurement** | `PROC` | 36 | 14 | 17 | 5 | Phase 1 | Not Started |
| 08 | **Inventory** | `INV` | 42 | 21 | 15 | 5 | Phase 1 | Not Started |
| 09 | **Accounting** | `ACC` | 52 | 29 | 21 | 2 | Phase 1 | Not Started |
| 10 | **India Compliance** | `GST` | 36 | 23 | 10 | 3 | Phase 1 | Not Started |
| 11 | **Point of Sale (POS)** | `POS` | 26 | 14 | 8 | 4 | Phase 2 | Not Started |
| 12 | **Manufacturing** | `MFG` | 32 | 15 | 14 | 3 | Phase 2 | Not Started |
| 13 | **Quality** | `QA` | 22 | 9 | 8 | 5 | Phase 2 | Not Started |
| 14 | **Assets** | `ASSET` | 22 | 10 | 9 | 3 | Phase 2 | Not Started |
| 15 | **Projects** | `PROJ` | 22 | 12 | 9 | 1 | Phase 2 | Not Started |
| 16 | **HRMS & Payroll** | `HR` | 46 | 22 | 20 | 4 | Phase 1 | Not Started |
| 17 | **Customer Support** | `SUPP` | 22 | 4 | 14 | 2 | Phase 2 | Not Started |
| 18 | **Website & E-commerce** | `WEB` | 22 | 7 | 10 | 5 | Phase 2 | Not Started |
| 19 | **Marketing** | `MKT` | 16 | 3 | 8 | 4 | Phase 2 | Not Started |
| 20 | **Reporting & Analytics** | `REP` | 26 | 11 | 14 | 1 | Phase 1 | Not Started |
| 21 | **API & Integrations** | `API` | 22 | 8 | 12 | 2 | Phase 1 | Not Started |
| 22 | **Low-Code Customization** | `CODE` | 16 | 6 | 9 | 1 | Phase 2 | Not Started |
| **TOTAL** | **22 Modules** | — | **702** | **289** | **314** | **92** | — | **Not Started** |

---

## 4. Exhaustive Feature Inventory by Module

### 1. Core Platform (`CORE`)

*Foundational architectural framework providing metadata-driven models, document lifecycle management, workflow orchestration, auditability, async processing, and communication backbones.*

**Total Features Tracked**: 52

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| CORE-001 | **Document Model & Metadata Framework** | DocType/Schema registry, typed field definitions, validation rules, relationship modeling, JSON schema auto-generation | Critical | Phase 1 | Not Started | TypeScript interfaces + Supabase PostgreSQL jsonb schema metadata table |
| CORE-002 | **Document Lifecycle State Machine** | Standard lifecycle states (Draft, Submitted, Cancelled, Amended, Deleted), state-locking, immutability on submit | Critical | Phase 1 | Not Started | Strict transition guards, preventing mutation of submitted documents |
| CORE-003 | **Dynamic Numbering Series Engine** | Prefix, suffix, fiscal year token, branch token, sequential counter, zero padding, hash hashing | Critical | Phase 1 | Not Started | Atomic counter increments in PostgreSQL using row-level locking or sequences |
| CORE-004 | **Multi-Tenant Data Isolation** | Row-Level Security (RLS) policies by tenant_id, schema-level multi-tenancy abstraction, tenant context propagation | Critical | Phase 1 | Not Started | Supabase RLS with JWT claim tenant_id enforcement on every query |
| CORE-005 | **Configurable Workflow Engine** | Visual state machine definition, state transitions, condition guards, role-based transitions, auto-actions | Critical | Phase 1 | Not Started | JSON-based workflow definitions parsed by Next.js server actions |
| CORE-006 | **Workflow Action & Approval Engine** | Approve, Reject, Request Clarification actions, multi-tier approvals, bypass conditions, approval logging | Critical | Phase 1 | Not Started | Integrated with Notification Engine for real-time manager alerts |
| CORE-007 | **Notification Rule Engine** | Trigger-based alerts (on-create, on-update, on-field-change, on-schedule, conditional expression) | High | Phase 1 | Not Started | PostgreSQL trigger / Supabase Realtime listeners notifying dispatcher |
| CORE-008 | **Multi-Channel Notification Dispatcher** | In-app push, Email, WhatsApp Business API, SMS, Webhook notifications, template rendering | High | Phase 1 | Not Started | Queue-backed worker processing alerts with retry strategy |
| CORE-009 | **In-App Real-time Notification Center** | Notification bell widget, read/unread states, action deep-links, browser notifications, sound alerts | Medium | Phase 1 | Not Started | Supabase Realtime WebSockets for instantaneous UI updates |
| CORE-010 | **Immutable System Audit Trail** | Universal change logging: modified fields, before/after values, user ID, IP address, user agent, timestamp | Critical | Phase 1 | Not Started | Dedicated append-only audit_logs table with PostgreSQL immutable triggers |
| CORE-011 | **Field-Level Version History & Diffs** | Visual version comparison, JSON diff engine, revision restore capability, change highlights | High | Phase 2 | Not Started | Deep diffing using jsondiffpatch or custom RFC 6902 JSON patch |
| CORE-012 | **Threaded Document Comments & Mentions** | Rich text comments, @user mentions, internal-only notes vs customer-visible comments, reply threads | Medium | Phase 1 | Not Started | Polymorphic relationship linking comments to any document entity |
| CORE-013 | **Universal Document Attachment Engine** | Supabase Storage integration, multi-file upload, drag-and-drop, MIME validation, thumbnail generation | High | Phase 1 | Not Started | Secure signed URLs with automatic virus scanning hook |
| CORE-014 | **Unified Activity Timeline** | Chronological stream aggregating status changes, comments, attachments, emails, workflow approvals | High | Phase 1 | Not Started | Integrated right-rail component on all standard form views |
| CORE-015 | **Dynamic Custom Fields Framework** | Zero-code custom fields (Text, Number, Date, Select, Checkbox, Link, Currency), jsonb storage fallback | Critical | Phase 2 | Not Started | Virtual fields merged seamlessly into document React forms |
| CORE-016 | **Dynamic Form Layout Engine** | Visual form layout builder, sections, columns, tabs, collapsible blocks, conditional visibility rules | High | Phase 2 | Not Started | React Hook Form + Tailwind CSS grid rendering schema JSON |
| CORE-017 | **Print Format Template Engine** | Handlebars/Liquid/React-to-PDF template engine, custom letterheads, CSS styling, multi-page layout | Critical | Phase 1 | Not Started | Headless Chromium / Puppeteer PDF generation or client-side print stylesheets |
| CORE-018 | **Email Template Builder** | Visual MJML/HTML email editor, dynamic variable substitution ({{doc.name}}), conditional logic | High | Phase 1 | Not Started | Standard templates for Invoices, POs, Quotations, Password Reset |
| CORE-019 | **Asynchronous Background Job Queue** | PostgreSQL/PgBoss or Redis/BullMQ job queue, priority queuing, concurrency limits, worker orchestration | Critical | Phase 1 | Not Started | Handles report generation, batch emails, heavy calculations off the main thread |
| CORE-020 | **Scheduled Cron & Task Scheduler** | Cron expression scheduler, recurring maintenance tasks, period locks, automated reconciliations | High | Phase 1 | Not Started | Vercel Cron / Supabase pg_cron / background worker triggering endpoints |
| CORE-021 | **Event Pub/Sub & Domain Event Broker** | In-memory and persistent domain event dispatch (e.g. SalesInvoiceSubmitted -> StockDeducted) | Critical | Phase 1 | Not Started | Decouples core business modules using clean domain event handlers |
| CORE-022 | **Full-Text Search Engine** | PostgreSQL tsvector / GIN index full-text search, trigram matching for typo tolerance, relevance ranking | High | Phase 1 | Not Started | Cross-entity full text index table updated via triggers |
| CORE-023 | **Universal Command Palette (Cmd+K)** | Quick search modal across documents, navigation pages, recent records, quick action executions | High | Phase 1 | Not Started | cmdk React library integration with keyboard shortcuts |
| CORE-024 | **Universal Data Import Wizard** | CSV/XLSX file parsing, column auto-mapping, data validation, dry-run mode, batch insert with error logs | Critical | Phase 1 | Not Started | Stream-based parsing for 100k+ rows without memory overflow |
| CORE-025 | **Universal Data Export Engine** | Filtered export to CSV, Excel, JSON, PDF; field selection, respectful of user permissions | High | Phase 1 | Not Started | Streaming response to prevent server timeout on large datasets |
| CORE-026 | **RESTful API Framework** | Next.js Route Handlers, automatic CRUD endpoints for all DocTypes, pagination, filtering, OpenAPI 3.0 | Critical | Phase 1 | Not Started | Type-safe Zod schema validation on all inputs |
| CORE-027 | **Outgoing Webhooks Framework** | HTTP webhooks on DocType events, HMAC-SHA256 signatures, exponential backoff retries, delivery logs | High | Phase 2 | Not Started | Allows external integrations (Zapier, Make, custom apps) |
| CORE-028 | **Incoming Webhook Receiver Engine** | Configurable webhook endpoints, payload signature verification, automated action triggering | High | Phase 2 | Not Started | Payment gateway callbacks, courier status updates, CRM intake |
| CORE-029 | **Centralized Error Handling & RFC 7807 Format** | Standardized JSON error envelope, error codes, HTTP status mapping, user-friendly localized messages | Critical | Phase 1 | Not Started | Prevents internal stack trace leakage while providing actionable UI error banners |
| CORE-030 | **Structured Application Logging** | JSON-formatted structured logs (Pino), log levels, correlation request IDs, user context | High | Phase 1 | Not Started | Exportable to Axiom / Datadog / Logflare / Betterstack |
| CORE-031 | **Distributed Caching Layer** | Redis / Upstash KV caching for master configurations, permissions, exchange rates, invalidation tags | High | Phase 1 | Not Started | Next.js unstable_cache and redis-based query cache |
| CORE-032 | **Storage Provider Abstraction Layer** | Pluggable storage driver interface (Supabase Storage, AWS S3, Cloudflare R2, Local Disk) | High | Phase 1 | Not Started | Standardized adapter pattern for cloud independence |
| CORE-033 | **Dynamic Feature Flag System** | Tenant-level, role-level, and user-level feature toggles, percentage rollout, beta features | Medium | Phase 2 | Not Started | Controls phased module rollouts per organization |
| CORE-034 | **Soft Deletes & Trash Bin Management** | Logical deletion (deleted_at), trash can view, restore document, permanent purge after 30 days | High | Phase 1 | Not Started | Guards foreign key constraints and prevents accidental data destruction |
| CORE-035 | **System Health Check & Telemetry** | Liveness, readiness probes (/api/health), database connection pool stats, cache latency | Medium | Phase 1 | Not Started | Standard health endpoints for container/platform monitoring |
| CORE-036 | **Universal Tagging Engine** | Custom color-coded tags, tag autocomplete, cross-entity tag filtering, bulk tagging | Medium | Phase 2 | Not Started | Polymorphic tag_associations table |
| CORE-037 | **Universal Bookmarks & Favorites** | User-specific star/favorite toggle on any record, pinned records drawer in sidebar | Low | Phase 2 | Not Started | Fast client-side cache synced to user preferences table |
| CORE-038 | **Auto-Save & Form Draft Recovery** | Local storage fallback, background auto-save to draft state every 30 seconds, unsaved changes alert | Medium | Phase 2 | Not Started | Prevents user data loss during browser crashes or network drops |
| CORE-039 | **Document Clone & Deep Copy Engine** | Duplicate document with options to copy child tables, reset status to Draft, exclude specific fields | Medium | Phase 1 | Not Started | Speeds up data entry for repetitive orders/invoices |
| CORE-040 | **Duplicate Master Record Merging Engine** | Detect duplicate customers/suppliers/items, merge foreign keys, preserve audit history, archive merged | Medium | Phase 3 | Not Started | Complex transactional foreign key re-pointing with advisory locks |
| CORE-041 | **Bulk Batch Operations Engine** | Batch submit, cancel, amend, delete, print, status change on selected list view items | High | Phase 2 | Not Started | Background job queue execution for operations over 20 records |
| CORE-042 | **Data Sanitization & Injection Defense** | DOMPurify HTML sanitation, SQL injection protection via parameterized queries, Zod input boundary validation | Critical | Phase 1 | Not Started | Zero raw SQL string concatenation allowed across all repository layers |
| CORE-043 | **API Rate Limiting & Abuse Prevention** | Sliding window rate limiting per IP / API key / Tenant using Upstash Redis | High | Phase 1 | Not Started | Protects public APIs and login endpoints from brute force / DoS |
| CORE-044 | **Internationalization (i18n) Framework** | Key-value string dictionary, next-intl integration, dynamic locale switching, right-to-left layout prep | High | Phase 2 | Not Started | Initial support: English, Hindi, Tamil, Telugu, Marathi, Gujarati |
| CORE-045 | **Timezone Normalization & Display Engine** | Store all timestamps in UTC, automatic conversion to tenant/user preferred timezone, DST support | Critical | Phase 1 | Not Started | Handled at database query and client presentation layers |
| CORE-046 | **Multi-System Number Formatting Engine** | Indian numbering system (Lakhs, Crores - 1,00,00,000) and International numbering (Millions, Billions) | Critical | Phase 1 | Not Started | Configurable at company and user locale level |
| CORE-047 | **Universal Barcode & QR Code Engine** | Generate dynamic QR (UPI, E-Invoice, URL) and 1D Barcodes (Code128, EAN13) in SVG/PNG | High | Phase 1 | Not Started | Pure JS generation for print templates and mobile display |
| CORE-048 | **Global System Configuration Registry** | Key-value settings table with schema validation, hot-reloading without server restarts | High | Phase 1 | Not Started | Stores company-wide configuration toggles and integrations |
| CORE-049 | **Database Migration & Schema Manager** | Automated Supabase / Prisma / Drizzle migration tracker, rollbacks, seed scripts | Critical | Phase 1 | Not Started | Versioned SQL migration scripts in source control |
| CORE-050 | **Record Assignment & Auto-Routing Rules** | Assign records to users/teams based on rules (round-robin, value threshold, territory, availability) | High | Phase 2 | Not Started | Powers CRM lead distribution and support ticket allocation |
| CORE-051 | **User Feedback & Diagnostic Reporter** | In-app bug/feedback widget, automatic console error capture, screenshot attachment, session context | Low | Phase 3 | Not Started | Aids user support and continuous quality improvement |
| CORE-052 | **Tenant Backup & Portable Archive Exporter** | Automated daily database snapshots, on-demand full tenant data export in encrypted ZIP/JSON | High | Phase 3 | Not Started | Critical for enterprise compliance and business continuity |

---

### 2. Setup & Organization (`SETUP`)

*Enterprise organizational hierarchy, legal entities, multi-location structures, fiscal year governance, and master reference data.*

**Total Features Tracked**: 42

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| SETUP-001 | **Multi-Organization Hierarchy** | Holding companies, subsidiaries, branch legal entities, consolidation trees, ownership percentages | Critical | Phase 1 | Not Started | Supports complex corporate structures under a single tenant |
| SETUP-002 | **Company Legal Entity Profile** | Legal company name, trade name, CIN, PAN, GSTIN, registered office, incorporation date | Critical | Phase 1 | Not Started | Primary entity for all financial transactions and tax filings |
| SETUP-003 | **Multi-Branch Master Management** | Branch codes, operating locations, branch heads, local GSTIN bindings, independent numbering series | Critical | Phase 1 | Not Started | Essential for Indian businesses operating across multiple states/locations |
| SETUP-004 | **Department & Unit Hierarchy** | Hierarchical organizational tree, department heads (HOD), parent-child relationships, budget links | High | Phase 1 | Not Started | Used across HRMS, project management, and cost accounting |
| SETUP-005 | **Division & Business Unit Master** | Strategic business units (SBUs), product lines, operating segments for segment reporting | High | Phase 2 | Not Started | Enables segment-wise P&L and balance sheet reporting |
| SETUP-006 | **Cost Centre Tree Hierarchy** | Multi-level cost centre hierarchy, budget capping, distribution percentage rules, default cost centres | Critical | Phase 1 | Not Started | Required for expense attribution in all accounting entries |
| SETUP-007 | **Profit Centre Hierarchy** | Profit centre tree, revenue and margin attribution, business performance tracking | High | Phase 2 | Not Started | Enables divisional margin analysis |
| SETUP-008 | **Multi-Warehouse Master** | Transit, bonded, raw materials, WIP, finished goods, scrap, quarantine warehouses, warehouse managers | Critical | Phase 1 | Not Started | Hierarchical warehouse grouping per branch |
| SETUP-009 | **Warehouse Zone & Location Mapping** | Aisles, zones, cold-storage areas, hazard zones, loading docks, GPS coordinates | Medium | Phase 2 | Not Started | Aids pick-pack-ship and safety compliance |
| SETUP-010 | **Rack & Bin Level Management** | Rack, shelf, bin identifiers, volumetric capacity, weight limits, bin barcode labels | Medium | Phase 2 | Not Started | Granular warehouse inventory tracking |
| SETUP-011 | **Fiscal Year Management** | Indian standard April-March fiscal year, international calendar years, custom 12-month periods | Critical | Phase 1 | Not Started | Controls transaction date validation and GL opening/closing |
| SETUP-012 | **Accounting Period & Soft/Hard Locks** | Monthly/quarterly periods, soft close (manager override), hard close (freeze GL postings) | Critical | Phase 1 | Not Started | Prevents backdated entries after audit sign-off |
| SETUP-013 | **Currency Master & Formatting** | ISO 4217 currencies, symbols (₹, $, €, £), decimal precision, subunit naming (Paise, Cents) | Critical | Phase 1 | Not Started | Supports multi-currency transactions and conversions |
| SETUP-014 | **Real-time Exchange Rate Management** | Daily exchange rates, automated API sync (OpenExchangeRates/RBI), triangulated conversions, effective dates | High | Phase 1 | Not Started | Required for import/export transactions and forex revaluations |
| SETUP-015 | **Country & Jurisdiction Master** | ISO-3166 alpha-2/3 country codes, international calling codes, address formatting rules | High | Phase 1 | Not Started | Pre-populated global directory |
| SETUP-016 | **State & Union Territory Master** | Indian 2-digit GST state codes, Union Territory status flags, international state/province directory | Critical | Phase 1 | Not Started | Critical for GST Place of Supply (POS) logic |
| SETUP-017 | **Tax Jurisdiction Master** | Central, State, Municipal tax jurisdictions, cross-jurisdiction rules | High | Phase 1 | Not Started | Framework for dynamic tax rate resolution |
| SETUP-018 | **Language & Regional Locales** | Locale configuration, date formats (DD/MM/YYYY vs MM/DD/YYYY), calendar systems | Medium | Phase 2 | Not Started | Customizable per user and company |
| SETUP-019 | **Timezone & Working Calendar** | Standard company timezone, weekly off configurations (Sunday, alternate Saturdays), standard hours | High | Phase 1 | Not Started | Governs SLA timers, shift schedules, and timesheets |
| SETUP-020 | **Global System Defaults & Fallbacks** | Default company, currency, warehouse, price list, cost centre, tax account fallbacks | Critical | Phase 1 | Not Started | Eliminates repetitive data entry across forms |
| SETUP-021 | **Company-Specific Transaction Defaults** | Default payment terms, default letterhead, default terms and conditions per transaction DocType | High | Phase 1 | Not Started | Automates transaction creation per subsidiary |
| SETUP-022 | **Number Series Configuration Matrix** | Configurable series per DocType, company, branch, and fiscal year (e.g. SINV-BLR-2425-0001) | Critical | Phase 1 | Not Started | Mandatory for statutory GST sequential numbering compliance |
| SETUP-023 | **Standard Terms & Conditions Master** | Reusable legal boilerplate, quotation terms, PO terms, payment penalty terms, rich-text clauses | High | Phase 1 | Not Started | Appends formatted terms to outgoing PDF documents |
| SETUP-024 | **Letterhead & Document Branding Master** | Header/footer image uploads, HTML/CSS letterheads, branch-specific logos, authorized signatures | High | Phase 1 | Not Started | Generates branded external customer/supplier PDFs |
| SETUP-025 | **Standard Payment Terms Templates** | Net 30, Net 60, 50% Advance 50% Delivery, milestone schedules, early payment discounts | High | Phase 1 | Not Started | Auto-calculates due dates on sales and purchase documents |
| SETUP-026 | **Holiday List & Non-Working Days Master** | Public holidays, regional state holidays, optional/restricted holidays per branch location | High | Phase 1 | Not Started | Integrated with HRMS attendance and delivery date estimators |
| SETUP-027 | **Unit of Measure (UOM) Master** | Standard metric/imperial units (Nos, Kg, Tonne, Litre, Meter, Box, Hour), fractional allowances | Critical | Phase 1 | Not Started | Indian GST compliant UQC codes (e.g. KGS, NOS, BOX) |
| SETUP-028 | **UOM Conversion Factor Rules** | Item-specific and global conversion multipliers (e.g. 1 Box = 24 Nos, 1 Pallet = 40 Boxes) | Critical | Phase 1 | Not Started | Seamless conversion between purchase, stock, and sales UOMs |
| SETUP-029 | **Address Master & Geocoding** | Multiple billing/shipping addresses per entity, GPS latitude/longitude, postal PIN code validation | Critical | Phase 1 | Not Started | Polymorphic address linking for Companies, Customers, Suppliers |
| SETUP-030 | **Universal Contact Master** | Multi-contact bindings, designation, primary mobile, secondary phone, email, WhatsApp opt-in | Critical | Phase 1 | Not Started | Linked across CRM, Sales, and Procurement |
| SETUP-031 | **Bank Directory & IFSC Master** | All Indian scheduled banks, 11-character IFSC verification, MICR, SWIFT/BIC codes, branch addresses | High | Phase 1 | Not Started | Prevents NEFT/RTGS transaction failures |
| SETUP-032 | **Company Bank Account Master** | Current accounts, Cash Credit (CC) accounts, Overdraft (OD), bank GL account link, virtual account IDs | Critical | Phase 1 | Not Started | Foundation for cash management and bank reconciliation |
| SETUP-033 | **Opening Balance Entry Wizard** | Wizard for GL opening balances, stock opening valuation, pending customer/supplier invoices | Critical | Phase 1 | Not Started | Facilitates migration from legacy Tally/Zoho/QuickBooks |
| SETUP-034 | **Document Dynamic Naming Rules** | Expression-driven naming rules based on document fields (e.g. CUST/{customer_group}/{####}) | Medium | Phase 2 | Not Started | Provides human-readable identification of records |
| SETUP-035 | **Industry & Sector Classification Master** | National Industry Classification (NIC) codes, NAICS codes, business vertical categorization | Low | Phase 2 | Not Started | Used for market segmentation and statutory survey filings |
| SETUP-036 | **Shipping Rule & Freight Rate Matrix** | Weight-based, distance-based, and flat shipping charge rules, regional freight zones | Medium | Phase 2 | Not Started | Auto-calculates freight line items on orders and invoices |
| SETUP-037 | **System Email Account Configurations** | Company outbound SMTP, inbound IMAP sync, SES/Postmark/SendGrid API keys, DKIM/SPF verification | High | Phase 1 | Not Started | Powers all outgoing transaction emails |
| SETUP-038 | **Global Notification Gateway Settings** | SMS gateway (Fast2SMS/Gupshup) credentials, WhatsApp Cloud API tokens, webhook endpoints | High | Phase 1 | Not Started | Central configuration for communications |
| SETUP-039 | **Data Retention & Archival Policy Master** | Statutory Indian 8-year record retention policies, automated cold-storage archiving rules | Medium | Phase 3 | Not Started | Compliance with Indian Companies Act 2013 record keeping |
| SETUP-040 | **Statutory Registrations Master** | MSME Udyam registration, Shop & Establishment license, Factories Act license, FSSAI number, IEC | High | Phase 1 | Not Started | Ensures statutory numbers print on regulatory invoices |
| SETUP-041 | **Multi-Currency Revaluation Settings** | Unrealized gain/loss GL account bindings, automatic month-end exchange rate revaluation setup | High | Phase 2 | Not Started | Automates forex accounting under Ind AS 21 |
| SETUP-042 | **Setup Completion & Onboarding Checklist** | Interactive progress checklist for initial company launch, guided wizard with sample data seeding | High | Phase 1 | Not Started | Ensures new tenants complete mandatory setup steps |

---

### 3. Identity & Security (`SEC`)

*Enterprise authentication, role-based access control (RBAC), multi-factor security, organizational boundaries, and audit controls.*

**Total Features Tracked**: 42

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| SEC-001 | **User Account Provisioning & Life Cycle** | User creation, profile details, status (Active, Suspended, Deactivated), password policies, lockout rules | Critical | Phase 1 | Not Started | Supabase Auth integration with custom users metadata profile table |
| SEC-002 | **User Invitation & Onboarding Workflow** | Time-limited signed invite links, email invite dispatch, forced first-time password change | Critical | Phase 1 | Not Started | Secure onboarding without sending raw credentials |
| SEC-003 | **Self-Service Password Reset** | Anti-enumeration reset requests, cryptographically secure reset tokens, rate-limited email delivery | Critical | Phase 1 | Not Started | OWASP-compliant password reset flow |
| SEC-004 | **Multi-Factor Authentication (MFA/TOTP)** | TOTP authenticator app support (Google Authenticator, Microsoft Authenticator), recovery backup codes | Critical | Phase 1 | Not Started | Mandatory MFA enforcement option for admin and finance roles |
| SEC-005 | **Active Session Management & Remote Revocation** | View active sessions, device info, IP, last active timestamp, one-click remote session termination | High | Phase 1 | Not Started | Token invalidation in Redis and Supabase session store |
| SEC-006 | **Role 1: System Administrator** | Full root privileges, tenant settings, security policies, backup/restore, user management | Critical | Phase 1 | Not Started | Super-admin role for IT and platform owners |
| SEC-007 | **Role 2: Chief Financial Officer (CFO)** | Unrestricted financial reporting, fiscal period sign-off, high-value approval rights, budget overrides | Critical | Phase 1 | Not Started | Executive financial oversight |
| SEC-008 | **Role 3: Finance & Accounts Manager** | Full GL management, journal vouchers, bank reconciliation, tax return sign-off, ledger approvals | Critical | Phase 1 | Not Started | Daily accounting department head |
| SEC-009 | **Role 4: Accounts Payable (AP) Clerk** | Purchase invoice entry, vendor payment preparation, debit notes, vendor balance checks | High | Phase 1 | Not Started | Restricted from posting payments without manager approval |
| SEC-010 | **Role 5: Accounts Receivable (AR) Clerk** | Sales invoice generation, payment receipt logging, credit notes, customer aging follow-ups | High | Phase 1 | Not Started | Restricted from altering general ledger journals |
| SEC-011 | **Role 6: Sales Director / Head** | Sales targets, territory allocation, pricing policy overrides, global CRM pipeline visibility | High | Phase 1 | Not Started | Strategic commercial leadership |
| SEC-012 | **Role 7: Sales Manager** | Lead assignment, deal approvals, discount approval up to 15%, team quota tracking | High | Phase 1 | Not Started | Team-level commercial management |
| SEC-013 | **Role 8: Sales Representative / Executive** | Lead creation, opportunity tracking, quotation creation, own customer view only | Critical | Phase 1 | Not Started | Restricted to assigned records via RLS |
| SEC-014 | **Role 9: Procurement / Purchase Manager** | Purchase order authorization, supplier selection, contract rate approval, RFQ awards | Critical | Phase 1 | Not Started | Procurement authorization governance |
| SEC-015 | **Role 10: Purchase Officer / Buyer** | Material request creation, RFQ dispatch, supplier quote entry, draft PO generation | High | Phase 1 | Not Started | Daily purchasing operations |
| SEC-016 | **Role 11: Warehouse / Inventory Manager** | Stock reconciliation, inter-warehouse transfers, inventory adjustments, stock valuation audit | Critical | Phase 1 | Not Started | Warehouse operational authority |
| SEC-017 | **Role 12: Stock Keeper / Store Operator** | GRN receipt, stock issue logging, pick list fulfillment, physical count data entry | High | Phase 1 | Not Started | Restricted from adjusting item valuation or posting financial entries |
| SEC-018 | **Role 13: Production / Works Manager** | BOM authorization, work order scheduling, MRP execution, capacity planning approval | High | Phase 2 | Not Started | Shop floor and manufacturing management |
| SEC-019 | **Role 14: Production Supervisor** | Job card assignment, workstation uptime logging, scrap entry, shift logbook sign-off | High | Phase 2 | Not Started | Shift-level manufacturing control |
| SEC-020 | **Role 15: Quality Assurance (QA) Manager** | Inspection template approvals, CAPA approval, quarantine material disposition authority | High | Phase 2 | Not Started | Quality standards governance |
| SEC-021 | **Role 16: Quality Inspector** | Incoming inspection, in-process testing, final inspection logging, non-conformance flag | Medium | Phase 2 | Not Started | Technical inspection data logger |
| SEC-022 | **Role 17: HR & Payroll Manager** | Salary structure design, payroll processing, statutory compliance filing, appraisals | Critical | Phase 2 | Not Started | Full access to employee compensation and records |
| SEC-023 | **Role 18: HR Executive / Recruiter** | Job openings, candidate interviews, attendance regularization, leave tracking | High | Phase 2 | Not Started | Restricted from viewing payroll salary amounts |
| SEC-024 | **Role 19: Employee Self-Service (ESS)** | Personal profile, leave applications, own payslip download, expense claim submission | Critical | Phase 1 | Not Started | Strictly locked to own employee record |
| SEC-025 | **Role 20: Customer Support Manager** | SLA rules, escalation policies, support agent allocation, CSAT monitoring | Medium | Phase 2 | Not Started | Support operations oversight |
| SEC-026 | **Role 21: Customer Support Agent** | Ticket triaging, customer replies, knowledge base article authoring, issue resolution | Medium | Phase 2 | Not Started | Restricted from altering sales or accounting documents |
| SEC-027 | **Role 22: Project Manager** | Project planning, task assignment, milestone sign-off, timesheet approval, project billing | High | Phase 2 | Not Started | Project delivery management |
| SEC-028 | **Role 23: Project Team Member** | Task status update, daily timesheet logging, project issue reporting | Medium | Phase 2 | Not Started | Restricted to assigned project tasks |
| SEC-029 | **Role 24: POS Cashier** | Counter billing, cash drawer entry, shift end cash reconciliation, sales receipt printing | High | Phase 2 | Not Started | Restricted POS interface with disabled back-office navigation |
| SEC-030 | **Role 25: Statutory Auditor** | Read-only forensic access to all financial ledgers, invoices, vouchers, and audit trails | High | Phase 1 | Not Started | Read-only across all accounting tables |
| SEC-031 | **Role Profile Composite Bundler** | Combine multiple functional roles into a reusable job profile (e.g. 'Regional Branch Accountant') | Medium | Phase 2 | Not Started | Simplifies user onboarding across large teams |
| SEC-032 | **User Groups Hierarchy** | Departmental, regional, and cross-functional user groups for broadcast notifications and workflows | Medium | Phase 2 | Not Started | Supports group-based assignment |
| SEC-033 | **Company-Level Access Boundary Rules** | Enforce user record isolation to specific allowed companies in multi-company setups | Critical | Phase 1 | Not Started | PostgreSQL RLS filtering by user_allowed_companies |
| SEC-034 | **Branch-Level Security Scoping** | Restrict transaction visibility and creation to user's assigned branches | Critical | Phase 1 | Not Started | Multi-branch data boundary enforcement |
| SEC-035 | **Warehouse-Level Access Restrictions** | Restrict inventory operations to specifically authorized warehouses per user | High | Phase 1 | Not Started | Prevents unauthorized stock movement in remote depots |
| SEC-036 | **Granular Field-Level Permissions** | Field-specific Read, Edit, or Hidden permissions by Role (e.g. Hide Cost Price from Sales Rep) | Critical | Phase 2 | Not Started | Enforced at both GraphQL/REST API layer and UI component rendering |
| SEC-037 | **Action-Level Permissions Matrix** | Fine-grained Create, Read, Update, Delete, Submit, Cancel, Amend, Export, Print permissions per DocType | Critical | Phase 1 | Not Started | Centralized authorization middleware |
| SEC-038 | **Tiered Financial Approval Limits** | Spending / approval limit thresholds per user/role (e.g. POs > ₹5,00,000 require CFO approval) | Critical | Phase 1 | Not Started | Prevents unauthorized financial commitments |
| SEC-039 | **Temporary Authority Delegation** | Out-of-office delegation: delegate approval authority to peer with start/end validity dates | Medium | Phase 2 | Not Started | Automatic expiry and full delegation audit trail |
| SEC-040 | **Segregation of Duties (SoD) Engine** | Conflict-of-interest enforcement (Maker cannot be Checker; PO creator cannot approve PO) | Critical | Phase 2 | Not Started | Statutory internal audit control requirement |
| SEC-041 | **Forensic Security Event Logs** | Comprehensive log of authentication events, password changes, failed logins, privilege escalations | Critical | Phase 1 | Not Started | SIEM-compatible logging with IP, geolocation, and user agent |
| SEC-042 | **Enterprise SSO & OAuth2 Providers** | Single Sign-On with Google Workspace, Microsoft Entra ID (Azure AD), SAML 2.0, OpenID Connect | High | Phase 2 | Not Started | Supabase Auth Enterprise SSO integration |

---

### 4. UX & Design System (`UX`)

*Ergonomic, modern enterprise design system built with Next.js, Tailwind CSS, and Shadcn UI, supporting high-density operational workflows.*

**Total Features Tracked**: 32

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| UX-001 | **Workspace App Launcher** | Visual module grid, categorized icons, pinned quick-launch apps, recent modules history | High | Phase 1 | Not Started | Intuitive landing dashboard for multi-module ERP |
| UX-002 | **Ergonomic Collapsible Sidebar** | Multi-level hierarchical tree, collapsed icon-only mode, customizable favorites, badge count indicators | Critical | Phase 1 | Not Started | Smooth Tailwind CSS animations with persistent state in cookies |
| UX-003 | **Universal Command Palette (Cmd+K)** | Fuzzy search across navigation, active documents, create actions, recent records, keyboard shortcuts | Critical | Phase 1 | Not Started | cmdk implementation with keyboard accessibility (WAI-ARIA) |
| UX-004 | **Active Company Context Switcher** | Header dropdown with company logo, instant context switch without full page reload, state preservation | Critical | Phase 1 | Not Started | Sets global active_company_id in server session context |
| UX-005 | **Branch Context Selector** | Header branch selector, all-branches view vs single-branch filter, permission-aware branch list | High | Phase 1 | Not Started | Filters lists and sets default branch on newly created vouchers |
| UX-006 | **Fiscal Year Context Scope Indicator** | Header pill displaying active fiscal year, warning banner when viewing historical closed years | Medium | Phase 1 | Not Started | Prevents accidental transaction entry in closed periods |
| UX-007 | **Global Quick Create Floating Action** | One-click modal creation for Lead, Customer, Quotation, Sales Invoice, Task, Payment Receipt | High | Phase 1 | Not Started | Available from any screen to reduce operational latency |
| UX-008 | **Real-time In-App Notification Bell** | Interactive dropdown tray, visual unread badges, mark all as read, click-to-navigate action links | High | Phase 1 | Not Started | Supabase Realtime WebSockets push notification integration |
| UX-009 | **Executive KPI Dashboard View** | Customizable drag-and-drop metric tiles, real-time aggregate counters, trend sparklines | High | Phase 1 | Not Started | Responsive Grid layout with Lucide icons |
| UX-010 | **Advanced Data List View** | Paginated server-side table, column sort, column resize, row selection, sticky header | Critical | Phase 1 | Not Started | TanStack Table v8 with virtualized scrolling for 10,000+ rows |
| UX-011 | **Interactive Kanban Board View** | Visual columns by status/workflow state, drag-and-drop card transitions with optimistic UI updates | High | Phase 1 | Not Started | @hello-pangea/dnd or dnd-kit integration for CRM and Tasks |
| UX-012 | **Universal Calendar View** | Month, week, day, and agenda views; event color coding, drag-and-drop rescheduling | Medium | Phase 2 | Not Started | FullCalendar / custom date-fns grid for tasks, visits, deliveries |
| UX-013 | **Interactive Gantt Chart View** | Task hierarchy bars, milestone diamonds, dependency linking arrows, zoom scale (Day, Week, Month) | High | Phase 2 | Not Started | SVG-based interactive Gantt for Projects and Production |
| UX-014 | **Dynamic Pivot Table View** | Multi-dimensional grouping, drag-and-drop row/column dimensions, sum/count/average aggregators | High | Phase 2 | Not Started | Client-side aggregation engine for ad-hoc business intelligence |
| UX-015 | **Interactive Chart View** | Dynamic bar, line, pie, donut, area, and stacked charts built directly over filtered list data | High | Phase 1 | Not Started | Recharts / Chart.js integration with theme support |
| UX-016 | **Standard Document Form View** | Two-column responsive layout, sticky top action bar, status badge pill, tabbed sections | Critical | Phase 1 | Not Started | React Hook Form with automatic dirty state tracking |
| UX-017 | **Analytical SQL Report View** | Data grid for tabular reports, sticky summary totals row, export buttons, dynamic filter bar | High | Phase 1 | Not Started | Standard container for financial statements and stock ledgers |
| UX-018 | **Chronological Audit Timeline View** | Vertical activity timeline with avatars, relative time badges, system change diffs, user comments | High | Phase 1 | Not Started | Standard right-hand sidebar component across all master and transaction forms |
| UX-019 | **List Capability: Column Chooser & Ordering** | Modal to toggle column visibility, reorder columns via drag, save preference per user | High | Phase 1 | Not Started | Persisted to localStorage and user_preferences table |
| UX-020 | **List Capability: Multi-Condition Filter Builder** | Complex filter builder: Field + Operator (equals, contains, between, >, <) + Value, AND/OR logic | Critical | Phase 1 | Not Started | Translates visual conditions into optimized Supabase SQL queries |
| UX-021 | **List Capability: Saved Custom Views** | Save filter combinations, sort orders, and visible columns as named views (Public or Private) | High | Phase 1 | Not Started | Quick-access tabs at the top of list views |
| UX-022 | **List Capability: Batch Action Toolbar** | Floating toolbar appearing upon row selection: Bulk Edit, Bulk Submit, Bulk Delete, Bulk Print | High | Phase 1 | Not Started | Prevents repetitive individual document processing |
| UX-023 | **List Capability: Inline Quick-Edit Grid Mode** | Spreadsheet-like inline cell editing with keyboard arrow navigation, fast tab key advance | Medium | Phase 2 | Not Started | High-speed data entry mode for inventory and accounting clerks |
| UX-024 | **List Capability: Density & Width Customizer** | Compact, Normal, and Relaxed row density modes; draggable column width resizing | Medium | Phase 1 | Not Started | Optimizes screen real estate for dense financial data |
| UX-025 | **Form Capability: Real-time Zod Validation** | Field-level inline error messages, tab error counters, scroll-to-first-error on submit | Critical | Phase 1 | Not Started | Type-safe Zod schema validation on client and server |
| UX-026 | **Form Capability: Collapsible Dynamic Sections** | Collapsible section breaks, section descriptions, conditional visibility based on other field values | High | Phase 1 | Not Started | Keeps long transaction forms clean and manageable |
| UX-027 | **Form Capability: Dynamic Child Table Grid** | Editable item grid (e.g. Invoice line items), keyboard row insertion, drag-to-reorder rows, totals auto-sum | Critical | Phase 1 | Not Started | High-performance virtualized sub-form table |
| UX-028 | **Form Capability: Hover Link Preview Popover** | Hovering over customer/supplier/item link displays popover card with contact info or stock levels | Medium | Phase 2 | Not Started | Radix UI HoverCard component integration |
| UX-029 | **Form Capability: Sticky Workflow Action Header** | Sticky header maintaining Save, Submit, Cancel, Amend, Print actions visible during long scroll | Critical | Phase 1 | Not Started | Improves usability on extensive multi-item vouchers |
| UX-030 | **Form Capability: Keyboard Shortcut Accelerators** | Ctrl+S / Cmd+S to save, Ctrl+Enter to submit, Esc to close modals, Alt+N for new row | High | Phase 1 | Not Started | Accelerates repetitive enterprise data entry |
| UX-031 | **Adaptive Multi-Theme Engine** | Dark mode, light mode, system preference sync, high-contrast accessibility mode | High | Phase 1 | Not Started | Tailwind CSS dark class with next-themes provider |
| UX-032 | **Fully Responsive Mobile/Tablet Interface** | Adaptive navigation drawer, mobile bottom navigation bar, card-based mobile list views | Critical | Phase 1 | Not Started | Allows field sales, warehouse workers, and executives to operate on mobile devices |

---

### 5. CRM (`CRM`)

*Comprehensive customer relationship management, lead lifecycle tracking, omnichannel communications, sales pipeline, and rep performance.*

**Total Features Tracked**: 32

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| CRM-001 | **Lead Master & Intake Directory** | Lead capture, contact info, lead source, industry, organization name, initial inquiry notes | Critical | Phase 1 | Not Started | Centralized directory for all prospective business leads |
| CRM-002 | **Automated Lead Scoring Engine** | Score rules based on budget, company size, website visits, email opens, inquiry completeness | High | Phase 2 | Not Started | Prioritizes high-intent leads for sales reps |
| CRM-003 | **Lead Auto-Assignment & Round-Robin Routing** | Round-robin, territory-based, product-specialization, and rep workload distribution algorithms | High | Phase 2 | Not Started | Ensures zero lead leakage and immediate response times |
| CRM-004 | **Lead Qualification & One-Click Conversion** | One-click conversion into Customer Master, Contact Record, and Opportunity Deal | Critical | Phase 1 | Not Started | Carries forward all communication history and attachments |
| CRM-005 | **Opportunity Deal Management** | Deal value, expected closing date, probability percentage, sales stage, competitor involvement | Critical | Phase 1 | Not Started | Core entity for pipeline forecasting |
| CRM-006 | **Visual Multi-Stage Sales Pipeline** | Kanban deal board (Prospecting, Qualification, Proposal, Negotiation, Won, Lost), drag-to-progress | Critical | Phase 1 | Not Started | Visual pipeline with column totals and weighted values |
| CRM-007 | **Lost Deal Root Cause Analysis** | Mandatory lost reason tagging (Price, Feature Gap, Competitor, Budget Cancelled), competitor lost to | High | Phase 2 | Not Started | Feeds win/loss intelligence reports |
| CRM-008 | **Contact Directory & Relationship Tree** | Stakeholder profiles, department, seniority, decision-maker flag, phone, direct email | High | Phase 1 | Not Started | Multi-contact association per customer/prospect |
| CRM-009 | **Organization / Account Master** | Corporate accounts, parent-subsidiary linking, annual revenue, employee count, GSTIN, PAN | Critical | Phase 1 | Not Started | B2B account management entity |
| CRM-010 | **Customer 360-Degree Unified Dossier** | Consolidated dashboard showing open quotes, active orders, unpaid invoices, support tickets, ledger balance | Critical | Phase 1 | Not Started | Single pane of glass across CRM, Sales, and Accounting |
| CRM-011 | **Sales Activity & Task Management** | Phone calls, product demos, site visits, follow-up tasks, completion status, due dates | High | Phase 1 | Not Started | Integrated with user notification center |
| CRM-012 | **Meeting Scheduling & Calendar Sync** | Schedule meetings, generate Google Meet / Zoom links, two-way sync with Google/Outlook calendars | High | Phase 2 | Not Started | CalDAV / Google Calendar API integration |
| CRM-013 | **Omnichannel Interaction Logger** | Log incoming/outgoing emails, phone call notes, WhatsApp conversation snippets, site visit minutes | High | Phase 1 | Not Started | Permanent timestamped customer communication log |
| CRM-014 | **Marketing Campaign Master** | Campaign budget, actual spend, target segment, start/end dates, lead count, attributed revenue | Medium | Phase 2 | Not Started | Calculates campaign ROI and customer acquisition cost |
| CRM-015 | **Lead Source Attribution Tracking** | First-touch and last-touch attribution, UTM source, UTM campaign, referral URL capture | High | Phase 2 | Not Started | Automated extraction from inbound web forms |
| CRM-016 | **Territory & Geographic Hierarchy** | Country -> Region -> State -> City -> Sales Zone hierarchical mapping | High | Phase 2 | Not Started | Used for territory-based lead routing and sales quotas |
| CRM-017 | **Sales Team Structure Master** | Sales teams, team leaders, regional managers, rep allocations | Medium | Phase 2 | Not Started | Hierarchical sales management |
| CRM-018 | **Sales Target Allocation Engine** | Monthly/quarterly targets by sales rep, territory, and product category; target vs actual revenue | High | Phase 2 | Not Started | Real-time attainment tracking against invoiced sales |
| CRM-019 | **Sales Commission Plan & Rules** | Tiered percentage commission, threshold quotas, margin-based commission plans | Medium | Phase 3 | Not Started | Rules engine calculating rep payouts |
| CRM-020 | **Sales Commission Settlement Workflow** | Commission calculation based on invoice collection, manager approval, expense voucher generation | Medium | Phase 3 | Not Started | Integrates with Accounts Payable / Payroll |
| CRM-021 | **Quotation Generation from Opportunity** | One-click quote generation from deal items, carrying forward negotiated prices and terms | Critical | Phase 1 | Not Started | Bridges CRM directly into core Sales workflow |
| CRM-022 | **Competitor Intelligence Battlecards** | Competitor profiles, pricing comparisons, strengths, weaknesses, objection handling battlecards | Medium | Phase 3 | Not Started | Equips sales reps during active deal negotiations |
| CRM-023 | **Customer Health & Sentiment Scoring** | RFM (Recency, Frequency, Monetary) scoring, ticket sentiment analysis, customer health score | Medium | Phase 3 | Not Started | Proactive churn prediction algorithm |
| CRM-024 | **Prospect Deduplication & Merge Engine** | Fuzzy phone number and email matching, duplicate lead alerts, selective field merge wizard | High | Phase 2 | Not Started | Prevents sales rep collision and dirty CRM data |
| CRM-025 | **Targeted Prospect Email/SMS Broadcast** | Filtered audience selection, personalized template merge, scheduled broadcast dispatch | Medium | Phase 2 | Not Started | Includes mandatory unsubscribe handling |
| CRM-026 | **Sales Rep Beat Route & Daily Visit Planner** | Daily route schedule, client visit sequence, GPS geolocation check-in/out on mobile | Medium | Phase 3 | Not Started | Optimizes field sales productivity and verifies client visits |
| CRM-027 | **Sales Pipeline Velocity Analytics** | Average days per stage, pipeline conversion rate, velocity formula ($ Pipeline * Win Rate / Cycle Time) | High | Phase 2 | Not Started | Identifies deal stalling bottlenecks |
| CRM-028 | **Sales Revenue Forecasting Engine** | Commit, Best Case, Pipeline forecast categories; weighted probability revenue projection | High | Phase 2 | Not Started | Provides executive leadership with reliable forward visibility |
| CRM-029 | **Win / Loss Ratio & Trend Analytics** | Win/loss rates segmented by sales rep, territory, competitor, deal size, and lead source | High | Phase 2 | Not Started | Pinpoints competitive strengths and training needs |
| CRM-030 | **Customer Dormancy & Churn Warning Alerts** | Automated alerts when previously regular ordering customers have not placed an order in X days | High | Phase 2 | Not Started | Triggers retention outreach before permanent customer loss |
| CRM-031 | **Document & Proposal Versioning Repository** | Attach signed NDAs, client RFP specifications, technical proposals, contract revisions | Medium | Phase 1 | Not Started | Stores all deal collateral securely in cloud storage |
| CRM-032 | **Public Web-to-Lead Embeddable Form** | Embeddable iframe / React component for corporate website, captcha defense, auto-intake API | High | Phase 1 | Not Started | Directly pushes website form inquiries into Lead Master |

---

### 6. Sales (`SALES`)

*End-to-end commercial operations: quotes, proforma, sales orders, delivery fulfillment, billing, customer pricing rules, credit management, and self-service portals.*

**Total Features Tracked**: 42

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| SALES-001 | **Customer Master Directory** | B2B/B2C classification, GSTIN, PAN, credit limit, credit days, billing/shipping addresses, default currency | Critical | Phase 1 | Not Started | Primary customer record with strict unique identifier validations |
| SALES-002 | **Customer Group & Taxonomy Master** | Commercial customer segments (Retail, Wholesale, Distributor, Government, Institutional, Export) | High | Phase 1 | Not Started | Controls default pricing lists and payment terms |
| SALES-003 | **Sales Quotation / Estimate Management** | Version revision tracking, quotation validity dates, line discounts, customer terms, PDF dispatch | Critical | Phase 1 | Not Started | Formal commercial proposal document |
| SALES-004 | **Quotation-to-Order Conversion Workflow** | One-click conversion into Sales Order, automatic stock availability verification, pricing freeze | Critical | Phase 1 | Not Started | Prevents manual re-keying and pricing discrepancies |
| SALES-005 | **Proforma Invoice Generation** | Advance payment proforma invoices, bank account details for wire transfer, custom declarations | High | Phase 1 | Not Started | Crucial for advance payment requests and export customs |
| SALES-006 | **Sales Order (SO) Management** | Customer PO reference, promised delivery dates, order booking status, line-item schedule | Critical | Phase 1 | Not Started | Legally binding commitment triggering inventory reservation and production |
| SALES-007 | **Order Approval & Credit Limit Gate** | Automated hard/soft stop when order exceeds customer credit limit or has overdue invoices > 30 days | Critical | Phase 1 | Not Started | Enforces financial risk boundaries before order confirmation |
| SALES-008 | **Delivery Note / Goods Challan** | Dispatch challan, batch and serial number selection, shipping courier details, packing box counts | Critical | Phase 1 | Not Started | Transfers stock out of warehouse and reduces balance |
| SALES-009 | **Sales Invoice (Tax Invoice)** | Statutory GST tax invoice, SAC/HSN codes, CGST/SGST/IGST breakdown, TCS calculation, e-invoice QR | Critical | Phase 1 | Not Started | Core financial voucher updating customer receivables and revenue GL accounts |
| SALES-010 | **POS Sales Invoice Integration** | Instant cash/card sales invoice generated from Point of Sale register with direct stock deduction | High | Phase 2 | Not Started | Bypasses quote/order workflow for direct retail sales |
| SALES-011 | **Payment Request Generation** | Generate automated dynamic payment links (Razorpay, Stripe, UPI QR), embed links in email/WhatsApp | High | Phase 1 | Not Started | Automates digital collection workflows |
| SALES-012 | **Sales Payment Receipt Entry** | Direct receipt voucher, multi-invoice knocked-off allocation, advance payment allocation, TDS deduction | Critical | Phase 1 | Not Started | Reconciles customer outstanding ledger balances |
| SALES-013 | **Credit Note / Sales Return Processing** | GST-compliant credit note with mandatory original invoice reference, reason code, reverse GST liability | Critical | Phase 1 | Not Started | Reverses sales revenue and customer debt |
| SALES-014 | **Sales Return & Restocking Challan** | Physical receipt of returned merchandise, inspection quarantine, return to salable stock or scrap | High | Phase 1 | Not Started | Synchronizes physical warehouse return with stock ledger |
| SALES-015 | **Recurring Subscription & Contract Billing** | Automated recurring invoice generation (Monthly, Quarterly, Annual), auto-proration, renewal alerts | High | Phase 2 | Not Started | SaaS, AMC, and subscription service billing |
| SALES-016 | **Subscription Lifecycle Management** | Plan upgrade, downgrade, pause, cancellation, pro-rated credit adjustments, renewal reminders | High | Phase 2 | Not Started | Automated subscription status transitions |
| SALES-017 | **Blanket Sales Orders / Rate Contracts** | Annual volume commitment contracts, periodic drawdown release orders against blanket PO | Medium | Phase 2 | Not Started | Manages high-volume B2B contract commitments |
| SALES-018 | **Dynamic Pricing Rule Engine** | Volume tier pricing (Buy 100+ get ₹50/unit), customer-tier pricing, promotional period pricing | High | Phase 1 | Not Started | Automatically resolves net rate upon line item selection |
| SALES-019 | **Promotional Schemes & Discount Coupons** | Buy X Get Y Free (BOGO), basket-level percent discounts, coupon code validation and usage limits | Medium | Phase 2 | Not Started | Powers retail and promotional marketing campaigns |
| SALES-020 | **Customer Credit Exposure Monitoring** | Total exposure calculation: Outstanding AR + Unbilled Deliveries + Confirmed Sales Orders | Critical | Phase 1 | Not Started | Real-time risk evaluation engine |
| SALES-021 | **Credit Days & Grace Period Enforcer** | Grace period thresholds, automatic account suspension upon reaching maximum overdue days | High | Phase 1 | Not Started | Reduces Days Sales Outstanding (DSO) |
| SALES-022 | **Sales Commission Accounting** | Auto-calculate rep commission percentage upon invoice generation or payment collection, expense accrual | Medium | Phase 3 | Not Started | Integrated with General Ledger commission liability |
| SALES-023 | **Self-Service Customer Portal** | Customer login to view order status, download PDF tax invoices, track shipments, pay via gateway | High | Phase 2 | Not Started | Reduces customer service overhead |
| SALES-024 | **Multi-Currency Sales Transactions** | Transaction currency pricing, real-time exchange rate capture, base currency GL posting | High | Phase 1 | Not Started | Required for international export operations |
| SALES-025 | **Multi-Location Sales Fulfillment** | Fulfill single sales order across multiple branch warehouses depending on localized stock availability | High | Phase 2 | Not Started | Optimizes logistics freight and delivery turnaround |
| SALES-026 | **Drop-Shipping Order Processing** | Direct delivery from supplier to end-customer, sales order auto-generates drop-ship Purchase Order | Medium | Phase 2 | Not Started | Fulfills orders without physical warehouse handling |
| SALES-027 | **Backorder & Partial Fulfillment Management** | Partial deliveries against sales orders, automatic backorder balance tracking, notification upon restock | High | Phase 1 | Not Started | Manages inventory stockouts gracefully |
| SALES-028 | **Sales Margin & Line-Item Profitability** | Real-time display of Item Valuation Cost, Selling Price, and Gross Margin % on order entry screen | High | Phase 1 | Not Started | Empowers sales reps to negotiate within profit targets |
| SALES-029 | **Sales Packing Slip Generator** | Automated packing slip generation, box weights, dimensions, package barcode labels | High | Phase 1 | Not Started | Standard documentation for freight handlers |
| SALES-030 | **Shipping & Logistics Carrier Integration** | API hooks for Shiprocket, Delhivery, Bluedart, FedEx; instant AWB generation and tracking URL | High | Phase 2 | Not Started | Direct shipping label printing and live tracking |
| SALES-031 | **Proof of Delivery (POD) Tracking** | Record delivery timestamp, courier POD image upload, OTP/digital signature capture | Medium | Phase 2 | Not Started | Settles commercial disputes regarding shipment receipt |
| SALES-032 | **E-Commerce Order Sync Adapter** | Bi-directional sync with Shopify, WooCommerce, Amazon Marketplace for order import and status update | High | Phase 2 | Not Started | Automates multi-channel omnichannel fulfillment |
| SALES-033 | **Customer SKU / Part Number Mapping** | Cross-reference customer's internal SKU code with company's item code, print customer SKU on invoice | Medium | Phase 2 | Not Started | Essential for OEM and enterprise B2B customers |
| SALES-034 | **Sales Representative Performance Dashboard** | Real-time rep leaderboard: booked sales, collected revenue, average discount given, target attainment | High | Phase 2 | Not Started | Gamifies sales performance and transparency |
| SALES-035 | **Unbilled Deliveries Report** | Identify delivered goods (Delivery Notes) where Sales Invoices have not yet been raised | High | Phase 1 | Not Started | Prevents revenue leakage and delayed billing |
| SALES-036 | **Undelivered Invoices Report** | Identify invoices raised where goods have not yet been physically dispatched | High | Phase 1 | Not Started | Tracks physical fulfillment backlog |
| SALES-037 | **Sales Target vs Actual Analytics** | Dynamic variance reports comparing target quotas vs actual invoiced sales by month/quarter | High | Phase 2 | Not Started | Strategic commercial tracking |
| SALES-038 | **Export Sales Documentation** | Commercial Invoice, Packing List, Shipping Bill, Bill of Lading reference, Export LUT declaration | High | Phase 2 | Not Started | Mandatory documentation for zero-rated international export |
| SALES-039 | **High-Discount Financial Approval Matrix** | Auto-route quotations/orders exceeding standard discount thresholds to Sales Head / CFO | High | Phase 1 | Not Started | Protects corporate gross margins from unauthorized discounts |
| SALES-040 | **Customer Dunning & Automated Reminders** | Automated tiered reminders (Friendly, Due Soon, Overdue, Final Notice) via Email/WhatsApp | High | Phase 2 | Not Started | Accelerates collections without manual intervention |
| SALES-041 | **Sales Return Quality Quarantine Routing** | Returned goods routed automatically to QA Inspection warehouse before credit note approval | Medium | Phase 2 | Not Started | Verifies condition of goods before crediting customer |
| SALES-042 | **Order Cancellation & Refund Workflow** | Track cancellation root cause, reverse reserved inventory, process bank refund or credit ledger | High | Phase 1 | Not Started | Standard cancellation audit trail |

---

### 7. Procurement (`PROC`)

*Strategic sourcing and purchasing: requisitions, RFQs, vendor quotations, purchase orders, goods receipts (GRN), 3-way matching, landed cost, and vendor evaluations.*

**Total Features Tracked**: 36

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| PROC-001 | **Supplier / Vendor Master Directory** | Legal business name, trade name, GSTIN, PAN, MSME category, payment terms, bank IFSC/account details | Critical | Phase 1 | Not Started | Primary vendor entity with statutory compliance verification |
| PROC-002 | **Supplier Categorization Master** | Vendor groups (Raw Materials, Capital Goods, Services, Consumables, OEM, Subcontractors) | High | Phase 1 | Not Started | Controls default GL expense accounts and tax mappings |
| PROC-003 | **Material Request / Purchase Requisition** | Indent for stock replenishment, manufacturing job card demand, department consumables request | Critical | Phase 1 | Not Started | Internal demand initiation document |
| PROC-004 | **Requisition Approval Hierarchy** | Departmental approval, budget availability check, priority classification (Urgent, Normal) | High | Phase 1 | Not Started | Prevents unauthorized spend commitments |
| PROC-005 | **Request for Quotation (RFQ) Generation** | Multi-vendor RFQ broadcast, specifications, requested delivery dates, submission deadline | Critical | Phase 1 | Not Started | Solicits competitive quotes from approved suppliers |
| PROC-006 | **Supplier Quotation Submission Portal** | External vendor login to view RFQ specifications and enter unit prices, taxes, lead times | High | Phase 2 | Not Started | Eliminates manual quote data entry for purchasing agents |
| PROC-007 | **Supplier Quotation Comparison Matrix** | Side-by-side comparative table: pricing, freight, payment terms, delivery lead times, best quote highlight | Critical | Phase 1 | Not Started | Aids procurement committee in transparent awarding |
| PROC-008 | **Purchase Order (PO) Management** | PO terms, agreed line rates, delivery schedules, billing/shipping locations, legal terms | Critical | Phase 1 | Not Started | Legally binding commercial procurement contract |
| PROC-009 | **Blanket Purchase Orders / Annual Contracts** | Annual rate contracts with suppliers, pre-negotiated volume prices, scheduled release orders | High | Phase 2 | Not Started | Stabilizes raw material procurement prices over the year |
| PROC-010 | **PO Multi-Tier Approval Workflow** | Tiered financial authorization matrix (Buyer -> Procurement Head -> CFO -> CEO) | Critical | Phase 1 | Not Started | Strict monetary ceiling checks before PO dispatch |
| PROC-011 | **Goods Receipt Note (GRN) / Purchase Receipt** | Physical receipt of materials at warehouse dock, batch/serial assignment, packaging inspection | Critical | Phase 1 | Not Started | Increases physical inventory and creates unbilled GRN accrual |
| PROC-012 | **Purchase Return / Rejection Note** | Return defective or excess materials to vendor, generate rejection slip, link debit advice | Critical | Phase 1 | Not Started | Reduces warehouse stock balance and halts vendor invoice |
| PROC-013 | **Purchase Invoice Booking (Bill)** | Record supplier tax invoice, HSN/SAC, GST tax breakdown, payment due dates, TDS deduction | Critical | Phase 1 | Not Started | Books accounts payable liability and Input Tax Credit (ITC) |
| PROC-014 | **Automated Three-Way Matching Engine** | Match Purchase Order vs GRN vs Vendor Invoice (Price, Quantity, Tax tolerances); flag variances | Critical | Phase 1 | Not Started | Blocks invoice payment authorization on unapproved price/quantity discrepancies |
| PROC-015 | **Debit Note Generation** | GST-compliant debit note issued to vendor for price variance, quantity shortage, or defective return | Critical | Phase 1 | Not Started | Reduces vendor accounts payable balance and adjusts input GST |
| PROC-016 | **Landed Cost Allocation Voucher** | Allocate freight, customs duty, port handling, and insurance across received item valuation | Critical | Phase 1 | Not Started | Updates true cost of inventory using FIFO/Moving Average |
| PROC-017 | **Subcontracting / Job Work Purchase Order** | PO for outsourcing manufacturing operations, specify raw materials issued vs finished product received | High | Phase 2 | Not Started | Tracks company-owned inventory held at vendor premises |
| PROC-018 | **Subcontracted Goods Receipt Reconciliation** | Receive finished goods from job worker, auto-consume issued raw materials, record scrap | High | Phase 2 | Not Started | Maintains accurate multi-tier manufacturing stock balance |
| PROC-019 | **Supplier Performance Scorecard & Rating** | Automated rating based on On-Time In-Full (OTIF) delivery %, QA rejection rate, and pricing compliance | High | Phase 2 | Not Started | Informs future supplier allocation decisions |
| PROC-020 | **Supplier Onboarding & KYC Verification** | Vendor registration portal, GSTIN verification, MSME certificate upload, canceled cheque verification | High | Phase 2 | Not Started | Ensures statutory vendor compliance prior to first PO |
| PROC-021 | **Procurement Budgetary Control Engine** | Hard or soft budget capping per department and cost centre; warn or block PO creation upon budget breach | Critical | Phase 2 | Not Started | Prevents unbudgeted departmental expenditure |
| PROC-022 | **Drop-Shipment Procurement Processing** | Purchase Order shipping address directly mapped to customer delivery address; supplier ships directly | Medium | Phase 2 | Not Started | Simplifies fulfillment for non-stocked goods |
| PROC-023 | **Automated Purchase Reorder Automation** | Auto-generate Purchase Requisitions / PO drafts when stock levels drop below safety reorder threshold | High | Phase 1 | Not Started | Prevents stockout of critical production components |
| PROC-024 | **Multi-Currency Procurement & Import Handling** | Purchase in foreign currency (USD, EUR, CNY), currency hedging notes, customs duty calculations | High | Phase 1 | Not Started | Standard workflow for international import sourcing |
| PROC-025 | **Vendor Advance Payment Request & Settlement** | Record advance payment against PO, track advance balance, auto-offset against subsequent invoices | High | Phase 1 | Not Started | Essential for capital goods and long-lead suppliers |
| PROC-026 | **Vendor Payment Scheduling & Cash Flow Forecast** | Ageing-based payment schedule, early payment cash discount alerts (e.g. 2/10 Net 30) | High | Phase 1 | Not Started | Optimizes treasury cash outflows and captures discounts |
| PROC-027 | **Import High-Sea Sales & Customs Clearance** | Bill of Entry (BOE) number tracking, customs duty assessment, bonded warehouse management | Medium | Phase 2 | Not Started | Complies with Indian Customs Act and DGFT regulations |
| PROC-028 | **Purchase Receipt Mandatory Quality Clearance** | Gate entry puts received items in quarantine; items cannot be moved to main stock until QA signs off | High | Phase 2 | Not Started | Enforces zero-defect manufacturing standards |
| PROC-029 | **Supplier Service Contracts & AMC Renewal** | Annual maintenance contracts (AMC), lease agreements, service renewal tracking and email alerts | Medium | Phase 2 | Not Started | Avoids service lapse on critical machinery and IT infrastructure |
| PROC-030 | **Purchase Price History & Trend Analytics** | Historical price trends by item and vendor, inflation indexing, price variation alerts | High | Phase 1 | Not Started | Prevents purchasing items at inflated rates |
| PROC-031 | **Supplier Catalog & Manufacturer Part Number (MPN)** | Map vendor's MPN and description to internal Item Code, print vendor part numbers on PO | Medium | Phase 2 | Not Started | Eliminates ordering mistakes for complex electronics and spares |
| PROC-032 | **Procurement Spend Analysis Dashboard** | Spend breakdown by supplier, item category, business unit; Pareto analysis (80/20 spend rule) | High | Phase 2 | Not Started | Identifies cost rationalization opportunities |
| PROC-033 | **Material Return to Vendor post Capitalization** | Process vendor return for items already capitalized into fixed assets or invoiced | Medium | Phase 2 | Not Started | Handles complex reverse accounting entries |
| PROC-034 | **Unbilled Purchase Receipts Report** | Report of GRNs received where supplier invoice has not yet been submitted or posted | Critical | Phase 1 | Not Started | Ensures month-end expense accrual accuracy |
| PROC-035 | **Non-PO Expense Invoice Processing** | Streamlined entry for rent, utility bills, professional fees, office pantry without requiring PO/GRN | High | Phase 1 | Not Started | Reduces friction for indirect non-inventory expenses |
| PROC-036 | **Supplier Blacklisting & Hold Controls** | Immediate block on creating POs or releasing payments for disputed or non-compliant suppliers | High | Phase 1 | Not Started | Protects organization from fraudulent or defaulting vendors |

---

### 8. Inventory (`INV`)

*Comprehensive warehouse and inventory management: item variants, batch/serial tracking, stock entries, FIFO/Moving Average valuation, reorder logic, and pick-pack-ship.*

**Total Features Tracked**: 42

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| INV-001 | **Item Master & Universal Catalog** | Item code, item name, description, category, default UOM, HSN code, tax template, barcode | Critical | Phase 1 | Not Started | Foundational master for all trading, manufacturing, and service entities |
| INV-002 | **Item Variant Architecture** | Attribute definitions (Size, Color, Material, Voltage), auto-generated variant matrix and SKUs | High | Phase 1 | Not Started | Eliminates creating hundreds of manual item masters |
| INV-003 | **Universal Barcode & GTIN Management** | Assign EAN-13, UPC, Code 128, QR codes; print barcode labels; barcode scanner input support | High | Phase 1 | Not Started | Enables fast error-free scanning in warehouse and retail |
| INV-004 | **Comprehensive Batch Number Tracking** | Batch ID, manufacturing date, expiration date, batch size, supplier batch reference | Critical | Phase 1 | Not Started | Mandatory for pharmaceutical, chemical, and food industries |
| INV-005 | **Serial Number Lifecycle Management** | Individual unique serial number tracking, warranty start/end, current warehouse location, status | Critical | Phase 1 | Not Started | Crucial for high-value equipment and electronics |
| INV-006 | **Multi-Warehouse Stock Architecture** | Hierarchical warehouse trees, physical branches, virtual warehouses (In-Transit, Quarantine, Scrap) | Critical | Phase 1 | Not Started | Provides segmented visibility across all physical locations |
| INV-007 | **Stock Entry: Material Receipt** | Direct stock receipt, opening stock entry, sample intake, customer return intake | Critical | Phase 1 | Not Started | Increases stock balance with valuation debit |
| INV-008 | **Stock Entry: Material Issue** | Internal issue for R&D, office consumption, machine maintenance spares, scrap write-off | Critical | Phase 1 | Not Started | Reduces inventory balance with cost centre expense debit |
| INV-009 | **Stock Entry: Material Transfer** | Transfer between warehouses, branch-to-branch transit tracking with intermediate in-transit state | Critical | Phase 1 | Not Started | Maintains accurate custody during shipment transit |
| INV-010 | **Stock Entry: Manufacturing Repack / Bundle** | Convert bulk raw packaging into smaller retail packs, unit conversion repackaging | High | Phase 2 | Not Started | Balances input vs output valuation seamlessly |
| INV-011 | **Stock Reconciliation & Physical Stocktake** | Cycle counting, annual physical inventory audit, barcode scanner count upload, variance reporting | Critical | Phase 1 | Not Started | Reconciles physical warehouse stock with system book balance |
| INV-012 | **Stock Adjustment & Damage Write-Off** | Adjustment voucher for shrinkage, transit damage, spoilage, expiry write-downs | High | Phase 1 | Not Started | Adjusts inventory valuation and posts loss to GL |
| INV-013 | **FIFO (First-In, First-Out) Valuation Engine** | Perpetual FIFO stock queues per warehouse; issues stock at oldest incoming valuation cost | Critical | Phase 1 | Not Started | Standard statutory valuation method compliant with Ind AS 2 |
| INV-014 | **Moving Weighted Average Valuation Engine** | Continuous dynamic weighted average cost calculation upon every receipt voucher | Critical | Phase 1 | Not Started | Alternative standard valuation methodology |
| INV-015 | **Perpetual Inventory Accounting Integration** | Real-time synchronized General Ledger entries for every stock movement (Stock in Hand vs Stock Adjustment) | Critical | Phase 1 | Not Started | Ensures balance sheet inventory value matches warehouse physical valuation |
| INV-016 | **Periodic Inventory Accounting Support** | Support for periodic stock accounting via manual month-end inventory adjustment journals | Medium | Phase 2 | Not Started | Option for micro-enterprises with simplified bookkeeping |
| INV-017 | **Negative Stock Prevention & Control Rules** | Hard lock preventing inventory balance from dipping below zero, optional tenant override warning | Critical | Phase 1 | Not Started | Prevents valuation calculation anomalies and accounting corruption |
| INV-018 | **Available-to-Promise (ATP) Calculator** | Real-time calculation: On-Hand Stock - Reserved Stock = Available to Promise to new customers | Critical | Phase 1 | Not Started | Prevents sales reps from double-selling stock |
| INV-019 | **Reserved Stock Management Engine** | Auto-reserve inventory upon Sales Order confirmation or Work Order release; release upon cancellation | Critical | Phase 1 | Not Started | Guarantees fulfillment for booked orders |
| INV-020 | **Projected Stock Availability Engine** | Projected Stock = Current On-Hand + Open POs + Planned Production - Open Sales Orders | High | Phase 1 | Not Started | Forward visibility into inventory sufficiency |
| INV-021 | **Automated Reorder Level & Safety Stock** | Minimum reorder level, safety stock buffer, maximum inventory level, reorder quantity calculation | Critical | Phase 1 | Not Started | Triggers automated procurement requisitions |
| INV-022 | **Pick-Pack-Ship Warehouse Fulfillment Workflow** | Generate consolidated pick lists by warehouse zone, packing verification slip, shipping dispatch | High | Phase 1 | Not Started | Streamlines multi-order warehouse dispatch |
| INV-023 | **Batch Expiry Alerts & FEFO Priority Engine** | First-Expiry, First-Out (FEFO) automated picking suggestion; alerts for batches expiring in 30/60/90 days | Critical | Phase 1 | Not Started | Minimizes expired stock write-offs for perishable goods |
| INV-024 | **Multi-UOM Hierarchy & Conversions** | Purchase UOM (e.g. Drums), Stock UOM (e.g. Litres), Sales UOM (e.g. Bottles); fractional conversion | Critical | Phase 1 | Not Started | Accurate unit tracking across business functions |
| INV-025 | **Item Group Taxonomic Tree** | Multi-level hierarchical category tree (e.g. Electronics -> Computers -> Laptops -> Gaming) | High | Phase 1 | Not Started | Aids reporting, default configurations, and navigation |
| INV-026 | **Product Bundles & Sales Kits** | Dynamic kit bundles (e.g. Computer Bundle: CPU + Monitor + Keyboard) without manufacturing work orders | High | Phase 1 | Not Started | Deducts individual child components upon delivery note submit |
| INV-027 | **Warehouse Bin Capacity & Dimension Rules** | Maximum cubic volume (m³) and weight (kg) capacity constraints per storage bin location | Medium | Phase 3 | Not Started | Optimizes spatial warehouse allocation |
| INV-028 | **Internal Material Transfer Request** | Branch store requests material from central warehouse; multi-level approval before dispatch | High | Phase 1 | Not Started | Formalizes internal inter-branch requisitioning |
| INV-029 | **In-Transit Warehouse Tracking** | Goods in transit accounted in specialized intermediate transit warehouse until destination GRN | Critical | Phase 1 | Not Started | Prevents inventory disappearing during transit |
| INV-030 | **Scrap & Defective Inventory Quarantine** | Dedicated quarantine warehouse; defective stock segregation; salvage valuation assessment | High | Phase 1 | Not Started | Prevents accidental shipment of damaged goods |
| INV-031 | **Slow-Moving & Non-Moving Stock Analysis** | Ageing brackets (0-30, 31-60, 61-90, 91-180, 180+ days) based on last issue transaction date | High | Phase 2 | Not Started | Identifies tied-up working capital and dead stock |
| INV-032 | **Inventory Turnover Ratio Analytics** | Inventory turnover calculation (COGS / Average Inventory) by item group and warehouse | High | Phase 2 | Not Started | Evaluates warehouse operational efficiency |
| INV-033 | **Stock Ledger / Stock Card Report** | Chronological audit trail of every single stock transaction per item, warehouse, batch, and voucher | Critical | Phase 1 | Not Started | Primary audit report for internal and statutory auditors |
| INV-034 | **Stock Balance & Valuation Summary Report** | Real-time quantitative balance and monetary valuation by warehouse, category, and company | Critical | Phase 1 | Not Started | Reconciles stock with General Ledger balance sheet |
| INV-035 | **Automated Material Reorder Indent Generation** | Nightly cron evaluates all items against reorder points and auto-creates Purchase Requisitions | High | Phase 2 | Not Started | Eliminates stockout surprises |
| INV-036 | **Serial Number Full Lineage Tracking** | Complete history of a serial number: Purchase Receipt -> Quality Inspection -> Internal Transfer -> Delivery Note -> Warranty Claim | High | Phase 1 | Not Started | Critical for post-sales support and traceability |
| INV-037 | **Batch Split & Merge Operations** | Split large bulk batch into smaller lots with distinct expiry dates, merge identical inspection lots | Medium | Phase 2 | Not Started | Useful in chemical packaging and pharmaceutical repacking |
| INV-038 | **Drop-Shipment Virtual Inventory Handling** | Virtual non-stock tracking for drop-shipped goods without impacting physical warehouse counts | Medium | Phase 2 | Not Started | Separates physical fulfillment from paper dropship transactions |
| INV-039 | **High-Value Stock Issue Dual Sign-Off** | Requires two-person authentication (storekeeper + manager) to issue items valued over threshold | Medium | Phase 2 | Not Started | Prevents pilferage of precious metals, chips, or drugs |
| INV-040 | **Cold-Chain & Environmental Parameter Logging** | Log temperature/humidity requirements on item master, alert if stored in non-compliant warehouse zone | Low | Phase 3 | Not Started | Ensures compliance with cold-chain food and pharma standards |
| INV-041 | **Landed Cost Revaluation on Stock Items** | Automatically adjust stock ledger valuation retroactively upon Landed Cost Voucher submission | Critical | Phase 1 | Not Started | Ensures inventory valuation accurately reflects import duties and freight |
| INV-042 | **Stock Ageing by Batch Manufacturing Date** | Ageing report based on date of manufacture rather than system receipt date | High | Phase 2 | Not Started | Essential for perishable and chemical shelf life tracking |

---

### 9. Accounting (`ACC`)

*Enterprise double-entry financial accounting: chart of accounts, GL, journals, AR/AP, bank reconciliation, multi-currency, financial statements, and budgets.*

**Total Features Tracked**: 52

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| ACC-001 | **Hierarchical Chart of Accounts** | Standard tree structure: Assets, Liabilities, Equity, Income, Expenses; parent groups and ledger accounts | Critical | Phase 1 | Not Started | Pre-seeded with standard Indian and international accounting templates |
| ACC-002 | **General Ledger Account Master** | Account code, account name, currency, account type (Bank, Cash, Receivable, Payable, Tax, Expense, Income) | Critical | Phase 1 | Not Started | Building blocks of financial reporting |
| ACC-003 | **Cost Centre & Dimension Architecture** | Multi-level cost centre hierarchy, branch dimension, department dimension, project dimension | Critical | Phase 1 | Not Started | Enables multi-dimensional financial reporting without polluting the chart of accounts |
| ACC-004 | **Consolidated Chart of Accounts for Multi-Company** | Parent holding company chart of accounts mapped to subsidiary local charts of accounts | High | Phase 2 | Not Started | Facilitates corporate group financial consolidation |
| ACC-005 | **General Journal Entry Voucher** | Manual double-entry voucher, multi-currency debit/credit balancing, cost centre and project tagging | Critical | Phase 1 | Not Started | Core voucher for ad-hoc accounting adjustments |
| ACC-006 | **Opening Balance Journal Entry** | Fiscal year opening entries for asset, liability, and equity accounts with opening invoice linkage | Critical | Phase 1 | Not Started | Facilitates initial data migration and year-end carry forward |
| ACC-007 | **Recurring Journal Entry Automation** | Schedule monthly recurring journals (e.g. Office rent, equipment lease, software amortization) | High | Phase 2 | Not Started | Automates month-end routine accruals |
| ACC-008 | **Reversing Journal Entries** | Automated auto-reversal on the first day of the following accounting period | High | Phase 2 | Not Started | Standard GAAP/IFRS practice for temporary month-end accruals |
| ACC-009 | **Payment Entry: Customer Receipt** | Record customer incoming payment, allocate against multiple unpaid invoices, handle rounding/discounts | Critical | Phase 1 | Not Started | Updates cash/bank balance and clears customer receivables |
| ACC-010 | **Payment Entry: Supplier Disbursement** | Record vendor payout, allocate against purchase invoices, record bank charges and TDS deductions | Critical | Phase 1 | Not Started | Updates bank balance and clears vendor accounts payable |
| ACC-011 | **Payment Entry: Internal Fund Transfer** | Cash to bank, bank to cash (cash withdrawal), bank to bank inter-account transfers | Critical | Phase 1 | Not Started | Maintains accurate internal liquidity balances |
| ACC-012 | **Advance Payment & Unallocated Receipts** | Record advances received or paid without invoice reference; FIFO auto-knockoff upon invoice generation | Critical | Phase 1 | Not Started | Complies with GST rules on advance vouchers |
| ACC-013 | **Automated Sales Invoice GL Posting** | System auto-posts: Debit Customer AR, Credit Revenue Account, Credit Output Tax Liabilities | Critical | Phase 1 | Not Started | Zero manual effort double-entry posting from Sales module |
| ACC-014 | **Automated Purchase Invoice GL Posting** | System auto-posts: Debit Expense/Stock In Hand, Debit Input Tax Credit, Credit Vendor AP | Critical | Phase 1 | Not Started | Zero manual effort double-entry posting from Procurement module |
| ACC-015 | **Sales Credit Note Accounting Posting** | Auto-posts: Debit Revenue / Return Account, Debit Output Tax Liability Reversal, Credit Customer AR | Critical | Phase 1 | Not Started | Reverses original invoice billing impact |
| ACC-016 | **Purchase Debit Note Accounting Posting** | Auto-posts: Debit Vendor AP, Credit Expense/Stock In Hand Reversal, Credit Input Tax Credit Reversal | Critical | Phase 1 | Not Started | Reverses original purchase invoice impact |
| ACC-017 | **Month-End Expense Accrual Processing** | Automated accrual voucher for unbilled goods receipts (GRNs) and utility services | High | Phase 2 | Not Started | Matches expenses to appropriate accounting period |
| ACC-018 | **Fixed Asset Depreciation Entry** | Automated batch generation of monthly depreciation journal entries (SLM and WDV methods) | High | Phase 2 | Not Started | Posts to Depreciation Expense and Accumulated Depreciation GL accounts |
| ACC-019 | **Realized Forex Gain / Loss Accounting** | Calculates realized currency exchange difference upon invoice payment settlement; posts to Forex GL | High | Phase 1 | Not Started | Mandatory for export/import businesses |
| ACC-020 | **Unrealized Forex Gain / Loss Revaluation** | Period-end revaluation of foreign currency bank accounts, receivables, and payables at closing exchange rates | High | Phase 2 | Not Started | Complies with Ind AS 21 / IAS 21 forex reporting standards |
| ACC-021 | **Accounts Receivable (AR) Subledger** | Customer-wise detailed ledger, invoice breakdown, credit notes, receipts, net outstanding balance | Critical | Phase 1 | Not Started | Primary tool for credit control and AR monitoring |
| ACC-022 | **Accounts Payable (AP) Subledger** | Supplier-wise detailed ledger, purchase bills, debit notes, disbursements, open liabilities | Critical | Phase 1 | Not Started | Primary tool for vendor payment management |
| ACC-023 | **AR Ageing Summary & Detailed Report** | Aging buckets (Current, 1-30, 31-60, 61-90, 91-180, 180+ days), customer contact, overdue interest | Critical | Phase 1 | Not Started | Vital for working capital health and collection prioritization |
| ACC-024 | **AP Ageing Summary & Detailed Report** | Payables aging buckets, due date analysis, cash requirement forecasting | Critical | Phase 1 | Not Started | Essential for treasury and cash flow planning |
| ACC-025 | **Automated Bank Statement Import** | Import electronic bank statements in OFX, QIF, CSV, MT940 formats | High | Phase 1 | Not Started | Eliminates manual entry of bank transactions |
| ACC-026 | **Rule-Based Bank Reconciliation Engine** | Auto-match statement lines with system vouchers based on reference number, date window, and amount | Critical | Phase 1 | Not Started | Quickly resolves cleared vs uncleared bank transactions |
| ACC-027 | **Payment Gateway Settlement Auto-Reconciliation** | Auto-parse settlement payout files from Razorpay, Stripe, Cashfree; record gateway fee deductions | High | Phase 2 | Not Started | Reconciles gross e-commerce receipts with net bank deposits |
| ACC-028 | **Electronic Payment Export (NEFT / RTGS / NACH)** | Generate encrypted batch payment upload files for HDFC, ICICI, SBI, Axis corporate banking portals | High | Phase 2 | Not Started | Streamlines bulk vendor payment processing |
| ACC-029 | **Real-Time Trial Balance** | Opening Balance, Debit Movement, Credit Movement, Closing Balance per account; drill-down to ledger | Critical | Phase 1 | Not Started | Fundamental verification that debits equal credits |
| ACC-030 | **Balance Sheet** | Assets, Liabilities, and Equity statement; horizontal/vertical formats; prior-period comparisons | Critical | Phase 1 | Not Started | Primary statutory financial health statement |
| ACC-031 | **Profit & Loss Statement (Income Statement)** | Gross Profit, Operating Profit, EBITDA, PBT, PAT; monthly, quarterly, annual comparatives | Critical | Phase 1 | Not Started | Essential measure of enterprise profitability |
| ACC-032 | **Cash Flow Statement** | Operating, Investing, and Financing activities cash flows; Direct and Indirect methods | Critical | Phase 2 | Not Started | Crucial for solvency and liquidity management |
| ACC-033 | **General Ledger Summary & Detailed Report** | Account-wise chronological transaction report with running balances; exportable to Excel/PDF | Critical | Phase 1 | Not Started | Primary book of account for audit examination |
| ACC-034 | **Party Ledger Statement of Account** | Branded customer / supplier statement of account with opening balance, invoices, payments, and closing balance | Critical | Phase 1 | Not Started | Dispatched to clients for balance confirmation |
| ACC-035 | **Cost Centre & Departmental Budgeting** | Annual, quarterly, and monthly budget allocations per cost centre and expense account | High | Phase 2 | Not Started | Sets spending limits across enterprise departments |
| ACC-036 | **Budget Variance Analysis & Control** | Actual spend vs Allocated budget variance reports; optional hard stop preventing over-budget transactions | High | Phase 2 | Not Started | Enforces strict fiscal discipline |
| ACC-037 | **Inter-Company Billing & Elimination Entries** | Mirror transactions between sister companies; automatic elimination entries during consolidation | High | Phase 3 | Not Started | Required for multi-entity corporate groups |
| ACC-038 | **Multi-Currency Accounting Subledgers** | Dual-currency ledger view: transaction foreign currency and base domestic currency | High | Phase 1 | Not Started | Ensures transparent accounting for cross-border transactions |
| ACC-039 | **Petty Cash Management & Imprest System** | Petty cash float log, minor cash expense voucher sign-off, reimbursement replenishment vouchers | High | Phase 1 | Not Started | Controls physical cash disbursements in branch offices |
| ACC-040 | **Cheque / Check Printing & Registry** | Custom cheque layout templates for Indian and international banks; cheque leaf tracking, voiding | Medium | Phase 2 | Not Started | Automates physical cheque issuance and prevents fraud |
| ACC-041 | **Bad Debt Write-Off & Provisioning** | Allowance for doubtful accounts provisioning; bad debt write-off journal against customer balance | High | Phase 2 | Not Started | Proper accounting for uncollectible customer debts |
| ACC-042 | **Interest Calculation on Overdue Receivables** | Automated interest debit note generation for late-paying customers based on contract terms | Medium | Phase 2 | Not Started | Incentivizes timely customer invoice settlements |
| ACC-043 | **Deferred Revenue Accounting Schedule** | Revenue recognition amortization schedules for annual subscriptions and prepaid contracts | High | Phase 2 | Not Started | Complies with Ind AS 115 / IFRS 15 revenue recognition |
| ACC-044 | **Prepaid Expense Amortization Schedule** | Amortize prepaid annual insurance, AMC, or software subscriptions over monthly expense periods | High | Phase 2 | Not Started | Prevents monthly expense distortions |
| ACC-045 | **Withholding Tax (TDS) Payable Subledger** | Section-wise TDS liability tracking (194C, 194J, 194I, 194Q), challan deposit mapping | Critical | Phase 1 | Not Started | Ensures timely compliance with Indian Income Tax Act |
| ACC-046 | **Tax Settlement & Input Credit Offsetting** | Offsetting input tax credits against output tax liabilities; posting net tax payable journal | Critical | Phase 1 | Not Started | Month-end tax ledger closing voucher |
| ACC-047 | **Period Closing Voucher & Year-End Roll Forward** | Transfer net profit/loss to Retained Earnings balance sheet equity account; reset nominal accounts | Critical | Phase 1 | Not Started | Annual financial year-end closing procedure |
| ACC-048 | **Hard Accounting Period Lock** | Strict date lock freezing all journal entries and financial postings prior to the lock date | Critical | Phase 1 | Not Started | Guarantees that audited historical figures cannot be altered |
| ACC-049 | **Financial Ratio Analysis Dashboard** | Current Ratio, Quick Ratio, Debt-to-Equity, DSO, DPO, Gross Margin %, Net Margin % | High | Phase 2 | Not Started | Executive financial health monitoring |
| ACC-050 | **Multi-Company Financial Consolidation** | Consolidated balance sheet, consolidated P&L, elimination of inter-company sales and balances | High | Phase 3 | Not Started | Essential for conglomerate and group reporting |
| ACC-051 | **Forensic Audit Trial Balance with Drilldown** | Interactive drilldown: Trial Balance -> Account Ledger -> Source Transaction Voucher -> Change Audit Log | Critical | Phase 1 | Not Started | Empowers statutory auditors during year-end inspections |
| ACC-052 | **Statutory Schedule III Financial Statement Formats** | Companies Act 2013 Schedule III compliant Balance Sheet and Statement of Profit and Loss | High | Phase 2 | Not Started | Directly usable for Indian MCA ROC statutory filings |

---

### 10. India Compliance (`GST`)

*Complete Indian statutory tax and regulatory compliance: GST, E-Invoice, E-Way Bill, GSTR returns, TDS/TCS, and MSME 43B(h) payment tracking.*

**Total Features Tracked**: 36

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| GST-001 | **GSTIN Master & Real-Time API Validation** | Validate 15-character GSTIN structure, checksum verification, live status lookup via GSTN API | Critical | Phase 1 | Not Started | Prevents invalid GSTIN entry for customers and vendors |
| GST-002 | **Permanent Account Number (PAN) Validation** | Validate 10-character PAN syntax, derive entity type from 4th character, Section 206AB compliance check | Critical | Phase 1 | Not Started | Ensures accurate tax deduction rates |
| GST-003 | **HSN (Harmonized System of Nomenclature) Master** | Goods classification codes (4, 6, or 8 digits), statutory GST rate mappings, cess rates | Critical | Phase 1 | Not Started | Mandatory for goods sales and inventory valuation |
| GST-004 | **SAC (Services Accounting Code) Master** | Services classification codes (6 digits), applicable GST slab rates, reverse charge applicability | Critical | Phase 1 | Not Started | Mandatory for service invoicing |
| GST-005 | **CGST (Central GST) Calculation Engine** | Auto-calculate Central GST portion on intra-state supply of goods and services | Critical | Phase 1 | Not Started | Standard Indian dual GST system |
| GST-006 | **SGST / UTGST Calculation Engine** | Auto-calculate State GST or Union Territory GST portion on intra-state supplies | Critical | Phase 1 | Not Started | Standard Indian dual GST system |
| GST-007 | **IGST (Integrated GST) Calculation Engine** | Auto-calculate Integrated GST on inter-state supplies, imports, and SEZ transactions | Critical | Phase 1 | Not Started | Applied when supplier and customer states differ |
| GST-008 | **Automated Place of Supply (POS) Engine** | Determine intra vs inter-state supply based on supplier location, billing address, and shipping delivery state | Critical | Phase 1 | Not Started | Eliminates human error in applying CGST+SGST vs IGST |
| GST-009 | **Reverse Charge Mechanism (RCM) Accounting** | Identify RCM supplies (GTA, Legal, Unregistered vendor purchases), auto-generate self-invoices and tax liability | Critical | Phase 1 | Not Started | Required under Section 9(3) and 9(4) of CGST Act |
| GST-010 | **Input Tax Credit (ITC) Ledger & Categorization** | Segregate ITC into Eligible, Ineligible, and Blocked under Section 17(5); capital goods ITC apportionment | Critical | Phase 1 | Not Started | Ensures accurate claiming in GSTR-3B |
| GST-011 | **GSTR-2B vs Purchase Register Auto-Reconciliation** | Automated ingestion of portal GSTR-2B, matching with purchase invoices; identify missing or mismatched invoices | Critical | Phase 1 | Not Started | Prevents claiming ineligible ITC and penalties under Rule 36(4) |
| GST-012 | **NIC E-Invoice Direct API Interface** | Direct API integration with NIC / IRP portal to generate Invoice Reference Number (IRN), Signed QR, Signed XML | Critical | Phase 1 | Not Started | Mandatory for B2B transactions over government turnover threshold |
| GST-013 | **E-Invoice Cancellation & Error Management** | Cancel IRN within 24-hour statutory window with reason code; error diagnostics for rejected payloads | Critical | Phase 1 | Not Started | Complies with NIC portal protocols |
| GST-014 | **E-Way Bill Direct API Generation** | Generate Part-A and Part-B E-Way Bills directly from ERP without manual portal login | Critical | Phase 1 | Not Started | Mandatory for goods movement exceeding ₹50,000 threshold |
| GST-015 | **E-Way Bill Auto-Generation from Invoices & Challans** | Auto-calculate transit pin-to-pin distance, assign vehicle number, transporter ID, generate printable EWB PDF | Critical | Phase 1 | Not Started | Accelerates warehouse dispatch operations |
| GST-016 | **E-Way Bill Extension & Vehicle Update Workflow** | Update vehicle registration number during transit transshipment, extend validity upon transit delay | High | Phase 1 | Not Started | Avoids vehicle impoundment on transit breakdowns |
| GST-017 | **GSTR-1 JSON & Excel Return Generator** | Export complete GSTR-1 in government offline tool format: B2B, B2CL, B2CS, CDNR, CDNUR, EXPORT, HSN Summary | Critical | Phase 1 | Not Started | Monthly/quarterly outward supplies statutory return |
| GST-018 | **GSTR-2B JSON Ingestion & Analysis Tool** | Parse monthly GSTR-2B JSON download from GST portal; match against internal purchase ledger | High | Phase 1 | Not Started | Automates monthly ITC claim preparation |
| GST-019 | **GSTR-3B Computation & Reconciliation Table** | Auto-calculate Table 3.1 (Outward taxable supplies), Table 4 (Eligible ITC), Table 5 (Exempt/Nil), tax payable | Critical | Phase 1 | Not Started | Monthly self-assessment summary return |
| GST-020 | **GSTR-9 Annual Return Preparation Worksheet** | Consolidate entire fiscal year data, compare GSTR-1 vs GSTR-3B vs Audited Books, identify discrepancies | High | Phase 2 | Not Started | Simplifies annual GST audit and filing |
| GST-021 | **TDS (Tax Deducted at Source) Section Master** | Configure sections: 194C (Contractors), 194J (Professional), 194I (Rent), 194Q (Goods purchase), 194H (Commission) | Critical | Phase 1 | Not Started | Pre-configured with statutory thresholds and deduction percentages |
| GST-022 | **TDS Automatic Deduction on Purchase Invoices** | Auto-calculate and deduct TDS when cumulative vendor purchases exceed threshold; enforce 20% rate for non-PAN | Critical | Phase 1 | Not Started | Eliminates manual TDS calculation errors |
| GST-023 | **Section 194Q vs 206C(1H) Mutual Exclusion Logic** | Intelligent validation: if buyer deducts TDS under 194Q, seller TCS under 206C(1H) is deactivated | Critical | Phase 1 | Not Started | Prevents double tax deduction on high-value goods |
| GST-024 | **TCS (Tax Collected at Source) Rule Engine** | Calculate TCS on sale of scrap, minerals, motor vehicles > ₹10 Lakhs, overseas tour packages | High | Phase 1 | Not Started | Complies with Income Tax Act Section 206C |
| GST-025 | **TDS Challan Tracking & Payment Voucher** | Record monthly ITNS 281 challan deposit, BSR code, challan serial number, tender date | Critical | Phase 1 | Not Started | Essential for quarterly TDS return filing |
| GST-026 | **Form 26Q / 27Q Quarterly TDS Return Export** | Export text file strictly compliant with NSDL FVU utility specifications for non-salary TDS returns | High | Phase 2 | Not Started | Directly uploadable to TRACES / TIN-NSDL |
| GST-027 | **Form 16A TDS Certificate Generator** | Generate Form 16A quarterly TDS certificates for vendors with digital signature and auto-email | High | Phase 2 | Not Started | Satisfies vendor compliance demands |
| GST-028 | **MSME Section 43B(h) Payment Delay Tracking** | Track 15-day / 45-day payment deadlines for micro & small enterprises; alert before fiscal year-end disallowance | Critical | Phase 1 | Not Started | Strictly enforces Income Tax disallowance rules for delayed MSME payments |
| GST-029 | **E-Commerce Operator GST Compliance (Section 52)** | Calculate and remit TCS at 1% on net value of taxable supplies made through e-commerce marketplace | Medium | Phase 2 | Not Started | Required if operating an online marketplace platform |
| GST-030 | **Composition Scheme Compliance Handling** | Flat rate turnover tax, issue 'Bill of Supply' instead of Tax Invoice, restrict ITC claiming | Medium | Phase 1 | Not Started | Supports small traders under the GST Composition Scheme |
| GST-031 | **SEZ & Export Invoicing with LUT / Bond** | Generate invoices for zero-rated supplies to Special Economic Zones (SEZ) or Exports under Letter of Undertaking | High | Phase 1 | Not Started | Ensures IGST exemption with proper statutory declarations |
| GST-032 | **Bill of Supply Generation** | Format for issuing non-taxable bills for exempt, nil-rated goods or composition taxpayers | High | Phase 1 | Not Started | Required by GST Law in lieu of standard Tax Invoice |
| GST-033 | **Delivery Challan under GST Rule 55** | Statutory challan for transportation of goods without invoice (Job work, exhibition, demo, approval) | High | Phase 1 | Not Started | Prevents goods seizure during non-sale transit |
| GST-034 | **GST Immutable Invoice Audit Trail** | Detailed log of every modification, cancellation, or amendment to tax invoices as per statutory notification | Critical | Phase 1 | Not Started | Complies with MCA accounting software audit trail mandate |
| GST-035 | **Merchanting Trade & High-Sea Sales Documentation** | Customs and GST exempt documentation for trade transactions where goods do not enter India territory | Medium | Phase 3 | Not Started | Used in international commodity trading |
| GST-036 | **GST Advance Receipt & Refund Voucher** | Receipt voucher on customer advance with tax calculation, refund voucher on order cancellation | High | Phase 1 | Not Started | Satisfies GST advance tax rules on service contracts |

---

### 11. Point of Sale (POS) (`POS`)

*Retail point-of-sale interface for high-speed counter billing, barcode scanning, multi-tender split payments, offline capability, and cashier shift reconciliation.*

**Total Features Tracked**: 26

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| POS-001 | **POS Profile Configuration** | Default store, warehouse, cash/bank accounts, customer, price list, and tax template per register | Critical | Phase 2 | Not Started | Configures operational parameters per retail terminal |
| POS-002 | **Retail Store / Outlet Master** | Physical store details, operating hours, store manager, linked branch company, tax jurisdiction | Critical | Phase 2 | Not Started | Enables multi-store retail chain management |
| POS-003 | **POS Cashier Counter & Register Setup** | Terminal counter ID, receipt printer binding, cash drawer port, display pole integration | High | Phase 2 | Not Started | Hardware mapping per checkout terminal |
| POS-004 | **Cashier Shift Management & Opening Cash** | Shift start timestamp, cashier assignment, opening float cash counting, supervisor sign-in | Critical | Phase 2 | Not Started | Ensures cashier accountability from start of day |
| POS-005 | **Barcode Scanning & Fast Search** | Continuous barcode gun scanning, instant item addition, product search with thumbnail grid | Critical | Phase 2 | Not Started | Sub-second item lookup for fast billing |
| POS-006 | **Touch-Friendly POS Cart Interface** | High-density responsive touch interface, quantity increment/decrement buttons, hotkey navigation | Critical | Phase 2 | Not Started | Optimized for touch monitors and tablets |
| POS-007 | **Fast Customer Lookup & Instant Onboarding** | Search customer by mobile number, quick customer creation modal with 10-digit phone and name | Critical | Phase 2 | Not Started | Reduces queue wait times at checkout |
| POS-008 | **Item Discounts & Price Overrides** | Line-item percentage discount, flat amount discount, manager passcode override for price changes | High | Phase 2 | Not Started | Secured price adjustment capabilities |
| POS-009 | **Cart-Level Promotions & Coupon Application** | Auto-apply best promotional rule, manual discount coupon code entry, basket-level discount | High | Phase 2 | Not Started | Evaluates promo rules dynamically |
| POS-010 | **Multi-Tender & Split Payment Support** | Split payment between Cash, Credit Card, UPI / QR, Loyalty Points, Gift Cards, and Store Credit | Critical | Phase 2 | Not Started | Accommodates modern consumer payment combinations |
| POS-011 | **Dynamic UPI QR Code Generation on Screen** | Display transaction-specific UPI QR on customer display screen; auto-detect payment completion | Critical | Phase 2 | Not Started | Essential for Indian retail QR payments (PhonePe, GPay, Paytm) |
| POS-012 | **Order Suspension & Recall (Park Bill)** | Hold active cart when customer steps away; attend next customer; recall held cart instantly | High | Phase 2 | Not Started | Prevents queue bottlenecks in busy retail outlets |
| POS-013 | **POS Return & Immediate Refund Processing** | Scan original receipt barcode, select return items, validate return window, issue cash/store credit | Critical | Phase 2 | Not Started | Prevents duplicate return fraud |
| POS-014 | **Cash Drawer Hardware Integration** | Trigger electronic cash drawer kick-out pulse via ESC/POS receipt printer upon cash tender | High | Phase 2 | Not Started | Physical security for retail cash handling |
| POS-015 | **Thermal Receipt Printing (ESC/POS)** | Fast printing on 58mm / 80mm thermal printers; customizable receipt header, footer, tax summary | Critical | Phase 2 | Not Started | Direct raw thermal printing or browser print |
| POS-016 | **Digital Paperless Receipt Dispatch** | Send instant receipt link via SMS or WhatsApp to customer's mobile number | Medium | Phase 2 | Not Started | Eco-friendly paperless billing option |
| POS-017 | **Offline POS Billing & Background Sync** | Continue billing with local IndexedDB storage during internet outages; auto-sync upon reconnection | Critical | Phase 2 | Not Started | Uninterrupted counter operations in flaky connectivity |
| POS-018 | **Cashier Shift Closing & Discrepancy Reconciliation** | End-of-shift physical cash count, system expected cash vs actual counted cash, variance explanation | Critical | Phase 2 | Not Started | Shift closing voucher with manager sign-off |
| POS-019 | **Store Day-End Settlement & Z-Report** | Consolidated store-wide closing report: gross sales, tax collected, payment mode totals, cash drop | Critical | Phase 2 | Not Started | Official retail daily accounting sign-off |
| POS-020 | **Cash Drop & Petty Cash Payout at Register** | Mid-shift cash transfer from drawer to safe (cash drop), record petty cash payout for store needs | High | Phase 2 | Not Started | Minimizes drawer cash risk during peak trading |
| POS-021 | **Loyalty Reward Points Redemption at Register** | Lookup customer loyalty balance; redeem points as currency deduction against bill | High | Phase 2 | Not Started | Integrates customer loyalty program directly into POS |
| POS-022 | **Gift Card & Store Credit Voucher Management** | Issue and redeem barcoded gift cards, check card balance, partial gift card usage | High | Phase 2 | Not Started | Drives repeat retail footfall |
| POS-023 | **Digital Weighing Scale Integration** | Direct serial / USB interface to read weight from digital weighing scale for bulk produce | Medium | Phase 3 | Not Started | Crucial for supermarkets, fruits/vegetables, and bakeries |
| POS-024 | **POS Price List & Happy Hour Markdowns** | Time-based automatic price markdowns (e.g. 20% off fresh bakery items after 8 PM) | Medium | Phase 2 | Not Started | Automates inventory clearance |
| POS-025 | **Cashier Hourly Productivity Metrics** | Track cashier speed: scans per minute, bills per hour, average basket size, voided line count | Medium | Phase 3 | Not Started | Staff performance and shift planning analytics |
| POS-026 | **POS Audit Trail & Anti-Theft Logging** | Log all item voids, cancelled transactions, price overrides, and manual drawer open events | Critical | Phase 2 | Not Started | Prevents internal cashier shrinkage and theft |

---

### 12. Manufacturing (`MFG`)

*Discrete and process manufacturing: multi-level Bill of Materials (BOM), routings, work centers, work orders, job cards, MRP, and capacity planning.*

**Total Features Tracked**: 32

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| MFG-001 | **Bill of Materials (BOM) Master** | Item recipe, raw material quantities, scrap allowance percentage, default BOM flag, currency | Critical | Phase 2 | Not Started | Foundational production specification document |
| MFG-002 | **Multi-Level Hierarchical BOM** | Exploded multi-tier sub-assemblies, indented tree visualization, component cost roll-up | Critical | Phase 2 | Not Started | Supports complex assemblies with dozens of sub-components |
| MFG-003 | **Dynamic BOM Costing & Valuation Calculator** | Calculate manufactured cost based on latest raw material purchase rates + workstation labor/electricity costs | Critical | Phase 2 | Not Started | Accurate standard cost setting |
| MFG-004 | **Production Routing Master** | Sequence of operations (Cutting -> Machining -> Assembly -> Painting), setup times, run times | Critical | Phase 2 | Not Started | Defines the exact manufacturing path for work orders |
| MFG-005 | **Workstation / Work Center Master** | Workstation code, hourly electricity cost, hourly labor rate, working hours per shift, capacity | Critical | Phase 2 | Not Started | Factory floor resource definition |
| MFG-006 | **Work Order (Production Order) Management** | Target item, planned quantity, source raw material warehouse, target FG warehouse, planned start/end | Critical | Phase 2 | Not Started | Primary production authorization voucher |
| MFG-007 | **Job Card Generation & Dispatch** | Individual job cards generated per operation in routing, assigned to specific operators and workstations | Critical | Phase 2 | Not Started | Shop floor tracking unit for operators |
| MFG-008 | **Material Transfer for Manufacture** | Issue required raw materials from central warehouse to shop floor staging warehouse against Work Order | Critical | Phase 2 | Not Started | Controls raw material custody on the factory floor |
| MFG-009 | **Raw Material Consumption Logging** | Log actual raw material consumption against standard BOM quantity; calculate material usage variance | Critical | Phase 2 | Not Started | Tracks material wastage and shop floor efficiency |
| MFG-010 | **Finished Goods Receipt Entry** | Transfer manufactured goods from shop floor to Finished Goods warehouse; capitalize production costs | Critical | Phase 2 | Not Started | Increases finished stock and updates WIP accounts |
| MFG-011 | **By-Product & Co-Product Accounting** | Record secondary products produced during main process, allocate percentage of production cost | High | Phase 2 | Not Started | Essential for chemical, process, and metal industries |
| MFG-012 | **Scrap & Defective Material Recording** | Log defective items and scrap generated at specific operations with salvage value assessment | High | Phase 2 | Not Started | Separates usable output from scrap waste |
| MFG-013 | **Subcontracted Manufacturing Operations** | Outsource specific operations (e.g. Chrome plating, heat treatment) to external job workers within routing | High | Phase 2 | Not Started | Seamless hybrid in-house and outsourced manufacturing |
| MFG-014 | **Material Requirement Planning (MRP) Engine** | Analyze demand from confirmed Sales Orders and forecasts; calculate gross and net raw material needs | Critical | Phase 2 | Not Started | Core planning algorithm to prevent production halts |
| MFG-015 | **Automated Purchase & Work Order Indents** | MRP automatically creates draft Purchase Requisitions for shortage items and draft Work Orders for sub-assemblies | Critical | Phase 2 | Not Started | Automates supply chain execution from demand forecast |
| MFG-016 | **Rough Cut Capacity Planning (RCCP)** | Evaluate total required hours against workstation available hours; identify bottleneck workstations | High | Phase 3 | Not Started | Prevents factory overload and missed shipment dates |
| MFG-017 | **Detailed Workstation Scheduling & Visual Gantt** | Visual interactive Gantt schedule of jobs across workstations with drag-and-drop rescheduling | High | Phase 3 | Not Started | Optimizes shop floor machine utilization |
| MFG-018 | **Engineering Change Notice (ECN) & BOM Revision** | Manage engineering design revisions, change approvals, deprecation of older BOM versions | High | Phase 2 | Not Started | Ensures factory builds according to latest approved blueprints |
| MFG-019 | **Workstation Downtime & Breakdown Logging** | Record machine breakdown events, downtime reason codes (Mechanical, Electrical, Waiting for Material) | High | Phase 2 | Not Started | Identifies production loss causes |
| MFG-020 | **Overall Equipment Effectiveness (OEE) Metrics** | Calculate Availability, Performance, and Quality rates; compute overall percentage OEE per workstation | High | Phase 3 | Not Started | World-class manufacturing metric for equipment productivity |
| MFG-021 | **Batch & Serial Traceability in Manufacturing** | Record which raw material batch numbers and serials went into which finished goods serial/batch | Critical | Phase 2 | Not Started | Mandatory for product recall and ISO compliance |
| MFG-022 | **Production Yield Analysis & Reporting** | Compare theoretical standard yield vs actual output yield; report variances across batches | High | Phase 2 | Not Started | Key efficiency metric for process manufacturing |
| MFG-023 | **Work-in-Progress (WIP) Valuation Ledger** | Live monetary tracking of raw materials and operational costs currently on the factory floor | Critical | Phase 2 | Not Started | Maintains accurate balance sheet WIP valuation |
| MFG-024 | **Operation Time Tracking & Barcode Punch** | Scan job card barcode to clock in and clock out of operations; measure real cycle times | High | Phase 2 | Not Started | Replaces paper punch cards with digital precision |
| MFG-025 | **Rework Order Management** | Issue rework orders to fix defective finished units with additional labor and material tracking | High | Phase 2 | Not Started | Isolates rework expenses from standard production costs |
| MFG-026 | **Make-to-Order (MTO) Direct Binding** | Link Work Order directly to Sales Order; reserve produced finished goods exclusively for that order | Critical | Phase 2 | Not Started | Standard practice for custom fabrication and machinery |
| MFG-027 | **Make-to-Stock (MTS) Forecast-Driven Scheduling** | Generate work orders based on minimum inventory buffer policies and sales forecasts | High | Phase 2 | Not Started | Standard for mass consumption goods |
| MFG-028 | **Preventive Machine Maintenance Integration** | Auto-schedule maintenance tasks when workstation operational hours exceed service interval threshold | High | Phase 2 | Not Started | Avoids catastrophic machine failures during production |
| MFG-029 | **Tooling & Die Life Cycle Management** | Track tool and mold usage cycles, sharpen alerts, tool retirement tracking | Medium | Phase 3 | Not Started | Critical for stamping, injection molding, and machining |
| MFG-030 | **Production Shift Logbook & Handover Notes** | Shift supervisor handover logs: incomplete jobs, machine warnings, quality alerts | Medium | Phase 2 | Not Started | Maintains continuity across rotating shifts |
| MFG-031 | **Shop Floor Operator Efficiency Dashboard** | Units produced per operator hour, job completion timeliness, individual scrap rates | Medium | Phase 3 | Not Started | Informs labor incentives and training programs |
| MFG-032 | **Subcontracting Material Reconciliation Ledger** | Reconcile raw materials sent to third-party processors vs finished parts received; track scrap loss | High | Phase 2 | Not Started | Prevents material leakage at external job work vendors |

---

### 13. Quality (`QA`)

*Quality management system: inspection templates, sampling plans, incoming/in-process/outgoing inspections, non-conformance reports (NCR), and CAPA.*

**Total Features Tracked**: 22

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| QA-001 | **Quality Inspection Template Master** | Define inspection checklists and specs per item or item group (Dimensions, Tensile Strength, Visual) | Critical | Phase 2 | Not Started | Standard operating procedure for quality testing |
| QA-002 | **Quality Inspection Parameters Master** | Define quantitative parameters (Min, Max, Nominal values) and qualitative parameters (Pass/Fail, Color match) | Critical | Phase 2 | Not Started | Atomic testing criteria library |
| QA-003 | **Sampling Plan & AQL Standards Master** | Configure ISO 2859 / ANSI Z1.4 sampling tables based on batch size and Acceptance Quality Limit (AQL) | High | Phase 2 | Not Started | Statistically valid sample size selection |
| QA-004 | **Incoming Material Quality Inspection** | Mandatory inspection on Goods Receipt Note (GRN); sample items at dock before stock receipt approval | Critical | Phase 2 | Not Started | Prevents bad raw materials from entering production |
| QA-005 | **In-Process Manufacturing Inspection** | Quality checkpoints performed between manufacturing routing operations before advancing to next step | Critical | Phase 2 | Not Started | Catches defects early in the production line |
| QA-006 | **Pre-Dispatch / Final Finished Goods Inspection** | Outgoing inspection on Finished Goods prior to Delivery Note submission; verify packaging and performance | Critical | Phase 2 | Not Started | Ensures zero defective goods are shipped to clients |
| QA-007 | **Non-Conformance Report (NCR) Logging** | Log quality failures, defect category, severity, photo evidence, root cause, and immediate containment | Critical | Phase 2 | Not Started | Formal documentation of quality non-compliance |
| QA-008 | **Material Disposition Workflow** | QA committee disposition decision: Scrap, Return to Vendor, Rework, or Accept on Concession | Critical | Phase 2 | Not Started | Governs handling of non-conforming inventory |
| QA-009 | **Corrective & Preventive Action (CAPA) Workflow** | 8D problem solving methodology: Problem description, containment, root cause analysis (5-Why), corrective action, preventive action | Critical | Phase 2 | Not Started | ISO 9001 compliance requirement |
| QA-010 | **Customer Quality Complaint Management** | Log customer RMA complaints, defect investigation, link to original serial/batch, resolution tracking | High | Phase 2 | Not Started | Directly ties customer claims to internal QA investigation |
| QA-011 | **Supplier Quality Rating & PPM Analytics** | Calculate Defective Parts Per Million (PPM) and quality score per supplier over rolling 12 months | High | Phase 2 | Not Started | Feeds into vendor selection and procurement negotiations |
| QA-012 | **Calibration Schedule & Instrument Registry** | Calipers, micrometers, pressure gauges registry; calibration due dates, calibration agency certificates | High | Phase 2 | Not Started | Alerts before using uncalibrated measuring instruments |
| QA-013 | **First Article Inspection (FAI) Report** | Comprehensive verification of all blueprint dimensions on the very first unit of a new production run | High | Phase 2 | Not Started | Standard aerospace and precision manufacturing practice |
| QA-014 | **Certificate of Analysis (CoA) Generation** | Auto-generate branded Certificate of Analysis PDF populated with actual test values for client shipments | High | Phase 2 | Not Started | Required for chemical, pharmaceutical, and food shipments |
| QA-015 | **Internal Quality Audit Management** | Annual audit schedule, departmental checklists, audit findings, non-compliance observations and sign-offs | Medium | Phase 3 | Not Started | Aids internal ISO quality audit execution |
| QA-016 | **Material Test Report (MTR) Repository** | Store supplier mill test certificates, chemical composition sheets, and heat numbers | Medium | Phase 2 | Not Started | Full raw material metallurgical traceability |
| QA-017 | **Statistical Process Control (SPC) Charts** | X-bar and R control charts, compute process capability index (Cp, Cpk), trend alerts | High | Phase 3 | Not Started | Detects machine drift before defects occur |
| QA-018 | **Concession / Deviation Permit Workflow** | Temporary technical sign-off to accept parts slightly outside tolerances when function is uncompromised | Medium | Phase 2 | Not Started | Strictly logged deviation authorization |
| QA-019 | **Quality Hold & Quarantine Automated Locks** | System automatically locks warehouse inventory in Quarantine status; blocks pick lists and shipments | Critical | Phase 2 | Not Started | Physically and logically prevents shipping unreleased stock |
| QA-020 | **Cost of Quality (CoQ) Analytics** | Aggregate Prevention costs, Appraisal costs, Internal failure (scrap/rework), and External failure (returns) | High | Phase 3 | Not Started | Executive visibility into the financial cost of poor quality |
| QA-021 | **Inspector Skill Matrix & Certification Tracking** | Record inspector certified testing capabilities (e.g. NDT Level II); enforce qualified inspector sign-off | Medium | Phase 3 | Not Started | Ensures qualified personnel conduct specialized tests |
| QA-022 | **HACCP & Critical Control Point Compliance** | Food & beverage hygiene checklists, temperature logs, sanitation verification records | Medium | Phase 3 | Not Started | Food safety statutory compliance |

---

### 14. Assets (`ASSET`)

*Fixed asset lifecycle management: asset tagging, capitalization, automated depreciation (SLM/WDV), physical audits, maintenance, and disposal.*

**Total Features Tracked**: 22

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| ASSET-001 | **Fixed Asset Category Master** | Asset categories (Plant & Machinery, Buildings, Vehicles, IT Hardware, Furniture), default useful life, GL accounts | Critical | Phase 2 | Not Started | Configures depreciation rates and accounting bindings |
| ASSET-002 | **Fixed Asset Master & Unique Tagging** | Asset code, asset name, serial number, barcode/RFID tag, purchase date, location, custodian employee | Critical | Phase 2 | Not Started | Individual asset identity tracking |
| ASSET-003 | **Capital Work-in-Progress (CWIP) Tracking** | Accumulate building construction or machine erection costs in CWIP GL account before formal commissioning | Critical | Phase 2 | Not Started | Complies with Ind AS 16 asset capitalization rules |
| ASSET-004 | **Asset Capitalization Voucher** | Capitalize CWIP or direct purchase invoice into active Fixed Asset; initiate depreciation schedule | Critical | Phase 2 | Not Started | Transfers value from CWIP to Fixed Asset register |
| ASSET-005 | **Straight Line Method (SLM) Depreciation** | Calculate equal periodic depreciation over asset useful life down to residual salvage value | Critical | Phase 2 | Not Started | Standard corporate financial reporting method |
| ASSET-006 | **Written Down Value (WDV) Depreciation** | Calculate reducing balance depreciation according to Indian Income Tax Act rates and Companies Act Schedule II | Critical | Phase 2 | Not Started | Statutory tax depreciation calculation engine |
| ASSET-007 | **Automated Monthly Depreciation Posting** | Scheduled cron automatically calculates and posts monthly depreciation journal entries across all assets | Critical | Phase 2 | Not Started | Zero manual effort month-end asset accounting |
| ASSET-008 | **Asset Split & Component Accounting** | Split compound asset into sub-components with different lifespans (e.g. Aircraft airframe vs Engine) | High | Phase 3 | Not Started | Mandatory under Ind AS 16 component accounting |
| ASSET-009 | **Asset Location & Custodian Transfer** | Transfer asset between branch locations, departments, or custodian employees; handover sign-off | High | Phase 2 | Not Started | Maintains custody trail for company equipment |
| ASSET-010 | **Physical Asset Audit & Barcode Verification** | Mobile app barcode scan audit; compare physically scanned assets against register; flag missing items | High | Phase 2 | Not Started | Essential for annual physical verification audit |
| ASSET-011 | **Asset Maintenance Schedule & Service Contracts** | Preventive maintenance calendar, AMC contract details, vendor service agreements, scheduled service alerts | High | Phase 2 | Not Started | Prolongs machinery lifespan and prevents unplanned downtime |
| ASSET-012 | **Asset Repair Work Orders & Spare Parts Log** | Log maintenance work orders, technician hours, spare parts consumed from inventory | High | Phase 2 | Not Started | Tracks total cost of equipment maintenance |
| ASSET-013 | **Asset Overhaul Expense Capitalization** | Capitalize major repair expenditures that extend asset useful life directly into asset gross block | High | Phase 2 | Not Started | Adjusts subsequent depreciation schedules accordingly |
| ASSET-014 | **Asset Revaluation Engine** | Record professional fair value revaluation (upward or downward); update revaluation reserve equity account | Medium | Phase 3 | Not Started | Complies with revaluation model under Ind AS 16 |
| ASSET-015 | **Asset Impairment Testing & Write-Down** | Assess recoverable amount; record impairment loss journal entry when carrying amount exceeds recoverable value | Medium | Phase 3 | Not Started | Ind AS 36 impairment of assets compliance |
| ASSET-016 | **Asset Scrapping & Decommissioning Workflow** | Retire obsolete or damaged assets, write off remaining net book value, log salvage scrap income | Critical | Phase 2 | Not Started | Clears retired assets from active books |
| ASSET-017 | **Asset Sale & Disposal Processing** | Sell asset to third party via sales invoice, derecognize gross block and accumulated depreciation, compute gain/loss | Critical | Phase 2 | Not Started | Calculates net profit/loss on asset sale |
| ASSET-018 | **Statutory Fixed Asset Register (FAR)** | Statutory report: Gross Block, Additions, Deductions, Depreciation for Year, Net Block (Companies Act & Income Tax) | Critical | Phase 2 | Not Started | Mandatory schedule for company annual financial statements |
| ASSET-019 | **Asset Insurance Policy Registry** | Insurance policy numbers, Insured Declared Value (IDV), policy expiry alerts, insurance claim tracking | High | Phase 2 | Not Started | Ensures corporate assets remain continuously insured |
| ASSET-020 | **Asset Warranty & OEM Guarantee Tracking** | Track OEM warranty period, warranty certificates, contact details for free warranty replacements | High | Phase 2 | Not Started | Avoids paying for repairs covered by warranty |
| ASSET-021 | **Leased Asset Accounting (Ind AS 116 / IFRS 16)** | Right-of-Use (ROU) asset capitalization, lease liability amortization schedule, interest expense calculation | High | Phase 3 | Not Started | Complies with modern lease accounting standards |
| ASSET-022 | **Asset Utilization & Uptime Analytics** | Log machine run hours, calculate utilization rate %, idle hours analysis | Medium | Phase 3 | Not Started | Assesses return on capital equipment investment |

---

### 15. Projects (`PROJ`)

*Project portfolio management: Work Breakdown Structure (WBS), Gantt scheduling, timesheets, resource allocation, project budgeting, and milestone billing.*

**Total Features Tracked**: 22

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| PROJ-001 | **Project Master & Portfolio Classification** | Project name, client, project type (Internal R&D, Client Billable, Capex), budget, estimated start/end | Critical | Phase 2 | Not Started | Central project tracking entity |
| PROJ-002 | **Work Breakdown Structure (WBS) & Task Hierarchy** | Multi-level nested task tree, task phases, work packages, task milestones, priority flags | Critical | Phase 2 | Not Started | Breaks complex projects into manageable tasks |
| PROJ-003 | **Task Dependency Mapping** | Dependency linkages: Finish-to-Start (FS), Start-to-Start (SS), Finish-to-Finish (FF); lag time in days | Critical | Phase 2 | Not Started | Enables critical path calculation |
| PROJ-004 | **Milestone Tracking & Sign-Off Workflow** | Deliverable milestones, completion verification checklist, formal customer sign-off capture | Critical | Phase 2 | Not Started | Triggers milestone-based invoicing |
| PROJ-005 | **Interactive Project Gantt Chart** | Visual interactive timeline, task bars, dependency connection lines, zoom levels, drag rescheduling | Critical | Phase 2 | Not Started | Visual project execution control |
| PROJ-006 | **Employee Timesheet Logging** | Daily and weekly time tracking against project tasks, billable vs non-billable hours, work notes | Critical | Phase 2 | Not Started | Accurate labor hours capture for costing and billing |
| PROJ-007 | **Timesheet Multi-Level Approval** | Project Manager review and approval/rejection of submitted hours before payroll/billing lock | Critical | Phase 2 | Not Started | Ensures validity of billed client hours |
| PROJ-008 | **Resource Allocation & Workload Balancing** | Assign team members to tasks, track total allocated hours, over-allocation warnings | High | Phase 2 | Not Started | Prevents team burnout and project bottlenecks |
| PROJ-009 | **Project Budgeting & Cost Breakdown** | Cost budgets broken down into Labor, Material, Subcontracting, and Travel expense heads | Critical | Phase 2 | Not Started | Sets project financial boundaries |
| PROJ-010 | **Material Requisition for Project** | Issue inventory from warehouse directly against project task code; book cost to project ledger | High | Phase 2 | Not Started | Direct integration with Inventory module |
| PROJ-011 | **Project Financial Cost Tracking** | Real-time aggregation of timesheet labor costs, material issues, supplier invoices, and expense claims | Critical | Phase 2 | Not Started | Live total project actual cost |
| PROJ-012 | **Milestone-Based Customer Invoicing** | Auto-generate Sales Invoice upon client milestone completion sign-off | Critical | Phase 2 | Not Started | Standard billing model for fixed-fee contracts |
| PROJ-013 | **Time & Material (T&M) Invoicing Engine** | Auto-generate client invoice from approved billable timesheets and project expenses with markup | Critical | Phase 2 | Not Started | Standard billing model for consulting and agency projects |
| PROJ-014 | **Percentage-of-Completion Revenue Recognition** | Recognize revenue based on proportion of actual costs incurred to total estimated contract costs | High | Phase 3 | Not Started | Complies with Ind AS 115 construction contract accounting |
| PROJ-015 | **Project Profitability & Margin Analytics** | Revenue billed vs actual total costs; calculate Gross Margin % and Net Profit per project | Critical | Phase 2 | Not Started | Identifies profitable vs loss-making client contracts |
| PROJ-016 | **Project Risk & Issue Register** | Log risks, probability (Low/Med/High), impact assessment, mitigation strategy, risk owner | High | Phase 2 | Not Started | Proactive risk mitigation tracking |
| PROJ-017 | **Project Kanban Board** | Agile task board (Backlog, Todo, In Progress, Review, Done); sprint tags, story points | High | Phase 2 | Not Started | Facilitates Agile / Scrum software and design workflows |
| PROJ-018 | **Project Document & Blueprint Repository** | Version-controlled CAD drawings, specifications, contract amendments, signed agreements | Medium | Phase 2 | Not Started | Centralized engineering document management |
| PROJ-019 | **Daily Progress Report (DPR) Entry** | Site engineer mobile log: daily workforce count, weather conditions, work completed, site photos | High | Phase 2 | Not Started | Crucial for civil construction and engineering projects |
| PROJ-020 | **Project Closure Checklist & Retention Release** | Handover documentation checklist, client completion certificate, release of retention money | High | Phase 2 | Not Started | Formal contract conclusion workflow |
| PROJ-021 | **Subcontractor Project Work Orders** | Issue subcontracted task packages to specialized vendors, verify subcontractor completion | High | Phase 2 | Not Started | Manages external contractors on large projects |
| PROJ-022 | **Earned Value Management (EVM) Analytics** | Calculate Planned Value (PV), Earned Value (EV), Actual Cost (AC), Cost Variance (CV), Schedule Variance (SV) | High | Phase 3 | Not Started | Project management institute standard performance metrics |

---

### 16. HRMS & Payroll (`HR`)

*Comprehensive human resource management: employee lifecycle, attendance, shifts, leave policies, expense claims, appraisals, salary structures, payroll batch processing, and Indian statutory payroll compliance (PF, ESI, PT, TDS).*

**Total Features Tracked**: 46

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| HR-001 | **Employee Master Directory** | Bio, emergency contact, date of birth, blood group, Aadhaar, PAN, personal/corporate email, bank details | Critical | Phase 1 | Not Started | Central repository for all workforce data |
| HR-002 | **Organizational Hierarchy & Reporting Lines** | Org chart visualization, line managers, department heads, dotted-line functional managers | Critical | Phase 1 | Not Started | Powers all HR workflow approvals and escalations |
| HR-003 | **Department & Designation Masters** | Standard company departments, designation hierarchy, job bands, salary grade linkages | High | Phase 1 | Not Started | Standardized organizational role structure |
| HR-004 | **Employee Lifecycle & Status Tracking** | Probation, Confirmed, On Notice, Relieved, Suspended; automated probation review triggers | High | Phase 1 | Not Started | Tracks career progression and status changes |
| HR-005 | **Biometric Attendance Machine Integration** | Real-time punch sync from biometric devices (ZKTeco, eSSL) via REST API push / automated pull | Critical | Phase 1 | Not Started | Eliminates manual attendance compilation |
| HR-006 | **Shift Roster & Rotating Shift Management** | Shift templates (Morning, General, Night), rotating shift schedules, shift allowance calculations | High | Phase 1 | Not Started | Essential for 24/7 manufacturing and service operations |
| HR-007 | **Geofenced Mobile Attendance** | GPS location verified mobile punch-in/out, selfie verification option, boundary radius rules | High | Phase 2 | Not Started | Enables attendance tracking for field sales and remote workers |
| HR-008 | **Attendance Regularization Workflow** | Employee request for missed punch or out-of-office visit; manager approval workflow | High | Phase 1 | Not Started | Corrects biometric discrepancies cleanly |
| HR-009 | **Leave Type Master** | Earned/Privilege Leave (EL/PL), Casual Leave (CL), Sick Leave (SL), Maternity Leave, Paternity Leave | Critical | Phase 1 | Not Started | Configured with statutory leave rules |
| HR-010 | **Leave Policy & Automated Allocation Engine** | Monthly accrual, annual upfront grant, carry-forward limits, leave encashment rules | Critical | Phase 1 | Not Started | Automated periodic leave ledger crediting |
| HR-011 | **Employee Leave Application & Approval** | Leave application form, leave balance preview, manager review, auto-rejection on negative balance | Critical | Phase 1 | Not Started | Updates employee attendance calendar upon approval |
| HR-012 | **Employee Expense Claim Management** | Travel, food, lodging expense logging, multi-currency support, receipt photo attachment, policy limits | Critical | Phase 1 | Not Started | Standard expense reimbursement submission |
| HR-013 | **Expense Claim Approval & Payment Settlement** | Manager approval, finance audit, auto-generation of Payment Entry / reimbursement via payroll | Critical | Phase 1 | Not Started | Reimburses employees seamlessly |
| HR-014 | **Employee Loan & Advance Management** | Company loan application, interest calculation, monthly EMI deduction automated in payroll | High | Phase 2 | Not Started | Manages employee financial assistance |
| HR-015 | **Job Opening & Headcount Requisition** | Departmental vacancy requests, approved headcount caps, job descriptions, hiring criteria | High | Phase 2 | Not Started | Initiates recruitment cycles |
| HR-016 | **Candidate Tracking & Recruitment Pipeline** | Resume parsing, Kanban applicant stages (Applied, Screened, Interview, Offered, Hired), interview scorecards | High | Phase 2 | Not Started | Streamlines talent acquisition |
| HR-017 | **Job Offer Letter & Contract Generator** | Offer letter templates, salary breakup attachment, digital e-signature acceptance tracking | High | Phase 2 | Not Started | Standardizes corporate hiring documentation |
| HR-018 | **Employee Onboarding & Asset Allocation** | Checklist for Day 1: IT laptop allocation, desk assignment, ID badge issue, statutory forms collection | High | Phase 2 | Not Started | Ensures consistent onboarding experience |
| HR-019 | **Performance Appraisal Cycle Master** | Annual, bi-annual, quarterly appraisal cycles, self-review, peer review, manager evaluation | High | Phase 2 | Not Started | Structured performance appraisal management |
| HR-020 | **Key Result Area (KRA) & Goal Setting** | Individual goal definition, goal weightages, progress percentage updates, alignment with company objectives | High | Phase 2 | Not Started | Objective performance measurement |
| HR-021 | **360-Degree Feedback & Peer Review** | Anonymous peer feedback questionnaires, manager evaluation ratings, consolidated scorecards | Medium | Phase 3 | Not Started | Comprehensive performance feedback |
| HR-022 | **Training Program & Course Directory** | Internal training programs, compliance courses, trainer scheduling, venue and video links | Medium | Phase 2 | Not Started | Employee learning and development catalog |
| HR-023 | **Training Need Identification (TNI)** | Identify skill gaps from performance appraisals; automatically enroll employees in relevant courses | Medium | Phase 3 | Not Started | Ties appraisals directly to training programs |
| HR-024 | **Employee Resignation & Exit Clearance** | Resignation submission, notice period calculation, no-objection clearance from IT, Admin, Finance | Critical | Phase 2 | Not Started | Formal separation workflow |
| HR-025 | **Full & Final (F&F) Settlement Engine** | Auto-calculate unpaid salary, leave encashment, gratuity, notice pay recovery, loan recovery, final tax | Critical | Phase 2 | Not Started | Generates settlement statement and payment voucher |
| HR-026 | **Statutory Gratuity Calculation** | Calculate gratuity as per Indian Payment of Gratuity Act: (15 * Last Drawn Basic * Tenure) / 26 | High | Phase 2 | Not Started | Automated statutory end-of-service benefit |
| HR-027 | **Salary Structure & Component Master** | Earnings: Basic, HRA, Conveyance, Special Allowance; Deductions: PF, ESI, PT, TDS, Loan Recovery | Critical | Phase 1 | Not Started | Flexible compensation framework |
| HR-028 | **Formula-Based Salary Rule Builder** | Define mathematical rules (e.g. HRA = 0.50 * Basic; PF = min(0.12 * Basic, 1800)) | Critical | Phase 1 | Not Started | Handles complex Indian compensation structures |
| HR-029 | **Salary Structure Assignment** | Assign customized salary packages to employees with effective start dates and revision history | Critical | Phase 1 | Not Started | Maintains employee compensation history |
| HR-030 | **Batch Payroll Processing Entry** | One-click batch payroll processing for entire company or branch; calculates earnings and deductions | Critical | Phase 1 | Not Started | Processes thousands of employee salaries in minutes |
| HR-031 | **Employee Salary Slip Generator** | Generate branded PDF pay slips with complete earnings, deductions, leave balances, and company seal | Critical | Phase 1 | Not Started | Complies with statutory payslip issuance rules |
| HR-032 | **Automated Bulk Payslip Email Dispatch** | Automated background worker sends password-protected PDF payslips directly to employee emails | High | Phase 1 | Not Started | Zero manual payslip distribution |
| HR-033 | **Bank Salary Disbursement Statement Export** | Export bank-specific batch upload text/excel file for direct NEFT/RTGS salary credit | Critical | Phase 1 | Not Started | Compatible with HDFC, ICICI, SBI, Axis corporate banking |
| HR-034 | **Employee Income Tax Declaration Portal** | Select Old vs New tax regime, declare 80C, 80D, HRA rent receipts, home loan interest proofs | Critical | Phase 1 | Not Started | Employee self-service tax planning portal |
| HR-035 | **Automated TDS on Salary (Section 192)** | Calculate annual tax liability, compute monthly TDS withholding, adjust dynamically across months | Critical | Phase 1 | Not Started | Complies with Indian Income Tax withholding rules |
| HR-036 | **Form 16 Part A & Part B Generation** | Generate year-end Form 16 salary tax deduction certificates with TRACES integration data | High | Phase 2 | Not Started | Annual statutory employee requirement |
| HR-037 | **Employees' Provident Fund (EPF) Compliance** | Auto-calculate 12% employee and employer share, EPS split, generate monthly ECR text file for EPFO | Critical | Phase 1 | Not Started | Mandatory Indian social security compliance |
| HR-038 | **Employees' State Insurance (ESIC) Compliance** | Check wage ceiling limit (₹21,000/mo), deduct 0.75% employee and 3.25% employer share, export return file | Critical | Phase 1 | Not Started | Mandatory healthcare insurance compliance |
| HR-039 | **State Professional Tax (PT) Slabs Engine** | State-specific monthly PT deduction tables (Maharashtra, Karnataka, West Bengal, Tamil Nadu, etc.) | Critical | Phase 1 | Not Started | Handles multi-state branch payroll tax deductions |
| HR-040 | **Labor Welfare Fund (LWF) Deductions** | Automated periodic LWF deductions based on specific state statutory rules | High | Phase 1 | Not Started | State statutory compliance |
| HR-041 | **Employee Self-Service (ESS) Web & Mobile Portal** | View payslips, check leave balance, apply for leave, submit expense claims, view holiday list | Critical | Phase 1 | Not Started | Empowers employees and reduces HR inquiries |
| HR-042 | **Employee Disciplinary Incident Tracking** | Log disciplinary issues, show-cause notices, inquiry committee proceedings, warnings | Medium | Phase 2 | Not Started | Maintains formal HR disciplinary audit records |
| HR-043 | **Employee Promotion & Transfer Workflow** | Record promotions, salary increments, department/branch transfers; auto-update permissions | High | Phase 2 | Not Started | Maintains historical career progression records |
| HR-044 | **Overtime (OT) Calculation Engine** | Track approved overtime hours, compute single/double rate hourly OT compensation in payroll | High | Phase 2 | Not Started | Statutory overtime compliance under Factories Act |
| HR-045 | **Compensatory Off (Comp-Off) Management** | Auto-credit comp-off leave balance when employee works on weekly off/holiday; auto-expiry rules | High | Phase 2 | Not Started | Fair compensation for non-working day shifts |
| HR-046 | **HR Workforce Analytics & Attrition Dashboard** | Monthly attrition rate %, headcount trends, gender diversity ratio, average tenure, payroll cost per head | High | Phase 2 | Not Started | Executive HR intelligence dashboard |

---

### 17. Customer Support (`SUPP`)

*Omnichannel customer support helpdesk: ticketing, SLA breach escalations, knowledge base, customer portal, warranty entitlements, and field service management.*

**Total Features Tracked**: 22

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| SUPP-001 | **Support Ticket Master & Omnichannel Ingestion** | Ticket creation from Email, Web Form, Customer Portal, WhatsApp, and manual phone call logging | Critical | Phase 2 | Not Started | Consolidates all customer inquiries into unified ticket queue |
| SUPP-002 | **Ticket Classification & Categorization** | Issue category, sub-category, severity (Low, Med, High, Urgent), product family linkage | High | Phase 2 | Not Started | Directs tickets to relevant subject matter specialists |
| SUPP-003 | **Service Level Agreement (SLA) Engine** | Define response and resolution SLA targets based on customer tier (Gold/Silver) and issue severity | Critical | Phase 2 | Not Started | Monitors operational adherence to support commitments |
| SUPP-004 | **Multi-Tier SLA Escalation Matrix** | Automated alert and ticket reassignment to Support Lead and Head of Support upon SLA breach risk | High | Phase 2 | Not Started | Prevents neglected or forgotten customer tickets |
| SUPP-005 | **Intelligent Ticket Assignment & Routing** | Round-robin, agent workload balancing, and skill-based automated ticket routing | High | Phase 2 | Not Started | Balances agent workload and improves first response time |
| SUPP-006 | **Support Agent Collision & Internal Notes** | Visual warning when another agent is viewing/typing; private internal agent notes hidden from customer | High | Phase 2 | Not Started | Prevents duplicate replies and facilitates internal collaboration |
| SUPP-007 | **Canned Responses & Quick Macros** | Library of pre-approved reusable response templates with dynamic customer/ticket placeholders | High | Phase 2 | Not Started | Accelerates resolution for standard recurring inquiries |
| SUPP-008 | **Customer Satisfaction (CSAT / NPS) Surveys** | Automated one-click rating survey sent upon ticket resolution (1-5 Stars + Feedback note) | High | Phase 2 | Not Started | Measures customer satisfaction metrics |
| SUPP-009 | **Knowledge Base (KB) Article Master** | Rich-text article editor, category hierarchy, public self-help articles, internal agent troubleshooting SOPs | High | Phase 2 | Not Started | Powers self-service customer deflections |
| SUPP-010 | **Self-Service Customer Support Portal** | Customer login to submit tickets, track ticket status, attach screenshots, search knowledge base | High | Phase 2 | Not Started | Reduces inbound phone and email volume |
| SUPP-011 | **Warranty & AMC Entitlement Verification** | Instant lookup of serial number / customer AMC contract status before authorizing free repair | Critical | Phase 2 | Not Started | Prevents servicing expired warranty items for free |
| SUPP-012 | **Field Service Dispatch & Work Orders** | Create field service visit, assign field engineer, schedule appointment date/time slot | High | Phase 2 | Not Started | Coordinates on-site technical repairs |
| SUPP-013 | **Mobile Field Technician Interface** | Mobile technician screen: view assigned visits, navigation route, work checklist, client digital signature | High | Phase 2 | Not Started | Empowers field service technicians on the road |
| SUPP-014 | **Field Service Spare Parts Tracking** | Record spare parts consumed from van stock during site repair; update inventory balances | High | Phase 2 | Not Started | Tracks mobile inventory in field technician vans |
| SUPP-015 | **Support Service Billing & Quotation** | Auto-generate Quotation / Sales Invoice for out-of-warranty labor hours and spare parts | High | Phase 2 | Not Started | Monetizes post-warranty support services |
| SUPP-016 | **Ticket Merge & Split Operations** | Merge duplicate tickets from the same customer into a master thread; split multi-issue tickets | Medium | Phase 2 | Not Started | Keeps helpdesk backlog clean and consolidated |
| SUPP-017 | **Comprehensive Ticket Audit Timeline** | Complete chronological history of customer messages, agent replies, status changes, and SLA events | Critical | Phase 2 | Not Started | Full audit visibility into support cases |
| SUPP-018 | **Automated Ticket Inactivity Auto-Close** | Auto-close ticket after 48/72 hours of customer silence following agent resolution | Medium | Phase 2 | Not Started | Keeps active queue focused on open issues |
| SUPP-019 | **Support Agent Performance Dashboard** | First Response Time (FRT), Mean Time to Resolution (MTTR), SLA compliance %, CSAT score by agent | High | Phase 2 | Not Started | Evaluates helpdesk team performance |
| SUPP-020 | **Product Defect Correlation Analytics** | Correlate recurring ticket complaints with specific manufacturing batches or item models | High | Phase 3 | Not Started | Feeds valuable quality improvement data back to Manufacturing |
| SUPP-021 | **Multi-Language Support Translation** | Auto-translate customer tickets and provide translated response drafts for regional inquiries | Low | Phase 3 | Not Started | Supports diverse Indian regional language inquiries |
| SUPP-022 | **Remote Assistance Integration Hooks** | Generate and log TeamViewer / AnyDesk / Zoom remote support session links directly on ticket | Low | Phase 2 | Not Started | Simplifies remote software troubleshooting |

---

### 18. Website & E-commerce (`WEB`)

*Headless CMS, web publishing, corporate blog, public product catalog, B2B wholesale and B2C retail online store, shopping cart, checkout, and portal.*

**Total Features Tracked**: 22

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| WEB-001 | **Dynamic Web Page Builder** | Visual section builder (Hero, Features, Testimonials, FAQ, CTA), Next.js Server Components rendering | High | Phase 2 | Not Started | Allows marketing teams to publish landing pages without code |
| WEB-002 | **Headless Content Management System (CMS)** | Custom content types, rich-text markdown/WYSIWYG editor, image/video media library, SEO metadata | High | Phase 2 | Not Started | Centralized digital content management |
| WEB-003 | **Corporate Blog & News Engine** | Blog posts, author profiles, categories, tags, publication scheduling, reader comments | Medium | Phase 2 | Not Started | Drives organic SEO inbound traffic |
| WEB-004 | **Public Online Product Catalog** | Grid and list views, faceted search filters (Category, Brand, Price Range, Specifications), sorting | Critical | Phase 2 | Not Started | Showcases products to potential buyers online |
| WEB-005 | **Product Detail Page (PDP) Showcase** | Image gallery/carousel, variant selectors (Color, Size), stock availability badge, technical specs table | Critical | Phase 2 | Not Started | High-converting product presentation |
| WEB-006 | **Persistent Shopping Cart Architecture** | Guest cart (localStorage), authenticated cart (database sync), real-time tax calculation, coupon box | Critical | Phase 2 | Not Started | Seamless multi-device shopping experience |
| WEB-007 | **Multi-Step Frictionless Checkout** | Shipping address selection, billing address, courier delivery speed choice, order review | Critical | Phase 2 | Not Started | Optimized for conversion and low cart abandonment |
| WEB-008 | **Online Payment Gateway Integration** | Seamless checkout integration with Razorpay, Cashfree, Stripe, PayU, and dynamic UPI QR | Critical | Phase 2 | Not Started | Secure PCI-DSS compliant payment processing |
| WEB-009 | **Customer Account Web Dashboard** | Customer order history, live parcel tracking status, downloadable tax invoices, profile settings | Critical | Phase 2 | Not Started | Self-service post-purchase customer experience |
| WEB-010 | **Customer Address Book Management** | Save multiple delivery addresses (Home, Office, Warehouse), select default shipping/billing | High | Phase 2 | Not Started | Speeds up repeat order checkout |
| WEB-011 | **Customer Wishlist & Save-for-Later** | Save favorite items to wishlist, move to cart, automated price drop email alerts | Medium | Phase 2 | Not Started | Increases customer retention and repeat visits |
| WEB-012 | **Instant Search & Autocomplete Engine** | Sub-50ms search suggestions with product thumbnails, pricing, and category matching | High | Phase 2 | Not Started | Fast product discovery for buyers |
| WEB-013 | **SEO Optimization & XML Sitemap Generator** | Custom meta titles, descriptions, OpenGraph social cards, auto-generated sitemap.xml and robots.txt | High | Phase 2 | Not Started | Ensures high ranking in search engine results |
| WEB-014 | **B2B Wholesale Ordering Portal** | Wholesale customer login, custom pre-negotiated tiered pricing, bulk Quick-Order Matrix by SKU | Critical | Phase 2 | Not Started | Streamlines high-volume B2B distributor ordering |
| WEB-015 | **Supplier Self-Service Portal** | Vendor login to view open Purchase Orders, upload invoices, submit Advance Shipping Notices (ASN) | High | Phase 2 | Not Started | Improves vendor communication and transparency |
| WEB-016 | **Abandoned Cart Recovery Engine** | Identify abandoned carts; trigger automated email sequences with discount incentives after 2h/24h | High | Phase 3 | Not Started | Recovers lost online store revenue |
| WEB-017 | **Verified Product Reviews & Ratings** | Star ratings, customer written reviews, photo uploads, verified buyer badge, admin moderation | Medium | Phase 2 | Not Started | Builds buyer trust and social proof |
| WEB-018 | **Related Products & Up-Sell / Cross-Sell Engine** | Dynamic product recommendations: 'Frequently Bought Together', 'You May Also Like' | High | Phase 2 | Not Started | Boosts Average Order Value (AOV) |
| WEB-019 | **Promotional Coupon Code Validation** | Single-use codes, minimum order value requirements, percentage or flat discounts at checkout | High | Phase 2 | Not Started | Executes online marketing sales promotions |
| WEB-020 | **Multi-Currency Storefront Display** | Automatic currency conversion display based on visitor IP geolocation; multi-currency checkout | Medium | Phase 3 | Not Started | Essential for cross-border e-commerce sales |
| WEB-021 | **Cookie Consent & Privacy Policy Banner** | Customizable cookie consent banner compliant with GDPR and Indian Digital Personal Data Protection Act | Medium | Phase 2 | Not Started | Ensures legal compliance for public web storefronts |
| WEB-022 | **E-Commerce Funnel Conversion Analytics** | Track visitors, product views, add-to-cart rate, checkout abandonment, and net conversion rate | High | Phase 2 | Not Started | Identifies e-commerce checkout bottlenecks |

---

### 19. Marketing (`MKT`)

*Marketing automation: campaign orchestration, audience segmentation, email/SMS/WhatsApp broadcasts, event management, surveys, and UTM attribution.*

**Total Features Tracked**: 16

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| MKT-001 | **Omnichannel Campaign Orchestrator** | Plan multi-channel marketing campaigns across Email, SMS, WhatsApp, and Social Media; track budgets | High | Phase 2 | Not Started | Unified campaign execution across marketing channels |
| MKT-002 | **Dynamic Audience Segmentation Engine** | Segment leads/customers based on demographic, geographic, purchase history, and behavioral rules | Critical | Phase 2 | Not Started | Enables highly targeted personalized messaging |
| MKT-003 | **Drag-and-Drop Responsive Email Builder** | Visual email template builder, responsive desktop/mobile preview, merge tags for personalization | High | Phase 2 | Not Started | Creates professional marketing newsletters |
| MKT-004 | **Bulk Email Broadcast Engine** | High-throughput transactional/marketing email sending via Amazon SES / SendGrid, bounce handling | High | Phase 2 | Not Started | Complies with anti-spam deliverability standards |
| MKT-005 | **Bulk SMS & WhatsApp Campaign Manager** | Send bulk promotional SMS and WhatsApp Business templates with DLT registration compliance in India | Critical | Phase 2 | Not Started | High-engagement direct messaging channels in India |
| MKT-006 | **Event Management & Guest Registration** | Create seminars/webinars, event landing page, ticket types, automated confirmation emails | Medium | Phase 3 | Not Started | Manages corporate events and product launches |
| MKT-007 | **Event Attendance Check-in & QR Badges** | On-site QR code scanning for attendee check-in, printable name badge generation | Medium | Phase 3 | Not Started | Smooth event registration and attendee tracking |
| MKT-008 | **Customer Feedback & Survey Builder** | Multi-step questionnaires, Net Promoter Score (NPS) questions, rating scales, response analytics | High | Phase 2 | Not Started | Gathers customer feedback directly into ERP records |
| MKT-009 | **Campaign Performance & ROI Analytics** | Track send count, delivery rate, open rate, click-through rate (CTR), attributed revenue, and ROI | High | Phase 2 | Not Started | Measures marketing spend effectiveness |
| MKT-010 | **UTM Tracking & Link Shortener Service** | Built-in link shortener, automatic UTM parameter attachment (source, medium, campaign), click stats | High | Phase 2 | Not Started | Provides accurate marketing attribution data |
| MKT-011 | **Lead Magnet & Content Gating Forms** | Gated whitepapers, brochures, and price guides requiring contact details before download | Medium | Phase 2 | Not Started | Generates qualified inbound leads |
| MKT-012 | **Drip Email Automation Sequences** | Automated sequential nurture workflows (e.g. Day 1 Welcome -> Day 3 Case Study -> Day 7 Demo Offer) | High | Phase 3 | Not Started | Nurtures prospects into sales-ready leads |
| MKT-013 | **Social Media Broadcast Scheduler** | Schedule and publish announcements to LinkedIn, Twitter / X company pages directly from ERP | Low | Phase 3 | Not Started | Maintains social media presence for announcements |
| MKT-014 | **Marketing Digital Asset Library** | Centralized repository for corporate logos, brand guidelines, product photography, brochures | Medium | Phase 2 | Not Started | Ensures brand consistency across campaigns |
| MKT-015 | **Marketing Budget Allocation & Actuals** | Allocate marketing budgets per channel/quarter; track invoice actuals against approved budget | High | Phase 2 | Not Started | Prevents marketing cost overruns |
| MKT-016 | **Opt-In & Consent Management** | Manage customer subscription preferences, one-click unsubscribe links, compliance audit logs | Critical | Phase 2 | Not Started | Complies with DPDP Act and CAN-SPAM regulations |

---

### 20. Reporting & Analytics (`REP`)

*Enterprise reporting and business intelligence: centralized report catalog, pivot tables, chart widgets, executive dashboards, drill-downs, and automated exports.*

**Total Features Tracked**: 26

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| REP-001 | **Centralized Enterprise Report Catalog** | Categorized directory of 100+ standard reports across modules, search, favorites, permission scoping | Critical | Phase 1 | Not Started | One-stop access to all enterprise business intelligence |
| REP-002 | **Dynamic Tabular Grid Report Engine** | Sortable columns, multi-column filters, column reordering, sticky header, sticky summary row | Critical | Phase 1 | Not Started | High-density data grid capable of rendering large datasets |
| REP-003 | **Grouped & Hierarchical Reports** | Multi-level grouping (e.g. Group by Branch -> Customer Group -> Customer), subtotals, grand totals | Critical | Phase 1 | Not Started | Essential for structured financial and operational analysis |
| REP-004 | **Summary & Matrix Aggregate Reports** | Matrix aggregation tables, sum, average, min, max, count metrics across intersecting dimensions | High | Phase 1 | Not Started | Produces concise management summaries |
| REP-005 | **Interactive Dynamic Pivot Table Builder** | Drag-and-drop rows, columns, and metric values to create customized analytical perspectives on the fly | High | Phase 2 | Not Started | Empowers business analysts without writing code |
| REP-006 | **Interactive Charting & Visualization Engine** | Bar charts, stacked bars, line charts, area charts, donut charts, scatter plots, radar charts | High | Phase 1 | Not Started | Visualizes trends and patterns across any dataset |
| REP-007 | **Real-Time KPI Metric Card Widgets** | Single-value metric cards with period-over-period percentage delta badges and mini sparklines | High | Phase 1 | Not Started | Highlights critical top-level numbers on dashboards |
| REP-008 | **Dashboard 1: Executive C-Suite Overview** | High-level consolidated view: Revenue, Gross Margin, Net Cash, Working Capital, Total Headcount | Critical | Phase 1 | Not Started | Provides CEO/Board with instant enterprise health check |
| REP-009 | **Dashboard 2: Financial Performance & Liquidity** | P&L trends, expense breakdown, cash balance by bank, DSO, DPO, quick ratio | Critical | Phase 1 | Not Started | Primary cockpit for CFO and finance teams |
| REP-010 | **Dashboard 3: Sales & Pipeline Operations** | Booked sales, pipeline stage funnel, win/loss ratio, top customer revenue, sales rep leaderboard | Critical | Phase 1 | Not Started | Commercial leadership monitoring dashboard |
| REP-011 | **Dashboard 4: Procurement & Spend Analytics** | Monthly spend trends, top suppliers by volume, purchase price variance, open PO backlog | High | Phase 1 | Not Started | Procurement optimization cockpit |
| REP-012 | **Dashboard 5: Inventory Valuation & Stock Movement** | Total stock valuation, warehouse distribution, stockout risk alerts, slow-moving inventory | Critical | Phase 1 | Not Started | Warehouse and supply chain operational overview |
| REP-013 | **Dashboard 6: Manufacturing Shop Floor Performance** | Overall Equipment Effectiveness (OEE), machine downtime, production yield %, work order backlog | High | Phase 2 | Not Started | Factory operations monitoring |
| REP-014 | **Dashboard 7: HR & Workforce Analytics** | Headcount by department, monthly payroll cost trend, absenteeism rate, attrition rate | High | Phase 2 | Not Started | HR leadership operational insights |
| REP-015 | **Dashboard 8: Customer Support & SLA Compliance** | Open ticket volume, First Response Time, SLA breach rate %, CSAT rating trends | High | Phase 2 | Not Started | Helpdesk service quality monitoring |
| REP-016 | **Dashboard 9: Quality & Defect Pareto Analytics** | Incoming defect PPM, scrap cost, Pareto chart of defect root causes, open CAPAs | High | Phase 2 | Not Started | Quality assurance metrics |
| REP-017 | **Dashboard 10: Retail POS Store Performance** | Store-by-store sales comparison, peak hourly billing traffic, average basket size, split tender share | High | Phase 2 | Not Started | Retail operations management |
| REP-018 | **Dashboard 11: India GST & Statutory Tax Dashboard** | Output GST liability vs Input Tax Credit (ITC), net payable, GSTR-2B reconciliation discrepancy | Critical | Phase 1 | Not Started | Statutory tax compliance tracking |
| REP-019 | **Dashboard 12: Project Health & Budget Burn** | Project milestones completed %, actual vs budget burn, billable timesheet utilization rate | High | Phase 2 | Not Started | Project portfolio tracking |
| REP-020 | **Dashboard 13: Fixed Asset Status & Depr. Run** | Gross block by category, monthly depreciation run status, maintenance work orders open | Medium | Phase 2 | Not Started | Asset management overview |
| REP-021 | **Dashboard 14: Marketing Campaign ROI & Attribution** | Customer acquisition cost (CAC), lead conversion funnel, channel attribution revenue | High | Phase 2 | Not Started | Marketing expenditure effectiveness |
| REP-022 | **Interactive Forensic Drilldown Engine** | Click any chart bar or report aggregate number to drill down to underlying line transactions | Critical | Phase 1 | Not Started | Instant forensic verification for auditors and managers |
| REP-023 | **Scheduled Automated Report Email Delivery** | Automate delivery of daily sales or weekly financial PDF/Excel reports to executive inboxes | High | Phase 2 | Not Started | Keeps stakeholders informed without requiring login |
| REP-024 | **Custom SQL / Query Report Studio** | Write parameterized SQL queries with strict read-only safety guards, dynamic filter parameters | High | Phase 2 | Not Started | Enables power users to build bespoke custom reports |
| REP-025 | **Universal Multi-Format Report Export** | One-click high-fidelity export to Microsoft Excel (.xlsx), CSV, formatted PDF, and raw JSON | Critical | Phase 1 | Not Started | Standard export across all enterprise reports |
| REP-026 | **Granular Report Access Permission Controls** | Restrict report access by user role, department, or company context | Critical | Phase 1 | Not Started | Prevents unauthorized viewing of sensitive financial figures |

---

### 21. API & Integrations (`API`)

*Integration architecture: OpenAPI REST endpoints, secure token authentication, rate limiting, outgoing/incoming webhooks, and third-party connector adapters.*

**Total Features Tracked**: 22

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| API-001 | **OpenAPI 3.0 & Swagger UI Documentation** | Interactive API explorer, schema definitions for all DocTypes, sample code snippets (cURL, Python, TS) | Critical | Phase 1 | Not Started | Comprehensive developer documentation |
| API-002 | **JWT & Session Token Authentication** | Cryptographically signed JSON Web Tokens for frontend and API clients, short expiration with refresh tokens | Critical | Phase 1 | Not Started | Standard modern authentication protocol |
| API-003 | **Personal Access Tokens & API Key Management** | User-generated API keys with custom labels, expiration dates, last used timestamp, instant revocation | Critical | Phase 1 | Not Started | Enables programmatic machine-to-machine integrations |
| API-004 | **Granular API Scope & Permission Enforcement** | Enforce exact read/write permissions per entity on API requests matching the user's role profile | Critical | Phase 1 | Not Started | Prevents API privilege escalation |
| API-005 | **Tenant-Level API Rate Limiting & Throttling** | Configurable requests per minute per tenant/API key; HTTP 429 Too Many Requests response | High | Phase 1 | Not Started | Protects server stability from runaway integration loops |
| API-006 | **Outbound Webhook Subscription Management** | Register webhook URLs for specific events (e.g. sales_order.created, payment.received) | High | Phase 2 | Not Started | Powers real-time external event automation |
| API-007 | **Webhook Delivery Queue with Exponential Backoff** | Background delivery worker with automatic retries (1m, 5m, 1h), dead letter queue for dead endpoints | High | Phase 2 | Not Started | Guarantees at-least-once webhook delivery |
| API-008 | **HMAC-SHA256 Webhook Payload Signatures** | Cryptographic signature in X-Vyapar-Signature header to verify authenticity and payload integrity | High | Phase 2 | Not Started | Ensures receiver can verify payload authenticity |
| API-009 | **Inbound Webhook Listener Framework** | Secure endpoints to receive third-party events (Stripe, Razorpay, Delhivery, Shopify) | High | Phase 2 | Not Started | Parses incoming payloads into native ERP events |
| API-010 | **GSTN & NIC E-Invoice / E-Way Bill Adapter** | Certified GSP/ASP connector for Indian government tax portal API integration | Critical | Phase 1 | Not Started | Core compliance integration module |
| API-011 | **Indian Payment Gateway Adapters** | Pre-built connector adapters for Razorpay, Cashfree, PayU, and PhonePe PG | Critical | Phase 1 | Not Started | Direct integration with leading Indian payment providers |
| API-012 | **International Payment Gateway Adapters** | Pre-built connector adapters for Stripe and PayPal checkout | High | Phase 2 | Not Started | Required for international cross-border transactions |
| API-013 | **Logistics & Courier Service Adapters** | Pre-built connectors for Shiprocket, Delhivery, Bluedart, and FedEx APIs | High | Phase 2 | Not Started | Automates airway bill creation and shipment tracking |
| API-014 | **SMS Gateway Integration Adapters** | Connectors for Indian DLT-compliant SMS providers (Fast2SMS, Gupshup, Textlocal) | High | Phase 1 | Not Started | Direct transactional and OTP SMS delivery |
| API-015 | **WhatsApp Business Cloud API Adapter** | Meta Cloud API connector for automated transactional WhatsApp message delivery with templates | High | Phase 1 | Not Started | High-converting messaging channel for Indian businesses |
| API-016 | **Transactional Email Provider Adapters** | API adapters for SendGrid, AWS SES, Postmark, and Resend with webhook bounce tracking | Critical | Phase 1 | Not Started | Guarantees high transactional email deliverability |
| API-017 | **Cloud Object Storage Adapters** | Pluggable storage drivers for Supabase Storage, AWS S3, Cloudflare R2, and Azure Blob | Critical | Phase 1 | Not Started | Ensures cloud infrastructure portability |
| API-018 | **Biometric Attendance Device API Adapter** | Push/pull attendance punch logger adapter supporting ZKTeco, eSSL, and ADMS protocols | High | Phase 1 | Not Started | Integrates physical attendance turnstiles with HRMS |
| API-019 | **E-Commerce Platform Sync Adapters** | Bi-directional sync connectors for Shopify and WooCommerce (Inventory, Orders, Customers) | High | Phase 2 | Not Started | Powers multi-channel online sales |
| API-020 | **Corporate Banking API Adapters** | Direct API connectors for ICICI Corporate Banking and HDFC Bank E-Net for automated payouts | High | Phase 2 | Not Started | Enables one-click salary and vendor disbursements from ERP |
| API-021 | **Calendar & Productivity Adapters** | Two-way synchronization with Google Calendar, Microsoft 365 Outlook, and Slack alerts | Medium | Phase 2 | Not Started | Keeps teams synchronized across enterprise productivity tools |
| API-022 | **iPaaS Automation Connectors (Zapier / Make / n8n)** | Verified integration apps for Zapier, Make.com, and self-hosted n8n workflows | Medium | Phase 2 | Not Started | Enables no-code integration with 5,000+ external apps |

---

### 22. Low-Code Customization (`CODE`)

*Extensibility framework: dynamic custom fields, custom form sections, client/server validation rules, visual print format designer, workflow designer, and schema export.*

**Total Features Tracked**: 16

| # | Feature | Sub-features | Priority | Phase | Status | Notes |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| CODE-001 | **Low-Code Custom Field Studio** | Add custom fields to any DocType (Text, Currency, Date, Link, Select, Multi-select, Checkbox) without code | Critical | Phase 2 | Not Started | Adapts ERP to unique business industry requirements |
| CODE-002 | **Visual Drag-and-Drop Form Layout Designer** | Reorganize sections, split columns, add tabs, reorder fields visually using drag-and-drop | High | Phase 2 | Not Started | Tailors data entry screens to specific department needs |
| CODE-003 | **Client-Side Dynamic Form Scripting** | Visual condition builder: Show/Hide fields, make Mandatory, set Read-Only based on other field values | Critical | Phase 2 | Not Started | Improves user experience and prevents invalid entries |
| CODE-004 | **Server-Side Validation Expression Rules** | Define mathematical and logical validation rules evaluated before saving or submitting documents | Critical | Phase 2 | Not Started | Enforces strict data integrity at the database boundary |
| CODE-005 | **Dynamic Naming Series Rule Customizer** | Configure bespoke document numbering formats (e.g. INV/{YYYY}/{branch}/{#####}) with custom reset rules | High | Phase 2 | Not Started | Customizes document identifiers to match existing company habits |
| CODE-006 | **Visual Drag-and-Drop Print Format Designer** | WYSIWYG print template builder, drag company logo, item table, tax summary, terms; custom CSS styling | Critical | Phase 2 | Not Started | Enables non-developers to design custom invoice templates |
| CODE-007 | **Custom Dashboard & Widget Studio** | Create custom dashboards by selecting metric cards, charts, and lists with drag-and-drop arrangement | High | Phase 2 | Not Started | Allows managers to build their own operational monitoring cockpits |
| CODE-008 | **User-Defined Custom Report Studio** | Select DocType, choose columns, specify sort order, apply permanent filters, save as named custom report | Critical | Phase 2 | Not Started | Eliminates dependency on developers for new reports |
| CODE-009 | **Visual Workflow State Machine Designer** | Visual node-based workflow editor: create custom states, draw transitions, assign required approval roles | Critical | Phase 2 | Not Started | Adapts approval chains to internal organizational hierarchy |
| CODE-010 | **Event-Driven Notification Rule Builder** | Visual trigger builder: 'When Quotation > ₹5,00,000 is submitted, send WhatsApp alert to Sales Director' | High | Phase 2 | Not Started | Empowers business users to automate alerts |
| CODE-011 | **Custom Action Buttons & Context Menu Commands** | Add custom action buttons to document header (e.g. 'Generate Work Order', 'Send to Transporter') | High | Phase 2 | Not Started | Extends standard UI with custom operational workflows |
| CODE-012 | **Dynamic Computed Formula Field Engine** | Define formula fields calculated automatically (e.g. 'margin = selling_price - cost_price') | High | Phase 2 | Not Started | Real-time calculations without backend code changes |
| CODE-013 | **Custom Child Table Builder** | Embed custom repeatable sub-tables into any document with custom columns and sum totals | High | Phase 2 | Not Started | Supports complex multi-line data structures |
| CODE-014 | **Dynamic Link Filter Query Rules** | Restrict selectable options in Link fields based on other document fields (e.g. Filter Warehouses by Branch) | High | Phase 2 | Not Started | Prevents cross-branch record association errors |
| CODE-015 | **Custom Terminology & Translation Overrides** | Override standard labels (e.g. rename 'Customer' to 'Client' or 'Patient') across the entire UI | Medium | Phase 2 | Not Started | Customizes system vernacular for healthcare, legal, or non-profit sectors |
| CODE-016 | **Customization Package Export & Import** | Bundle all custom fields, workflows, print formats, and scripts into a portable JSON package for deployment | High | Phase 3 | Not Started | Facilitates staging-to-production migration of customizations |

---

## 5. Implementation Roadmap & Phased Execution Strategy

### Phase 1: Core Foundation & Financial Spine (Months 1–4)
- **Objective**: Establish production-ready tenant isolation, security, master data models, core supply chain transactions (Order-to-Cash, Procure-to-Pay), double-entry accounting, and statutory Indian GST/E-Invoicing compliance.
- **Key Deliverables**:
  1. Metadata-driven DocType registry, Dynamic Numbering Series, Audit Trail triggers.
  2. Multi-company hierarchy, Chart of Accounts, Bank Accounts, and Tax Templates.
  3. Item master, batch/serial tracking, FIFO/Moving Average valuation engine.
  4. Sales Order -> Delivery Challan -> GST Sales Invoice -> Payment Entry workflow.
  5. Purchase Requisition -> RFQ -> PO -> GRN -> Purchase Bill -> Payment workflow.
  6. NIC E-Invoice IRN API, E-Way Bill generation, and GSTR-1 / GSTR-3B auto-computation.
  7. Real-time General Ledger posting, Trial Balance, P&L, Balance Sheet, and AR/AP Aging.

### Phase 2: Operations, HR, POS & Low-Code Customization (Months 5–8)
- **Objective**: Expand operational capabilities into Retail, CRM, Discrete Manufacturing, Project Billing, HRMS, and self-service customization.
- **Key Deliverables**:
  1. High-speed retail POS with touch cart, split tender, UPI QR, and offline IndexedDB sync.
  2. CRM pipeline, round-robin lead distribution, activity logger, and quotation conversion.
  3. Multi-level BOM, production routing, work order dispatch, and MRP calculations.
  4. Indian payroll engine (PF, ESIC, Professional Tax, TDS Section 192, bulk payslips).
  5. Quality control inspections (Incoming GRN, In-Process, Pre-Dispatch) and CAPA workflows.
  6. Fixed Asset register with automated SLM / WDV depreciation postings.
  7. Low-code custom fields studio, dynamic form layout builder, and visual print format designer.

### Phase 3: Enterprise Deepening & Omni-Channel Scaling (Months 9–12)
- **Objective**: Deliver enterprise multi-facility scheduling, advanced analytics, marketing automation, customer support portals, and headless e-commerce.
- **Key Deliverables**:
  1. Rough Cut Capacity Planning (RCCP) and visual interactive workstation Gantt scheduling.
  2. Earned Value Management (EVM) for complex contracting and civil projects.
  3. B2B Wholesale Customer Portal and Supplier Self-Service Invoicing Portal.
  4. Marketing automation drip workflows, audience segmentation, and link attribution.
  5. Corporate banking API integration (ICICI / HDFC) for direct salary and vendor NEFT payouts.
  6. Complete multi-entity financial consolidation with inter-company elimination journals.

### Phase 4: Advanced AI, Optimization & Global Scale (Months 13+)
- **Objective**: Introduce predictive machine learning models, autonomous demand forecasting, intelligent bank matching, and global multi-region deployments.
- **Key Deliverables**:
  1. Autonomous cash flow forecasting and predictive inventory stockout warnings.
  2. AI-powered invoice receipt OCR ingestion and auto-coding to GL accounts.
  3. Multi-region database replication and international localized tax packs (US Sales Tax, VAT).
  4. Third-party developer marketplace and plugin SDK.

---

## 6. Guidelines for Updating and Maintaining this Inventory

1. **Single Source of Truth**: This document represents the authoritative functional scope for VyaparSuite ERP. Any architectural or feature additions must be indexed here before sprint allocation.
2. **Updating Feature Status**: When beginning work on a feature, transition the status in this document from `Not Started` to `Analysed` -> `Designed` -> `Partially Implemented` -> `Implemented` -> `Tested` -> `Production Ready`.
3. **Documenting Blockers**: If a feature status is moved to `Blocked`, the specific dependency or reason must be documented in the `Notes` column with the blocking issue ticket reference.
4. **Preserving Schema Integrity**: All table rows must strictly adhere to the 7-column schema (`| # | Feature | Sub-features | Priority | Phase | Status | Notes |`) to enable automated script-based parsing and CI/CD validation.
