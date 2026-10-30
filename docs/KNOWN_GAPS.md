# VyaparSuite ERP - Known Gaps, Technical Limitations & Deferred Capabilities

> **Document Version**: 1.0.0  
> **Target Release**: VyaparSuite v1.0.0 Architecture Baseline  
> **Scope**: Functional, Architectural, and Statutory Scope Boundaries  
> **Reference Standard**: ERPNext v15 / Odoo 17 Community Parity  
> **Last Updated**: October 2026  

---

## Executive Summary & Gap Taxonomy

VyaparSuite is architected to deliver a modern, resilient, multi-tenant cloud ERP platform. While the core transactional engines—such as the double-entry General Ledger, real-time Stock Ledger, Document Meta-Engine, and India GST calculation routines—are fully engineered for production workloads, certain enterprise peripheral integrations and complex specialized workflows are deliberately staged across subsequent minor and major milestones.

To guarantee complete architectural transparency, this document details **15 known technical limitations, integration gaps, and deferred capabilities**. Each item specifies its **architectural state, business impact, immediate workaround, planned technical resolution, priority, and target milestone**.

```mermaid
quadrantChart
    title Gap Priority vs Implementation Complexity
    x-axis Low Complexity --> High Complexity
    y-axis Low Priority --> Critical Priority
    quadrant-1 Immediate Post-Launch (P1/P2)
    quadrant-2 Strategic High-Complexity (P1/P2)
    quadrant-3 Low Priority Enhancements (P4)
    quadrant-4 Community & Incremental (P3)
    "Hardware Integrations": [0.35, 0.78]
    "Govt API Credentials (IRP/NIC)": [0.42, 0.95]
    "Payment Gateway Adapters": [0.25, 0.88]
    "SMS/WhatsApp Adapters": [0.20, 0.82]
    "Offline POS Service Worker": [0.65, 0.72]
    "ML Analytics & Forecasting": [0.85, 0.35]
    "Native Mobile App": [0.75, 0.60]
    "Multi-Language Translations": [0.30, 0.45]
    "Global Statutory Payroll": [0.70, 0.65]
    "Automated Bank Feeds": [0.60, 0.55]
    "Consolidated Statements Eliminations": [0.68, 0.50]
    "Advanced MRP II / Shop Floor": [0.82, 0.58]
    "EDI B2B Integrations": [0.78, 0.40]
    "Document AI / OCR Ingestion": [0.62, 0.42]
    "AI Agent Automation": [0.88, 0.38]
```

---

## Detailed Gap Analysis & Deferred Capabilities

