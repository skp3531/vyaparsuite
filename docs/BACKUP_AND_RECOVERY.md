# VyaparSuite Backup, Disaster Recovery & Business Continuity Specification
**Standard:** Enterprise ERP Data Durability, ISO 27001, Indian Companies Act 2013 (Sec 128), CGST Act (Sec 36)  
**Target Platform:** Supabase (PostgreSQL 15+, WAL-G / pgBackRest, Storage API), AWS S3 / Cloudflare R2  
**Version:** 1.0.0

---

## 1. Architectural Principles and Objectives

VyaparSuite manages legally binding financial, tax, and inventory records for enterprise businesses. Data loss, corruption, or statutory audit failure introduces catastrophic business risk. Consequently, the backup and disaster recovery architecture is engineered around the principle of zero data loss and automated, verifiable recovery.

### 1.1 Recovery Objectives (RPO & RTO Targets)

| Severity / Tier | Incident Classification | Recovery Point Objective (RPO) | Recovery Time Objective (RTO) |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Catastrophic)** | Total AWS / Supabase Data Center Outage, Storage Destruction | $\le 5$ Minutes | $\le 60$ Minutes |
| **Tier 2 (Database Failure)**| Primary PostgreSQL instance corruption, Disk loss | $\le 0$ Seconds (Sync Streaming Replica) | $\le 5$ Minutes (Automated Failover) |
| **Tier 3 (Logical Corruption)**| Malicious script, destructive migration, accidental mass update | $\le 1$ Minute (PITR WAL replay) | $\le 30$ Minutes |
| **Tier 4 (Tenant Deletion)** | Tenant requests rollback or mistakenly purges fiscal year | $\le 1$ Hour | $\le 2$ Hours (Tenant-isolated restore) |

---

## 2. Multi-Layer Backup Strategy

VyaparSuite enforces a defense-in-depth backup methodology combining Continuous Physical Archival, Automated Managed Snapshots, and Custom Encrypted Logical Dumps.

```mermaid
flowchart TD
    subgraph Primary Production Site [AWS ap-south-1 Mumbai]
        PG[(PostgreSQL Primary)] -->|Continuous WAL Streaming| WAL[WAL Archive - S3 Encrypted]
        PG -->|Physical Base Snapshot Daily| BaseSnap[Managed Daily Snapshot]
        PG -->|Logical pg_dump Every 6h| Dump[Custom Logical Encrypted Dump]
        Storage[(Supabase Object Storage)] -->|Cross-Region Replication| S3Storage[Document & PDF Storage]
    end

    subgraph Disaster Recovery Site [AWS ap-southeast-1 Singapore]
        WAL -.->|Cross-Region S3 Sync| DR_WAL[Replicated WALs]
        BaseSnap -.->|Replicated Snapshot| DR_Snap[Replicated Base Snapshot]
        Dump -.->|Encrypted Mirror| DR_Dump[Cold S3 Storage (WORM)]
        S3Storage -.->|Continuous Sync| DR_Storage[Cold Storage Replica]
    end
```

### 2.1 Layer 1: Supabase Managed Physical Backups & PITR
* **Mechanism:** Physical block-level backups using continuous Write-Ahead Log (WAL) archiving via pgBackRest/WAL-G.
* **Frequency:** Full base backup taken every 24 hours at 01:00 UTC.
* **WAL Streaming:** WAL segments flushed every 16MB or 60 seconds directly to highly durable AWS S3 buckets (99.999999999% durability).
* **Retention Window:** 30 days continuous rolling point-in-time recovery window.

### 2.2 Layer 2: Custom Logical Backups (Tenant-Aware `pg_dump`)
In addition to physical backups, automated containerized cron jobs execute logical dumps every 6 hours:
* Tool: `pg_dump` with custom parallel compression (`-Fc -Z 9`).
* Encryption: Encrypted on the fly using AES-256-GCM with envelope encryption via AWS KMS / HashiCorp Vault.
* Output: Streamed directly to an isolated disaster recovery S3 bucket located in an alternate geographic region (e.g., `ap-southeast-1` Singapore).

