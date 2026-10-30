# VyaparSuite Deployment Architecture & Infrastructure Specification
**Platform:** Next.js (TypeScript, App Router), Supabase (PostgreSQL 15+, Gotrue Auth, Storage), Vercel & Self-Hosted Containerization  
**Target Environments:** Local Development, Ephemeral Preview, Production (Cloud & On-Premises)  
**Version:** 1.0.0

---

## 1. System Topology Overview

VyaparSuite is architected using a decoupled cloud-native topology that supports both **Managed Cloud Deployments** (Vercel + Supabase Cloud) and **Air-Gapped / Self-Hosted Deployments** (Docker Compose / Kubernetes on bare metal or private cloud).

```mermaid
flowchart TD
    Client[Web Browser / Mobile Client] --> Edge[Cloudflare / Vercel Edge Network]
    Edge --> NextApp[Next.js App Router - Serverless / Docker]
    NextApp --> PgBouncer[Supavisor / PgBouncer Connection Pooler]
    PgBouncer --> SupabaseDB[(PostgreSQL Primary Database)]
    SupabaseDB --> ReadReplica[(Read Replica)]
    NextApp --> SupabaseAuth[Supabase Auth - Gotrue]
    NextApp --> SupabaseStorage[Supabase Object Storage - S3 API]
    NextApp --> Redis[(Upstash Redis / Redis Cluster - Rate Limiting & Queue)]
    NextApp --> IRP[IRP / NIC Statutory Gateways]
```

---

## 2. Local Development Environment Setup

### 2.1 Prerequisites
* Node.js v20.x LTS or higher
* Docker Engine 24.0+ and Docker Compose v2.20+
* Git 2.40+
* Supabase CLI (`brew install supabase/tap/supabase` or `npm install -g supabase`)

### 2.2 Bootstrap Sequence
```bash
# 1. Clone the repository
git clone https://github.com/vyaparsuite/vyaparsuite.git
cd vyaparsuite

# 2. Install application dependencies
npm install

# 3. Initialize and boot local Supabase container cluster
supabase init
supabase start

# 4. Copy local environment template
cp .env.example .env.local

# 5. Apply local schema migrations and seed baseline master data
supabase db reset

# 6. Launch Next.js development server
npm run dev
```

Local access points:
* **Next.js Web Application:** `http://localhost:3000`
* **Supabase Studio (Database UI):** `http://localhost:54323`
* **Inbucket (Email Testing / Verification Catch-all):** `http://localhost:54324`
* **PostgreSQL Direct Connection:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

---

## 3. Local Supabase Configuration