```
================================================================================
GAP 01: HARDWARE INTEGRATIONS (THERMAL PRINTERS, SCANNERS, WEIGHING SCALES)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: The hardware integration layer currently provides architectural contracts, abstract driver interfaces (`IReceiptPrinterDriver`, `IScaleReader`), and browser-native Web APIs (such as the standard `window.print()` dialogue and keyboard HID wedge event listeners for USB barcode scanners).
* **Missing Elements**: Native serial port/USB raw byte communications (such as ESC/POS raw command streams via WebUSB or Web Serial API, and continuous RS-232 COM port polling for digital weighing scales) are not bundled as pre-configured client drivers.

### 2. Business & Operational Impact
* High-velocity retail checkout counters and warehouse dispatch docks experience slight friction:
  * Printing receipts requires dismissing standard OS print dialog boxes unless browser kiosk printing flags (`--kiosk-printing`) are manually enabled.
  * Weighing scale data requires manual keyboard entry instead of automatic real-time weight capture upon placing items on the platform.

### 3. Immediate Workaround
* **Barcode Scanners**: Configure USB or Bluetooth barcode scanners to operate in **Keyboard Wedge Mode** (standard HID mode) with a suffix delimiter (Enter/Return). VyaparSuite's POS and inventory inputs capture these scanned barcodes seamlessly without specialized device drivers.
* **Thermal Printers**: Set thermal receipt printers (Epson, TVS, Star Micronics) as the operating system's default printer, format paper width to 80mm/58mm in print settings, and launch Google Chrome or Edge in kiosk mode (`--kiosk --kiosk-printing`) to bypass dialog prompts.
* **Weighing Scales**: Operators manually enter gross and tare weights into the respective document quantity fields.

### 4. Planned Technical Resolution
* Develop a lightweight local hardware relay agent ("VyaparSuite Device Bridge") in Go/Rust or Node.js running as a local OS daemon (or Electron/Tauri helper).
* Implement native Web Serial and WebUSB API drivers directly within the Next.js POS client to negotiate bidirectional communication with COM/USB ports without local third-party software.
* Support raw ESC/POS graphic rasterization and cash drawer kick pulse triggers (`ESC p m t1 t2`).

### 5. Classification
* **Priority**: **P2 (High)**
* **Effort Estimate**: 3 Weeks
* **Target Milestone**: v1.1.0

---

```
================================================================================
GAP 02: GOVERNMENT API INTEGRATIONS (E-INVOICE IRP & E-WAY BILL NIC)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: The India GST engine fully implements the statutory payload formatting, JSON schema compilation (INV-01 standard), QR code rendering algorithms, and mock adapter pipelines (`IIndianGstProvider`).
* **Missing Elements**: Live, automated HTTP synchronization with the National Informatics Centre (NIC) and Invoice Registration Portal (IRP) requires official GSP (GST Suvidha Provider) credentials, production client SSL certificates, and registered GSTIN whitelisting, which cannot be hardcoded or packaged in the generic open distribution.

### 2. Business & Operational Impact
* Enterprises with annual turnover exceeding Indian statutory mandatory e-invoicing thresholds cannot generate automated IRN (Invoice Reference Numbers) via a single click unless connected to an authorized GSP partner tunnel.

### 3. Immediate Workaround
* **Manual Bulk JSON Upload**: VyaparSuite provides an automated one-click **"Export IRP JSON"** feature. Users export the compliant JSON file from VyaparSuite and upload it directly to the government `einvoice1.gst.gov.in` portal, download the signed JSON containing IRN and QR code, and upload it back to VyaparSuite to attach the official stamp.
* **E-Way Bill**: Generate the standard NIC Excel/JSON bulk upload file from the Delivery Note screen and upload it directly to the e-Way Bill portal (`ewaybillgst.gov.in`).

### 4. Planned Technical Resolution
* Ship pre-built connector modules for accredited GST Suvidha Providers (such as ClearTax, Masters India, Iris, and Cygnet GSP).
* Provide configuration screens in tenant settings where enterprises enter their own GSP API credentials, client secrets, and public/private encryption keys for automated headless IRN generation.

### 5. Classification
* **Priority**: **P1 (Critical Path for Indian Enterprise)**
* **Effort Estimate**: 2 Weeks
* **Target Milestone**: v1.0.5

---

```
================================================================================
GAP 03: PAYMENT GATEWAY INTEGRATIONS (ONLINE CHECKOUT & AR PAYMENT LINKS)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: VyaparSuite includes an extensible payment processing abstraction (`IPaymentGatewayAdapter`) defining standard hooks: `createOrder()`, `verifyPaymentWebhook()`, and `initiateRefund()`. Core schema models support transaction IDs, gateway tokens, and ledger mapping.
* **Missing Elements**: Out-of-the-box merchant accounts and direct vendor SDK bindings (Razorpay, Cashfree, Stripe, PayU) are delivered as architectural interface stubs requiring merchant API key activation.

### 2. Business & Operational Impact
* Customer Portal users cannot pay outstanding invoices via integrated UPI/Credit Card modals out-of-the-box without configuring merchant gateway credentials.
* Automated dynamic UPI QR code rendering on printed invoice headers requires tenant-level VPA/merchant configuration.

### 3. Immediate Workaround
* **Manual Bank Transfers (NEFT/RTGS/IMPS)**: Invoices display company bank details, IFSC, and account numbers. Customers pay externally and accountants record transactions via standard **Payment Entry** referencing the UTR/bank transaction number.
* **Static UPI QR Codes**: Print formats include static company UPI QR codes (e.g., `upi://pay?pa=company@bank&pn=Company&am=Amount`), allowing customers to scan and pay via phone, with manual reconciliation by the finance team.