#### Automated Backup Script (`scripts/backup/run-logical-backup.sh`):
```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_FILE="/tmp/vyapar_db_${TIMESTAMP}.dump"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"
S3_BUCKET="s3://vyapar-cold-backups-sg/logical"

echo "[*] Starting logical database dump: ${TIMESTAMP}..."

# Execute parallel compressed dump
PGPASSWORD="${DATABASE_PASSWORD}" pg_dump \
  -h "${DATABASE_HOST}" \
  -p "${DATABASE_PORT}" \
  -U "${DATABASE_USER}" \
  -d "${DATABASE_NAME}" \
  -Fc \
  --no-owner \
  --no-acl \
  -f "${BACKUP_FILE}"

echo "[*] Encrypting archive with OpenSSL AES-256-CBC..."
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in "${BACKUP_FILE}" \
  -out "${ENCRYPTED_FILE}" \
  -pass "env:BACKUP_ENCRYPTION_SECRET"

echo "[*] Calculating SHA-256 checksum..."
sha256sum "${ENCRYPTED_FILE}" > "${ENCRYPTED_FILE}.sha256"

echo "[*] Uploading to offsite Disaster Recovery S3 bucket..."
aws s3 cp "${ENCRYPTED_FILE}" "${S3_BUCKET}/${TIMESTAMP}/" --storage-class GLACIER_IR
aws s3 cp "${ENCRYPTED_FILE}.sha256" "${S3_BUCKET}/${TIMESTAMP}/"

echo "[*] Cleaning temporary local artifacts..."
rm -f "${BACKUP_FILE}" "${ENCRYPTED_FILE}" "${ENCRYPTED_FILE}.sha256"
echo "[+] Backup successfully completed and archived."
```

---

## 3. Point-in-Time Recovery (PITR) Protocol

Point-in-Time Recovery allows restoring the database state to an exact second in time, neutralizing catastrophic events such as an erroneous `DROP TABLE` or flawed batch update script.

### 3.1 Executing PITR via Supabase CLI
```bash
# 1. Identify target target timestamp (UTC)
# Example: Incident occurred at 2026-10-30 14:15:22 UTC. Target: 14:14:00 UTC.
TARGET_TIME="2026-10-30T14:14:00Z"

# 2. Initiate PITR restore into an isolated staging clone
supabase branches create pitr-recovery-clone \
  --project-ref vyapar-prod-ref \
  --restore-to-point "${TARGET_TIME}"

# 3. Verify integrity of data in cloned instance
supabase db test --project-ref pitr-recovery-clone

# 4. Promote clone or extract required recovered records
```

---

## 4. File and Object Storage Backup (Invoices, Receipts, Attachments)

All customer-uploaded files (scanned vendor bills, delivery signatures, export shipping manifests, signed E-Invoice PDFs) reside in Supabase Storage (backed by S3).

### 4.1 Storage Resiliency Architecture
1. **S3 Versioning:** Enabled on all storage buckets. Overwriting or deleting an object creates a historical version rather than permanently expunging it.
2. **Cross-Region Replication (CRR):** S3 bucket in Mumbai (`ap-south-1`) continuously replicates asynchronously to Singapore (`ap-southeast-1`) with a replication SLA of $< 15$ minutes.
3. **MFA Delete:** Permanent deletion of storage objects requires hardware Multi-Factor Authentication.

---

## 5. Automated Backup Verification and Integrity Testing

A backup that has never been restored is an illusion. VyaparSuite enforces automated daily restore verification drills.

### 5.1 Daily Verification Pipeline
Every night at 03:00 UTC, an automated GitHub Actions runner or isolated Kubernetes job executes:
1. Downloads the latest encrypted logical backup from offsite S3.
2. Decrypts and verifies the SHA-256 integrity checksum.
3. Boots a clean, ephemeral PostgreSQL Docker container.
4. Restores the dump file into the container: `pg_restore -d postgres /tmp/dump`.
5. Runs a suite of automated SQL sanity assertions:
   * Asserts total count of tenants $> 0$.
   * Asserts sum of debits equals credits in `gl_entry` across all companies.
   * Asserts latest document timestamp is within expected backup window.
