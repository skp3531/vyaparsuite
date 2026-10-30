/**
 * VyaparSuite Audit Service
 * 
 * Implements an immutable, append-only audit trail compliant with:
 * - Indian MCA Rule 3 (Companies Audit and Auditors Rules)
 * - SOX and ISO 27001 data governance standards
 * 
 * Features:
 * - Field-level diffing between previous and next document states
 * - Document status transition tracking
 * - Authentication and authorization security event logging
 * - Structured audit search and compliance exports (CSV / JSON)
 */

import type { IDatabaseAdapter, QueryFilter } from '@/lib/db/adapter';
import { logger } from '@/lib/utils/logger';

export type AuditActionType =
  | 'create'
  | 'update'
  | 'transition'
  | 'delete'
  | 'soft_delete'
  | 'login'
  | 'logout'
  | 'login_failed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'unauthorized_attempt'
  | 'export';

export interface FieldDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogEntry {
  id: string;
  tenant_id: string;
  company_id: string;
  doctype: string;
  document_id: string;
  document_number?: string;
  action: AuditActionType | string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  ip_address?: string;
  user_agent?: string;
  previous_status?: string;
  new_status?: string;
  comment?: string;
  diff?: FieldDiff[];
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface LogDocumentChangeParams {
  tenantId: string;
  companyId: string;
  doctype: string;
  documentId: string;
  documentNumber?: string;
  userId: string;
  userEmail?: string;
  oldDoc?: Record<string, unknown>;
  newDoc: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  comment?: string;
  ignoreFields?: string[];
}

export interface LogTransitionParams {
  tenantId: string;
  companyId: string;
  doctype: string;
  documentId: string;
  documentNumber?: string;
  userId: string;
  userEmail?: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  ipAddress?: string;
  userAgent?: string;
  comment?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface LogAuthEventParams {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
  action: 'login' | 'logout' | 'login_failed';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface LogPermissionEventParams {
  tenantId: string;
  companyId: string;
  userId: string;
  targetUserId?: string;
  action: 'permission_granted' | 'permission_revoked' | 'unauthorized_attempt';
  doctype?: string;
  documentId?: string;
  roleOrPermission?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditQueryOptions {
  companyId?: string;
  doctype?: string;
  documentId?: string;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export class AuditService {
  private static readonly DEFAULT_IGNORED_FIELDS = new Set([
    'updated_at',
    'created_at',
    'version',
    'updated_by',
    'created_by',
  ]);

  constructor(private db: IDatabaseAdapter) {}

  /**
   * Compute field-level differences between two document snapshots.
   */
  computeDiff(
    oldDoc: Record<string, unknown>,
    newDoc: Record<string, unknown>,
    customIgnored?: string[]
  ): FieldDiff[] {
    const ignored = new Set([...AuditService.DEFAULT_IGNORED_FIELDS, ...(customIgnored || [])]);
    const diffs: FieldDiff[] = [];
    const allKeys = new Set([...Object.keys(oldDoc), ...Object.keys(newDoc)]);

    for (const key of allKeys) {
      if (ignored.has(key)) continue;

      const oldVal = oldDoc[key];
      const newVal = newDoc[key];

      // Compare serialized JSON for complex objects/arrays or direct equality for primitives
      const isDifferent =
        typeof oldVal === 'object' || typeof newVal === 'object'
          ? JSON.stringify(oldVal) !== JSON.stringify(newVal)
          : oldVal !== newVal;

      if (isDifferent) {
        diffs.push({
          field: key,
          oldValue: oldVal ?? null,
          newValue: newVal ?? null,
        });
      }
    }

    return diffs;
  }

  /**
   * Log document create/update with granular field diffs.
   */
  async logDocumentChange(params: LogDocumentChangeParams): Promise<AuditLogEntry> {
    const isCreate = !params.oldDoc;
    const diffs = isCreate
      ? []
      : this.computeDiff(params.oldDoc!, params.newDoc, params.ignoreFields);

    const now = new Date().toISOString();
    const entryData: Record<string, unknown> = {
      tenant_id: params.tenantId,
      company_id: params.companyId,
      doctype: params.doctype,
      document_id: params.documentId,
      document_number: params.documentNumber,
      action: isCreate ? 'create' : 'update',
      user_id: params.userId,
      user_email: params.userEmail,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      comment: params.comment,
      diff: JSON.stringify(diffs),
      timestamp: now,
    };

    const res = await this.db.insert<AuditLogEntry>('audit_log', entryData);
    if (res.error) {
      logger.error('Failed to write audit log for document change', new Error(res.error.message), {
        doctype: params.doctype,
        documentId: params.documentId,
      });
    }

    logger.debug('Audit log recorded for document change', {
      doctype: params.doctype,
      documentId: params.documentId,
      changesCount: diffs.length,
      action: isCreate ? 'create' : 'update',
    });

    return (res.data || entryData) as AuditLogEntry;
  }

  /**
   * Log document lifecycle transition.
   */
  async logTransition(params: LogTransitionParams): Promise<AuditLogEntry> {
    const now = new Date().toISOString();
    const entryData: Record<string, unknown> = {
      tenant_id: params.tenantId,
      company_id: params.companyId,
      doctype: params.doctype,
      document_id: params.documentId,
      document_number: params.documentNumber,
      action: `transition:${params.action}`,
      previous_status: params.previousStatus,
      new_status: params.newStatus,
      user_id: params.userId,
      user_email: params.userEmail,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      comment: params.comment || params.reason,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      timestamp: now,
    };

    const res = await this.db.insert<AuditLogEntry>('audit_log', entryData);
    if (res.error) {
      logger.error('Failed to write audit log for transition', new Error(res.error.message), {
        doctype: params.doctype,
        documentId: params.documentId,
        action: params.action,
      });
    }

    return (res.data || entryData) as AuditLogEntry;
  }

  /**
   * Log user authentication events.
   */
  async logAuthEvent(params: LogAuthEventParams): Promise<AuditLogEntry> {
    const now = new Date().toISOString();
    const entryData: Record<string, unknown> = {
      tenant_id: params.tenantId,
      company_id: params.companyId || 'GLOBAL',
      doctype: 'auth_session',
      document_id: params.userId,
      action: params.action,
      user_id: params.userId,
      user_email: params.userEmail,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      timestamp: now,
    };

    const res = await this.db.insert<AuditLogEntry>('audit_log', entryData);
    return (res.data || entryData) as AuditLogEntry;
  }

  /**
   * Log permission-related access control events.
   */
  async logPermissionEvent(params: LogPermissionEventParams): Promise<AuditLogEntry> {
    const now = new Date().toISOString();
    const entryData: Record<string, unknown> = {
      tenant_id: params.tenantId,
      company_id: params.companyId,
      doctype: params.doctype || 'permission',
      document_id: params.documentId || params.targetUserId || params.userId,
      action: params.action,
      user_id: params.userId,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      comment: params.roleOrPermission,
      metadata: params.metadata ? JSON.stringify(params.metadata) : undefined,
      timestamp: now,
    };

    const res = await this.db.insert<AuditLogEntry>('audit_log', entryData);
    return (res.data || entryData) as AuditLogEntry;
  }

  /**
   * Query document audit history.
   */
  async getDocumentHistory(
    doctype: string,
    documentId: string,
    tenantId: string,
    options?: { page?: number; pageSize?: number }
  ): Promise<AuditLogEntry[]> {
    const filters: QueryFilter[] = [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
      { column: 'doctype', operator: 'eq', value: doctype },
      { column: 'document_id', operator: 'eq', value: documentId },
    ];

    const res = await this.db.findMany<AuditLogEntry>('audit_log', {
      filters,
      sort: [{ column: 'timestamp', direction: 'desc' }],
      pagination: {
        page: options?.page || 1,
        pageSize: options?.pageSize || 100,
      },
    });

    return (res.data || []).map(this.normalizeEntry);
  }

  /**
   * Query tenant audit trail with flexible filtering.
   */
  async getTenantAuditTrail(
    tenantId: string,
    options?: AuditQueryOptions
  ): Promise<{ data: AuditLogEntry[]; count: number }> {
    const filters: QueryFilter[] = [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
    ];

    if (options?.companyId) {
      filters.push({ column: 'company_id', operator: 'eq', value: options.companyId });
    }
    if (options?.doctype) {
      filters.push({ column: 'doctype', operator: 'eq', value: options.doctype });
    }
    if (options?.documentId) {
      filters.push({ column: 'document_id', operator: 'eq', value: options.documentId });
    }
    if (options?.userId) {
      filters.push({ column: 'user_id', operator: 'eq', value: options.userId });
    }
    if (options?.action) {
      filters.push({ column: 'action', operator: 'like', value: `%${options.action}%` });
    }
    if (options?.startDate) {
      filters.push({ column: 'timestamp', operator: 'gte', value: options.startDate });
    }
    if (options?.endDate) {
      filters.push({ column: 'timestamp', operator: 'lte', value: options.endDate });
    }

    const res = await this.db.findMany<AuditLogEntry>('audit_log', {
      filters,
      sort: [{ column: 'timestamp', direction: 'desc' }],
      pagination: {
        page: options?.page || 1,
        pageSize: options?.pageSize || 50,
      },
    });

    return {
      data: (res.data || []).map(this.normalizeEntry),
      count: res.count || 0,
    };
  }

  /**
   * Export audit log in CSV or JSON format for regulatory compliance.
   */
  async exportAuditLog(
    tenantId: string,
    options?: AuditQueryOptions,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const { data } = await this.getTenantAuditTrail(tenantId, {
      ...options,
      pageSize: 10000, // Export up to 10k records
    });

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV format
    const headers = [
      'Timestamp',
      'Action',
      'DocType',
      'Document ID',
      'Document Number',
      'User ID',
      'User Email',
      'Previous Status',
      'New Status',
      'Comment',
      'IP Address',
    ];

    const escapeCsv = (val: unknown): string => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = data.map((entry) => [
      escapeCsv(entry.timestamp),
      escapeCsv(entry.action),
      escapeCsv(entry.doctype),
      escapeCsv(entry.document_id),
      escapeCsv(entry.document_number),
      escapeCsv(entry.user_id),
      escapeCsv(entry.user_email),
      escapeCsv(entry.previous_status),
      escapeCsv(entry.new_status),
      escapeCsv(entry.comment),
      escapeCsv(entry.ip_address),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  private normalizeEntry(entry: any): AuditLogEntry {
    let parsedDiff = entry.diff;
    if (typeof parsedDiff === 'string') {
      try {
        parsedDiff = JSON.parse(parsedDiff);
      } catch {
        parsedDiff = [];
      }
    }

    let parsedMeta = entry.metadata;
    if (typeof parsedMeta === 'string') {
      try {
        parsedMeta = JSON.parse(parsedMeta);
      } catch {
        parsedMeta = undefined;
      }
    }

    return {
      ...entry,
      diff: parsedDiff,
      metadata: parsedMeta,
    };
  }
}