### 4. Planned Technical Resolution
* Release official open-source plugins for Razorpay, Cashfree, and Stripe.
* Implement serverless webhook endpoints handling payment success callbacks, automated receipt generation, General Ledger posting, and real-time invoice status updates.

### 5. Classification
* **Priority**: **P1 (Critical)**
* **Effort Estimate**: 2 Weeks
* **Target Milestone**: v1.0.4

---

```
================================================================================
GAP 04: MULTI-CHANNEL SMS & WHATSAPP BUSINESS INTEGRATIONS
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: The Notification Engine contains an asynchronous message queue (BullMQ/Redis) and an abstract provider interface (`ISmsProvider`, `IWhatsAppProvider`). Rich email notifications (via SMTP/SendGrid/Resend) are fully operational.
* **Missing Elements**: Native adapters for specific Indian SMS DLT gateways (such as Jio, Airtel, Textlocal, Gupshup) and the Meta WhatsApp Cloud API are structured as pluggable interfaces requiring tenant credentials and pre-approved statutory DLT templates.

### 2. Business & Operational Impact
* Invoices, dispatch updates, and OTPs cannot be dispatched over SMS or WhatsApp out-of-the-box without establishing a provider account and configuring DLT template registration.

### 3. Immediate Workaround
* **Automated Email Dispatch**: All transactional notifications (Quotations, Order Confirmations, PDF Invoices, Dispatch Slips) are dispatched automatically via email.
* **Manual WhatsApp Web Click-to-Chat**: Form views include dynamic **"Share via WhatsApp"** buttons that launch `https://wa.me/?text=...` with pre-filled document links and summaries, enabling users to send messages directly from their browser or phone.

### 4. Planned Technical Resolution
* Build official adapters for Meta WhatsApp Cloud API and Twilio / Gupshup SMS.
* Implement template management within Tenant Settings, supporting dynamic placeholder variables and DLT template ID verification.

### 5. Classification
* **Priority**: **P2 (High)**
* **Effort Estimate**: 2 Weeks
* **Target Milestone**: v1.1.0

---

```
================================================================================
GAP 05: OFFLINE-CAPABLE POINT OF SALE (PWA SERVICE WORKER)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: The POS interface is optimized for rapid desktop and tablet interactions with sub-50ms UI response times. Transaction payloads are validated via client-side Zod schemas prior to server transmission.
* **Missing Elements**: Comprehensive offline resilience—enabling a cashier to operate for hours without an active internet connection using Service Workers, local IndexedDB caching, and conflict-resolution replication—is designed architecturally but not fully implemented in the v1.0 web client.

### 2. Business & Operational Impact
* Temporary internet outages at physical retail retail stores prevent POS checkout transactions from completing until network connectivity is restored.

### 3. Immediate Workaround
* **Cellular Hotspot / Dual WAN Failover**: Retail locations deploy standard multi-WAN routers with automatic 4G/5G cellular failover to prevent loss of cloud connectivity.
* **Manual Receipt Contingency**: Cashiers record transactions using pre-printed manual bill books during catastrophic network failure and back-enter the entries into VyaparSuite once connectivity returns.

### 4. Planned Technical Resolution
* Implement Workbox / Next.js PWA Service Worker caching the POS client bundle and item price catalog in browser `IndexedDB`.
* Store offline orders locally with cryptographic sequence hashes, replaying them sequentially via background sync APIs upon network re-establishment with optimistic concurrency control.

### 5. Classification
* **Priority**: **P2 (High)**
* **Effort Estimate**: 3 Weeks
* **Target Milestone**: v1.2.0

---

```
================================================================================
GAP 06: ADVANCED PREDICTIVE ANALYTICS & ML-BASED DEMAND FORECASTING
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: Inventory reordering is governed by deterministic rules: Reorder Points (ROP), Minimum Order Quantities (MOQ), Safety Stock levels, and Lead Time equations.
* **Missing Elements**: Machine learning algorithms (ARIMA, Prophet, or transformer-based demand forecasting) taking into account historical seasonality, weather correlations, promotional elasticity, and multi-echelon optimization are deferred.

