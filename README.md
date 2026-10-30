# VyaparSuite

> **VyaparSuite** is an open-source, production-grade enterprise resource planning (ERP) platform designed for modern businesses with first-class multi-tenancy, immutable audit ledgers, and comprehensive India localization (GST, e-Way bill, e-Invoicing, TDS/TCS).

---

## 🌟 Key Features & Architectural Pillars

- **Next-Generation Stack**: Next.js 14+ (App Router), TypeScript (strict mode), Tailwind CSS, and Supabase PostgreSQL.
- **Immutable Financial & Stock Ledgers**: General Ledger (GL) and Stock Ledger (SLE) follow strict append-only patterns. Corrections occur through reversal transactions or credit/debit notes.
- **Multi-Tenancy & Data Isolation**: Every tenant and legal entity (`company_id`) is strictly segregated with PostgreSQL Row Level Security (RLS) policies and composite indexes.
- **Financial Precision**: All monetary values, exchange rates, quantities, and tax calculations use high-precision PostgreSQL `numeric` / fixed-precision decimals—zero floating-point math issues.
- **India Compliance First-Class**:
  - Full GST Engine (CGST, SGST, IGST, UTGST, RCM, Exemptions, Composition scheme)
  - HSN / SAC code validation and tax rate resolution
  - GSTR-1, GSTR-3B, GSTR-9 ready data extraction
  - Real-time e-Invoicing (IRN, QR Code) and NIC e-Way Bill generation
  - TDS & TCS deduction registers and Form 26Q/27Q preparation
- **Domain-Driven Modular Architecture**: Clean separation between domain entities, business services, server actions, schemas (Zod), and UI layers. Infrastructure adapters abstract Supabase to ensure low coupling.
- **Granular RBAC & Audit Trails**: Role-based permissions down to document-level actions (`read`, `create`, `update`, `submit`, `cancel`, `amend`, `delete`) and comprehensive activity logging.

---

## 🧱 Modules Overview

| Module | Scope & Highlights |
|---|---|
| **Core & Setup** | Multi-company configuration, fiscal years, currency exchange, chart of accounts, numbering series |
| **Auth & Security** | Supabase Auth integration, multi-factor authentication (MFA), role and permission assignment |
| **Accounting** | General ledger, journal entries, accounts payable/receivable, bank reconciliation, financial statements (P&L, Balance Sheet, Cash Flow) |
| **India Compliance** | GST calculation, e-Invoice generation (IRN), e-Way bill, GSTR reporting, TDS/TCS management |
| **Sales** | Leads, opportunities, quotations, sales orders, delivery notes, sales invoices, credit notes |
| **Purchase** | Material requests, supplier RFQs, purchase orders, purchase receipts, purchase invoices, debit notes |
| **Inventory** | Item master, variants, batches, serial numbers, multi-warehouse stock management, stock valuation (FIFO / Moving Average) |
| **POS** | Point of Sale interface, offline-tolerant register, shift reconciliation, receipt printing |
| **Manufacturing** | Bill of Materials (BOM), multi-level operations, work orders, job cards, scrap management |
| **Quality** | Inspection criteria, incoming/in-process/final inspection records, non-conformance reports |
| **Assets** | Asset register, depreciation schedules (Straight Line / WDV), asset maintenance, disposals |
| **Projects** | Project tracking, task dependencies, milestone billing, timesheets, project profitability |
| **HRMS** | Employee master, departments, designations, attendance, leave management, payroll processing |
| **Support** | Ticket lifecycle, customer issue management, SLAs, service level escalation |
| **Website & Marketing** | Public catalog, customer portal, lead capture campaigns, email marketing |
| **Reports & Analytics** | Standard operational reports, financial statements, configurable executive dashboards |

---

## 📂 Project Structure