6. Emits a heartbeat telemetry metric to Datadog/BetterUptime. If verification fails or heartbeats cease, PagerDuty alerts the on-call Site Reliability Engineer (SRE).

---

## 6. Step-by-Step Disaster Recovery Procedures (Runbooks)

### Runbook 1: Accidental Data Corruption or Erroneous Migration
**Trigger:** An unverified migration script inadvertently dropped a column or corrupted fiscal records.
1. **Freeze Writes:** Immediately set the Next.js application to maintenance mode via edge middleware flag (`MAINTENANCE_MODE=true` in Vercel/Cloudflare).
2. **Determine T-Minus Timestamp:** Inspect `system_audit_trail` table to determine the exact UTC millisecond prior to the corrupting script execution.
3. **Trigger PITR:** Launch Supabase PITR to restore the database to `T_CORRUPT - 1s`.
4. **Data Verification:** Execute financial ledger integrity query:
   ```sql
   SELECT company_id, SUM(debit) - SUM(credit) AS discrepancy 
   FROM gl_entry 
   GROUP BY company_id 
   HAVING ABS(SUM(debit) - SUM(credit)) > 0.01;
   ```
   *Expected result: 0 rows returned.*
5. **DNS / Connection Cutover:** Switch application database pooler connection string to point to the recovered instance.
6. **Disable Maintenance Mode:** Verify health checks and release traffic.

---

### Runbook 2: Primary Data Center Region Total Outage
**Trigger:** AWS Mumbai (`ap-south-1`) suffers total loss of connectivity or infrastructure.
1. **Declare Disaster:** Incident Commander verifies outage via AWS Health Dashboard and invokes DR Plan.
2. **Promote DR Read Replica:** In the Singapore (`ap-southeast-1`) cluster, promote the standby PostgreSQL instance to primary standalone mode:
   ```bash
   pg_ctl promote -D /var/lib/postgresql/data
   ```
3. **Point Storage to Replicated S3:** Update Next.js application environment variable `SUPABASE_STORAGE_URL` to point to the Singapore replica bucket.
4. **Update Edge DNS Routing:** Switch Cloudflare / Vercel DNS records to route application API traffic to Singapore computing nodes.
5. **Broadcast Advisory:** Update public status page (`status.vyaparsuite.com`) notifying users of failover completion.

---

### Runbook 3: Accidental Single-Tenant Deletion
**Trigger:** Tenant administrator mistakenly deleted an operating branch or requested restoration of an altered financial year.
1. **DO NOT RESTORE THE WHOLE DATABASE** (which would revert all other tenants).
2. Restore the latest backup to an isolated ephemeral staging database.
3. Execute the Selective Tenant Extraction script:
   ```bash
   ./scripts/backup/extract-tenant.sh --tenant-id="ten_994a3dfb_7c11" --target-db="staging_restore"
   ```
4. Stream extracted tenant rows into the production database inside a single atomic transaction:
   ```sql
   BEGIN;
   -- Clean damaged tenant records
   DELETE FROM gl_entry WHERE tenant_id = 'ten_994a3dfb_7c11' AND fiscal_year = '2026-27';
   -- Reinsert restored clean rows
   \copy gl_entry FROM '/tmp/ten_994a3dfb_gl.csv' WITH CSV HEADER;
   COMMIT;
   ```

---

## 7. Tenant Data Isolation in Backups & Portability

Under modern data sovereignty frameworks (Indian DPDP Act 2023, GDPR), business tenants possess the statutory right to export their entire operational data repository.