### 2. Business & Operational Impact
* Reorder alerts depend on static thresholds configured by inventory managers rather than dynamically adjusting to seasonal demand spikes or macroeconomic shifts.

### 3. Immediate Workaround
* **Historical Trend Reports**: Managers utilize the **Stock Consumption Analysis Report** and **Sales Trends Explorer** to manually inspect monthly run-rates, adjusting safety stock parameters and reorder levels quarterly.

### 4. Planned Technical Resolution
* Build a decoupled Python/FastAPI microservice or serverless edge function running statistical forecasting models against historical Sales Order and Stock Movement tables, writing recommended safety stock parameters back to the database.

### 5. Classification
* **Priority**: **P4 (Future Enhancement)**
* **Effort Estimate**: 4 Weeks
* **Target Milestone**: v2.0.0

---

```
================================================================================
GAP 07: NATIVE MOBILE APPLICATIONS (IOS & ANDROID APP STORES)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: VyaparSuite is fully engineered as a responsive Progressive Web App (PWA). All screens, dashboards, data tables, and forms scale seamlessly down to mobile viewport dimensions (375px+).
* **Missing Elements**: Compiled native binaries (`.ipa` and `.apk`) distributed through Apple App Store and Google Play Store with native OS background services, Bluetooth peripheral access, and push notification tokens are not part of the initial launch.

### 2. Business & Operational Impact
* Mobile users access VyaparSuite by opening their mobile browser and using the "Add to Home Screen" feature rather than downloading an application from an app store.

### 3. Immediate Workaround
* Users install the web application as a standalone PWA on iOS and Android devices, which provides full-screen execution, an app launcher icon, and local storage caching without browser chrome bars.

### 4. Planned Technical Resolution
* Package the Next.js responsive web application using Capacitor.js or React Native / Expo to deliver compiled binaries for the App Store and Google Play Store, unlocking native hardware APIs and push notification services.

### 5. Classification
* **Priority**: **P3 (Medium)**
* **Effort Estimate**: 3 Weeks
* **Target Milestone**: v1.2.0

---

```
================================================================================
GAP 08: MULTI-LANGUAGE LOCALIZATION (COMMUNITY TRANSLATION CATALOGS)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: Internationalization (i18n) infrastructure is fully integrated into the Next.js frontend using `next-intl`. Key labels, error messages, and table headers are decoupled into JSON translation key structures (`en.json`).
* **Missing Elements**: Complete, validated localized language catalogs for major Indian languages (Hindi, Marathi, Gujarati, Tamil, Telugu, Kannada) and international languages (Spanish, French, Arabic, German) are incomplete, currently defaulting to English.

### 2. Business & Operational Impact
* Non-English-speaking warehouse staff or retail cashiers must operate with the English user interface.

### 3. Immediate Workaround
* Users utilize Google Chrome's built-in full-page translation feature, which converts UI labels in real time.
* System administrators can manually edit the translation JSON files within tenant settings to provide translations for their specific region.

### 4. Planned Technical Resolution
* Launch a public Crowdin or Weblate translation portal to crowdsource and verify complete translations across 12 Indian official languages and 8 international business languages.

### 5. Classification
* **Priority**: **P3 (Medium)**
* **Effort Estimate**: 2 Weeks
* **Target Milestone**: v1.1.5

---

