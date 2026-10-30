# VyaparSuite — Navigation Architecture & UI Routing Map

> **Complete Information Architecture, App Launcher, Sidebar Hierarchies, URL Routing, and Interaction Design Specification**  
> *Document Version: 1.0.0*  
> *Status: Approved & Canonical Specification*  
> *Classification: Frontend Architecture & UX Engineering Guide*

---

## 1. Navigation Architecture Principles

VyaparSuite’s navigation architecture is engineered for **speed, ergonomics, cognitive clarity, and zero-latency exploration**. Designed around modern Next.js App Router patterns, Radix UI accessibility, and Tailwind CSS design systems, it balances the density required by enterprise power-users with the simplicity demanded by non-technical SMB operators.

### 1.1 Core Navigation Tenets
1. **Three-Click Maximum Rule**: Any operational document, analytical report, or configuration setting must be reachable within a maximum of three interactions from any screen.
2. **Instant Omnipresent Command Palette (`Cmd + K`)**: Keyboard-first navigation allowing instant jumps across modules, records, quick actions, and settings without touching the mouse.
3. **Contextual Progressive Disclosure**: Sidebars and menus reveal operational depth dynamically based on user role clearances and active company modules, hiding disabled capabilities.
4. **Persistent Multi-Entity Context**: The active legal Company and physical Branch context is always visible in the global top bar, preventing cross-entity booking mistakes.
5. **Predictable RESTful URL Structure**: Strictly standardized routing schemas enabling deep-linking, browser history navigation, and tabbed multi-tasking.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ GLOBAL TOP BAR: [App Launcher] [Company/Branch Switcher] [Search Cmd+K] [+ New] [User] │
├──────────────────────────┬─────────────────────────────────────────────────────────────┤
│ SIDEBAR NAVIGATION       │ BREADCRUMB: Home > Accounting > Sales Invoices > INV-00421  │
│ ├── App Title / Icon     ├─────────────────────────────────────────────────────────────┤
│ ├── Workspace Overview   │                                                             │
│ ├── Section Header 1     │                     VIEWPORT CONTENT                        │
│ │   ├── Menu Item (Badge)│             (Server-Rendered Page Component)                │
│ │   └── Menu Item        │                                                             │
│ ├── Section Header 2     │                                                             │
│ │   ├── Menu Item        │                                                             │
│ └── Module Settings      │                                                             │
└──────────────────────────┴─────────────────────────────────────────────────────────────┘
```

---

## 2. App Launcher Catalog (The 22 Applications)

The App Launcher is accessible via the persistent 9-dot grid icon in the global top bar. It provides instantaneous switching between operational modules.

| App Slug | Module Display Name | Lucide Icon | Accent Theme | Description | Target Route |
|---|---|---|---|---|---|
| `accounting` | Financial Accounting | `Landmark` | Emerald | Double-entry general ledger, vouchers, financial statements, and AR/AP. | `/app/accounting` |
| `tax-compliance` | India GST & Tax | `Scale` | Indigo | Direct e-Invoice, e-Way bill, GSTR-1/3B filing, and statutory TDS/TCS. | `/app/tax-compliance` |
| `sales` | Sales & Invoicing | `TrendingUp` | Blue | Quotations, sales orders, customer delivery notes, and receivables. | `/app/sales` |
| `procurement` | Procurement & AP | `ShoppingCart` | Amber | Requisitions, RFQs, vendor comparisons, purchase orders, and 3-way match.| `/app/procurement` |
| `inventory` | Stock & Warehouse | `Boxes` | Violet | Multi-warehouse tracking, serialized stock, batch-expiry, and bin cards. | `/app/inventory` |
| `pos` | Point of Sale | `Store` | Rose | Offline-first high-speed retail checkout, thermal receipts, and cash drawer.| `/app/pos` |
| `manufacturing` | Manufacturing & BOM | `Factory` | Orange | Multi-level BOMs, work stations, routing, job cards, and scrap accounting.| `/app/manufacturing` |
| `quality` | Quality Assurance | `ClipboardCheck`| Teal | Inward raw material inspection, shop-floor checks, and CAPA logs. | `/app/quality` |
| `assets` | Asset Management | `Building2` | Slate | Fixed asset registers, depreciation engines (SLM/WDV), and maintenance. | `/app/assets` |
| `crm` | CRM & Pipelines | `Users` | Cyan | Omnichannel lead capture, deal Kanban stages, and opportunity funnels. | `/app/crm` |
| `marketing` | Marketing Campaigns | `Megaphone` | Fuchsia | Customer segmentation, bulk WhatsApp/Email broadcasts, and ROI tracking. | `/app/marketing` |
| `ecommerce` | E-Commerce Store | `ShoppingBag` | Sky | Headless catalog sync, B2B wholesale portal, and payment gateway webhooks. | `/app/ecommerce` |
| `hrms` | HR & Personnel | `UserCheck` | Green | Employee lifecycle, biometric attendance, shift rosters, and leave approvals.| `/app/hrms` |
| `payroll` | Payroll & Benefits | `BadgePercent` | Lime | Indian statutory payroll (PF, ESIC, PT), payslips, and bank payout files. | `/app/payroll` |
| `projects` | Projects & Costing | `Briefcase` | Yellow | Work breakdown structures, Gantt milestones, timesheets, and job profitability.| `/app/projects` |
| `support` | Helpdesk & Support | `LifeBuoy` | Red | Support tickets, SLA breach alerts, customer portal, and knowledge base. | `/app/support` |
| `workflows` | Workflow & Approvals| `GitFork` | Purple | Visual state machines, delegation rules, multi-tier approval chains, and SLAs.| `/app/workflows` |
| `analytics` | BI & Reporting | `BarChart3` | Blue | Consolidated financial dashboards, drill-down pivot grids, and exports.| `/app/analytics` |
| `studio` | Low-Code Studio | `Code2` | Zinc | Custom doctypes, dynamic form fields, client scripting, and print formats.| `/app/studio` |
| `integrations` | API & Integrations | `Plug` | Stone | Webhooks, REST/GraphQL keys, logistics aggregators, and bank connectors. | `/app/integrations` |
| `security` | Identity & Security | `ShieldAlert` | Red | Role assignments, RLS policies, audit logs, and session management. | `/app/security` |
| `setup` | Masters & Setup | `Settings2` | Slate | Company entities, branch registries, currencies, UOMs, and fiscal years. | `/app/setup` |

---

## 3. Module Sidebar Navigation (Complete Specification Across All 22 Modules)

Each module renders a focused, two-level hierarchical sidebar navigation. Badges display real-time query counts (e.g., unpaid invoices, pending approvals, low stock warnings).

### 3.1 Financial Accounting (`/app/accounting`)
- **Workspace Dashboard**: `/app/accounting`
- **Section: General Ledger & Vouchers**
  - General Ledger: `/app/accounting/general-ledger`
  - Journal Entries: `/app/accounting/journal-entry` *(Badge: Pending Review)*
  - Payment Entries: `/app/accounting/payment-entry` *(Badge: Pending Auth)*
  - Bank Clearance: `/app/accounting/bank-clearance`
  - Bank Reconciliation Tool: `/app/accounting/bank-reconciliation`
- **Section: Accounts Receivable & Payable**
  - Sales Invoices: `/app/accounting/sales-invoice` *(Badge: Overdue Count)*
  - Purchase Invoices: `/app/accounting/purchase-invoice` *(Badge: Unpaid Count)*
  - Credit Notes: `/app/accounting/credit-note`
  - Debit Notes: `/app/accounting/debit-note`
  - Payment Requests: `/app/accounting/payment-request`
- **Section: Financial Statements**
  - Balance Sheet: `/app/accounting/report/balance-sheet`
  - Profit and Loss: `/app/accounting/report/profit-loss`
  - Trial Balance: `/app/accounting/report/trial-balance`
  - Cash Flow Statement: `/app/accounting/report/cash-flow`
  - Accounts Receivable Aging: `/app/accounting/report/ar-aging`
  - Accounts Payable Aging: `/app/accounting/report/ap-aging`
- **Section: Master Setup**
  - Chart of Accounts: `/app/accounting/chart-of-accounts`
  - Fiscal Years: `/app/accounting/fiscal-year`
  - Cost Centers: `/app/accounting/cost-center`
  - Payment Terms: `/app/accounting/payment-term`

### 3.2 India Statutory Compliance & Tax Engine (`/app/tax-compliance`)
- **Workspace Dashboard**: `/app/tax-compliance`
- **Section: GST E-Way Bill & E-Invoice**
  - E-Invoice Generation: `/app/tax-compliance/e-invoice` *(Badge: Pending IRN)*
  - E-Way Bills: `/app/tax-compliance/e-way-bill` *(Badge: Expiring Today)*
  - Consolidated E-Way Bills: `/app/tax-compliance/consolidated-e-way-bill`
  - IRP Authentication Logs: `/app/tax-compliance/irp-logs`
- **Section: GST Periodic Returns**
  - GSTR-1 (Outward Supplies): `/app/tax-compliance/gstr-1`
  - GSTR-2B Auto-Reconciliation: `/app/tax-compliance/gstr-2b-reconcile` *(Badge: Mismatch)*
  - GSTR-3B (Summary Tax Return): `/app/tax-compliance/gstr-3b`
  - GSTR-9 (Annual Return): `/app/tax-compliance/gstr-9`
- **Section: TDS & TCS Direct Tax**
  - TDS Vouchers & Withholding: `/app/tax-compliance/tds-entry`
  - TDS Slabs & Sections (194C/J/Q): `/app/tax-compliance/tds-category`
  - Form 26Q Export Preparation: `/app/tax-compliance/form-26q`
  - TCS Collection Register: `/app/tax-compliance/tcs-register`
- **Section: Statutory Audit**
  - MCA Rule 3 Audit Trail: `/app/tax-compliance/audit-trail`

### 3.3 Sales & Order Management (`/app/sales`)
- **Workspace Dashboard**: `/app/sales`
- **Section: Customer Operations**
  - Customers: `/app/sales/customer`
  - Customer Groups: `/app/sales/customer-group`
  - Customer Credit Registry: `/app/sales/credit-limits` *(Badge: Blocked Orders)*
- **Section: Order Fulfillment**
  - Quotations: `/app/sales/quotation` *(Badge: Expiring Soon)*
  - Sales Orders: `/app/sales/sales-order` *(Badge: Pending Approval)*
  - Pick Lists: `/app/sales/pick-list`
  - Delivery Notes: `/app/sales/delivery-note` *(Badge: To Dispatch)*
  - Sales Invoices: `/app/sales/sales-invoice`
- **Section: Pricing & Commercials**
  - Price Lists: `/app/sales/price-list`
  - Item Pricing Rules: `/app/sales/pricing-rule`
  - Promotional Schemes: `/app/sales/promotions`
  - Sales Partner Commissions: `/app/sales/sales-partner`
- **Section: Analytics**
  - Sales Analytics Funnel: `/app/sales/report/sales-analytics`
  - Territory Sales Summary: `/app/sales/report/territory-sales`

### 3.4 Procurement & Vendor Management (`/app/procurement`)
- **Workspace Dashboard**: `/app/procurement`
- **Section: Purchasing Operations**
  - Material Requests: `/app/procurement/material-request` *(Badge: Pending Action)*
  - Request for Quotations (RFQ): `/app/procurement/rfq`
  - Supplier Quotations: `/app/procurement/supplier-quotation`
  - Quotation Comparison Sheet: `/app/procurement/quotation-comparison`
  - Purchase Orders: `/app/procurement/purchase-order` *(Badge: To Approve)*
- **Section: Receiving & Invoicing**
  - Purchase Receipts (GRN): `/app/procurement/purchase-receipt` *(Badge: Quality Pending)*
  - Landed Cost Vouchers: `/app/procurement/landed-cost-voucher`
  - Purchase Invoices: `/app/procurement/purchase-invoice`
- **Section: Vendor Directory**
  - Suppliers: `/app/procurement/supplier`
  - Supplier Scorecards: `/app/procurement/supplier-scorecard`
  - Supplier Groups: `/app/procurement/supplier-group`

### 3.5 Inventory & Warehouse Management (`/app/inventory`)
- **Workspace Dashboard**: `/app/inventory`
- **Section: Stock Transactions**
  - Stock Entries (Transfers / Issues): `/app/inventory/stock-entry`
  - Stock Reconciliation: `/app/inventory/stock-reconciliation`
  - Delivery Trips: `/app/inventory/delivery-trip`
- **Section: Item Catalog**
  - Items / Products: `/app/inventory/item`
  - Item Groups: `/app/inventory/item-group`
  - Serial Numbers: `/app/inventory/serial-no`
  - Batch / Lot Tracking: `/app/inventory/batch` *(Badge: Expiring <30d)*
  - Barcode Management: `/app/inventory/barcode`
- **Section: Warehouse Infrastructure**
  - Warehouses: `/app/inventory/warehouse`
  - Bin Card Balances: `/app/inventory/report/stock-balance`
  - Reorder Level Alerts: `/app/inventory/report/reorder-level` *(Badge: Low Stock)*
  - Stock Aging Analysis: `/app/inventory/report/stock-aging`

### 3.6 Point of Sale (POS) (`/app/pos`)
- **Cashier Terminal Launcher**: `/app/pos/terminal` *(Direct Fullscreen Checkout)*
- **Section: POS Governance**
  - POS Profiles: `/app/pos/pos-profile`
  - Opening / Closing Shifts: `/app/pos/pos-shift` *(Badge: Open Shifts)*
  - POS Invoices / Receipts: `/app/pos/pos-invoice`
  - Cash Drawer Balances: `/app/pos/cash-drawer`
  - Daily Shift Register: `/app/pos/report/shift-summary`

### 3.7 Manufacturing & Production (`/app/manufacturing`)
- **Workspace Dashboard**: `/app/manufacturing`
- **Section: Engineering Masters**
  - Bill of Materials (BOM): `/app/manufacturing/bom`
  - Operations: `/app/manufacturing/operation`
  - Workstations & Centers: `/app/manufacturing/workstation`
  - Routing Templates: `/app/manufacturing/routing`
- **Section: Shop Floor Operations**
  - Work Orders: `/app/manufacturing/work-order` *(Badge: In Progress)*
  - Production Planning Tool: `/app/manufacturing/production-plan`
  - Job Cards: `/app/manufacturing/job-card` *(Badge: Open Jobs)*
  - Subcontracting Orders: `/app/manufacturing/subcontracting-order`
  - Scrap Records: `/app/manufacturing/scrap-log`

### 3.8 Quality Management (`/app/quality`)
- **Workspace Dashboard**: `/app/quality`
- **Section: Inspections**
  - Quality Inspections: `/app/quality/quality-inspection` *(Badge: Failed Checks)*
  - Inspection Templates: `/app/quality/inspection-template`
  - Inspection Parameters: `/app/quality/inspection-parameter`
- **Section: Non-Conformance & Governance**
  - Non-Conformance Reports (NCR): `/app/quality/ncr` *(Badge: Active Open)*
  - CAPA (Corrective Action): `/app/quality/capa`
  - Calibration Logs: `/app/quality/calibration`

### 3.9 Fixed Asset Management (`/app/assets`)
- **Workspace Dashboard**: `/app/assets`
- **Section: Asset Registers**
  - Asset Registry: `/app/assets/asset`
  - Asset Categories: `/app/assets/asset-category`
  - Asset Movements & Location: `/app/assets/asset-movement`
- **Section: Depreciation & Disposal**
  - Depreciation Schedules: `/app/assets/depreciation-schedule`
  - Depreciation Postings: `/app/assets/depreciation-posting`
  - Asset Maintenance Logs: `/app/assets/maintenance` *(Badge: Overdue)*
  - Asset Repairs: `/app/assets/asset-repair`
  - Asset Scrapping / Sale: `/app/assets/asset-disposal`

### 3.10 CRM & Lead Management (`/app/crm`)
- **Workspace Dashboard**: `/app/crm`
- **Section: Sales Pipelines**
  - Leads: `/app/crm/lead` *(Badge: New Today)*
  - Visual Pipeline Kanban: `/app/crm/kanban`
  - Opportunities: `/app/crm/opportunity` *(Badge: Hot Deals)*
  - Contact Directory: `/app/crm/contact`
- **Section: Activity Tracking**
  - Calls & Meetings: `/app/crm/activity`
  - Lead Sources: `/app/crm/lead-source`

### 3.11 Marketing Automation (`/app/marketing`)
- **Workspace Dashboard**: `/app/marketing`
- **Section: Campaigns**
  - Campaigns: `/app/marketing/campaign` *(Badge: Active)*
  - Email Broadcasts: `/app/marketing/email-campaign`
  - WhatsApp Broadcasts: `/app/marketing/whatsapp-campaign`
  - SMS Templates: `/app/marketing/sms-template`
- **Section: Segments**
  - Contact Segments: `/app/marketing/segment`
  - Unsubscribe Register: `/app/marketing/unsubscribe`

### 3.12 E-Commerce Storefront Admin (`/app/ecommerce`)
- **Workspace Dashboard**: `/app/ecommerce`
- **Section: Storefront Governance**
  - Online Catalog Items: `/app/ecommerce/item-listing`
  - Featured Collections: `/app/ecommerce/collection`
  - Web Orders: `/app/ecommerce/web-order` *(Badge: Unfulfilled)*
  - Customer Accounts: `/app/ecommerce/web-customer`
  - Payment Gateway Logs: `/app/ecommerce/gateway-log`

### 3.13 Human Resource Management (HRMS) (`/app/hrms`)
- **Workspace Dashboard**: `/app/hrms`
- **Section: Employee Operations**
  - Employees: `/app/hrms/employee`
  - Employment Types: `/app/hrms/employment-type`
  - Departments: `/app/hrms/department`
  - Designations: `/app/hrms/designation`
  - Branch Allocations: `/app/hrms/branch-allocation`
- **Section: Attendance & Shifts**
  - Attendance Logs: `/app/hrms/attendance` *(Badge: Absences Today)*
  - Biometric Logs Sync: `/app/hrms/biometric-sync`
  - Shift Types & Rotas: `/app/hrms/shift-roster`
  - Holiday Calendars: `/app/hrms/holiday-calendar`
- **Section: Leave Management**
  - Leave Applications: `/app/hrms/leave-application` *(Badge: Pending Approval)*
  - Leave Allocations: `/app/hrms/leave-allocation`
  - Leave Types & Policy: `/app/hrms/leave-type`
  - Leave Encashment: `/app/hrms/leave-encashment`
- **Section: Lifecycle**
  - Onboarding Checklists: `/app/hrms/onboarding`
  - Separation & Exit: `/app/hrms/separation`

### 3.14 Payroll & Statutory Remittances (`/app/payroll`)
- **Workspace Dashboard**: `/app/payroll`
- **Section: Monthly Payroll**
  - Payroll Entries: `/app/payroll/payroll-entry` *(Badge: Pending Submission)*
  - Salary Slips: `/app/payroll/salary-slip`
  - Bank Disbursement Batches: `/app/payroll/bank-batch`
- **Section: Salary Structures & Statutory**
  - Salary Structures: `/app/payroll/salary-structure`
  - Salary Components (Basic, HRA): `/app/payroll/salary-component`
  - Employee PF Register: `/app/payroll/pf-register`
  - ESIC Monthly Summary: `/app/payroll/esic-summary`
  - Professional Tax Slabs: `/app/payroll/pt-slabs`
  - Income Tax Form 16: `/app/payroll/form-16`

### 3.15 Project Management & Job Costing (`/app/projects`)
- **Workspace Dashboard**: `/app/projects`
- **Section: Delivery & Tasks**
  - Projects: `/app/projects/project` *(Badge: Active Overdue)*
  - Task Boards: `/app/projects/task`
  - Gantt Timeline: `/app/projects/gantt`
  - Employee Timesheets: `/app/projects/timesheet` *(Badge: Pending Sign-off)*
- **Section: Costing & Profitability**
  - Project Budgets: `/app/projects/budget`
  - Job Costing Analysis: `/app/projects/report/job-costing`
  - Milestone Billing Plans: `/app/projects/billing-plan`

### 3.16 Customer Support & Helpdesk (`/app/support`)
- **Workspace Dashboard**: `/app/support`
- **Section: Ticket Management**
  - All Tickets: `/app/support/ticket` *(Badge: Unassigned / SLA Breached)*
  - My Assigned Tickets: `/app/support/my-tickets`
  - Issue Classifications: `/app/support/issue-type`
  - SLA Policies: `/app/support/sla-policy`
- **Section: Knowledge Base**
  - Help Articles: `/app/support/kb-article`
  - Article Categories: `/app/support/kb-category`

### 3.17 Workflow & Approval Engine (`/app/workflows`)
- **Workspace Dashboard**: `/app/workflows`
- **Section: Pending Approvals Queue**
  - My Pending Approvals: `/app/workflows/my-approvals` *(Badge: High-Priority Pending)*
  - Delegation Rules: `/app/workflows/delegation`
- **Section: Workflow Studio**
  - State Machines: `/app/workflows/state-machine`
  - Transitions & Conditions: `/app/workflows/transition`
  - SLA Escalation Timers: `/app/workflows/sla-timers`
  - Immutable Audit Action Logs: `/app/workflows/audit-log`

### 3.18 Reporting & Business Intelligence (`/app/analytics`)
- **Workspace Dashboard**: `/app/analytics`
- **Section: Executive Summaries**
  - CFO Financial Cockpit: `/app/analytics/cfo-cockpit`
  - Revenue Operations Hub: `/app/analytics/revops-dashboard`
  - Inventory Velocity Matrix: `/app/analytics/inventory-velocity`
- **Section: Report Engine**
  - Master Report Directory: `/app/analytics/report-catalog`
  - Custom SQL / Query Builder: `/app/analytics/query-builder`
  - Scheduled Email Reports: `/app/analytics/scheduled-reports`

### 3.19 Low-Code Customization & Studio (`/app/studio`)
- **Workspace Dashboard**: `/app/studio`
- **Section: Schema & Data Models**
  - DocType Modeler: `/app/studio/doctype`
  - Custom Fields: `/app/studio/custom-field`
  - Client Validation Scripts: `/app/studio/client-script`
  - Server Hooks: `/app/studio/server-hook`
- **Section: Output & Layout**
  - Print Format Builder: `/app/studio/print-designer`
  - Webhook Automations: `/app/studio/automation`

### 3.20 API Platform & Integrations (`/app/integrations`)
- **Workspace Dashboard**: `/app/integrations`
- **Section: External Connectors**
  - India NIC / E-Invoice Gateway: `/app/integrations/nic-gateway`
  - Shipping Logistics (Delhivery / Shiprocket): `/app/integrations/logistics`
  - Payment Gateways (Razorpay / Stripe): `/app/integrations/payments`
  - Open Banking Connected Accounts: `/app/integrations/open-banking`
- **Section: Developer Ecosystem**
  - API Keys & Tokens: `/app/integrations/api-keys`
  - Webhook Subscriptions: `/app/integrations/webhooks`
  - Interactive OpenAPI Swagger Explorer: `/app/integrations/docs`

### 3.21 Identity, Access & Security (`/app/security`)
- **Workspace Dashboard**: `/app/security`
- **Section: Access Control**
  - Users: `/app/security/user`
  - Roles & Privileges: `/app/security/role`
  - Permission Matrix Inspector: `/app/security/permission-inspector`
  - Segregation of Duties Rules: `/app/security/sod-rules`
- **Section: Governance & Forensics**
  - Immutable Audit Trail (MCA Rule 3): `/app/security/audit-trail`
  - Active User Sessions: `/app/security/sessions`
  - Security Incident Logs: `/app/security/security-events`

### 3.22 Setup & Master Data (`/app/setup`)
- **Workspace Dashboard**: `/app/setup`
- **Section: Corporate Structure**
  - Companies (Legal Entities): `/app/setup/company`
  - Branches & Cost Centers: `/app/setup/branch`
  - Fiscal Years: `/app/setup/fiscal-year`
- **Section: Global Standards**
  - Currencies & Exchange Rates: `/app/setup/currency`
  - Units of Measure (UOM): `/app/setup/uom`
  - Document Naming Series: `/app/setup/naming-series`
  - System Global Settings: `/app/setup/global-settings`

---

## 4. Global Top Bar Elements

The top navigation bar is permanently docked at the apex of the screen (height: `h-14`, `56px`), providing omnipresent workspace control:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ [≡ Grid] VyaparSuite | [Company: Apex Mills ▾] [Branch: Mumbai ▾] | [Cmd+K Search] ... │
│                                   ... [+ New ▾] [🔔 3] [⚙ Background] [Help] [Avatar ▾]│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **App Switcher (9-Dot Grid)**: Opens a modern modal overlay showing the 22 apps with search filtering.
2. **Entity Context Switcher (Company / Branch Dropdown)**:
   - Displays the active Company and active Branch.
   - Allows instant switching between authorized companies. Switching instantly re-executes session claims and reloads current views under the target entity.
3. **Omni-Search Bar**:
   - High-visibility pill button: `Search records, doctypes, actions... (Cmd+K)`.
4. **Universal Quick-Create (`+ New` Dropdown)**:
   - Direct shortcut dropdown to instantiate transactions immediately.
5. **Notification Bell with Dynamic Badge**:
   - Displays unread workflow approval requests, SLA warnings, and mention notifications.
   - Opens the slide-over Notification Drawer.
6. **Background Task & Sync Monitor**:
   - Spinning indicator when data imports, batch PDF generations, or tax filings are running.
   - Clicking reveals real-time job progress percentages.
7. **Contextual Help & Documentation**:
   - Direct link to keyboard shortcuts cheat sheet, video tutorials, and technical docs.
8. **User Profile & Account Avatar**:
   - Displays avatar, full name, and primary role badge.

---

## 5. Universal Quick-Create Menu (`+ New`)

The Quick-Create menu surfaces the 20 most frequent business transactions across the enterprise:

```
┌──────────────────────────────────────────────────────────────┐
│ QUICK CREATE TRANSACTION                                     │
├───────────────────────────────┬──────────────────────────────┤
│ COMMERCIAL OPERATIONS         │ LOGISTICS & SUPPLY CHAIN     │
│ • New Quotation               │ • New Material Request       │
│ • New Sales Order             │ • New Purchase Order         │
│ • New Sales Invoice           │ • New Goods Receipt (GRN)    │
│ • New Lead                    │ • New Stock Transfer Entry   │
│ • New Customer                │ • New Item Master            │
├───────────────────────────────┼──────────────────────────────┤
│ FINANCIALS & TREASURY         │ PEOPLE & OPERATIONS          │
│ • New Payment Entry           │ • Apply for Leave            │
│ • New Journal Entry           │ • Submit Expense Claim       │
│ • New Expense Voucher         │ • Log Timesheet Hours        │
│ • New Purchase Invoice        │ • Create Support Ticket      │
└───────────────────────────────┴──────────────────────────────┘
```

---

## 6. Global Search Scope (`Cmd + K` Command Palette)

VyaparSuite’s Command Palette indexes three distinct tiers of data using local indexing and PostgreSQL `pgvector` / `pg_trgm`:

1. **Application Navigation**:
   - Matches all 22 modules, sub-menus, doctypes, and system setting panels (e.g., typing "Chart of Accounts" jumps directly to `/app/accounting/chart-of-accounts`).
2. **Direct Record Lookup**:
   - Fast trilateral index matching:
     - Customer / Vendor name, phone, email, and GSTIN.
     - Document series numbers (e.g., `INV-2026-00421`, `PO-00812`, `SO-10923`).
     - Item SKU, Item Name, and Serial/Batch numbers.
     - Employee ID and Name.
3. **Quick Contextual Actions**:
   - Direct command execution (e.g., `> Change Company`, `> Run Balance Sheet`, `> Clear Cache`, `> Toggle Dark Mode`).

---

## 7. User Menu & Account Preferences

Clicking the user avatar reveals:
- **User Header**: Display Name, Email, Primary Role Badge (`Finance Manager`).
- **Active Company / Branch Indicator**: Current operational context.
- **My Profile**: Contact info, avatar upload, regional language preference (`English`, `Hindi`, `Marathi`, `Gujarati`, `Tamil`).
- **Security & MFA**: Manage TOTP Authenticator apps, active sessions, and password rotation.
- **My Notification Preferences**: In-app, Email, WhatsApp alert subscriptions.
- **Keyboard Shortcuts Cheat Sheet**: Modal displaying all hotkeys.
- **Theme Selection**: Light, Dark, System Match.
- **Sign Out**: Revokes JWT session and purges local encrypted storage.

---

## 8. Keyboard Shortcuts Specification

VyaparSuite is fully operable without a mouse.

### 8.1 Global Application Shortcuts
| Key Combination | Action | Scope |
|---|---|---|
| `Cmd + K` / `Ctrl + K` | Open Universal Command Palette | Global |
| `Cmd + /` / `Ctrl + /` | Open Keyboard Shortcuts Cheat Sheet | Global |
| `G then A` | Go to Accounting Module | Global |
| `G then S` | Go to Sales Module | Global |
| `G then P` | Go to Procurement Module | Global |
| `G then I` | Go to Inventory Module | Global |
| `G then H` | Go to HRMS Module | Global |
| `Cmd + B` / `Ctrl + B` | Toggle Navigation Sidebar (Collapse/Expand) | Global |

### 8.2 Document List View Shortcuts
| Key Combination | Action | Scope |
|---|---|---|
| `C` / `N` | Create New Record in Current DocType | List View |
| `J` / `Down Arrow` | Move Selection to Next Row | List View |
| `K` / `Up Arrow` | Move Selection to Previous Row | List View |
| `Enter` / `O` | Open Selected Document | List View |
| `X` | Select / Unselect Checkbox of Active Row | List View |
| `Shift + A` | Select All Rows in Current Page | List View |
| `Cmd + R` / `F5` | Refresh Grid Data | List View |
| `F` | Focus Search / Filter Input | List View |

### 8.3 Form & Transaction Edit Shortcuts
| Key Combination | Action | Scope |
|---|---|---|
| `Cmd + S` / `Ctrl + S` | Save Current Record (Draft) | Form View |
| `Cmd + Enter` / `Ctrl + Enter` | Submit Document for Approval / Final Ledger Post | Form View |
| `Cmd + P` / `Ctrl + P` | Open Print Preview / Generate PDF | Form View |
| `Cmd + E` / `Ctrl + E` | Dispatch via Email / WhatsApp Modal | Form View |
| `Cmd + Shift + X` | Cancel Submitted Document | Form View |
| `Cmd + Shift + A` | Amend Cancelled Document | Form View |
| `Tab` | Advance to Next Field in Form | Form View |
| `Shift + Tab` | Move to Previous Field | Form View |
| `Insert` / `Alt + N` | Add New Row to Line-Item Grid (Items, Entries) | Form Grid |
| `Delete` / `Alt + D` | Remove Active Row in Line-Item Grid | Form Grid |

---

## 9. Breadcrumb Navigation Patterns

Breadcrumbs render dynamically in the top sub-bar of every view, establishing operational orientation and upstream navigational links.

### 9.1 Hierarchy Rules
- **Dashboard / Home**: `Home`
- **Module Overview**: `Home` > `{Module Name}`
- **DocType List**: `Home` > `{Module Name}` > `{Plural DocType Name}`
- **New Document**: `Home` > `{Module Name}` > `{Plural DocType Name}` > `New`
- **Document Detail / Edit**: `Home` > `{Module Name}` > `{Plural DocType Name}` > `{Document ID}` `[Status Badge]`
- **Report View**: `Home` > `{Module Name}` > `Reports` > `{Report Name}`

### 9.2 Real Examples
- `Home` > `Accounting` > `Sales Invoices` > `INV-2026-00421` `[Submitted]`
- `Home` > `Procurement` > `Purchase Orders` > `PO-2026-00812` `[Pending HOD Approval]`
- `Home` > `Inventory` > `Stock Balances` > `Report`

---

## 10. URL Routing Architecture & Parameter Standard

VyaparSuite enforces a strictly standardized Next.js App Router directory and route pattern.

```
/app
 ├── {module}
 │    ├── page.tsx                                // Module Dashboard
 │    ├── {doctype}
 │    │    ├── page.tsx                           // List View Grid
 │    │    ├── new/page.tsx                       // New Document Form
 │    │    ├── [id]
 │    │    │    ├── page.tsx                      // Document View / Form
 │    │    │    ├── edit/page.tsx                 // Explicit Edit View
 │    │    │    └── print/page.tsx                // Dedicated Print Format Preview
 │    │    └── report
 │    │         └── [report_name]/page.tsx        // Analytical Drilldown Report
```

### 10.1 Standardized Query Parameters
All list views, grids, and reports consume standardized search query parameters, enabling instant URL sharing with exact filters intact:

- **Pagination**: `?page=1&limit=50`
- **Sorting**: `?sort_by=posting_date&sort_order=desc`
- **Status Filter**: `?status=Pending+Approval`
- **Date Ranges**: `?from_date=2026-04-01&to_date=2026-04-30`
- **Multi-Select Filters**: `?branch=uuid1,uuid2&customer=cust_102`
- **Search Term**: `?q=Tata+Motors`
- **Tab State**: `?tab=audit_trail`