The local development cluster runs directly inside Docker containers managed by the Supabase CLI. Configuration is declared in `supabase/config.toml`:

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000/**"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false # Auto-confirm in local dev

[storage]
enabled = true
file_size_limit = "52428800" # 50MB
```

---

## 4. Vercel Deployment Configuration

When deploying the Next.js frontend and serverless API handlers to Vercel, the configuration is governed by `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "regions": ["bom1"],
  "cleanUrls": true,
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Credentials", "value": "true" },
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
        { "key": "Access-Control-Allow-Headers", "value": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key, Idempotency-Key" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "functions": {
    "src/app/api/**": {
      "memory": 1024,
      "maxDuration": 30
    },
    "src/app/api/reports/**": {
      "memory": 3008,
      "maxDuration": 60
    }
  }
}
```
* **Region Selection:** `bom1` (Mumbai, India) ensures single-digit millisecond latency to domestic users and statutory IRP gateways.

---

## 5. Supabase Cloud Configuration

For managed cloud infrastructure:
1. **Region:** `ap-south-1` (AWS Mumbai) to match Vercel `bom1`.
2. **Compute Sizing:** Minimum 2 vCPU, 4GB RAM (Scale to 8 vCPU / 32GB RAM for production workloads $> 100$ concurrent users).
3. **Connection Pooling (Supavisor):**
   * Mode: `Transaction` pooler on port 6543 (for Next.js serverless functions).
   * Direct connection on port 5432 (reserved exclusively for database migration scripts and background workers).
   * Maximum client connections configured to match compute tier (e.g., 200 pool size).
4. **Custom SMTP:** Connect AWS SES or Postmark for transactional email deliverability (invoices, password resets).

---

## 6. Environment Variables Catalog

| Variable Name | Environments | Description / Example | Security Classification |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | All | `development` \| `test` \| `production` | Public |
| `NEXT_PUBLIC_APP_URL` | All | `https://app.vyaparsuite.com` | Public |
| `NEXT_PUBLIC_SUPABASE_URL` | All | `https://xyzcompany.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All | Public Supabase API Key (Safe for browser) | Restricted Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Only | Master admin key bypassing RLS (CRITICAL) | High Secret |
| `DATABASE_URL` | Server Only | Direct PostgreSQL URL for Prisma/Drizzle/Migrations | High Secret |
| `DATABASE_POOL_URL` | Server Only | Supavisor pooled connection URL (port 6543) | High Secret |
| `REDIS_URL` | Server Only | `rediss://default:token@host:port` (Upstash / Redis) | Secret |
| `IRP_API_CLIENT_ID` | Production | GST Invoice Registration Portal Client ID | Secret |
| `IRP_API_CLIENT_SECRET` | Production | GST IRP Client Secret | High Secret |
| `NIC_EWB_USERNAME` | Production | E-Way Bill Portal integration account | Secret |
| `NIC_EWB_PASSWORD` | Production | E-Way Bill Portal integration password | High Secret |
| `ENCRYPTION_KEY` | Server Only | 256-bit AES hex key for PII / bank account encryption | High Secret |
| `SENTRY_DSN` | All | Sentry observability tracking endpoint | Public / Semi-Secret |

---

## 7. CI/CD Deployment Pipeline (GitHub Actions)

VyaparSuite implements an automated pipeline with two target workflows: Staging (Preview) on Pull Requests and Production on `main` merge.

```yaml
name: Production Release Pipeline

on:
  push:
    branches: [main]

concurrency:
  group: production_deployment
  cancel-in-progress: false

jobs:
  validate:
    name: Lint, Test & Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit

  db-migrate:
    name: Run Database Migrations
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - name: Deploy Migrations to Supabase Prod
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_PROD_PROJECT_ID }}
          supabase db push --include-all
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_PROD_DB_PASSWORD }}

  deploy-vercel:
    name: Deploy Next.js to Vercel Prod
    needs: db-migrate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 8. Database Migration Protocol (Zero-Downtime)

To guarantee 99.99% availability and prevent database locks during peak business hours, migrations follow the **Expand and Contract (Blue/Green Schema)** pattern:

1. **Rule 1: Never perform destructive schema alterations in a single step.**
   * E.g., Do NOT rename columns directly (`ALTER TABLE rename_column`).
   * *Phase 1:* Add new column (`new_column`).
   * *Phase 2:* Add database trigger replicating writes from `old_column` to `new_column`.
   * *Phase 3:* Backfill historical data in background chunks.
   * *Phase 4:* Deploy code reading and writing to `new_column`.
   * *Phase 5:* Drop old column and trigger in subsequent migration.
2. **Rule 2: Add Indexes Concurrently:**
   * Always write `CREATE INDEX CONCURRENTLY` in migration scripts so table locking is prevented during high-traffic intervals.
3. **Rule 3: Deterministic Versioning:**
   * Migration filenames must use UTC timestamps: `supabase/migrations/YYYYMMDDHHMMSS_action_name.sql`.
   * Never modify an already executed migration file in source control.

---

## 9. Ephemeral Preview Deployments

For every pull request opened:
1. Vercel automatically spins up an isolated preview URL: `https://vyapar-pr-123.vercel.app`.
2. A GitHub Action executes Supabase Branching:
   * Creates an ephemeral database branch (`pr-123`) branched off the staging database.
   * Runs the new PR migration scripts.
   * Populates test seed fixtures.
   * Injects branch credentials into the Vercel preview deployment.
3. When the PR is merged or closed, the ephemeral Supabase database branch is automatically destroyed.

---

## 10. Self-Hosted On-Premises Architecture (Docker Compose)

For enterprises requiring on-premises deployment, data sovereignty within their own data center, or air-gapped environments, VyaparSuite provides a production-ready `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Next.js Application Server
  vyapar-app:
    image: vyaparsuite/app:latest
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=http://api.local.vyapar:8000
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      - REDIS_URL=redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  # PostgreSQL 15 Database with Extensions
  db:
    image: supabase/postgres:15.1.0.117
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d/migrations
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Supabase Auth (Gotrue)
  auth:
    image: supabase/gotrue:v2.132.3
    restart: always
    environment:
      GOTRUE_JWT_SECRET: ${JWT_SECRET}
      GOTRUE_DB_DRIVER: postgres
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      GOTRUE_SITE_URL: http://localhost:3000
    depends_on:
      - db

  # Supabase Storage Engine
  storage:
    image: supabase/storage-api:v0.43.0
    restart: always
    environment:
      ANON_KEY: ${ANON_KEY}
      SERVICE_KEY: ${SERVICE_ROLE_KEY}
      POSTGREST_URL: http://rest:3000
      PGRST_JWT_SECRET: ${JWT_SECRET}
      DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD}@db:5432/postgres
      STORAGE_BACKEND: file
      FILE_STORAGE_BACKEND_PATH: /var/lib/storage
    volumes:
      - storagedata:/var/lib/storage
    depends_on:
      - db

  # Redis for Caching and Distributed Locks
  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data

  # Reverse Proxy & SSL Termination
  caddy:
    image: caddy:2-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - vyapar-app

volumes:
  pgdata:
  storagedata:
  redisdata:
  caddy_data:
  caddy_config:
```

---

## 11. Monitoring, Observability & Auditing

1. **Application Performance Monitoring (APM):**
   * Sentry integration configured in `sentry.client.config.ts` and `sentry.server.config.ts`.
   * Captures unhandled client-side exceptions, server action failures, and transaction traces.
2. **PostgreSQL Telemetry:**
   * `pg_stat_statements` enabled to monitor slow queries exceeding 250ms.
   * Real-time monitoring of active database connections, lock contention, and buffer cache hit ratio (must stay $> 99\%$).
3. **Statutory Audit Log:**
   * Every write mutation logs to an append-only `system_audit_trail` table capturing:
     * `timestamp`, `tenant_id`, `user_id`, `ip_address`, `doctype`, `document_id`, `action` (`CREATE`, `SUBMIT`, `CANCEL`, `AMEND`), and JSON diff.

---

## 12. CDN & Caching Architecture

* **Static Assets (`/_next/static/*`):**
  * Cached at Vercel Edge / Cloudflare CDN with `Cache-Control: public, max-age=31536000, immutable`.
* **Master Data Endpoints (e.g., Currency List, State Codes, HSN Codes):**
  * Handled via Stale-While-Revalidate: `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
* **Transactional Endpoints (e.g., Invoices, GL, Stock Ledger):**
  * Strictly non-cacheable: `Cache-Control: private, no-cache, no-store, must-revalidate`.

---

## 13. Scaling and Performance Tuning

1. **Connection Pooling:**
   * Direct database connections exhaust memory rapidly on serverless architectures. All Next.js route handlers connect strictly via the Supavisor connection pooler.
2. **Read Replica Routing:**
   * Heavy analytical queries (e.g., Profit & Loss statement, General Ledger export, Inventory aging report) are dispatched to a read replica (`DATABASE_READ_REPLICA_URL`) to eliminate lock contention on write-heavy OLTP tables.
3. **Partitioning Strategy:**
   * `gl_entry` and `stock_ledger_entry` tables are partitioned by financial year (`RANGE (posting_date)`) to maintain query performance as records grow past millions of rows.

---

## 14. Production Deployment Checklist

Prior to promoting any release to production:

- [ ] All database migrations applied and verified on staging environment.
- [ ] No migrations contain table locks on large tables (`CREATE INDEX CONCURRENTLY` verified).
- [ ] Environment variables verified and cross-checked against production KMS.
- [ ] Supavisor connection pooling limits tuned (Pool size $\le 80\%$ of Postgres `max_connections`).
- [ ] AWS SES / SMTP credentials verified for transactional email sending.
- [ ] Sentry error monitoring active and release tag uploaded.
- [ ] Automated backup confirmed running with PITR active.
- [ ] Statutory IRP / E-Way Bill production credentials validated and tokens alive.
- [ ] Health check endpoint (`GET /api/health`) returning HTTP 200 with DB latency $< 15$ms.