### 7.1 Single-Tenant Data Extraction Protocol
VyaparSuite provides an asynchronous export engine accessible via UI and API (`POST /api/v1/tenant/export`).
* The engine queries all tables filtering strictly by `WHERE tenant_id = :tenant_id`.
* Generates a password-protected zip bundle containing:
  * `company_profile.json`
  * `chart_of_accounts.json`
  * `general_ledger_export.csv`
  * `sales_invoices.json` (including item details and tax splits)
  * `purchase_invoices.json`
  * `stock_ledger_entries.csv`
  * `/attachments/` (All uploaded invoices and documents downloaded from S3)
* The zip bundle is encrypted with an ephemeral user-selected password using AES-256 and made available via a presigned 4-hour download link.

---

## 8. Compliance & Data Retention Requirements

Indian statutory mandates enforce strict data archiving and immutability standards.

### 8.1 Statutory Retention Matrix
| Regulation | Mandated Retention Period | Required Artifacts | Storage Policy |
| :--- | :--- | :--- | :--- |
| **Companies Act, 2013 (Section 128)** | **8 Financial Years** immediately preceding the current FY. | Books of account, balance sheets, vouchers, and general ledgers. | Immutable WORM (Write Once, Read Many) Glacier storage. |
| **CGST Act, 2017 (Section 36)** | **72 Months (6 Years)** from due date of furnishing Annual Return (Form GSTR-9). | Tax invoices, bills of supply, delivery challans, credit/debit notes, ITC records. | Readily retrievable within 24 hours upon statutory notice. |
| **Income Tax Act, 1961 (Section 44AA)**| **6 Years** from end of relevant assessment year (extendable to 16 years for foreign assets). | Audit reports, TDS records, 3CD statements, bank statements. | Cold encrypted storage. |

### 8.2 WORM (Write Once, Read Many) Storage Policy
To satisfy auditor requirements under the Companies (Accounts) Rules, backups archived to AWS S3 Glacier utilize **Object Lock** in **Compliance Mode**:
* Backups cannot be deleted, overwritten, or modified by *any* IAM user, including root account administrators, until the statutory retention period (8 years) has elapsed.

---

## 9. Disaster Recovery Team Roles & Escalation Matrix

During an operational crisis, clarity of command is paramount.

```markdown
Incident Response Team Structure:
├── Incident Commander (Head of Engineering / SRE Lead)
│   └── Responsible for overall decision making, authorizing failover or PITR rollbacks.
├── Database Recovery Lead (Principal DBA / Backend Architect)
│   └── Responsible for executing restore scripts, WAL replaying, and database sanity checks.
├── Application Recovery Lead (Fullstack Lead)
│   └── Responsible for edge DNS traffic shifting, Vercel deployments, and API sanity tests.
└── Communications Officer (Product Operations / Customer Support Lead)
    └── Responsible for updating status page, customer notifications, and statutory communications.
```

### Escalation Timeline:
* **T + 0 min:** Monitoring alert triggers on downtime or error rate $> 5\%$.
* **T + 5 min:** On-call SRE assesses severity; escalates to Incident Commander if unresolved.
* **T + 15 min:** Incident Commander declares Major Incident (Tier 1/2/3); mobilizes DR team on emergency bridge.
* **T + 30 min:** Status page updated; recovery runbook initiated (Failover or PITR).
* **T + 60 min:** Target recovery time; validation suite executed; services restored.
* **T + 24 hrs:** Blameless Post-Mortem published with root cause analysis and preventative remediation actions.

---

## 10. Quarterly Disaster Recovery Drill Cadence

To guarantee that the team and automated systems remain in perpetual readiness, DR drills are executed once every quarter in a dedicated isolated staging environment:

- **Q1 Drill:** Simulate primary database disk corruption $\rightarrow$ Execute full PITR to second-level precision.
- **Q2 Drill:** Simulate catastrophic regional cloud failure $\rightarrow$ Execute DNS failover and read-replica promotion to alternate region.
- **Q3 Drill:** Simulate malicious ransomware or batch script attack $\rightarrow$ Test air-gapped encrypted WORM backup extraction and cold-restore.
- **Q4 Drill:** Multi-tenant isolation drill $\rightarrow$ Selectively extract and restore a single tenant from backups without touching co-located tenants.