```
================================================================================
GAP 09: GLOBAL STATUTORY PAYROLL ENGINE VALIDATIONS
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: The HRMS & Payroll engine features a flexible, formula-driven calculation architecture capable of processing earnings, deductions, gross pay, net pay, and General Ledger posting. Standard Indian statutory components (PF, ESI, Professional Tax, standard TDS) are pre-configured.
* **Missing Elements**: Pre-validated, legally certified statutory tax deduction formulas for international jurisdictions (such as US W-2/1099, UK PAYE, UAE WPS, Saudi GOSI, Australia Superannuation) are not bundled out-of-the-box.

### 2. Business & Operational Impact
* International companies operating outside India must manually configure local statutory formula rules, tax bands, and pension deduction algorithms within the Salary Component configuration screens.

### 3. Immediate Workaround
* System administrators configure custom **Salary Components** utilizing the built-in mathematical expression builder, defining exact tax brackets and percentage rules applicable to their specific jurisdiction.

### 4. Planned Technical Resolution
* Release official regional localization packs (Country Localization Packs) providing pre-verified tax rules, contribution caps, and statutory filing exports for the US, UK, UAE, and GCC regions.

### 5. Classification
* **Priority**: **P3 (Medium)**
* **Effort Estimate**: 4 Weeks
* **Target Milestone**: v1.3.0

---

```
================================================================================
GAP 10: AUTOMATED DIRECT BANK FEEDS (OPEN BANKING / PLAID / YODLEE)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: The Bank Reconciliation module provides comprehensive tooling to import statement files (CSV, Microsoft Excel, OFX, MT940), automated fuzzy-matching algorithms against General Ledger entries, and manual clearing workflows.
* **Missing Elements**: Direct, automated real-time server-to-server bank feeds via Open Banking APIs (such as Plaid, Yodlee, Salt Edge, or Indian Account Aggregator framework / ICICI/HDFC Corporate APIs) are not integrated.

### 2. Business & Operational Impact
* Finance teams must periodically download bank statement files from their corporate banking portals and upload them into VyaparSuite rather than having transactions stream in automatically.

### 3. Immediate Workaround
* Accountants log into corporate net banking, export the monthly or daily statement in CSV or Excel format, and upload it into `/app/accounting/bank-reconciliation`. The system automatically parses and matches transactions against GL entries based on date, reference number, and amount.

### 4. Planned Technical Resolution
* Implement integrations with Plaid (for US/EU/UK markets) and the Sahamati Account Aggregator (AA) ecosystem / ICICI Corporate Banking API (for Indian enterprises).

### 5. Classification
* **Priority**: **P3 (Medium)**
* **Effort Estimate**: 3 Weeks
* **Target Milestone**: v1.2.0

---

```
================================================================================
GAP 11: CONSOLIDATED FINANCIAL STATEMENTS WITH COMPLEX INTER-COMPANY ELIMINATIONS
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: Multi-company architectures share a unified Chart of Accounts or map to parent group accounts. Standard consolidated Balance Sheet and Profit & Loss reports aggregate figures across selected subsidiary companies in a common currency.
* **Missing Elements**: Advanced statutory consolidation features—such as automated inter-company transaction eliminations (reversing inter-company sales/purchases and unrealized inventory profits) and minority interest equity allocations—require manual journal entries.

### 2. Business & Operational Impact
* Large corporate groups with high volumes of internal trading must manually post consolidation elimination journals at period-end to prevent double-counting revenue and expenses.

### 3. Immediate Workaround
* Finance teams establish a dedicated virtual "Consolidation Legal Entity" within VyaparSuite, running consolidation reports and posting period-end manual elimination journal entries to zero out inter-company balances.

### 4. Planned Technical Resolution
* Develop an automated Elimination Rule Engine that detects transactions flagged with inter-company party IDs, generating automated consolidation adjustment layers during financial statement generation.

### 5. Classification
* **Priority**: **P3 (Medium)**
* **Effort Estimate**: 3 Weeks
* **Target Milestone**: v1.3.0

---

```
================================================================================
GAP 12: ADVANCED MANUFACTURING (MRP II, FINITE CAPACITY & SHOP-FLOOR IOT)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: The manufacturing module supports multi-level Bills of Materials (BOM), Work Orders, Job Cards, raw material consumption (backflushing or manual issue), finished goods receipt, and workstation hourly costing.
* **Missing Elements**: Closed-loop Material Requirements Planning (MRP II) with finite capacity machine scheduling, Gantt-based shop floor sequencing, and direct IoT machine telemetry integration (OPC-UA / MQTT) are deferred.

