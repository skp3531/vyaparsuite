# VyaparSuite ERP - Master System Architecture Specification

> **Document Status**: Production Architecture Specification  
> **Target Release**: VyaparSuite v1.0.0  
> **Domain**: Indian MSMEs & International Multi-Company Enterprises  
> **Scope**: Functional Parity with ERPNext & Odoo Community Editions  
> **Core Tech Stack**: Next.js 15+ (App Router, React 19, TypeScript 5+), Tailwind CSS v4, PostgreSQL 16+ (Supabase / Self-Hosted), Redis / BullMQ, Web Crypto API  

---

## Table of Contents

1. [Architecture Overview & Core Principles](#1-architecture-overview--core-principles)
   - 1.1 Architectural Style: Modular Monolith
   - 1.2 Unidirectional Layered Architecture
   - 1.3 Domain-Driven Design (DDD) Boundaries
   - 1.4 High-Level System Context (C4 Level 1)
2. [Complete Project Directory Structure](#2-complete-project-directory-structure)
   - 2.1 Workspace Root & System Hierarchy
   - 2.2 Domain Modules Directory Deep-Dive
   - 2.3 Shared Framework & Infrastructure Layout
3. [Standard Module Architecture](#3-standard-module-architecture)
   - 3.1 Anatomy of a VyaparSuite Module
   - 3.2 The Module Manifest (`module.config.ts`)
   - 3.3 Inter-Module Communication Contracts
   - 3.4 Cross-Module Transaction Boundary Rules
4. [Core Document Framework (Meta-Engine)](#4-core-document-framework-meta-engine)
   - 4.1 Metadata-Driven Document Paradigm
   - 4.2 The `BaseDocument` Contract
   - 4.3 Three-Tier Document Lifecycle State Machine
   - 4.4 Atomic Document Numbering Service
   - 4.5 Validation & Hook Execution Pipeline
   - 4.6 Document Permission Model (Doc-Level & Field-Level)
   - 4.7 Audit Trail, Versioning, and Diff Engine
   - 4.8 Document Attachments, Comments, and Timeline
   - 4.9 Document Amendment Engine
5. [Database Architecture & Multi-Tenancy](#5-database-architecture--multi-tenancy)
   - 5.1 Multi-Tenancy Strategy: Shared Database, Isolated Records
   - 5.2 Database Conventions & Naming Standards
   - 5.3 Indexing Strategy & Optimization
   - 5.4 Table Partitioning Strategy (GL & Stock Ledgers)
   - 5.5 Migration Management & Schema Evolution
   - 5.6 Seed Data & Country Localizations
6. [Authentication & Authorization Architecture](#6-authentication--authorization-architecture)
   - 6.1 Authentication Topology & Token Lifecycle
   - 6.2 Claims Injection & Tenant Identification
   - 6.3 Granular Role-Based Access Control (RBAC) Engine
   - 6.4 PostgreSQL Row-Level Security (RLS) Implementation
   - 6.5 Dynamic Permission Resolution Algorithm
   - 6.6 User Assignments & Record-Level Security
7. [Event-Driven Architecture & Transactional Outbox](#7-event-driven-architecture--transactional-outbox)
   - 7.1 Event System Topology (Synchronous vs Asynchronous)
   - 7.2 Domain Event Schema & Event Catalog
   - 7.3 Transactional Outbox Pattern
   - 7.4 Double-Entry Accounting Posting Engine
   - 7.5 Real-Time Stock Ledger & Inventory Valuation Engine
8. [Infrastructure Abstraction Layer (Adapters)](#8-infrastructure-abstraction-layer-adapters)
   - 8.1 Database Adapter (`IDatabaseAdapter`)
   - 8.2 Authentication Adapter (`IAuthAdapter`)
   - 8.3 File Storage Adapter (`IStorageAdapter`)
   - 8.4 Background Job Queue Adapter (`IQueueAdapter`)
   - 8.5 Distributed Caching Adapter (`ICacheAdapter`)
   - 8.6 Transactional Email & Messaging Adapter (`IEmailAdapter`)
   - 8.7 Enterprise Search Adapter (`ISearchAdapter`)
9. [Security Architecture & Zero-Trust Posture](#9-security-architecture--zero-trust-posture)
   - 9.1 Multi-Layer Defense in Depth
   - 9.2 Input Sanitization & Schema Validation (Zod)
   - 9.3 SQL Injection & ORM Escaping Safeguards
   - 9.4 Cross-Site Scripting (XSS) & Content Security Policy (CSP)
   - 9.5 Cross-Site Request Forgery (CSRF) & State Verifications
   - 9.6 Adaptive Rate Limiting & Brute-Force Throttling
   - 9.7 Cryptographic Envelope Encryption for Sensitive MSME Data
10. [Performance & Scalability Architecture](#10-performance--scalability-architecture)
    - 10.1 React Server Components (RSC) vs Client Components
    - 10.2 Relational Query Optimization & Anti-N+1 Patterns
    - 10.3 High-Volume Pagination Architectures (Keyset vs Offset)
    - 10.4 Tiered Caching Strategy (L1 Memory, L2 Redis, L3 HTTP Data Cache)
    - 10.5 Heavy Workload Delegation & Asynchronous Task Processing
    - 10.6 Dynamic Code Splitting & Module Hydration
11. [Deployment, Infrastructure & DevOps](#11-deployment-infrastructure--devops)
    - 11.1 Target Environments (Local, Staging, Cloud Production)
    - 11.2 Self-Hosted & Air-Gapped Deployment Architecture
    - 11.3 CI/CD Pipeline & Quality Gates
    - 11.4 Telemetry, OpenTelemetry Tracing, and Logging
12. [Architectural Visualizations (Mermaid Diagrams)](#12-architectural-visualizations-mermaid-diagrams)
    - 12.1 System Context Diagram
    - 12.2 Container Architecture Diagram
    - 12.3 Modular Monolith Dependency Graph
    - 12.4 End-to-End Request/Execution Sequence Diagram
    - 12.5 Asynchronous Outbox & Accounting Event Pipeline
    - 12.6 Authentication & RLS Resolution Sequence

---

## 1. Architecture Overview & Core Principles

VyaparSuite is an open, modular enterprise resource planning platform engineered to address the functional density of legacy ERPs (such as ERPNext and Odoo) while utilizing modern cloud architecture: Next.js App Router, TypeScript, Tailwind CSS, PostgreSQL, and Supabase.

```
+---------------------------------------------------------------------------------------+
|                                   VyaparSuite ERP                                     |
|                                                                                       |
|   +-----------------------+   +-----------------------+   +-----------------------+   |
|   |      Presentation     |   |          API          |   |      Application      |   |
|   |  RSC, Client Islands  |-->| Server Actions, Route |-->| Domain Services, Use |   |
|   |    Tailwind UI/UX     |   | Handlers, Webhooks    |   | Cases, Orchestration  |   |
|   +-----------------------+   +-----------------------+   +-----------+-----------+   |
|                                                                       |               |
|   +-------------------------------------------------------------------+-----------+   |
|   |                                                                   v               |
|   |   +-----------------------+   +-----------------------+   +-------------------+   |
|   |   |     Data Layer        |   |     Infrastructure    |   |    Domain Layer   |   |
|   |   | PostgreSQL, Multi-    |<--| Database, Auth, Cache |<--| Pure Logic, State |   |
|   |   | Tenant RLS, Partitions|   | Storage, Queue Adapts |   | Invariants, Maths |   |
|   |   +-----------------------+   +-----------------------+   +-------------------+   |
+---+-----------------------------------------------------------------------------------+
```

### 1.1 Architectural Style: Modular Monolith
Rather than deploying microservices—which impose distributed transaction overhead, operational complexity, and network latency unsuited for complex enterprise accounting—VyaparSuite is architected as an **In-Process Modular Monolith**.

1. **High Cohesion, Low Coupling**: Every business module (Sales, Purchase, Accounting, HRMS, etc.) encapsulates its own schemas, domain logic, data contracts, and UI components.
2. **Explicit Public Interfaces**: Modules communicate across strict boundaries using typed Domain Services or asynchronous Domain Events. Direct cross-module database querying is strictly forbidden by architectural linters.
3. **Microservice Readiness**: While running in a unified runtime for operational simplicity, each module maintains boundary hygiene such that any module (e.g., POS, Inventory Valuation, Background Reporting) can be extracted into an independent microservice if required.

### 1.2 Unidirectional Layered Architecture
VyaparSuite enforces a strict six-layer architecture with unidirectional dependencies:

```
[Presentation Layer]
        │
        ▼
   [API Layer]
        │
        ▼
[Application Layer]
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
[Domain Layer]        [Infrastructure Layer]
                                 │
                                 ▼
                           [Data Layer]
```

- **1. Presentation Layer (`src/app`, `src/components`)**:
  - Implements UI using React Server Components (RSC) by default for zero client bundle overhead and rapid server-side rendering.
  - Interactive Client Components (`"use client"`) are isolated to leaf nodes (dynamic tables, barcode inputs, rich form fields).
  - Strictly presents state and captures user intent. Contains zero business calculations or direct SQL queries.
- **2. API Layer (`src/app/api`, Server Actions in `src/modules/*/actions`)**:
  - Validates request payloads through Zod schemas.
  - Resolves authentication context, tenancy headers, and request tracing IDs.
  - Translates transport protocols (HTTP REST, Webhooks, Server Actions) into Application Service invocations.
- **3. Application / Service Layer (`src/modules/*/services`)**:
  - Implements use cases and workflow orchestrations.
  - Manages database transaction boundaries (`Unit of Work`).
  - Coordinates inter-module operations (e.g., triggering stock allocation when a Sales Invoice is approved).
  - Publishes Domain Events to the transactional outbox.
- **4. Domain Layer (`src/modules/*/types`, Domain Models)**:
  - Contains enterprise business rules, mathematical invariants, state machines, and valuation logic.
  - Pure, side-effect-free TypeScript code.
  - Absolutely zero external dependencies (no database clients, no HTTP libraries, no framework references).
- **5. Infrastructure Layer (`src/lib/*`, Adapters)**:
  - Implements technical capabilities through defined ports/interfaces.
  - Houses adapters for Supabase, PostgreSQL connection pools, Redis, BullMQ, AWS S3, Resend, and Indian Government GST/E-Way Bill APIs.
- **6. Data Layer (`supabase/migrations`, PostgreSQL Engine)**:
  - Physical database schema, tables, foreign keys, triggers, Row-Level Security policies, and partition definitions.

### 1.3 Domain-Driven Design (DDD) Boundaries
The platform is partitioned into autonomous Bounded Contexts:

| Bounded Context | Core Aggregates | Ubiquitous Language Key Terms |
| :--- | :--- | :--- |
| **Identity & Access** | `User`, `Role`, `Tenant`, `Permission` | Tenant, Organization, Branch, Role, Permission Set, RLS |
| **Organization Setup** | `Company`, `FiscalYear`, `CostCenter` | Consolidated Company, Base Currency, Chart of Cost Centers |
| **Financial Accounting** | `Account`, `GL_Entry`, `JournalEntry`, `PaymentEntry` | Double-Entry, Debit, Credit, Posting Date, Reconciliation |
| **Inventory & Warehousing** | `Item`, `Warehouse`, `StockLedgerEntry`, `Batch` | Stock Balance, Valuation Rate, FIFO, Moving Average, UOM |
| **Sales & Distribution** | `Quotation`, `SalesOrder`, `DeliveryNote`, `SalesInvoice` | Naming Series, Fulfillment, Payment Terms, Price List |
| **Procurement** | `MaterialRequest`, `PurchaseOrder`, `PurchaseReceipt` | Landed Cost, Drop Shipping, Bill of Materials, Three-Way Match |
| **Indian Compliance** | `GSTIN`, `GSTR_1`, `GSTR_3B`, `EWayBill`, `EInvoice` | HSN/SAC, CGST, SGST, IGST, IRN, QR Code, Reverse Charge |
| **Human Resources** | `Employee`, `Attendance`, `LeaveApplication`, `SalarySlip` | Cost to Company (CTC), Provident Fund (PF), ESI, Professional Tax |

---

## 2. Complete Project Directory Structure

VyaparSuite enforces a deterministic, predictable repository structure. All application code is co-located under `src/`, with infrastructure-as-code under `supabase/` and end-to-end specifications under `tests/` and `docs/`.

```
/Volumes/Personal/antigravity app/erpnext/erpnext_V_01/
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Lint, Test, Typecheck, Build
│       ├── db-migrate.yml             # Automated Supabase/PostgreSQL schema migrations
│       └── security-scan.yml          # Trivy & Snyk dependency & vulnerability scanning
├── config/
│   ├── app.config.ts                  # Global application constants & feature flags
│   ├── currencies.config.ts           # Supported international & local currency formats
│   └── tax.config.ts                  # Default country tax matrix registries
├── docs/
│   ├── SYSTEM_ARCHITECTURE.md         # Master System Architecture (This Document)
│   ├── DATABASE_SCHEMA.md             # Comprehensive Data Dictionary & DDL Reference
│   ├── MODULE_SPECIFICATIONS.md       # Deep Functional Spec for all 18 Modules
│   ├── INDIA_COMPLIANCE.md            # GST, E-Way Bill, E-Invoice, TDS/TCS Technical Manual
│   └── API_REFERENCE.md               # OpenAPI / REST / Server Action Interface Spec
├── supabase/
│   ├── config.toml                    # Supabase CLI local configuration
│   ├── migrations/
│   │   ├── 00001_initial_schema.sql   # Core tenant, user, and authorization schema
│   │   ├── 00002_core_engine.sql      # Document framework, numbering, audit tables
│   │   ├── 00003_accounting.sql       # Chart of accounts, GL entries, journals
│   │   ├── 00004_inventory.sql        # Items, warehouses, stock ledgers, batches
│   │   ├── 00005_sales_purchase.sql   # Orders, invoices, delivery notes, receipts
│   │   ├── 00006_india_compliance.sql # GSTIN, e-invoicing, tax rules, HSN codes
│   │   └── 00007_partitions.sql      # Range partitioning for GL and Stock Ledgers
│   ├── seed/
│   │   ├── 01_system_roles.sql        # Standard ERP roles & permissions
│   │   ├── 02_uom_data.sql            # International & Indian UOMs
│   │   ├── 03_india_chart_of_accounts.sql # Standard Indian Schedule III COA
│   │   └── 04_demo_tenant.sql         # Optional sandbox demonstration data
│   └── functions/                     # Supabase Edge Functions (Webhooks, Cron)
│       ├── e-invoice-sync/
│       └── bank-statement-parser/
├── tests/
│   ├── e2e/                           # Playwright End-to-End Test Suites
│   │   ├── auth.spec.ts
│   │   ├── sales-cycle.spec.ts        # Quote -> Order -> Delivery -> Invoice -> Payment
│   │   └── gst-filing.spec.ts
│   ├── integration/                   # Cross-Module Integration Tests
│   └── unit/                          # Isolated Mathematical & Engine Unit Tests
├── src/
│   ├── app/                           # Next.js 15+ App Router
│   │   ├── (auth)/                    # Authentication Route Group (Clean Layout)
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── forgot-password/
│   │   │   └── verify-mfa/
│   │   ├── (app)/                     # Authenticated ERP Main Shell Route Group
│   │   │   ├── layout.tsx             # Enterprise App Shell (Sidebar, TopNav, Command Bar)
│   │   │   ├── dashboard/             # Executive & Role-Specific Dashboards
│   │   │   ├── accounting/            # Accounting Module Routes
│   │   │   │   ├── chart-of-accounts/
│   │   │   │   ├── general-ledger/
│   │   │   │   ├── journal-entries/
│   │   │   │   │   ├── page.tsx       # List View (Data Table)
│   │   │   │   │   ├── new/page.tsx   # Document Creation View
│   │   │   │   │   └── [id]/page.tsx  # Document Edit/View/Audit Timeline
│   │   │   │   └── payment-entries/
│   │   │   ├── sales/                 # Sales Module Routes
│   │   │   │   ├── quotations/
│   │   │   │   ├── sales-orders/
│   │   │   │   ├── delivery-notes/
│   │   │   │   └── sales-invoices/
│   │   │   ├── purchase/              # Purchase Module Routes
│   │   │   ├── inventory/             # Inventory Module Routes
│   │   │   ├── crm/                   # CRM Module Routes
│   │   │   ├── hrms/                  # HRMS & Payroll Routes
│   │   │   ├── manufacturing/         # Production, BOM & Routing Routes
│   │   │   ├── assets/                # Fixed Asset Management Routes
│   │   │   ├── projects/              # Projects, Tasks & Timesheets
│   │   │   ├── support/               # Helpdesk & Issue Ticketing
│   │   │   ├── india/                 # GST Compliance Center Routes
│   │   │   └── settings/              # System & Tenant Settings
│   │   ├── (pos)/                     # Dedicated Ultra-Low Latency POS Layout
│   │   │   ├── pos/terminal/page.tsx
│   │   │   └── pos/register/page.tsx
│   │   ├── (portal)/                  # Customer / Supplier Self-Service Portal
│   │   │   ├── portal/invoices/
│   │   │   └── portal/orders/
│   │   ├── api/                       # HTTP API Routes & Webhook Receivers
│   │   │   ├── v1/
│   │   │   │   ├── documents/[doctype]/
│   │   │   │   └── reports/[reportId]/
│   │   │   └── webhooks/
│   │   │       ├── payment-gateways/  # Razorpay, Stripe webhooks
│   │   │       └── e-invoice-callback/
│   │   ├── globals.css                # Tailwind CSS v4 directives & theme variables
│   │   └── layout.tsx                 # Root HTML layout with providers (Theme, QueryClient)
│   ├── modules/                       # Self-Contained Domain Modules
│   │   ├── core/                      # Metaprogramming Engine & Base Framework
│   │   ├── setup/                     # Multi-Company, Branch & Currency Setup
│   │   ├── auth/                      # Identity, RBAC, Sessions
│   │   ├── crm/                       # Leads, Opportunities, Pipelines
│   │   ├── sales/                     # Quotation through Sales Invoicing
│   │   ├── purchase/                  # Material Request through Purchase Invoicing
│   │   ├── inventory/                 # Warehousing, Batches, Stock Ledger
│   │   ├── accounting/                # General Ledger, AR/AP, Financial Reports
│   │   ├── india/                     # GST, E-Invoice, E-Way Bill, TDS/TCS
│   │   ├── pos/                       # Offline-Ready Point of Sale Engine
│   │   ├── manufacturing/             # BOM, Work Orders, Operations
│   │   ├── quality/                   # Inspection Templates & Logs
│   │   ├── assets/                    # Depreciation & Fixed Assets
│   │   ├── projects/                  # Gantt, Tasks, Timesheets
│   │   ├── hrms/                      # Payroll, Attendance, Leaves
│   │   ├── support/                   # Service SLAs, Tickets
│   │   ├── website/                   # CMS & Public Pages
│   │   └── marketing/                 # Email Campaigns & Tracking
│   ├── lib/                           # Shared Cross-Cutting Infrastructure
│   │   ├── db/                        # Database Connection & Query Client
│   │   │   ├── client.ts              # Supabase / PostgreSQL Client Factory
│   │   │   ├── transaction.ts         # Distributed Transaction Runner
│   │   │   └── rls.ts                 # Dynamic RLS Session Variable Context
│   │   ├── auth/                      # Auth Infrastructure
│   │   │   ├── session.ts             # Session extraction & JWT verification
│   │   │   └── permissions.ts         # RBAC Evaluation Engine
│   │   ├── storage/                   # Storage Infrastructure
│   │   │   └── storage-client.ts      # Multi-provider File Storage Client
│   │   ├── queue/                     # Task Queue Infrastructure
│   │   │   ├── queue-client.ts        # BullMQ / In-Process Task Dispatcher
│   │   │   └── worker.ts              # Outbox Worker Processor
│   │   ├── cache/                     # Caching Infrastructure
│   │   │   └── cache-client.ts        # Redis / Memory Cache Manager
│   │   ├── email/                     # Transactional Communications
│   │   │   └── mailer.ts              # Resend / SMTP / WhatsApp Provider
│   │   ├── logger/                    # Structured Logging (Pino)
│   │   └── crypto/                    # AES-GCM Envelope Encryption
│   ├── components/                    # Reusable Presentation Components
│   │   ├── ui/                        # Design System Primitives (Button, Dialog, Input)
│   │   ├── forms/                     # Dynamic Metadata Form Engine
│   │   │   ├── DynamicForm.tsx
│   │   │   ├── FormFieldRenderer.tsx
│   │   │   └── CurrencyInput.tsx
│   │   ├── tables/                    # High-Performance Data Tables
│   │   │   ├── DataTable.tsx          # Virtualized, Filterable, Sortable
│   │   │   └── TablePagination.tsx
│   │   ├── document/                  # Core Document UI Elements
│   │   │   ├── DocumentHeader.tsx     # Status Badges, Action Buttons (Submit/Cancel)
│   │   │   ├── DocumentTimeline.tsx   # Audit History, Comments, Activity Feed
│   │   │   ├── DocumentAttachments.tsx
│   │   │   └── PrintPreviewModal.tsx
│   │   └── layout/                    # Application Layout Shell Elements
│   │       ├── Sidebar.tsx
│   │       ├── TopNavBar.tsx
│   │       └── CommandMenu.tsx        # Global Cmd+K Search & Navigator
│   ├── hooks/                         # Shared Custom React Hooks
│   │   ├── use-document.ts            # Client-side Document State & Sync
│   │   ├── use-permissions.ts         # User Permission Evaluator Hook
│   │   ├── use-debounce.ts
│   │   └── use-hotkeys.ts
│   ├── types/                         # System-Wide Ambient TypeScript Types
│   │   ├── document.ts                # BaseDocument, DocStatus, Metadata Types
│   │   ├── permissions.ts             # RBAC Types & Permission Actions
│   │   ├── events.ts                  # Domain Event Interface Contracts
│   │   └── tenant.ts                  # TenantContext & TenantConfig Types
│   └── middleware.ts                  # Next.js Edge Middleware (Auth, Tenancy, Routing)
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 3. Standard Module Architecture

Every domain module within `src/modules/<module_name>/` follows an identical, strictly enforced anatomical contract. This standardization guarantees that any engineer or automated agent can immediately understand, navigate, test, and extend any module in the system.

### 3.1 Anatomy of a VyaparSuite Module

```
src/modules/<module_name>/
├── module.config.ts         # Module manifest, navigation, permissions, and dependencies
├── types/
│   ├── index.ts             # Module domain entities, aggregates, and value objects
│   └── events.ts            # Typed domain event definitions emitted by this module
├── schemas/
│   ├── <document>.schema.ts # Zod validation schemas for input & state transitions
│   └── index.ts
├── services/
│   ├── <document>.service.ts# Domain application logic, calculations, business invariants
│   └── index.ts
├── actions/
│   ├── <document>.actions.ts# Next.js Server Actions (Mutation entry points)
│   └── index.ts
├── api/
│   ├── route.ts             # Standard Next.js Route Handlers (REST endpoints)
│   └── [id]/route.ts
├── components/
│   ├── <Document>Form.tsx   # Module-specific interactive form views
│   ├── <Document>List.tsx   # Specialized list views & card decks
│   └── <Document>Print.tsx  # Compliant PDF/Print layout templates
├── hooks/
│   └── use-<module>.ts      # Module-specific client hooks
├── utils/
│   └── calculations.ts      # Pure mathematical/formatting functions (zero side-effects)
├── constants/
│   └── index.ts             # Enums, standard series codes, default values
└── tests/
    ├── <document>.service.test.ts
    └── <document>.actions.test.ts
```

### 3.2 The Module Manifest (`module.config.ts`)

Every module exports a strongly typed `ModuleConfig` object that registers itself with the central VyaparSuite kernel.

```typescript
// src/modules/sales/module.config.ts

import { ModuleConfig } from "@/types/module";

export const salesModuleConfig: ModuleConfig = {
  id: "sales",
  name: "Sales & Distribution",
  version: "1.0.0",
  description: "End-to-end sales lifecycle from quotation to invoice and revenue realization",
  dependencies: ["core", "setup", "accounting", "inventory"],
  navigation: {
    title: "Sales",
    icon: "ShoppingCartIcon",
    order: 30,
    items: [
      { title: "Quotations", path: "/sales/quotations", permission: "sales:quotation:read" },
      { title: "Sales Orders", path: "/sales/sales-orders", permission: "sales:sales_order:read" },
      { title: "Delivery Notes", path: "/sales/delivery-notes", permission: "sales:delivery_note:read" },
      { title: "Sales Invoices", path: "/sales/sales-invoices", permission: "sales:sales_invoice:read" },
    ],
  },
  documents: [
    {
      doctype: "Quotation",
      tableName: "sales_quotations",
      isSubmittable: true,
      hasWorkflow: true,
      namingPrefix: "QTN-",
    },
    {
      doctype: "SalesOrder",
      tableName: "sales_orders",
      isSubmittable: true,
      hasWorkflow: true,
      namingPrefix: "SO-",
    },
    {
      doctype: "SalesInvoice",
      tableName: "sales_invoices",
      isSubmittable: true,
      hasWorkflow: true,
      namingPrefix: "SINV-",
    },
  ],
  permissions: [
    "sales:quotation:read", "sales:quotation:write", "sales:quotation:submit", "sales:quotation:cancel",
    "sales:sales_order:read", "sales:sales_order:write", "sales:sales_order:submit", "sales:sales_order:cancel",
    "sales:sales_invoice:read", "sales:sales_invoice:write", "sales:sales_invoice:submit", "sales:sales_invoice:cancel",
  ],
  eventSubscriptions: [
    {
      event: "inventory.stock.depleted",
      handler: "handleLowStockAlert",
    },
    {
      event: "accounting.payment.reconciled",
      handler: "handleInvoicePaymentReconciled",
    },
  ],
};
```

### 3.3 Inter-Module Communication Contracts
To preserve modular monolith isolation:
1. **No Cross-Module Database Joins**: The `sales` module must never perform a SQL `JOIN` directly onto `accounting_gl_entries`.
2. **Public Service Interfaces**: If `sales` needs customer credit balance, it invokes the public contract of the `accounting` module:
   ```typescript
   // Allowed: Invoking an exported application service
   import { CustomerCreditService } from "@/modules/accounting/services";
   const balance = await CustomerCreditService.getAvailableCredit(customerId, tenantContext);
   ```
3. **Decoupled Event Dispatching**: Permanent state impacts across modules (e.g., when an invoice is submitted, debiting Accounts Receivable and crediting Revenue) are performed asynchronously via the Transactional Outbox Event Engine.

### 3.4 Cross-Module Transaction Boundary Rules
When operations span multiple domain boundaries synchronously within a user action:
- A root application transaction (via PostgreSQL `BEGIN...COMMIT`) is established by the primary service.
- If a secondary service is invoked in-process, it accepts the existing `TransactionContext`.
- If an unhandled failure occurs in any participating domain logic, the entire transaction rolls back atomically.
- Side-effects involving external systems (e.g., calling the Indian Government E-Invoice Portal, sending an SMS via Twilio, initiating a WhatsApp alert) must **never** be executed inside the database transaction; they must be written to the Outbox table and executed only after the transaction commits successfully.

---

## 4. Core Document Framework (Meta-Engine)

The Core Document Framework provides the metadata-driven backbone of VyaparSuite. Inspired by the architectural strengths of ERPNext DocTypes, it guarantees uniform lifecycle handling, validation, numbering, auditability, and immutability across all business transactions.

```
       [ Draft (doc_status = 0) ]
                   │
                   │  submit()
                   ▼
     [ Submitted (doc_status = 1) ]
                   │
                   │  cancel()
                   ▼
     [ Cancelled (doc_status = 2) ]
                   │
                   │  amend()
                   ▼
   [ New Draft (amended_from = Parent) ]
```

### 4.1 Metadata-Driven Document Paradigm
In traditional ad-hoc applications, every entity creates its own validation pipeline, audit logging, and numbering. In VyaparSuite, all business documents inherit from a unified engine. Whether an entity is a Sales Invoice, a Material Request, an Employee Onboarding Application, or a Custom MSME Form, the runtime handles lifecycle states, authorization, version tracking, and event emission transparently.

### 4.2 The `BaseDocument` Contract

Every submittable document in VyaparSuite implements the core `BaseDocument` TypeScript interface and extends the standard relational schema.

```typescript
// src/types/document.ts

export type DocStatus = 0 | 1 | 2; // 0: Draft, 1: Submitted, 2: Cancelled

export interface BaseDocument {
  // Identity & Tenancy
  id: string;                         // UUIDv4 Primary Key
  tenant_id: string;                  // Multi-Tenant Isolation Key
  company_id: string;                 // Operating Entity within Tenant
  
  // Document Classification & Naming
  doctype: string;                    // e.g., "SalesInvoice", "PurchaseOrder"
  name: string;                       // Unique Business ID (e.g., "SINV-2026-00412")
  naming_series: string;              // Format rule (e.g., "SINV-.YYYY.-.#####")
  
  // Lifecycle & Workflow
  doc_status: DocStatus;              // 0=Draft, 1=Submitted, 2=Cancelled
  workflow_state: string;             // Dynamic State (e.g., "Pending Approval", "Approved")
  is_submittable: boolean;            // Flag indicating if document supports submission
  
  // Immutability & Audit Trail
  created_at: Date;                   // UTC Timestamp
  created_by: string;                 // User UUID
  updated_at: Date;                   // UTC Timestamp
  updated_by: string;                 // User UUID
  submitted_at: Date | null;          // Populated upon transition to doc_status = 1
  submitted_by: string | null;        // User UUID who submitted
  cancelled_at: Date | null;          // Populated upon transition to doc_status = 2
  cancelled_by: string | null;        // User UUID who cancelled
  
  // Versioning & Corrections
  version: number;                    // Optimistic Locking & Revision counter
  amended_from: string | null;        // References previous document 'name' if amendment
  is_deleted: boolean;                // Soft delete flag (only valid when doc_status = 0)
  
  // Extensibility
  custom_fields: Record<string, any>; // JSONB column for user-defined metadata
  tags: string[];                     // Categorization labels
}
```

### 4.3 Three-Tier Document Lifecycle State Machine

VyaparSuite enforces an unbreachable three-tier state machine for all transactional business documents:

| State (`doc_status`) | Label | Permitted Operations | Financial / Stock Impact | Mutability |
| :---: | :--- | :--- | :--- | :--- |
| **`0`** | **Draft** | Edit, Save, Delete, Validate, Submit | None | Fully mutable. All fields editable subject to permissions. |
| **`1`** | **Submitted** | Cancel, Amend, Print, Duplicate | **Active** (GL entries posted, stock balances deducted/added) | **Immutable**. Critical business fields locked. Only non-financial comments/tags editable. |
| **`2`** | **Cancelled** | Amend, Print, View History | **Reversed** (Reversal GL entries created, stock returned) | **Permanently Sealed**. Cannot be revived. Can only generate an Amendment. |

#### Invariant Enforcement Rules:
1. Direct transition from `Draft` (0) to `Cancelled` (2) is disallowed. A draft that is not needed is simply deleted.
2. Transition from `Submitted` (1) to `Draft` (0) is mathematically prohibited. Once posted, financial records cannot be "un-submitted" or altered in place; they must be cancelled via explicit compensatory reversal entries.
3. Once `Cancelled` (2), a document cannot be transitioned to any other state. To correct an error, the user triggers an `Amend` operation, which generates a new document in `Draft` state with `amended_from` referencing the cancelled document's identifier.

### 4.4 Atomic Document Numbering Service

VyaparSuite guarantees gapless, collision-free, human-readable document identifiers even under massive concurrent request volume.

#### Numbering Architecture:
- Format strings support dynamic tokens: `{SERIES}-.{YYYY}.-.{MM}.-.#####` (e.g., `INV-2026-10-00042`).
- Rather than calculating `MAX(id) + 1` via SQL (which causes table locks, race conditions, and deadlocks), the system uses an atomic sequence registry table with PostgreSQL row-level advisory locking or atomic `UPDATE...RETURNING` operations.

```sql
-- PostgreSQL Sequence Registry Schema
CREATE TABLE sys_naming_series (
    tenant_id UUID NOT NULL,
    prefix VARCHAR(64) NOT NULL,
    current_value BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, prefix)
);

-- Atomic Sequence Fetch Function
CREATE OR REPLACE FUNCTION get_next_naming_series(
    p_tenant_id UUID,
    p_prefix VARCHAR
) RETURNS BIGINT AS $$
DECLARE
    v_next BIGINT;
BEGIN
    INSERT INTO sys_naming_series (tenant_id, prefix, current_value, updated_at)
    VALUES (p_tenant_id, p_prefix, 1, NOW())
    ON CONFLICT (tenant_id, prefix)
    DO UPDATE SET 
        current_value = sys_naming_series.current_value + 1,
        updated_at = NOW()
    RETURNING current_value INTO v_next;
    
    RETURN v_next;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// src/modules/core/services/naming-series.service.ts

export class NamingSeriesService {
  static async generate(
    tenantId: string,
    seriesFormat: string,
    date: Date = new Date()
  ): Promise<string> {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // Replace dynamic date tokens to form the unique prefix
    const prefix = seriesFormat
      .replace(".YYYY.", year)
      .replace(".YY.", year.slice(-2))
      .replace(".MM.", month)
      .replace(".DD.", day)
      .replace(/#+$/, ""); // Strip trailing hashes to get the counter prefix

    const hashMatch = seriesFormat.match(/(#+)$/);
    const paddingLength = hashMatch ? hashMatch[1].length : 5;

    // Execute atomic sequence increment in PostgreSQL
    const nextSeq = await db.raw(
      `SELECT get_next_naming_series($1::uuid, $2::varchar) as seq`,
      [tenantId, prefix]
    );

    const formattedNumber = nextSeq.rows[0].seq.toString().padStart(paddingLength, "0");
    return `${prefix}${formattedNumber}`;
  }
}
```

### 4.5 Validation & Hook Execution Pipeline

Every mutation passing through the Core Document Framework executes through a predictable lifecycle pipeline:

```
[Incoming Request]
        │
        ▼
[1. Pre-Validation Sanitization]
        │
        ▼
[2. Zod Schema Validation]
        │
        ▼
[3. Business Invariant Checks]
        │
        ▼
[4. Permission & State Validation]
        │
        ▼
[5. BEGIN Transaction]
        │
        ├──▶ [6. before_save / before_submit Hook]
        ├──▶ [7. Persistence (INSERT/UPDATE with Optimistic Lock)]
        ├──▶ [8. Write to sys_audit_log & sys_version_log]
        ├──▶ [9. Write Domain Event to sys_outbox]
        └──▶ [10. after_save / after_submit Hook]
        │
        ▼
[11. COMMIT Transaction]
        │
        ▼
[12. Trigger Background Outbox Worker]
```

### 4.6 Document Permission Model (Doc-Level & Field-Level)
Security is enforced at two distinct tiers:

1. **Document-Level Permissions**: Controls whether a user possessing specific roles can `create`, `read`, `write`, `submit`, `cancel`, or `amend` documents of a given DocType within their authorized Tenant and Company.
2. **Field-Level Permissions**: Controls specific column visibility and editability based on the document's `workflow_state` and the user's role. For example:
   - The `margin_rate` field on a Quotation is visible only to `Sales Manager` and hidden from `Sales Executive`.
   - The `posting_date` on a Sales Invoice is editable during `Draft`, but permanently read-only once `Submitted`.

### 4.7 Audit Trail, Versioning, and Diff Engine

Compliance demands an immutable, tamper-evident record of all system activities.

- **`sys_audit_logs`**: Captures every high-level user interaction, IP address, user agent, action verb (`CREATE`, `UPDATE`, `SUBMIT`, `CANCEL`, `DELETE`), and execution timestamp.
- **`sys_version_logs`**: Captures precise JSON patch diffs (RFC 6902) between the previous record state and the new record state upon every update:

```json
{
  "doctype": "SalesInvoice",
  "document_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "version": 3,
  "diff": [
    { "op": "replace", "path": "/items/2/rate", "old_value": 450.00, "new_value": 420.00 },
    { "op": "replace", "path": "/grand_total", "old_value": 15200.00, "new_value": 15120.00 }
  ],
  "changed_by": "8f8b3c65-27a3-4a52-b88e-64c9959e19a1",
  "changed_at": "2026-10-30T14:45:10.231Z"
}
```

### 4.8 Document Attachments, Comments, and Timeline
Every document view aggregates a unified collaborative activity feed:
- **Comments**: Inline discussions with `@mention` notifications to team members.
- **Attachments**: Cryptographically verified files stored in object storage (Supabase Storage / S3), mapped with file size, MIME type, virus-scan status, and access restrictions.
- **Timeline Events**: Automated system logs displaying submission dates, workflow transitions, payment receipts, and dispatch notices in chronological sequence.

### 4.9 Document Amendment Engine
When a submitted document contains errors and must be rectified:
1. The user with `Cancel` permission executes `cancel()`. The document transitions to `doc_status = 2`, triggering full ledger reversals.
2. The user executes `amend()`. The system clones the cancelled document into a new `Draft` (`doc_status = 0`).
3. The new document's `name` is assigned an amendment suffix (e.g., `SINV-2026-0012` becomes `SINV-2026-0012-1`).
4. The field `amended_from` points explicitly to `SINV-2026-0012`, creating an audit trail linking the replacement document to its predecessor.

---

## 5. Database Architecture & Multi-Tenancy

The database layer is engineered on PostgreSQL 16+ using Supabase as the underlying platform. It provides high-performance data processing while guaranteeing complete logical separation between enterprise tenants.

```
+---------------------------------------------------------------------------------------+
|                                    PostgreSQL 16                                      |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |                       Multi-Tenant Core (Single Database)                     |   |
|   |                                                                               |   |
|   |   +-------------------------+     +---------------------------------------+   |   |
|   |   | Tenant Context (RLS)    |     | Master Entities                       |   |   |
|   |   | app.current_tenant_id   |     | tenants, companies, users, roles      |   |   |
|   |   +-------------------------+     +---------------------------------------+   |   |
|   |                                                                               |   |
|   |   +-----------------------------------------------------------------------+   |   |
|   |   | Transactional Tables (Partitioned)                                    |   |   |
|   |   | gl_entries (Partitioned by Year/Quarter on posting_date)              |   |   |
|   |   | stock_ledger_entries (Partitioned by Year/Quarter on posting_date)    |   |   |
|   |   +-----------------------------------------------------------------------+   |   |
|   |                                                                               |   |
|   |   +-----------------------------------------------------------------------+   |   |
|   |   | Document Tables                                                       |   |   |
|   |   | sales_invoices, purchase_orders, stock_entries, etc.                  |   |   |
|   |   +-----------------------------------------------------------------------+   |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

### 5.1 Multi-Tenancy Strategy: Shared Database, Isolated Records

VyaparSuite adopts the **Shared Database, Shared Schema with Mandatory Tenant Column & Row-Level Security (RLS)** strategy.

#### Why This Strategy?
1. **Cost-Efficiency for MSMEs**: Operating isolated databases or independent schemas for thousands of small businesses causes severe connection pool exhaustion, memory overhead, and unmanageable operational complexity.
2. **Instant Provisioning**: New tenant registration requires zero DDL executions or migrations; an onboarding transaction simply writes a row to `sys_tenants`.
3. **Unified Migrations**: Schema updates and index enhancements apply instantaneously to all tenants in a single migration run.
4. **Ironclad Isolation**: PostgreSQL native RLS guarantees that even if an application engineer writes `SELECT * FROM sales_invoices` without a `WHERE tenant_id = ...` clause, the PostgreSQL query planner automatically rewrites the execution tree to filter by the authenticated tenant's ID.

### 5.2 Database Conventions & Naming Standards

To eliminate ambiguity across hundreds of tables:
- **Table Names**: Plural, lower snake_case, prefixed by domain module:
  - `acc_accounts`, `acc_gl_entries`, `acc_journal_entries`
  - `inv_items`, `inv_warehouses`, `inv_stock_ledger_entries`
  - `sales_invoices`, `sales_invoice_items`, `sales_orders`
  - `pur_orders`, `pur_receipts`, `pur_invoices`
  - `sys_tenants`, `sys_users`, `sys_roles`, `sys_audit_logs`
- **Primary Keys**: Always `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- **Foreign Keys**: Column name equals the singular referenced entity with `_id` suffix: `company_id REFERENCES sys_companies(id)`.
- **Timestamps**: Always store in UTC with timezone: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
- **Financial Precision**: Monetary amounts and tax percentages must **never** use floating-point types (`REAL`, `FLOAT`, `DOUBLE`). All financial metrics use `NUMERIC(18, 4)` or `NUMERIC(18, 2)`. Quantities use `NUMERIC(18, 6)` to accommodate precision measurement units (e.g., fractional grams, liters, kilograms).

### 5.3 Indexing Strategy & Optimization

To maintain sub-50ms query execution across millions of enterprise records:

1. **Tenant-Compound Keys**: Every transactional query filters by `tenant_id`. Therefore, composite indexes always lead with `tenant_id`:
   ```sql
   CREATE INDEX idx_sales_invoices_tenant_posting 
   ON sales_invoices(tenant_id, company_id, posting_date DESC);
   ```
2. **Partial Indexes for Active Records**: To keep index sizes minimal and cache-friendly, deleted or cancelled records are filtered out of hot path indexes:
   ```sql
   CREATE INDEX idx_inv_items_active 
   ON inv_items(tenant_id, item_code) 
   WHERE is_deleted = false;
   ```
3. **JSONB GIN Indexing**: Custom fields defined dynamically by end-users are queried using JSONB path operators indexed via Generalized Inverted Indexes:
   ```sql
   CREATE INDEX idx_sales_invoices_custom_fields 
   ON sales_invoices USING GIN (custom_fields);
   ```
4. **Full-Text Search (FTS)**: Document search and inventory lookups utilize generated `tsvector` columns with GIN indexes supporting multi-language stemming.

### 5.4 Table Partitioning Strategy (GL & Stock Ledgers)

In high-volume ERP installations, tables such as `acc_gl_entries` (General Ledger) and `inv_stock_ledger_entries` accumulate tens of millions of records annually. Without partitioning, B-tree indexes exceed RAM capacity, degrading write and query performance.

VyaparSuite implements **Declarative Range Partitioning** on `posting_date`:

```sql
-- Base Partitioned Table: General Ledger Entries
CREATE TABLE acc_gl_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES sys_tenants(id),
    company_id UUID NOT NULL REFERENCES sys_companies(id),
    account_id UUID NOT NULL REFERENCES acc_accounts(id),
    party_type VARCHAR(32), -- 'Customer', 'Supplier', 'Employee'
    party_id UUID,
    posting_date DATE NOT NULL,
    debit NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    credit NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    voucher_type VARCHAR(64) NOT NULL, -- 'Sales Invoice', 'Payment Entry'
    voucher_no VARCHAR(128) NOT NULL,
    cost_center_id UUID,
    remarks TEXT,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (posting_date, id)
) PARTITION BY RANGE (posting_date);

-- Annual Partitions (Automated via Cron or Partition Manager)
CREATE TABLE acc_gl_entries_y2025 PARTITION OF acc_gl_entries
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

CREATE TABLE acc_gl_entries_y2026 PARTITION OF acc_gl_entries
    FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');

CREATE TABLE acc_gl_entries_y2027 PARTITION OF acc_gl_entries
    FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');

-- Compound Indexes on Partitioned Tables
CREATE INDEX idx_gl_tenant_account_date 
ON acc_gl_entries (tenant_id, account_id, posting_date DESC);

CREATE INDEX idx_gl_voucher 
ON acc_gl_entries (tenant_id, voucher_type, voucher_no);
```

#### Partition Pruning Guarantee:
When an accountant runs a Balance Sheet or Profit & Loss statement for Fiscal Year 2026, the PostgreSQL query planner executes **Partition Pruning**, completely ignoring partitions from 2025, 2027, etc., reducing disk I/O by orders of magnitude.

### 5.5 Migration Management & Schema Evolution

All database schema evolutions adhere strictly to the **Expand and Contract (Parallel Run)** methodology:
1. **Never Rename Columns in Production**: To prevent downtime during deployments, never rename columns directly. Instead, add the new column (Expand), write to both old and new columns via application services or triggers, backfill legacy data, and deprecate/drop the old column in a subsequent release (Contract).
2. **Migrations as Code**: Migrations live in `supabase/migrations/` as sequentially ordered, immutable SQL files.
3. **CI/CD Validation**: The GitHub Actions pipeline executes every new migration against a disposable ephemeral PostgreSQL instance populated with realistic seed volumes to measure lock times and execution duration before approval.

### 5.6 Seed Data & Country Localizations

When a tenant registers, the system executes an automated bootstrapping sequence:
- **System Master Data**: Global Units of Measure (UOM) per ISO 80000, ISO Currency Codes (INR, USD, EUR, GBP, AED, etc.).
- **Localization Packages**:
  - **India**: Standard Chart of Accounts compliant with Schedule III of the Indian Companies Act 2013, GST Tax Templates (IGST, CGST, SGST at 0%, 5%, 12%, 18%, 28%), default HSN/SAC master categories, and State Codes.
  - **International**: Standard International IFRS / GAAP Chart of Accounts with flexible VAT/Sales Tax structures.

---

## 6. Authentication & Authorization Architecture

VyaparSuite enforces a defense-in-depth security model combining modern identity protocols with low-overhead, database-enforced permissions.

```
[User Login Request]
        │
        ▼
[Supabase Auth / OIDC Provider]
        │
        ├──▶ Validates Credentials & MFA
        └──▶ Issues Signed JWT (RS256)
        │
        ▼
[Next.js Edge Middleware]
        │
        ├──▶ Verifies JWT Signature
        ├──▶ Extracts tenant_id & user_id
        └──▶ Injects x-tenant-id & x-user-id headers
        │
        ▼
[PostgreSQL Database Connection]
        │
        ├──▶ SET LOCAL app.current_tenant_id = '...'
        └──▶ SET LOCAL app.current_user_id = '...'
        │
        ▼
[Row-Level Security (RLS) Policy Engine]
        │
        └──▶ Automatically Filters: WHERE tenant_id = app.current_tenant_id()
```

### 6.1 Authentication Topology & Token Lifecycle

VyaparSuite decouples the authentication mechanics via an abstract identity provider interface (`IAuthProvider`), with the default production implementation backed by Supabase Auth (GoTrue).

- **Access Tokens**: Short-lived (15 minutes), cryptographically signed JSON Web Tokens (JWT) using asymmetric RS256 algorithms.
- **Refresh Tokens**: Long-lived (7 days), stored in secure `HttpOnly`, `SameSite=Lax`, `Secure` encrypted browser cookies.
- **Multi-Factor Authentication (MFA)**: Built-in TOTP (Time-based One-Time Password) support for sensitive financial and system administrator roles.

### 6.2 Claims Injection & Tenant Identification

Upon successful authentication, the token or session context is decorated with enterprise claims:

```json
{
  "sub": "a9484b3d-4c31-4a4b-97e3-0d5885c3b52d",
  "email": "cfo@enterprisemsme.in",
  "app_metadata": {
    "tenant_id": "b3e34b12-87a1-4322-8b65-66778899aabb",
    "companies": ["f1a2b3c4-d5e6-7890-1234-56789abcdef0"],
    "is_tenant_admin": false
  },
  "user_metadata": {
    "full_name": "Rajesh Sharma",
    "default_branch_id": "c1d2e3f4-a5b6-7890-1234-56789abcdef1"
  },
  "exp": 1793450400
}
```

### 6.3 Granular Role-Based Access Control (RBAC) Engine

Permissions are structured using standard hierarchical resource strings:
`<module>:<doctype_or_resource>:<action>`

Examples:
- `sales:sales_invoice:read`
- `sales:sales_invoice:write`
- `sales:sales_invoice:submit`
- `sales:sales_invoice:cancel`
- `accounting:general_ledger:export`
- `india:gst_returns:file`

#### Relational RBAC Schema:
```sql
CREATE TABLE sys_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES sys_tenants(id),
    name VARCHAR(64) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE(tenant_id, name)
);

CREATE TABLE sys_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(128) NOT NULL UNIQUE, -- 'sales:sales_invoice:submit'
    description TEXT
);

CREATE TABLE sys_role_permissions (
    role_id UUID NOT NULL REFERENCES sys_roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES sys_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE sys_user_roles (
    user_id UUID NOT NULL REFERENCES sys_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES sys_roles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES sys_companies(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id, company_id)
);
```

### 6.4 PostgreSQL Row-Level Security (RLS) Implementation

To eliminate accidental cross-tenant data leaks, RLS is enabled on every single business table without exception.

```sql
-- Enable RLS globally on the table
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices FORCE ROW LEVEL SECURITY;

-- Helper function to read the session tenant
CREATE OR REPLACE FUNCTION current_app_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Unified Multi-Tenant RLS Policy
CREATE POLICY sales_invoices_tenant_isolation_policy ON sales_invoices
    AS RESTRICTIVE
    FOR ALL
    TO authenticated
    USING (tenant_id = current_app_tenant_id())
    WITH CHECK (tenant_id = current_app_tenant_id());
```

#### Session Initialization in Application Runtime:
Whenever a database client executes a query on behalf of an incoming request, the transaction begins by injecting session settings:

```typescript
// src/lib/db/rls.ts

import { PoolClient } from "pg";

export async function setTenantSessionContext(
  client: PoolClient,
  tenantId: string,
  userId: string
): Promise<void> {
  await client.query(
    `SELECT 
      set_config('app.current_tenant_id', $1, true),
      set_config('app.current_user_id', $2, true);`,
    [tenantId, userId]
  );
}
```

### 6.5 Dynamic Permission Resolution Algorithm

```typescript
// src/lib/auth/permissions.ts

export async function hasPermission(
  userId: string,
  tenantId: string,
  requiredPermission: string,
  companyId?: string
): Promise<boolean> {
  // 1. Check if user is SuperAdmin / Tenant Owner (fast-path bypass)
  const isOwner = await checkTenantOwnership(userId, tenantId);
  if (isOwner) return true;

  // 2. Query Redis L2 cache for user permission bitset
  const cacheKey = `perm:${tenantId}:${userId}:${companyId || 'all'}`;
  const cachedPerms = await CacheClient.get<string[]>(cacheKey);
  
  let userPerms = cachedPerms;
  if (!userPerms) {
    // 3. Fallback: Resolve roles and aggregated permissions from database
    userPerms = await queryAggregatedPermissions(userId, tenantId, companyId);
    // Cache for 10 minutes with tag-based invalidation
    await CacheClient.set(cacheKey, userPerms, 600);
  }

  // 4. Wildcard matching (e.g. 'sales:*:*' matches 'sales:sales_invoice:read')
  return matchPermissionPattern(userPerms, requiredPermission);
}
```

### 6.6 User Assignments & Record-Level Security

Beyond role-based permissions, MSMEs require **Record-Level Security**:
- **Branch Confinement**: A sales representative assigned to the *Mumbai Branch* can only view quotations generated within that branch, whereas the *National Sales Head* views all branches.
- **Explicit Assignment (DocShare)**: Documents can be explicitly assigned to specific users for approval or review. This is tracked in `sys_document_shares`:

```sql
CREATE TABLE sys_document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    doctype VARCHAR(64) NOT NULL,
    document_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES sys_users(id),
    read_only BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, doctype, document_id, user_id)
);
```

---

## 7. Event-Driven Architecture & Transactional Outbox

VyaparSuite avoids tight coupling between business domains by employing an **Event-Driven Architecture (EDA)** anchored by the **Transactional Outbox Pattern**.

```
[User Action: Submit Sales Invoice]
        │
        ▼
[Database Transaction (BEGIN)]
        │
        ├──▶ 1. Update sales_invoices SET doc_status = 1
        ├──▶ 2. Insert into sys_outbox_events (Payload: SalesInvoiceSubmitted)
        │
[Database Transaction (COMMIT)] ──▶ (Atomicity Guaranteed: Data and Event commit together)
        │
        ▼
[Outbox Worker Service (Polls or Listens via PG Notify)]
        │
        ├──▶ Picks up unprocessed event
        ├──▶ Dispatches to Handlers:
        │       ├──▶ Accounting Engine (Creates GL Entries)
        │       ├──▶ Stock Engine (Generates Stock Ledger Entry & Deducts Warehouse Balance)
        │       ├──▶ India GST Engine (Queues IRN / E-Way Bill generation)
        │       └──▶ Notification Engine (Sends WhatsApp & Email Invoice to Customer)
        │
        └──▶ Mark sys_outbox_events SET processed_at = NOW()
```

### 7.1 Event System Topology (Synchronous vs Asynchronous)

VyaparSuite balances consistency requirements using two distinct event tiers:
1. **Synchronous In-Process Interceptors (Lifecycle Hooks)**: Used solely within the same bounded context prior to database commit (e.g., calculating tax sub-totals, validating credit limits). If an interceptor fails, the entire transaction aborts.
2. **Asynchronous Cross-Module Events (Domain Events)**: Used for inter-module integration (e.g., Sales -> Accounting -> Inventory -> Notifications). Persisted to the database outbox and processed reliably with retry capabilities.

### 7.2 Domain Event Schema & Event Catalog

All domain events implement a strict JSON specification:

```typescript
// src/types/events.ts

export interface DomainEvent<T = any> {
  id: string;               // UUIDv4 Event Identifier
  tenant_id: string;        // Tenant Boundary
  company_id: string;       // Operating Company
  event_type: string;       // Dot-delimited event name (e.g., 'sales.invoice.submitted')
  aggregate_type: string;   // 'SalesInvoice'
  aggregate_id: string;     // Document UUID
  version: number;          // Schema version of the event payload
  timestamp: string;        // ISO 8601 UTC timestamp
  actor_id: string;         // User UUID who triggered the event
  payload: T;               // Strongly typed document payload
}
```

#### Core Event Catalog Sample:
- `sales.quotation.submitted` -> Triggers customer notification & CRM probability update.
- `sales.invoice.submitted` -> Triggers General Ledger posting, Stock Ledger posting, and E-Invoice generation.
- `sales.invoice.cancelled` -> Triggers General Ledger reversal and Stock Ledger restoration.
- `purchase.receipt.submitted` -> Triggers Stock Ledger valuation and landed cost allocation.
- `accounting.payment.reconciled` -> Updates outstanding invoices and releases credit locks.

### 7.3 Transactional Outbox Pattern

To prevent the classic distributed system failure mode where a database update succeeds but an external message queue publish fails, events are committed to the exact same database transaction as the document change:

```sql
CREATE TABLE sys_outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    company_id UUID NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 5,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_outbox_pending 
ON sys_outbox_events(status, created_at) 
WHERE status IN ('PENDING', 'FAILED');
```

The background worker continuously drains the outbox queue, processes subscribers idempotently, and updates event statuses. In case of network failures, events back off exponentially and dead-letter upon reaching `max_retries`.

### 7.4 Double-Entry Accounting Posting Engine

When a document posting event fires, the Accounting Domain Service processes the payload and generates balanced General Ledger entries.

#### Fundamental Invariant:
$$\sum \text{Debits} \equiv \sum \text{Credits}$$

If this mathematical invariant fails by even $0.0001$, the posting engine rejects the batch, marks the outbox event as failed, and raises a critical alert.

```typescript
// src/modules/accounting/services/gl-posting.service.ts

export class GLPostingService {
  static async postSalesInvoice(event: DomainEvent<SalesInvoicePayload>): Promise<void> {
    const { payload, tenant_id, company_id, aggregate_id } = event;
    const entries: GLEntryDraft[] = [];

    // 1. Debit Accounts Receivable (Customer)
    entries.push({
      tenant_id,
      company_id,
      account_id: payload.debit_to_account_id,
      party_type: "Customer",
      party_id: payload.customer_id,
      posting_date: payload.posting_date,
      debit: payload.grand_total,
      credit: 0.00,
      voucher_type: "Sales Invoice",
      voucher_no: payload.name,
      remarks: `Sales Invoice ${payload.name}`,
    });

    // 2. Credit Sales / Revenue Account for each item line
    for (const item of payload.items) {
      entries.push({
        tenant_id,
        company_id,
        account_id: item.income_account_id,
        posting_date: payload.posting_date,
        debit: 0.00,
        credit: item.net_amount,
        voucher_type: "Sales Invoice",
        voucher_no: payload.name,
        remarks: item.description,
      });
    }

    // 3. Credit Tax Accounts (CGST, SGST, IGST)
    for (const tax of payload.taxes) {
      entries.push({
        tenant_id,
        company_id,
        account_id: tax.tax_account_id,
        posting_date: payload.posting_date,
        debit: 0.00,
        credit: tax.tax_amount,
        voucher_type: "Sales Invoice",
        voucher_no: payload.name,
        remarks: `${tax.tax_title} @ ${tax.rate}%`,
      });
    }

    // 4. Validate Balance Invariant
    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Accounting Inbalance Detected: Debit (${totalDebit}) != Credit (${totalCredit})`);
    }

    // 5. Persist to Partitioned GL Entry Table
    await GLRepository.batchInsert(entries);
  }
}
```

### 7.5 Real-Time Stock Ledger & Inventory Valuation Engine

VyaparSuite enforces perpetual inventory valuation. Every movement of goods writes an immutable row to `inv_stock_ledger_entries`.

#### Supported Valuation Methods:
1. **FIFO (First-In, First-Out)**: Maintains discrete item cost queues per warehouse. Dispatches pop from the oldest available batch layer.
2. **Moving Weighted Average**: Recalculates unit valuation rate upon every incoming receipt:

$$\text{New Valuation Rate} = \frac{(\text{Current Qty} \times \text{Current Rate}) + (\text{Incoming Qty} \times \text{Incoming Rate})}{\text{Current Qty} + \text{Incoming Qty}}$$

When goods are delivered, the stock ledger posting engine records:
1. Physical quantity reduction in the specified Warehouse.
2. An automatic General Ledger journal:
   - **Debit**: Cost of Goods Sold (COGS) Account.
   - **Credit**: Stock in Hand (Asset) Account.

---

## 8. Infrastructure Abstraction Layer (Adapters)

To guarantee that VyaparSuite never suffers from vendor lock-in to Supabase, Vercel, or AWS, all external capabilities are abstracted behind clean, idiomatic TypeScript interfaces.

```
+---------------------------------------------------------------------------------------+
|                                Application Core                                       |
+---------------------------------------------------------------------------------------+
        │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼
[IDatabaseAdapter]   [IAuthAdapter]     [IStorageAdapter]    [IQueueAdapter]
        │                   │                   │                   │
  ┌─────┴─────┐       ┌─────┴─────┐       ┌─────┴─────┐       ┌─────┴─────┐
  ▼           ▼       ▼           ▼       ▼           ▼       ▼           ▼
Supabase   Self-Host Supabase   NextAuth  Supabase   AWS S3    BullMQ   In-Process
Client     Postgres  GoTrue     / OIDC    Storage    / R2      (Redis)   Memory
```

### 8.1 Database Adapter (`IDatabaseAdapter`)

```typescript
// src/lib/db/types.ts

export interface QueryOptions {
  tenantId?: string;
  transaction?: any;
}

export interface IDatabaseAdapter {
  query<T = any>(sql: string, params?: any[], options?: QueryOptions): Promise<T[]>;
  queryOne<T = any>(sql: string, params?: any[], options?: QueryOptions): Promise<T | null>;
  transaction<T>(callback: (tx: IDatabaseAdapter) => Promise<T>): Promise<T>;
  rawClient(): any;
}
```

### 8.2 Authentication Adapter (`IAuthAdapter`)

```typescript
// src/lib/auth/types.ts

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  roles: string[];
}

export interface IAuthAdapter {
  verifySession(token: string): Promise<AuthUser | null>;
  createSession(userId: string, claims: Record<string, any>): Promise<string>;
  revokeSession(userId: string): Promise<void>;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, hash: string): Promise<boolean>;
}
```

### 8.3 File Storage Adapter (`IStorageAdapter`)

```typescript
// src/lib/storage/types.ts

export interface UploadOptions {
  tenantId: string;
  doctype: string;
  documentId: string;
  contentType: string;
  isPrivate: boolean;
}

export interface IStorageAdapter {
  uploadFile(path: string, buffer: Buffer, options: UploadOptions): Promise<{ key: string; url: string }>;
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteFile(key: string): Promise<void>;
}
```

### 8.4 Background Job Queue Adapter (`IQueueAdapter`)

```typescript
// src/lib/queue/types.ts

export interface JobDefinition<T = any> {
  name: string;
  payload: T;
  options?: {
    delayMs?: number;
    attempts?: number;
    backoffExponential?: boolean;
  };
}

export interface IQueueAdapter {
  enqueue<T>(job: JobDefinition<T>): Promise<string>;
  process<T>(jobName: string, handler: (job: JobDefinition<T>) => Promise<void>): void;
}
```

### 8.5 Distributed Caching Adapter (`ICacheAdapter`)

```typescript
// src/lib/cache/types.ts

export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidateByTag(tag: string): Promise<void>;
}
```

### 8.6 Transactional Email & Messaging Adapter (`IEmailAdapter`)

```typescript
// src/lib/email/types.ts

export interface SendMessageOptions {
  to: string | string[];
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  attachments?: { filename: string; content: Buffer }[];
}

export interface IEmailAdapter {
  sendEmail(options: SendMessageOptions): Promise<{ messageId: string }>;
  sendWhatsApp?(phone: string, templateId: string, parameters: string[]): Promise<void>;
}
```

### 8.7 Enterprise Search Adapter (`ISearchAdapter`)

```typescript
// src/lib/search/types.ts

export interface SearchQuery {
  tenantId: string;
  query: string;
  doctypes?: string[];
  limit?: number;
  offset?: number;
}

export interface ISearchAdapter {
  search(query: SearchQuery): Promise<{ id: string; doctype: string; snippet: string; score: number }[]>;
  indexDocument(doctype: string, id: string, document: Record<string, any>): Promise<void>;
  removeDocument(doctype: string, id: string): Promise<void>;
}
```

---

## 9. Security Architecture & Zero-Trust Posture

VyaparSuite processes core financial ledgers, tax filings, payroll figures, and proprietary client master data. A compromise of any tenant constitutes a catastrophic failure. The platform enforces an absolute zero-trust posture across all execution boundaries.

```
       [ Client HTTPS Request ]
                  │
                  ▼
   [ Edge Network / Cloudflare WAF ] ──▶ DDoS Mitigation & IP Reputation
                  │
                  ▼
        [ Next.js Middleware ] ───────▶ Rate Limiting & Security Headers
                  │
                  ▼
        [ Zod Schema Pipeline ] ──────▶ Strict Input Sanitization
                  │
                  ▼
   [ Application Service Layer ] ─────▶ RBAC / Record Authorization
                  │
                  ▼
     [ Parameterized SQL Query ] ─────▶ SQL Injection Prevention
                  │
                  ▼
     [ PostgreSQL RLS Engine ] ───────▶ Multi-Tenant Isolation
                  │
                  ▼
 [ Database Tables & Encrypted Columns ]
```

### 9.1 Multi-Layer Defense in Depth
Security does not depend upon a single barrier. A failure in the application layer is stopped by the database RLS layer; a flaw in the API layer is mitigated by strict Zod schema validation; and transport eavesdropping is eliminated by modern cipher suites.

### 9.2 Input Sanitization & Schema Validation (Zod)
No untrusted user input enters the application domain without undergoing schema parsing:
- All request parameters, query strings, and mutation bodies are parsed with Zod schemas.
- `z.object().strict()` is employed to reject unrecognized properties, blocking parameter injection attacks.
- Numerical limits are strictly bounded (e.g., quantities must be $> 0$ and $< 100,000,000$).

```typescript
// src/modules/sales/schemas/sales-invoice.schema.ts

import { z } from "zod";

export const SalesInvoiceItemSchema = z.object({
  item_id: z.string().uuid("Invalid item identifier"),
  item_code: z.string().min(1).max(64),
  description: z.string().max(500),
  warehouse_id: z.string().uuid("Invalid warehouse identifier"),
  qty: z.number().positive("Quantity must be strictly greater than zero").max(10000000),
  rate: z.number().min(0, "Rate cannot be negative"),
  discount_percentage: z.number().min(0).max(100).default(0),
  hsn_sac_code: z.string().regex(/^\d{4,8}$/, "Invalid HSN/SAC code format"),
  gst_rate: z.number().min(0).max(40),
  income_account_id: z.string().uuid("Invalid income account identifier"),
}).strict();

export const CreateSalesInvoiceSchema = z.object({
  company_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Posting date must be YYYY-MM-DD"),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  currency: z.string().length(3).default("INR"),
  conversion_rate: z.number().positive().default(1.0),
  naming_series: z.string().min(2).max(32).default("SINV-.YYYY.-.#####"),
  items: z.array(SalesInvoiceItemSchema).min(1, "At least one line item is required"),
  remarks: z.string().max(1000).optional(),
  custom_fields: z.record(z.any()).default({}),
}).strict();

export type CreateSalesInvoiceInput = z.infer<typeof CreateSalesInvoiceSchema>;
```

### 9.3 SQL Injection & ORM Escaping Safeguards
- Raw SQL string concatenation is strictly prohibited across the codebase.
- Architectural linters flag any occurrence of template string queries lacking parameter binding tokens (`$1, $2`).
- All queries pass through PostgreSQL parameterized execution or typed query builders (Drizzle/Kysely/Prisma) with automatic variable escaping.

### 9.4 Cross-Site Scripting (XSS) & Content Security Policy (CSP)
- Next.js and React inherently escape string outputs rendered in JSX.
- For user-customizable HTML Print Formats and Invoices, HTML rendering is strictly quarantined via DOMPurify with an aggressive tag allowlist (prohibiting `<script>`, `<iframe>`, `onload`, `onerror`).
- Strict CSP HTTP Headers are enforced on all responses:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{RANDOM}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co; font-src 'self'; frame-ancestors 'none';
  ```

### 9.5 Cross-Site Request Forgery (CSRF) & State Verifications
- Next.js Server Actions automatically enforce cryptographic CSRF tokens tied to the current session origin.
- All session cookies carry `SameSite=Lax` or `SameSite=Strict` directives with the `Secure` flag enabled.
- External webhook endpoints (Razorpay, Stripe, GST NIC) verify cryptographic HMAC signatures before execution:

```typescript
// src/app/api/webhooks/payment-gateways/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  const rawBody = await req.text();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(signature || ""), Buffer.from(expectedSignature))) {
    return NextResponse.json({ error: "Invalid cryptographic signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  // Process payment verification safely...
  return NextResponse.json({ received: true });
}
```

### 9.6 Adaptive Rate Limiting & Brute-Force Throttling
Rate limiting is enforced at the Next.js Edge Middleware layer using a Redis sliding-window counter algorithm:
- **Authentication Endpoints (`/api/auth/*`)**: Capped at 5 attempts per IP per minute. Consecutive failures trigger exponential backoff delays.
- **Transactional Mutation APIs**: Capped at 120 requests per tenant per minute.
- **Reporting & Heavy Export APIs**: Capped at 10 requests per user per minute to protect the database against denial-of-service via expensive queries.

```typescript
// src/lib/security/rate-limiter.ts

import { Redis } from "@upstash/redis";

export class SlidingWindowRateLimiter {
  constructor(private redis: Redis) {}

  async checkLimit(identifier: string, limit: number, windowSeconds: number): Promise<{ success: boolean; remaining: number }> {
    const key = `ratelimit:${identifier}`;
    const now = Date.now();
    const clearBefore = now - windowSeconds * 1000;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, clearBefore);
    pipeline.zcard(key);
    pipeline.zadd(key, { score: now, member: `${now}:${Math.random()}` });
    pipeline.expire(key, windowSeconds);

    const results = await pipeline.exec();
    const count = (results[1] as number) || 0;

    return {
      success: count < limit,
      remaining: Math.max(0, limit - count - 1),
    };
  }
}
```

### 9.7 Cryptographic Envelope Encryption for Sensitive MSME Data
Certain fields (e.g., Bank Account Numbers, Aadhaar Numbers, Indian GST NIC API Credentials, Gateway Secret Keys) cannot be stored in plain text, even within an RLS-protected database.

VyaparSuite utilizes **Application-Level Envelope Encryption**:
1. A master Key Encryption Key (KEK) is stored securely in environment secrets or a Hardware Security Module (KMS).
2. For each tenant, a distinct Data Encryption Key (DEK) is generated.
3. Sensitive fields are encrypted using **AES-256-GCM** with a unique Initialization Vector (IV) and authentication tag before saving to the database.

```typescript
// src/lib/crypto/envelope-encryption.ts

import crypto from "crypto";

export interface EncryptedPayload {
  iv: string;         // Hex-encoded 12-byte IV
  authTag: string;    // Hex-encoded 16-byte GCM authentication tag
  ciphertext: string; // Hex-encoded encrypted data
}

export class EnvelopeEncryptionService {
  private static ALGORITHM = "aes-256-gcm";

  /**
   * Encrypts plaintext using tenant-specific DEK
   */
  static encrypt(plaintext: string, dekBuffer: Buffer): EncryptedPayload {
    const iv = crypto.randomBytes(12); // GCM recommended IV size
    const cipher = crypto.createCipheriv(this.ALGORITHM, dekBuffer, iv);
    
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
      iv: iv.toString("hex"),
      authTag,
      ciphertext: encrypted,
    };
  }

  /**
   * Decrypts ciphertext using tenant-specific DEK and validates authentication tag
   */
  static decrypt(payload: EncryptedPayload, dekBuffer: Buffer): string {
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      dekBuffer,
      Buffer.from(payload.iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(payload.authTag, "hex"));

    let decrypted = decipher.update(payload.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8"); // Throws error if payload tampered with
    return decrypted;
  }
}
```

---

## 10. Performance & Scalability Architecture

To ensure responsiveness for MSME users operating over mobile hot-spots or low-bandwidth networks, VyaparSuite is engineered for extreme runtime efficiency.

### 10.1 React Server Components (RSC) vs Client Components
VyaparSuite maintains a 90/10 rule: 90% of all UI components are compiled and executed as React Server Components on the server.

```
+---------------------------------------------------------------------------------------+
|  Server Component (Dashboard Layout & Document View Shell)                            |
|  - Zero JavaScript shipped to browser                                                |
|  - Directly reads from local database pool                                            |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |  Client Component Island: <DocumentActionToolbar />                           |   |
|   |  - Handles submit/cancel clicks, confirmation modals                          |   |
|   +-------------------------------------------------------------------------------+   |
|                                                                                       |
|   +-------------------------------------------------------------------------------+   |
|   |  Client Component Island: <ItemGridEditor />                                  |   |
|   |  - High-speed interactive row additions, instant subtotal calculation         |   |
|   +-------------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------------+
```

### 10.2 Relational Query Optimization & Anti-N+1 Patterns
- **Column Pruning**: Views and list pages select only the explicit columns required for display (e.g., `id, name, posting_date, grand_total, doc_status`) rather than `SELECT *`.
- **Eliminating N+1 Queries**: Child lines (e.g., `sales_invoice_items`) are aggregated directly in PostgreSQL using `json_agg()` or fetched via consolidated batch queries (`WHERE sales_invoice_id = ANY($1)`), avoiding repeated round-trip calls.

```typescript
// src/modules/sales/services/sales-invoice-query.service.ts

export class SalesInvoiceQueryService {
  /**
   * Fetches multiple invoices with items in a single query using json_agg,
   * completely eliminating N+1 database roundtrips.
   */
  static async getInvoicesWithItems(tenantId: string, invoiceIds: string[]) {
    const sql = `
      SELECT 
        si.id,
        si.name,
        si.posting_date,
        si.customer_id,
        si.grand_total,
        si.doc_status,
        COALESCE(
          json_agg(
            json_build_object(
              'id', sii.id,
              'item_code', sii.item_code,
              'qty', sii.qty,
              'rate', sii.rate,
              'amount', sii.amount
            )
          ) FILTER (WHERE sii.id IS NOT NULL), '[]'
        ) as items
      FROM sales_invoices si
      LEFT JOIN sales_invoice_items sii ON sii.sales_invoice_id = si.id
      WHERE si.tenant_id = $1 AND si.id = ANY($2::uuid[])
      GROUP BY si.id;
    `;
    return await db.query(sql, [tenantId, invoiceIds]);
  }
}
```

### 10.3 High-Volume Pagination Architectures (Keyset vs Offset)
- **Standard Document Lists**: Keyset pagination (Cursor-based) is enforced on high-volume tables such as General Ledger and Stock Ledger:

```typescript
// src/modules/accounting/services/ledger-pagination.service.ts

export interface KeysetCursor {
  posting_date: string;
  id: string;
}

export class LedgerPaginationService {
  static async queryGLEntries(
    tenantId: string,
    companyId: string,
    limit: number = 50,
    cursor?: KeysetCursor
  ) {
    let sql = `
      SELECT id, posting_date, account_id, debit, credit, voucher_type, voucher_no
      FROM acc_gl_entries
      WHERE tenant_id = $1 AND company_id = $2
    `;
    const params: any[] = [tenantId, companyId];

    if (cursor) {
      params.push(cursor.posting_date, cursor.id);
      sql += ` AND (posting_date, id) < ($${params.length - 1}, $${params.length})`;
    }

    params.push(limit + 1);
    sql += ` ORDER BY posting_date DESC, id DESC LIMIT $${params.length};`;

    const rows = await db.query(sql, params);
    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    const nextCursor = hasMore && items.length > 0
      ? {
          posting_date: items[items.length - 1].posting_date,
          id: items[items.length - 1].id,
        }
      : null;

    return { items, nextCursor };
  }
}
```

### 10.4 Tiered Caching Strategy (L1 Memory, L2 Redis, L3 HTTP Data Cache)

```
[Incoming Read Request]
        │
        ▼
[L1 In-Memory LRU Cache] ──(Hit: <1ms)────▶ Return cached value
        │ (Miss)
        ▼
[L2 Distributed Redis Cache] ─(Hit: <5ms)─▶ Return & populate L1
        │ (Miss)
        ▼
[PostgreSQL Database Query] ─────────────▶ Return & populate L2 + L1
```

- **L1 In-Memory Cache**: Ultra-short TTL (5 seconds) for request deduplication in server processes.
- **L2 Redis Cache**: Stores tenant configurations, active roles, exchange rates, and tax templates (TTL: 1 hour, invalidated explicitly via cache tags).
- **L3 Next.js Data Cache**: Employs `unstable_cache` with granular revalidation tags (`revalidateTag("doctype:sales_invoice")`).

```typescript
// src/lib/cache/cache-tags.ts

import { revalidateTag } from "next/cache";

export class CacheInvalidationService {
  static async invalidateDocument(tenantId: string, doctype: string, documentId?: string) {
    // 1. Invalidate Next.js Data Cache tag
    revalidateTag(`tenant:${tenantId}:${doctype.toLowerCase()}`);
    if (documentId) {
      revalidateTag(`doc:${documentId}`);
    }

    // 2. Invalidate L2 Redis keys matching pattern
    await CacheClient.invalidateByTag(`${tenantId}:${doctype}`);
  }
}
```

### 10.5 Heavy Workload Delegation & Asynchronous Task Processing
Operations requiring more than 250ms of CPU compute are immediately offloaded from the web request loop to background workers:
- Batch GST E-Way Bill generation.
- Monthly Payroll Calculation across hundreds of employees.
- Bulky PDF generation using Headless Chromium / Puppeteer.
- End-of-year Financial Close reconciliations.

### 10.6 Dynamic Code Splitting & Module Hydration
Heavy UI sub-systems (e.g., the interactive Point of Sale interface, Project Gantt visualizers, and Rich Text print format builders) are dynamically imported using Next.js `dynamic()` with SSR disabled, keeping the main ERP bundle footprint under 120KB gzipped:

```typescript
// src/app/(pos)/pos/terminal/page.tsx

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Heavy POS Terminal island dynamically loaded on client-only
const POSTerminalIsland = dynamic(
  () => import("@/modules/pos/components/POSTerminalIsland"),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[90vh] rounded-xl" />,
  }
);

export default function POSTerminalPage() {
  return <POSTerminalIsland />;
}
```

---

## 11. Deployment, Infrastructure & DevOps

VyaparSuite supports flexible deployment models ranging from managed serverless clouds to fully air-gapped on-premise installations.

```
+---------------------------------------------------------------------------------------+
|                                    Target Models                                      |
|                                                                                       |
|   [ 1. Managed Cloud (Vercel + Supabase) ]                                            |
|   - Vercel Edge / Node Serverless runtime                                             |
|   - Supabase Managed PostgreSQL + Storage + Auth                                      |
|   - Upstash Serverless Redis for Caching & Rate Limiting                              |
|                                                                                       |
|   [ 2. Self-Hosted / On-Premise (Docker / Kubernetes) ]                               |
|   - Standalone Next.js Node.js Container                                              |
|   - Dedicated PostgreSQL 16 Cluster (with pgvector & extensions)                      |
|   - Redis Cluster (BullMQ + Caching)                                                  |
|   - MinIO Object Storage (S3-compatible)                                              |
|   - Nginx / Traefik Reverse Proxy with automated Let's Encrypt SSL                    |
+---------------------------------------------------------------------------------------+
```

### 11.1 Target Environments (Local, Staging, Cloud Production)

| Parameter | Local Development | Staging / Preview | Production (Cloud) |
| :--- | :--- | :--- | :--- |
| **Compute** | Next.js Dev Server (`npm run dev`) | Vercel Preview Deployments | Vercel Enterprise / Node Cluster |
| **Database** | Supabase Local (Docker) | Supabase Branching Instance | Supabase Multi-AZ Managed PG |
| **Cache & Queue** | In-Memory / Local Redis | Managed Redis Staging | High-Availability Redis Cluster |
| **Storage** | Supabase Local Storage (MinIO) | S3 Staging Bucket | Supabase Storage / AWS S3 Multi-Region |
| **Email** | Local Mailpit (Catch-all) | Resend Sandbox | Resend / Amazon SES Production |

### 11.2 Self-Hosted & Air-Gapped Deployment Architecture

For enterprises requiring data sovereignty, defense compliance, or operating in remote locations with intermittent connectivity, VyaparSuite packages as a self-contained `docker-compose.yml` specification:

```yaml
version: '3.8'

services:
  app:
    image: vyaparsuite/erp-core:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://vyapar:secret@postgres:5432/vyaparsuitedb
      - REDIS_URL=redis://redis:6379
      - STORAGE_DRIVER=s3
      - S3_ENDPOINT=http://minio:9000
      - S3_ACCESS_KEY=minioadmin
      - S3_SECRET_KEY=miniopassword
      - NEXTAUTH_SECRET=supersecretgeneratedkey
    depends_on:
      - postgres
      - redis
      - minio

  postgres:
    image: postgres:16-alpine
    restart: always
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=vyaparsuitedb
      - POSTGRES_USER=vyapar
      - POSTGRES_PASSWORD=secret

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redisdata:/data

  minio:
    image: minio/minio:latest
    restart: always
    command: server /data --console-address ":9001"
    volumes:
      - miniodata:/data
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=miniopassword

volumes:
  pgdata:
  redisdata:
  miniodata:
```

### 11.3 CI/CD Pipeline & Quality Gates

The continuous delivery pipeline enforces automated quality checks prior to merging code into `main`:
1. **Static Analysis**: ESLint, Prettier formatting, and strict TypeScript compilation (`tsc --noEmit`).
2. **Unit & Mathematical Verification**: Vitest suites validating rounding algorithms, GST tax splits, depreciation schedules, and currency conversions.
3. **Database Migration Verification**: Running new migrations against an ephemeral PostgreSQL container, followed by automated schema diff validation.
4. **End-to-End Testing**: Playwright suites executing complete transactional workflows: Quotation -> Sales Order -> Delivery -> Invoicing -> Ledger Verification.

### 11.4 Telemetry, OpenTelemetry Tracing, and Logging
- **Structured Logging**: All logs are emitted in JSON format via Pino, enriched with `tenant_id`, `user_id`, `trace_id`, and `duration_ms`.
- **OpenTelemetry Tracing**: Distributed traces track requests from Next.js server actions through database queries and background event execution.
- **Error Tracking**: Exceptions are captured in Sentry with complete contextual stack traces, breadcrumbs, and user session metadata (with sensitive PII masked).

---

## 12. Architectural Visualizations (Mermaid Diagrams)

### 12.1 System Context Diagram (C4 Level 1)

```mermaid
flowchart TD
    User["Enterprise User / MSME Accountant"]
    Customer["Portal Customer / Supplier"]
    Gov["Indian Tax System (GSTN / E-Way / E-Invoice)"]
    Bank["Banking Gateway (Razorpay / Open Banking)"]
    
    subgraph VyaparSuite["VyaparSuite ERP System"]
        Core["Core ERP Platform (Next.js & Supabase)"]
    end
    
    User -->|"Manages Sales, Purchases, Accounts, HR"| Core
    Customer -->|"Views Invoices & Pays Bills"| Core
    Core -->|"Reports B2B Invoices & Generates IRN/EWB"| Gov
    Core -->|"Fetches Statements & Initiates Payouts"| Bank
```

### 12.2 Container Architecture Diagram (C4 Level 2)

```mermaid
flowchart TD
    subgraph ClientTier["Client Tier"]
        Browser["Desktop & Mobile Browsers (React 19 Islands)"]
        POSDevice["POS Touch Terminals & Scanners"]
    end

    subgraph AppTier["Application Tier (Next.js 15 Runtime)"]
        Edge["Edge Middleware (Tenant & Auth Check)"]
        RSC["React Server Components Engine"]
        Actions["Server Actions & Route Handlers"]
        DomainServices["Domain Application Services"]
        OutboxWorker["Background Outbox Processor"]
    end

    subgraph InfraTier["Infrastructure & Storage Tier"]
        PG[("PostgreSQL 16 (Multi-Tenant RLS & Partitions)")]
        Redis[("Redis Cluster (Cache & BullMQ)")]
        ObjectStore[("S3 / Supabase Storage (PDFs & Media)")]
    end

    Browser -->|"HTTPS / WSS"| Edge
    POSDevice -->|"HTTPS / REST"| Edge
    Edge --> RSC
    Edge --> Actions
    RSC --> DomainServices
    Actions --> DomainServices
    DomainServices --> PG
    DomainServices --> Redis
    DomainServices --> ObjectStore
    OutboxWorker --> PG
    OutboxWorker --> Redis
```

### 12.3 Modular Monolith Dependency Graph

```mermaid
flowchart TD
    Core["core (Document Engine, Audit, Workflow)"]
    Setup["setup (Companies, Branches, Currencies)"]
    Auth["auth (Users, Roles, RBAC)"]
    
    Accounting["accounting (GL, COA, Banking)"]
    Inventory["inventory (Items, Stock Ledger, Warehouses)"]
    Sales["sales (Orders, Invoices, Delivery)"]
    Purchase["purchase (Orders, Invoices, Receipts)"]
    India["india (GST, E-Way Bill, E-Invoice)"]
    HRMS["hrms (Payroll, Attendance, Leaves)"]
    
    Setup --> Core
    Auth --> Core
    Accounting --> Setup
    Inventory --> Setup
    Sales --> Setup
    Sales --> Inventory
    Sales --> Accounting
    Purchase --> Setup
    Purchase --> Inventory
    Purchase --> Accounting
    India --> Accounting
    India --> Sales
    India --> Purchase
    HRMS --> Accounting
```

### 12.4 End-to-End Request & Execution Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant MW as Next.js Middleware
    participant SA as Server Action
    participant SVC as Sales Invoice Service
    participant DB as PostgreSQL (RLS)
    participant OB as Outbox Worker

    User->>MW: POST /sales/sales-invoices/submit (JWT Session)
    MW->>MW: Verify JWT & Inject Tenant Headers
    MW->>SA: Invoke submitInvoiceAction(invoiceId)
    SA->>SA: Validate Zod Schema & User Permissions
    SA->>SVC: SalesInvoiceService.submit(invoiceId, context)
    
    activate SVC
    SVC->>DB: BEGIN Transaction
    SVC->>DB: SET LOCAL app.current_tenant_id = '...'
    SVC->>DB: UPDATE sales_invoices SET doc_status = 1 WHERE id = ...
    SVC->>DB: INSERT INTO sys_version_logs (Diff Tracking)
    SVC->>DB: INSERT INTO sys_outbox_events ('sales.invoice.submitted')
    SVC->>DB: COMMIT Transaction
    deactivate SVC
    
    SVC-->>SA: Success Response
    SA-->>User: Refresh Route / Update UI State (Optimistic)

    Note over OB,DB: Asynchronous Event Drain
    OB->>DB: Poll PENDING sys_outbox_events
    OB->>DB: Call AccountingEngine: Create GL Entries
    OB->>DB: Call StockEngine: Deduct Stock Balances
    OB->>DB: Mark outbox event as COMPLETED
```

### 12.5 Asynchronous Outbox & Accounting Event Pipeline

```mermaid
flowchart LR
    Event["sys_outbox_events<br/>('sales.invoice.submitted')"]
    
    subgraph Processor["Outbox Worker Daemon"]
        Queue["BullMQ / PG Listen"]
        Router{"Event Type Router"}
    end
    
    subgraph Handlers["Domain Event Handlers"]
        H1["GL Posting Handler<br/>(Debits AR, Credits Revenue)"]
        H2["Stock Ledger Handler<br/>(Deducts Qty, Debits COGS)"]
        H3["India GST Handler<br/>(Generates IRN & E-Way Bill)"]
        H4["Customer Notification<br/>(Sends WhatsApp / Email)"]
    end
    
    Event --> Queue
    Queue --> Router
    Router --> H1
    Router --> H2
    Router --> H3
    Router --> H4
```

### 12.6 Authentication & RLS Resolution Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Client as Client App
    participant Auth as Supabase Auth / OIDC
    participant App as Next.js Server Action / Route
    participant DB as PostgreSQL Engine

    Client->>Auth: Login (Email & Password + TOTP)
    Auth-->>Client: Issue Signed JWT (with tenant_id & user_id)
    
    Client->>App: Request Data (Headers: Bearer JWT)
    App->>App: Verify JWT Signature (RS256)
    
    App->>DB: Acquire Connection from Pool
    App->>DB: SET LOCAL app.current_tenant_id = 'tenant_xyz';
    App->>DB: SET LOCAL app.current_user_id = 'user_123';
    
    App->>DB: SELECT * FROM acc_accounts;
    
    Note over DB: PostgreSQL RLS Engine Evaluates:<br/>WHERE tenant_id = current_app_tenant_id()
    
    DB-->>App: Return Filtered Tenant Rows Only
    App-->>Client: Rendered Server Response
```

---

## 13. System Architecture Sign-Off & Verification

This Master System Architecture Specification establishes the structural constraints, software design patterns, and operational guardrails for VyaparSuite ERP. 

All engineering implementations, database schema definitions, API contracts, and sub-module specifications developed for VyaparSuite must strictly comply with the patterns, interfaces, and invariants codified in this document.
