/**
 * Unit & Integration Tests for VyaparSuite Permission Service
 * Tests multi-tier RBAC role permissions, compliance auditor read-only enforcement,
 * financial approval limits, Segregation of Duties (Four-Eyes Principle),
 * Attribute-Based Access Control (ABAC), and Field-Level Security (FLS).
 */

import { describe, it, beforeEach, assert } from '../../../../tests/helpers/test-runner';
import { PermissionService, UserSecurityContext } from '../services/permission-service';
import { AuthorizationError } from '@/lib/utils/errors';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(() => {
    service = new PermissionService();
  });

  describe('1. Role Permission Checks (RBAC)', () => {
    it('should grant full superuser bypass for system_manager', async () => {
      const adminCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'admin-01',
        roles: ['system_manager'],
      };

      // system_manager can perform all standard operations
      const actions: Array<'read' | 'create' | 'write' | 'submit' | 'approve' | 'delete' | 'cancel' | 'amend'> = [
        'read',
        'create',
        'write',
        'submit',
        'approve',
        'delete',
        'cancel',
        'amend',
      ];

      for (const action of actions) {
        const result = await service.checkPermission(action, 'sales_invoice', adminCtx);
        assert.strictEqual(result.allowed, true, `system_manager should be allowed to ${action}`);
        await assert.doesNotReject(async () => {
          await service.assertPermission(action, 'sales_invoice', adminCtx);
        });
      }
    });

    it('should enforce strict read-only access for auditor role', async () => {
      const auditorCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'auditor-01',
        roles: ['auditor'],
      };

      // Auditor can read, print, export, report
      const allowedActions: Array<'read' | 'print' | 'export' | 'report'> = ['read', 'print', 'export', 'report'];
      for (const action of allowedActions) {
        const res = await service.checkPermission(action, 'general_ledger', auditorCtx);
        assert.strictEqual(res.allowed, true, `Auditor should be allowed to ${action}`);
      }

      // Auditor cannot create, write, submit, approve, delete, cancel, amend
      const forbiddenActions: Array<'create' | 'write' | 'submit' | 'approve' | 'delete' | 'cancel' | 'amend'> = [
        'create',
        'write',
        'submit',
        'approve',
        'delete',
        'cancel',
        'amend',
      ];
      for (const action of forbiddenActions) {
        const res = await service.checkPermission(action, 'general_ledger', auditorCtx);
        assert.strictEqual(res.allowed, false, `Auditor must not be allowed to ${action}`);
        assert.ok(res.reason?.includes('Compliance auditor role has strict read-only ledger access.'));

        await assert.rejects(
          async () => {
            await service.assertPermission(action, 'general_ledger', auditorCtx);
          },
          AuthorizationError
        );
      }
    });

    it('should grant managers (level >= 70) full operational permissions including delete', async () => {
      const managerCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'mgr-01',
        roles: ['finance_manager'],
      };

      const actions: Array<'read' | 'create' | 'write' | 'submit' | 'delete'> = [
        'read',
        'create',
        'write',
        'submit',
        'delete',
      ];

      for (const action of actions) {
        const res = await service.checkPermission(action, 'journal_entry', managerCtx);
        assert.strictEqual(res.allowed, true, `Finance manager should be allowed to ${action}`);
      }
    });

    it('should grant operational users (level 40-50) create, read, write, submit but deny delete', async () => {
      const operationalCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'user-sales',
        roles: ['sales_user'],
      };

      // Allowed actions
      const allowed: Array<'read' | 'create' | 'write' | 'submit' | 'print' | 'email'> = [
        'read',
        'create',
        'write',
        'submit',
        'print',
        'email',
      ];
      for (const action of allowed) {
        const res = await service.checkPermission(action, 'sales_order', operationalCtx);
        assert.strictEqual(res.allowed, true, `sales_user should be allowed to ${action}`);
      }

      // Denied actions: operational staff cannot delete drafts
      const deleteRes = await service.checkPermission('delete', 'sales_order', operationalCtx);
      assert.strictEqual(deleteRes.allowed, false);

      await assert.rejects(
        async () => {
          await service.assertPermission('delete', 'sales_order', operationalCtx);
        },
        AuthorizationError
      );
    });

    it('should restrict frontline/clerical users (level 20-30) from submitting', async () => {
      const warehouseCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'wh-user',
        roles: ['warehouse_user'],
      };

      // Can read and create draft
      const readRes = await service.checkPermission('read', 'delivery_note', warehouseCtx);
      assert.strictEqual(readRes.allowed, true);

      // Cannot submit delivery note
      const submitRes = await service.checkPermission('submit', 'delivery_note', warehouseCtx);
      assert.strictEqual(submitRes.allowed, false);
    });

    it('should deny unauthorized/unknown roles', async () => {
      const guestCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'guest-01',
        roles: ['unknown_custom_role'],
      };

      const res = await service.checkPermission('create', 'sales_invoice', guestCtx);
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('lack permission'));
    });
  });

  describe('2. Approval Limit Validation', () => {
    it('should allow approval when document amount is within authorized limit', async () => {
      const managerCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'mgr-01',
        roles: ['sales_manager'],
        approvalLimits: {
          sales_invoice: 50000, // ₹50,000 limit
        },
      };

      const docUnderLimit = {
        id: 'doc-under-limit',
        grand_total: '35000.00',
        created_by: 'sales-rep-02',
      };

      const res = await service.checkPermission('approve', 'sales_invoice', managerCtx, docUnderLimit);
      assert.strictEqual(res.allowed, true);
    });

    it('should reject approval when document amount exceeds authorized limit', async () => {
      const managerCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'mgr-01',
        roles: ['sales_manager'],
        approvalLimits: {
          sales_invoice: 50000, // ₹50,000 limit
        },
      };

      const docOverLimit = {
        id: 'doc-over-limit',
        grand_total: '75000.00',
        created_by: 'sales-rep-02',
      };

      const res = await service.checkPermission('approve', 'sales_invoice', managerCtx, docOverLimit);
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('exceeds your authorized approval limit'));
      assert.ok(res.reason?.includes('₹75,000'));
      assert.ok(res.reason?.includes('₹50,000'));

      await assert.rejects(
        async () => {
          await service.assertPermission('approve', 'sales_invoice', managerCtx, docOverLimit);
        },
        AuthorizationError
      );
    });

    it('should fall back to wildcard approval limit (*) when doctype limit is not explicitly defined', async () => {
      const managerCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'mgr-02',
        roles: ['procurement_manager'],
        approvalLimits: {
          '*': 100000, // ₹1,00,000 wildcard limit
        },
      };

      // Under wildcard limit
      const poUnder = {
        id: 'po-under',
        grand_total: '80000.00',
        created_by: 'buyer-01',
      };
      const resUnder = await service.checkPermission('approve', 'purchase_order', managerCtx, poUnder);
      assert.strictEqual(resUnder.allowed, true);

      // Over wildcard limit
      const poOver = {
        id: 'po-over',
        grand_total: '150000.00',
        created_by: 'buyer-01',
      };
      const resOver = await service.checkPermission('approve', 'purchase_order', managerCtx, poOver);
      assert.strictEqual(resOver.allowed, false);
      assert.ok(resOver.reason?.includes('₹1,50,000'));
    });

    it('should allow users without approval limits to approve any amount', async () => {
      const cfoCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'cfo-01',
        roles: ['cfo'],
        // No approvalLimits defined means unlimited
      };

      const hugeInvoice = {
        id: 'inv-huge',
        grand_total: '100000000.00', // ₹10 Crore
        created_by: 'finance-lead',
      };

      const res = await service.checkPermission('approve', 'sales_invoice', cfoCtx, hugeInvoice);
      assert.strictEqual(res.allowed, true);
    });

    it('should not restrict non-approve actions by approval limit', async () => {
      const managerCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'mgr-01',
        roles: ['sales_manager'],
        approvalLimits: {
          sales_invoice: 50000,
        },
      };

      const docOverLimit = {
        id: 'doc-view-only',
        grand_total: '500000.00',
      };

      // Manager can still read and write the document
      const readRes = await service.checkPermission('read', 'sales_invoice', managerCtx, docOverLimit);
      assert.strictEqual(readRes.allowed, true);

      const writeRes = await service.checkPermission('write', 'sales_invoice', managerCtx, docOverLimit);
      assert.strictEqual(writeRes.allowed, true);
    });
  });

  describe('3. Segregation of Duties (Four-Eyes Principle)', () => {
    it('should prevent creator from approving their own document', async () => {
      const managerCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'manager-user-01',
        roles: ['finance_manager'],
      };

      const ownDoc = {
        id: 'doc-self-created',
        grand_total: '10000.00',
        created_by: 'manager-user-01', // Same user as context!
      };

      const res = await service.checkPermission('approve', 'journal_entry', managerCtx, ownDoc);
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('Four-eyes principle violation'));

      await assert.rejects(
        async () => {
          await service.assertPermission('approve', 'journal_entry', managerCtx, ownDoc);
        },
        (err: Error) => {
          assert.ok(err instanceof AuthorizationError);
          assert.ok(err.message.includes('Four-eyes principle violation'));
          return true;
        }
      );
    });

    it('should allow manager to approve a document created by a colleague', async () => {
      const managerCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'manager-user-01',
        roles: ['finance_manager'],
      };

      const colleagueDoc = {
        id: 'doc-colleague-created',
        grand_total: '10000.00',
        created_by: 'accountant-user-02', // Different user
      };

      const res = await service.checkPermission('approve', 'journal_entry', managerCtx, colleagueDoc);
      assert.strictEqual(res.allowed, true);
    });
  });

  describe('4. Attribute-Based Scoping Check (ABAC)', () => {
    it('should forbid cross-tenant document access', async () => {
      const userCtx: UserSecurityContext = {
        tenantId: 'tenant-AAA',
        userId: 'user-01',
        roles: ['sales_user'],
      };

      const foreignDoc = {
        id: 'doc-foreign-tenant',
        tenant_id: 'tenant-BBB', // Different tenant
      };

      const res = await service.checkPermission('read', 'sales_order', userCtx, foreignDoc);
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('Cross-tenant access forbidden'));
    });

    it('should enforce company boundary scoping', async () => {
      const userCtx: UserSecurityContext = {
        tenantId: 'tenant-AAA',
        userId: 'user-01',
        roles: ['sales_user'],
        allowedCompanyIds: ['company-alpha', 'company-beta'],
      };

      const allowedDoc = {
        id: 'doc-comp-alpha',
        tenant_id: 'tenant-AAA',
        company_id: 'company-alpha',
      };
      const allowedRes = await service.checkPermission('read', 'sales_order', userCtx, allowedDoc);
      assert.strictEqual(allowedRes.allowed, true);

      const forbiddenDoc = {
        id: 'doc-comp-gamma',
        tenant_id: 'tenant-AAA',
        company_id: 'company-gamma', // Not in allowedCompanyIds
      };
      const forbiddenRes = await service.checkPermission('read', 'sales_order', userCtx, forbiddenDoc);
      assert.strictEqual(forbiddenRes.allowed, false);
      assert.ok(forbiddenRes.reason?.includes('company-gamma'));
    });

    it('should enforce branch boundary scoping', async () => {
      const userCtx: UserSecurityContext = {
        tenantId: 'tenant-AAA',
        userId: 'user-01',
        roles: ['sales_user'],
        allowedBranchIds: ['branch-north'],
      };

      const forbiddenDoc = {
        id: 'doc-branch-south',
        tenant_id: 'tenant-AAA',
        branch_id: 'branch-south',
      };

      const res = await service.checkPermission('read', 'sales_order', userCtx, forbiddenDoc);
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes('branch-south'));
    });
  });

  describe('5. Field-Level Permissions & Masking (FLS)', () => {
    beforeEach(() => {
      service.registerFieldPermissions('sales_invoice', [
        {
          field: 'profit_margin',
          readRoles: ['cfo', 'finance_manager'],
          writeRoles: ['cfo'],
        },
      ]);
    });

    it('should mask confidential fields for unauthorized roles', () => {
      const doc = {
        id: 'inv-001',
        grand_total: '10000.00',
        profit_margin: '25.50',
      };

      const salesCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'sales-rep',
        roles: ['sales_user'],
      };

      const masked = service.maskDocumentFields('sales_invoice', doc, salesCtx);
      assert.strictEqual(masked.grand_total, '10000.00');
      assert.strictEqual(masked.profit_margin, null, 'Confidential field should be masked to null');
    });

    it('should leave confidential fields unmasked for authorized roles (finance_manager, cfo)', () => {
      const doc = {
        id: 'inv-001',
        grand_total: '10000.00',
        profit_margin: '25.50',
      };

      const mgrCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'finance-mgr',
        roles: ['finance_manager'],
      };

      const unmasked = service.maskDocumentFields('sales_invoice', doc, mgrCtx);
      assert.strictEqual(unmasked.profit_margin, '25.50');
    });

    it('should prevent unauthorized users from writing to restricted fields', () => {
      const mgrCtx: UserSecurityContext = {
        tenantId: 'tenant-100',
        userId: 'finance-mgr',
        roles: ['finance_manager'], // Has readRoles but not writeRoles (only cfo has write)
      };

      assert.throws(
        () => {
          service.validateWritableFields(
            'sales_invoice',
            { profit_margin: '30.00' },
            mgrCtx
          );
        },
        (err: Error) => {
          assert.ok(err instanceof AuthorizationError);
          assert.ok(err.message.includes("restricted field 'profit_margin'"));
          return true;
        }
      );
    });
  });
});