### 2. Business & Operational Impact
* High-volume discrete manufacturers must manually sequence work order dates and assess machine capacity constraints rather than relying on automated algorithmic capacity leveling.

### 3. Immediate Workaround
* Production managers utilize the **Material Request from Production Plan** tool to compute gross raw material requirements and manually schedule Work Orders across workstations based on standard lead times.

### 4. Planned Technical Resolution
* Engineer an advanced MRP calculation engine that calculates net requirements across multi-tier BOMs factoring in purchase order lead times, minimum batch sizes, and workstation operating hours.
* Integrate MQTT message brokers for shop-floor IoT pulse counters.

### 5. Classification
* **Priority**: **P3 (Medium)**
* **Effort Estimate**: 4 Weeks
* **Target Milestone**: v1.3.0

---

```
================================================================================
GAP 13: ELECTRONIC DATA INTERCHANGE (EDI - EDIFACT / ANSI X12)
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: Inter-system data exchange is conducted via modern RESTful JSON APIs, webhooks, and asynchronous file imports/exports (CSV, Excel, JSON).
* **Missing Elements**: Legacy Electronic Data Interchange protocols—such as EDIFACT (EDI for Administration, Commerce and Transport) or ANSI ASC X12 standards (EDI 850 Purchase Order, EDI 810 Invoice, EDI 856 ASN)—are not natively parsed.

### 2. Business & Operational Impact
* Suppliers trading with legacy multinational retail chains (such as Walmart or large automotive OEMs) requiring strict AS2/EDI compliance cannot connect directly without an intermediate translator.

### 3. Immediate Workaround
* Enterprises deploy third-party EDI middleware (such as Stedi, Orderful, or Babelway) that translates inbound EDIFACT/X12 files into REST calls against VyaparSuite's standard `/api/v1/sales/orders` API, and vice-versa.

### 4. Planned Technical Resolution
* Implement an EDI translator service transforming standard JSON payloads to and from standard EDI X12 / EDIFACT transaction sets.

### 5. Classification
* **Priority**: **P4 (Low / Enterprise Specific)**
* **Effort Estimate**: 4 Weeks
* **Target Milestone**: v2.0.0

---

```
================================================================================
GAP 14: DOCUMENT OCR & AUTOMATED AP VENDOR BILL INGESTION
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: File attachments (PDFs, scans, images) can be uploaded to any document and stored in secure Supabase Storage buckets.
* **Missing Elements**: Optical Character Recognition (OCR) and intelligent document processing that parses uploaded vendor PDF bills or scanned receipts to automatically populate purchase invoice line items are deferred.

### 2. Business & Operational Impact
* Accounts Payable clerks must manually type line items, quantities, and rates from vendor PDF invoices rather than having fields populated automatically via computer vision.

### 3. Immediate Workaround
* Accounts clerks upload vendor PDFs as document attachments and reference them via side-by-side split screen while manually filling out the Purchase Invoice form.

### 4. Planned Technical Resolution
* Implement an asynchronous document analysis pipeline utilizing cloud vision services (such as AWS Textract, Google Document AI, or open-source Tesseract/TrOCR models) that extracts invoice numbers, dates, line items, and totals into draft Purchase Invoices.

### 5. Classification
* **Priority**: **P4 (Future Enhancement)**
* **Effort Estimate**: 3 Weeks
* **Target Milestone**: v1.3.0

---

```
================================================================================
GAP 15: AI-POWERED COPILOTS & AGENTIC AUTOMATION
================================================================================
```

### 1. Description & Current Architectural State
* **Current State**: VyaparSuite enforces deterministic, verifiable, audit-compliant business logic. All document transitions, calculations, and postings follow rigid, traceable code paths.
* **Missing Elements**: Generative AI assistants, natural language query interfaces ("Show me our top 5 overdue accounts in Mumbai"), and autonomous agentic workflows are not embedded into the v1.0 core.