```
.
├── docs/                         # Architecture, domain specifications, and compliance guides
│   ├── API_SPECIFICATION.md
│   ├── DOCUMENT_LIFECYCLE.md
│   ├── INDIA_COMPLIANCE_SPEC.md
│   ├── MODULE_DEPENDENCY_MAP.md
│   ├── PERMISSION_MATRIX.md
│   ├── PRODUCT_VISION.md
│   └── SYSTEM_ARCHITECTURE.md
├── public/                       # Static public assets (icons, images)
├── scripts/                      # Operational scripts, seeds, migrations
├── src/
│   ├── app/                      # Next.js App Router (pages, layouts, route handlers)
│   │   ├── (auth)/               # Authentication route group (login, register, forgot-password)
│   │   ├── (erp)/                # Authenticated ERP application route group
│   │   └── api/                  # REST / Webhook API endpoints
│   ├── components/               # Shared presentation components
│   │   ├── charts/               # Analytics & dashboard charts
│   │   ├── forms/                # Form inputs, selectors, and validation controls
│   │   ├── layout/               # Header, sidebar, command palette, page shells
│   │   ├── tables/               # Data tables, pagination, filters, virtual lists
│   │   └── ui/                   # Primitive design system components
│   ├── config/                   # Global configuration constants and navigation
│   ├── hooks/                    # Reusable React hooks
│   ├── lib/                      # Core infrastructure adapters & utilities
│   │   ├── auth/                 # Supabase session and user helpers
│   │   ├── cache/                # Cache layers & invalidation helpers
│   │   ├── db/                   # Database client, query helpers, transaction management
│   │   ├── email/                # Transactional email dispatcher
│   │   ├── queue/                # Background job queue processing
│   │   ├── search/               # Full-text and vector search abstractions
│   │   ├── storage/              # Supabase Storage client for document attachments
│   │   └── utils/                # Monetary math, formatting, dates, string helpers
│   ├── modules/                  # Self-contained domain modules
│   │   └── <module_name>/
│   │       ├── actions/          # Next.js Server Actions
│   │       ├── components/       # Domain-specific components
│   │       ├── events/           # Domain event listeners and publishers
│   │       ├── schemas/          # Zod validation schemas
│   │       ├── services/         # Business logic and ledger writers
│   │       ├── tests/            # Unit and integration test suites
│   │       └── types/            # Module-specific TypeScript definitions
│   └── types/                    # Global database and application types
├── supabase/                     # Supabase migrations, RLS policies, and seed data
└── tests/                        # End-to-end (E2E) and integration test fixtures
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **Supabase CLI**: installed and authenticated (`brew install supabase/tap/supabase`)
- **Docker**: required for local Supabase development

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repo-url> vyaparsuite
cd vyaparsuite
npm install
```

### 3. Environment Configuration
Copy the environment template and populate your credentials:
```bash
cp .env.local.example .env.local
```
Provide the Supabase URL, anon key, and service role key:
```ini
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Database Setup
Start the local Supabase container or link to your remote instance:
```bash
# Start local Supabase instance
supabase start

# Apply database migrations
npm run db:migrate

# Seed standard Chart of Accounts, tax templates, and system roles
npm run db:seed

# Generate TypeScript types from Supabase schema
npm run db:types
```

### 5. Running the Application
```bash
# Start development server
npm run dev

# Run type checker
npm run typecheck

# Run test suites
npm run test

# Run end-to-end tests
npm run test:e2e
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## 📖 Specifications & Architecture Documentation

For deep technical insights, review the documentation in the `/docs` directory:
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Document Lifecycle & Ledger Workflows](docs/DOCUMENT_LIFECYCLE.md)
- [India Compliance Specification](docs/INDIA_COMPLIANCE_SPEC.md)
- [Module Dependency Map](docs/MODULE_DEPENDENCY_MAP.md)
- [Role & Permission Matrix](docs/PERMISSION_MATRIX.md)
- [API Specification](docs/API_SPECIFICATION.md)
- [Product Vision](docs/PRODUCT_VISION.md)

---

## 🛡️ License
Private & Proprietary © VyaparSuite Team.
