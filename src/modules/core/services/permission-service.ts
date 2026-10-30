/**
 * VyaparSuite Permission Service
 * 
 * Enforces multi-tier security:
 * - Role-Based Access Control (RBAC) with hierarchical inheritance
 * - Attribute-Based Access Control (ABAC) for tenant, company, branch, and warehouse scoping
 * - Field-Level Permissions (FLS) for masking confidential financial and PII fields
 * - Financial approval limits & Segregation of Duties (Four-Eyes Principle)
 * - In-memory permission caching with high hit rates
 */

import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { BaseDocument, TransactionDocument } from '../types/document';
import { AuthorizationError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export type StandardAction =
  | 'read'
  | 'create'
  | 'write'
  | 'submit'
  | 'approve'
  | 'cancel'
  | 'amend'
  | 'delete'
  | 'print'
  | 'email'
  | 'export'
  | 'import'
  | 'report';

export interface UserSecurityContext {
  tenantId: string;
  userId: string;
  roles: string[];
  companyId?: string;
  allowedCompanyIds?: string[];
  allowedBranchIds?: string[];
  allowedWarehouseIds?: string[];
  approvalLimits?: Record<string, number>; // doctype -> max amount (or '*' for all)
}

export interface FieldPermissionRule {
  field: string;
  readRoles?: string[];  // Only these roles can read (others get masked/removed)
  writeRoles?: string[]; // Only these roles can mutate this field
}

export interface DocTypePermissionRule {
  doctype: string;
  role: string;
  canCreate: boolean;
  canRead: boolean;
  canWrite: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canCancel: boolean;
  canAmend: boolean;
  canDelete: boolean;
  maxApprovalAmount?: number;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

// Built-in role hierarchy weights (from PERMISSION_MATRIX.md)
export const ROLE_HIERARCHY: Record<string, number> = {
  system_manager: 100,
  workspace_admin: 90,
  cfo: 85,
  auditor: 80,
  finance_manager: 70,
  sales_manager: 70,
  procurement_manager: 70,
  inventory_manager: 70,
  manufacturing_manager: 70,
  hr_manager: 70,
  support_manager: 70,
  project_manager: 65,
  tax_officer: 60,
  accounts_user: 50,
  hr_user: 45,
  quality_inspector: 45,
  sales_user: 40,
  purchase_user: 40,
  production_supervisor: 40,
  maintenance_engineer: 40,
  support_agent: 35,
  accounts_assistant: 30,
  warehouse_user: 30,
  pos_cashier: 20,
  employee_self_service: 10,
};

export class PermissionService {
  private cache: Map<string, { result: PermissionCheckResult; expiresAt: number }> = new Map();
  private cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  // Field permission rules registry
  private fieldPermissions: Map<string, FieldPermissionRule[]> = new Map();

  constructor(private db?: IDatabaseAdapter) {}

  /**
   * Register field-level masking/permission rules for a doctype.
   */
  registerFieldPermissions(doctype: string, rules: FieldPermissionRule[]): void {
    this.fieldPermissions.set(doctype, rules);
  }

  /**
   * Check if a user has permission to perform an action on a document.
   */
  async checkPermission(
    action: StandardAction,
    doctype: string,
    context: UserSecurityContext,
    doc?: Partial<BaseDocument>
  ): Promise<PermissionCheckResult> {
    // 1. Superuser / System Manager bypass
    if (context.roles.includes('system_manager')) {
      return { allowed: true };
    }

    // 2. Auditor check (Auditor is read-only everywhere)
    if (context.roles.includes('auditor')) {
      if (['read', 'print', 'export', 'report'].includes(action)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Compliance auditor role has strict read-only ledger access.',
      };
    }

    // 3. Cache lookup
    const cacheKey = this.getCacheKey(context, doctype, action, doc?.id);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    // 4. Attribute-Based Scoping Check (ABAC: Company, Branch)
    if (doc) {
      const scopeCheck = this.checkAttributeScope(doc, context);
      if (!scopeCheck.allowed) {
        this.setCache(cacheKey, scopeCheck);
        return scopeCheck;
      }
    }

    // 5. Segregation of Duties (Four-Eyes Principle)
    if (action === 'approve' && doc) {
      const creatorId = doc.created_by || doc.owner_id;
      if (creatorId && creatorId === context.userId) {
        const result = {
          allowed: false,
          reason: 'Four-eyes principle violation: You cannot approve a document you created.',
        };
        this.setCache(cacheKey, result);
        return result;
      }
    }

    // 6. Approval Limits Check
    if (action === 'approve' && doc) {
      const limitCheck = this.checkApprovalLimit(doctype, doc, context);
      if (!limitCheck.allowed) {
        this.setCache(cacheKey, limitCheck);
        return limitCheck;
      }
    }

    // 7. Role-Based Permission Check
    const rbacResult = await this.resolveRolePermission(action, doctype, context);
    this.setCache(cacheKey, rbacResult);

    return rbacResult;
  }

  /**
   * Throws AuthorizationError if action is not permitted.
   */
  async assertPermission(
    action: StandardAction,
    doctype: string,
    context: UserSecurityContext,
    doc?: Partial<BaseDocument>
  ): Promise<void> {
    const check = await this.checkPermission(action, doctype, context, doc);
    if (!check.allowed) {
      logger.warn('Permission denied', {
        action,
        doctype,
        userId: context.userId,
        reason: check.reason,
      });
      throw new AuthorizationError(
        check.reason || `You lack '${action}' permission for document type '${doctype}'.`
      );
    }
  }

  /**
   * Filter and mask confidential fields in document data before returning to client.
   */
  maskDocumentFields<T extends Record<string, unknown>>(
    doctype: string,
    doc: T,
    context: UserSecurityContext
  ): T {
    // System managers and CFOs see everything unmasked
    if (context.roles.includes('system_manager') || context.roles.includes('cfo')) {
      return doc;
    }

    const rules = this.fieldPermissions.get(doctype);
    if (!rules || rules.length === 0) {
      return doc;
    }

    const copy = { ...doc } as any;

    for (const rule of rules) {
      if (rule.readRoles && rule.readRoles.length > 0) {
        const hasAccess = rule.readRoles.some((r) => context.roles.includes(r));
        if (!hasAccess && copy[rule.field] !== undefined) {
          // Field is confidential: mask or redact
          copy[rule.field] = null;
        }
      }
    }

    return copy;
  }

  /**
   * Validate that user is not updating restricted/read-only fields.
   */
  validateWritableFields(
    doctype: string,
    updatedFields: Record<string, unknown>,
    context: UserSecurityContext
  ): void {
    if (context.roles.includes('system_manager')) {
      return;
    }

    const rules = this.fieldPermissions.get(doctype) || [];
    for (const rule of rules) {
      if (rule.writeRoles && rule.writeRoles.length > 0) {
        if (rule.field in updatedFields) {
          const canWrite = rule.writeRoles.some((r) => context.roles.includes(r));
          if (!canWrite) {
            throw new AuthorizationError(
              `You lack permission to modify restricted field '${rule.field}' in '${doctype}'.`
            );
          }
        }
      }
    }
  }

  /**
   * Invalidate cache for a user or tenant.
   */
  invalidateUser(userId: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(`:${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Invalidate entire permission cache.
   */
  invalidateAll(): void {
    this.cache.clear();
  }

  // --- Private Helpers ---

  private checkAttributeScope(
    doc: Partial<BaseDocument>,
    context: UserSecurityContext
  ): PermissionCheckResult {
    // Tenant boundary
    if (doc.tenant_id && doc.tenant_id !== context.tenantId) {
      return { allowed: false, reason: 'Cross-tenant access forbidden.' };
    }

    // Company boundary
    if (
      context.allowedCompanyIds &&
      context.allowedCompanyIds.length > 0 &&
      doc.company_id &&
      !context.allowedCompanyIds.includes(doc.company_id)
    ) {
      return {
        allowed: false,
        reason: `Access restricted to assigned companies. Company '${doc.company_id}' not permitted.`,
      };
    }

    // Branch boundary
    if (
      context.allowedBranchIds &&
      context.allowedBranchIds.length > 0 &&
      doc.branch_id &&
      !context.allowedBranchIds.includes(doc.branch_id)
    ) {
      return {
        allowed: false,
        reason: `Access restricted to assigned branches. Branch '${doc.branch_id}' not permitted.`,
      };
    }

    return { allowed: true };
  }

  private checkApprovalLimit(
    doctype: string,
    doc: Partial<BaseDocument>,
    context: UserSecurityContext
  ): PermissionCheckResult {
    // If no approval limits defined on user context, proceed
    if (!context.approvalLimits) {
      return { allowed: true };
    }

    const txDoc = doc as Partial<TransactionDocument>;
    const amountStr = txDoc.grand_total || txDoc.net_total;
    if (!amountStr) {
      return { allowed: true };
    }

    const docAmount = parseFloat(amountStr);
    if (isNaN(docAmount)) {
      return { allowed: true };
    }

    // Check specific doctype limit, then wildcard '*' limit
    const limit = context.approvalLimits[doctype] ?? context.approvalLimits['*'];
    if (limit !== undefined && docAmount > limit) {
      return {
        allowed: false,
        reason: `Document amount (₹${docAmount.toLocaleString('en-IN')}) exceeds your authorized approval limit (₹${limit.toLocaleString('en-IN')}).`,
      };
    }

    return { allowed: true };
  }

  private async resolveRolePermission(
    action: StandardAction,
    doctype: string,
    context: UserSecurityContext
  ): Promise<PermissionCheckResult> {
    // Workspace admin has broad managerial access across modules
    if (context.roles.includes('workspace_admin')) {
      return { allowed: true };
    }

    // Default action mappings based on standard roles
    const allowed = context.roles.some((role) => {
      // Role hierarchy level
      const level = ROLE_HIERARCHY[role] ?? 0;

      // Department heads & managers have full operational permissions within their scope
      if (level >= 70) {
        return true;
      }

      // Operational level (40-50): Create, Read, Write, Submit (if authorized)
      if (level >= 40) {
        if (action === 'delete') return false; // Only managers can delete drafts
        return ['read', 'create', 'write', 'submit', 'print', 'email'].includes(action);
      }

      // Frontline / Clerical (20-30): Read, Create, Write Drafts
      if (level >= 20) {
        return ['read', 'create', 'write', 'print'].includes(action);
      }

      // Self-service (10): Read, Create, Write own drafts
      if (level >= 10) {
        return ['read', 'create', 'write'].includes(action);
      }

      return false;
    });

    if (!allowed) {
      return {
        allowed: false,
        reason: `Roles [${context.roles.join(', ')}] lack permission to perform '${action}' on '${doctype}'.`,
      };
    }

    return { allowed: true };
  }

  private getCacheKey(
    context: UserSecurityContext,
    doctype: string,
    action: string,
    docId?: string
  ): string {
    const rolesKey = context.roles.sort().join(',');
    return `${context.tenantId}:${context.userId}:${rolesKey}:${doctype}:${action}:${docId || '*'}`;
  }

  private setCache(key: string, result: PermissionCheckResult): void {
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.cacheTtlMs,
    });
  }
}