### 2. Business & Operational Impact
* Users must navigate standard reporting menus, apply database filters, and configure saved views to extract business intelligence rather than querying the ERP in natural conversational English.

### 3. Immediate Workaround
* Users utilize the universal search bar (`Cmd+K`), standardized report builders, and customizable dashboard KPI widgets to filter, aggregate, and export data.

### 4. Planned Technical Resolution
* Embed a privacy-preserving LLM Copilot interface capable of executing read-only Text-to-SQL conversions against multi-tenant filtered views and generating contextual executive summaries.

### 5. Classification
* **Priority**: **P4 (Future Enhancement)**
* **Effort Estimate**: 4 Weeks
* **Target Milestone**: v2.0.0

---

## Gap Resolution Master Roadmap & Priority Matrix

| Gap # | Domain | Title | Priority | Target Release | Workaround Complexity |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **02** | Compliance | Government API Credentials (IRP / NIC) | **P1** | v1.0.5 | Low (Bulk JSON Upload) |
| **03** | Payments | Payment Gateway Adapters (Razorpay, Stripe) | **P1** | v1.0.4 | Low (Bank Transfer / Static QR) |
| **01** | Hardware | Hardware Integrations (Printers, Scanners) | **P2** | v1.1.0 | Low (HID Wedge / Kiosk Mode) |
| **04** | Communication| SMS / WhatsApp Business Integrations | **P2** | v1.1.0 | Low (Email / WhatsApp Click) |
| **05** | Retail | Offline POS (Service Worker / IndexedDB) | **P2** | v1.2.0 | Medium (Network Redundancy) |
| **07** | Mobile | Native Mobile App Store Binaries | **P3** | v1.2.0 | Low (Responsive PWA) |
| **08** | Localization | Multi-Language Translation Catalogs | **P3** | v1.1.5 | Low (Browser Translation) |
| **10** | Banking | Automated Bank Feeds | **P3** | v1.2.0 | Low (CSV/Excel Statement Upload) |
| **09** | Payroll | Global Statutory Payroll Rule Packs | **P3** | v1.3.0 | Medium (Formula Component Builder) |
| **11** | Accounting | Inter-Company Elimination Automation | **P3** | v1.3.0 | Medium (Consolidation Entity) |
| **12** | Manufacturing| MRP II & Finite Capacity Scheduling | **P3** | v1.3.0 | Medium (Production Plan Tool) |
| **14** | Automation | Document OCR Vendor Bill Ingestion | **P4** | v1.3.0 | Low (Manual Split-Screen Entry) |
| **06** | Analytics | ML-based Predictive Demand Forecasting | **P4** | v2.0.0 | Low (Standard Trend Reports) |
| **13** | Integration | EDI (EDIFACT / ANSI X12) Translation | **P4** | v2.0.0 | High (Third-Party Middleware) |
| **15** | AI | AI Copilots & Conversational Querying | **P4** | v2.0.0 | Low (Universal Search & Filters) |

---

## Technical Extension Guidelines for Integrators

For enterprise partners and systems integrators wishing to address these gaps prior to official roadmap releases, VyaparSuite provides clear extension points:

1. **Hardware & Peripheral Extension**: Connect to the local browser window events via custom client scripts injected through the Document Meta-Engine, utilizing standard Web APIs (`navigator.serial` or `navigator.usb`).
2. **Third-Party API Adapters**: Implement the declared TypeScript interfaces located in `src/core/interfaces/` (e.g., `IPaymentGatewayAdapter`, `ISmsProvider`, `IGstProvider`) and bind them in `inversify` / dependency injection configuration.
3. **External Event Webhooks**: Listen to the Document Meta-Engine lifecycle hooks (`on_submit`, `on_cancel`, `after_insert`) to trigger external microservices, ETL pipelines, or EDI translation bridges.
