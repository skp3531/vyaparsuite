/**
 * Unit & Integration Tests for VyaparSuite Core Document Service
 * Tests document creation in Draft status, finite state machine transitions
 * (Draft -> Submitted -> Approved -> Posted), invalid transition guards,
 * post-posting immutability protection, and accounting period lock blocks.
 */

import { describe, it, beforeEach, assert } from '../../../../tests/helpers/test-runner';
import { MockDatabaseAdapter } from '../../../../tests/helpers/mock-db';
import { DocumentService, DocumentContext } from '../services/document-service';
import {
  DocumentStatus,
  DocumentAction,
  DoctypeDefinition,
  BaseDocument,
} from '../types/document';
import {
  BusinessRuleError,
  ImmutableRecordError,
  PeriodClosedError,
  ValidationError,
  NotFoundError,
} from '@/lib/utils/errors';

describe('DocumentService Lifecycle & State Machine', () => {
  let db: MockDatabaseAdapter;
  let service: DocumentService;
  let adminContext: DocumentContext;

  const testInvoiceDoctype: DoctypeDefinition = {
    name: 'test_invoice',
    label: 'Test Invoice',
    module: 'sales',
    tableName: 'test_invoices',
    itemTableName: 'test_invoice_items',
    isSubmittable: true,
    isAmendable: true,
    hasItems: true,
    hasAccounting: true,
    hasInventory: false,
    hasWorkflow: false,
    hasNamingSeries: true,
    defaultNamingSeries: 'INV-.YYYY.-.####',
    transitions: {
      [DocumentStatus.Draft]: [DocumentAction.Submit, DocumentAction.Save],
      [DocumentStatus.PendingApproval]: [DocumentAction.Approve, DocumentAction.Reject, DocumentAction.Hold],
      [DocumentStatus.Approved]: [DocumentAction.Post, DocumentAction.Hold],
      [DocumentStatus.Submitted]: [DocumentAction.Approve, DocumentAction.Post, DocumentAction.Reject],
      [DocumentStatus.Posted]: [DocumentAction.Cancel, DocumentAction.Close],
      [DocumentStatus.Rejected]: [DocumentAction.Submit],
      [DocumentStatus.Cancelled]: [DocumentAction.Amend],
      [DocumentStatus.Amended]: [],
      [DocumentStatus.Closed]: [DocumentAction.Reopen, DocumentAction.Amend],
      [DocumentStatus.OnHold]: [DocumentAction.Resume],
      [DocumentStatus.PartiallyFulfilled]: [DocumentAction.Close, DocumentAction.Cancel],
      [DocumentStatus.Fulfilled]: [DocumentAction.Close],
    },
  };

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    service = new DocumentService(db);
    service.registerDoctype(testInvoiceDoctype);

    adminContext = {
      tenantId: 'tenant-erp-01',
      companyId: 'company-hq-01',
      userId: 'user-finance-lead',
      userEmail: 'finance@vyaparsuite.local',
      branchId: 'branch-main',
      companyCode: 'VYAP',
      branchCode: 'DEL',
      roles: ['system_manager'], // superuser role to test core document mechanics
    };
  });

  describe('1. Document Creation in Draft Status', () => {
    it('should create document in Draft status with initial version 1 and document number', async () => {
      const doc = await service.create(
        'test_invoice',
        {
          posting_date: '2025-06-15',
          currency: 'INR',
        },
        adminContext
      );

      assert.ok(doc.id, 'Document should have an ID');
      assert.strictEqual(doc.doctype, 'test_invoice');
      assert.strictEqual(doc.status, DocumentStatus.Draft, 'Initial status must be Draft');
      assert.strictEqual(doc.version, 1, 'Initial version must be 1');
      assert.strictEqual(doc.tenant_id, adminContext.tenantId);
      assert.strictEqual(doc.company_id, adminContext.companyId);
      assert.strictEqual(doc.created_by, adminContext.userId);
      assert.strictEqual(doc.financial_year, '25-26');
      assert.ok(doc.document_number.startsWith('INV-.2025.-'), 'Document number should match pattern');
    });

    it('should persist child line items during document creation', async () => {
      const doc = await service.create(
        'test_invoice',
        {
          posting_date: '2025-06-15',
          items: [
            {
              item_code: 'ITEM-001',
              item_name: 'Widget A',
              quantity: '10.000000',
              rate: '50.000000',
              amount: '500.000000',
            },
            {
              item_code: 'ITEM-002',
              item_name: 'Widget B',
              quantity: '5.000000',
              rate: '100.000000',
              amount: '500.000000',
            },
          ] as any,
        },
        adminContext
      );

      // Verify header created
      assert.strictEqual(doc.status, DocumentStatus.Draft);

      // Verify line items persisted in child table
      const storedItems = db.getTableRecords('test_invoice_items');
      assert.strictEqual(storedItems.length, 2);
      assert.strictEqual(storedItems[0].parent_id, doc.id);
      assert.strictEqual(storedItems[0].idx, 1);
      assert.strictEqual(storedItems[1].idx, 2);
    });

    it('should fail creation when registering validator fails', async () => {
      service.registerValidator('test_invoice', async (doc) => {
        if ((doc as any).title === 'invalid') {
          return { valid: false, errors: [{ field: 'title', message: 'Title cannot be invalid' }] };
        }
        return { valid: true, errors: [] };
      });

      await assert.rejects(
        async () => {
          await service.create('test_invoice', { title: 'invalid' } as any, adminContext);
        },
        ValidationError
      );
    });
  });

  describe('2. Valid State Transitions', () => {
    it('should transition through full lifecycle: Draft -> PendingApproval -> Approved -> Posted', async () => {
      // Step 1: Create in Draft
      const draft = await service.create(
        'test_invoice',
        {
          posting_date: '2025-06-15',
        },
        adminContext
      );
      assert.strictEqual(draft.status, DocumentStatus.Draft);
      assert.strictEqual(draft.version, 1);

      // Step 2: Draft -> Submit (results in PendingApproval)
      const submitted = await service.transition(
        'test_invoice',
        draft.id,
        DocumentAction.Submit,
        adminContext
      );
      assert.strictEqual(submitted.status, DocumentStatus.PendingApproval);
      assert.strictEqual(submitted.version, 2);
      assert.strictEqual(submitted.submitted_by, adminContext.userId);
      assert.ok(submitted.submitted_at);

      // Step 3: PendingApproval -> Approve (results in Approved)
      const approved = await service.transition(
        'test_invoice',
        submitted.id,
        DocumentAction.Approve,
        adminContext
      );
      assert.strictEqual(approved.status, DocumentStatus.Approved);
      assert.strictEqual(approved.version, 3);
      assert.strictEqual(approved.approved_by, adminContext.userId);
      assert.ok(approved.approved_at);

      // Step 4: Approved -> Post (results in Posted)
      const posted = await service.transition(
        'test_invoice',
        approved.id,
        DocumentAction.Post,
        adminContext
      );
      assert.strictEqual(posted.status, DocumentStatus.Posted);
      assert.strictEqual(posted.version, 4);
      assert.strictEqual(posted.posted_by, adminContext.userId);
      assert.ok(posted.posted_at);
    });

    it('should support direct transition from Submitted status: Submitted -> Approved -> Posted', async () => {
      // Seed a document directly in Submitted status
      const seededId = 'doc-seeded-submitted-101';
      db.seed('test_invoices', [
        {
          id: seededId,
          doctype: 'test_invoice',
          document_number: 'INV-2025-0101',
          tenant_id: adminContext.tenantId,
          company_id: adminContext.companyId,
          posting_date: '2025-06-15',
          financial_year: '25-26',
          currency: 'INR',
          exchange_rate: '1',
          status: DocumentStatus.Submitted,
          owner_id: adminContext.userId,
          created_by: adminContext.userId,
          updated_by: adminContext.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          version: 1,
        },
      ]);

      // 1. Submitted -> Approve
      const approved = await service.transition(
        'test_invoice',
        seededId,
        DocumentAction.Approve,
        adminContext
      );
      assert.strictEqual(approved.status, DocumentStatus.Approved);

      // 2. Approved -> Post
      const posted = await service.transition(
        'test_invoice',
        seededId,
        DocumentAction.Post,
        adminContext
      );
      assert.strictEqual(posted.status, DocumentStatus.Posted);
    });

    it('should support Post directly from Submitted when allowed in workflow', async () => {
      const seededId = 'doc-direct-post-102';
      db.seed('test_invoices', [
        {
          id: seededId,
          doctype: 'test_invoice',
          document_number: 'INV-2025-0102',
          tenant_id: adminContext.tenantId,
          company_id: adminContext.companyId,
          posting_date: '2025-06-15',
          financial_year: '25-26',
          currency: 'INR',
          status: DocumentStatus.Submitted,
          owner_id: adminContext.userId,
          created_by: adminContext.userId,
          updated_by: adminContext.userId,
          version: 1,
        },
      ]);

      const posted = await service.transition(
        'test_invoice',
        seededId,
        DocumentAction.Post,
        adminContext
      );
      assert.strictEqual(posted.status, DocumentStatus.Posted);
    });
  });

  describe('3. Invalid State Transitions Throwing BusinessRuleError', () => {
    it('should reject invalid transition: Draft -> Post directly', async () => {
      const doc = await service.create('test_invoice', { posting_date: '2025-06-15' }, adminContext);

      await assert.rejects(
        async () => {
          await service.transition('test_invoice', doc.id, DocumentAction.Post, adminContext);
        },
        (err: Error) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.ok(err.message.includes("Cannot perform 'post' on test_invoice in 'draft' status"));
          return true;
        }
      );
    });

    it('should reject invalid transition: Draft -> Approve directly', async () => {
      const doc = await service.create('test_invoice', { posting_date: '2025-06-15' }, adminContext);

      await assert.rejects(
        async () => {
          await service.transition('test_invoice', doc.id, DocumentAction.Approve, adminContext);
        },
        (err: Error) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.ok(err.message.includes("Cannot perform 'approve' on test_invoice in 'draft' status"));
          return true;
        }
      );
    });

    it('should reject invalid transition: Posted -> Submit', async () => {
      const seededId = 'doc-posted-103';
      db.seed('test_invoices', [
        {
          id: seededId,
          doctype: 'test_invoice',
          document_number: 'INV-2025-0103',
          tenant_id: adminContext.tenantId,
          company_id: adminContext.companyId,
          posting_date: '2025-06-15',
          currency: 'INR',
          status: DocumentStatus.Posted,
          owner_id: adminContext.userId,
          created_by: adminContext.userId,
          updated_by: adminContext.userId,
          version: 1,
        },
      ]);

      await assert.rejects(
        async () => {
          await service.transition('test_invoice', seededId, DocumentAction.Submit, adminContext);
        },
        (err: Error) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.ok(err.message.includes("Cannot perform 'submit' on test_invoice in 'posted' status"));
          return true;
        }
      );
    });

    it('should reject invalid transition on unknown doctype', async () => {
      await assert.rejects(
        async () => {
          await service.transition('non_existent_doc', '123', DocumentAction.Submit, adminContext);
        },
        (err: Error) => {
          assert.ok(err instanceof BusinessRuleError);
          assert.ok(err.message.includes('Unknown doctype: non_existent_doc'));
          return true;
        }
      );
    });
  });

  describe('4. Immutable Record Protection', () => {
    it('should prevent mutating documents once in Posted status', async () => {
      // 1. Create and progress to Posted
      const doc = await service.create('test_invoice', { posting_date: '2025-06-15' }, adminContext);
      await service.transition('test_invoice', doc.id, DocumentAction.Submit, adminContext);
      await service.transition('test_invoice', doc.id, DocumentAction.Approve, adminContext);
      const posted = await service.transition('test_invoice', doc.id, DocumentAction.Post, adminContext);

      assert.strictEqual(posted.status, DocumentStatus.Posted);

      // 2. Attempt update on posted document
      await assert.rejects(
        async () => {
          await service.update('test_invoice', doc.id, { notes: 'Tampered note' }, adminContext);
        },
        (err: Error) => {
          assert.ok(err instanceof ImmutableRecordError);
          assert.ok(err.message.includes('record is immutable after posting'));
          return true;
        }
      );
    });

    it('should allow updates while document is in Draft status', async () => {
      const doc = await service.create('test_invoice', { notes: 'Initial Draft' }, adminContext);
      assert.strictEqual(doc.version, 1);

      const updated = await service.update(
        'test_invoice',
        doc.id,
        { notes: 'Updated Draft Note' },
        adminContext
      );

      assert.strictEqual(updated.notes, 'Updated Draft Note');
      assert.strictEqual(updated.version, 2);
    });

    it('should prevent softDelete of Posted documents', async () => {
      const seededId = 'doc-posted-delete-test';
      db.seed('test_invoices', [
        {
          id: seededId,
          doctype: 'test_invoice',
          document_number: 'INV-2025-0104',
          tenant_id: adminContext.tenantId,
          company_id: adminContext.companyId,
          posting_date: '2025-06-15',
          currency: 'INR',
          status: DocumentStatus.Posted,
          owner_id: adminContext.userId,
          created_by: adminContext.userId,
          updated_by: adminContext.userId,
          version: 1,
        },
      ]);

      await assert.rejects(
        async () => {
          await service.softDelete('test_invoice', seededId, adminContext);
        },
        ImmutableRecordError
      );
    });
  });

  describe('5. Accounting Period Closed Block', () => {
    it('should block posting when date falls within a closed accounting period', async () => {
      // Seed locked period: June 2025 is closed
      db.seed('period_lock', [
        {
          id: 'period-jun-2025',
          tenant_id: adminContext.tenantId,
          company_id: adminContext.companyId,
          period_name: 'June 2025 Period Lock',
          start_date: '2025-06-01',
          end_date: '2025-06-30',
          is_locked: true,
        },
      ]);

      // Seed approved document dated 2025-06-15
      const docId = 'doc-approved-in-closed-period';
      db.seed('test_invoices', [
        {
          id: docId,
          doctype: 'test_invoice',
          document_number: 'INV-2025-0999',
          tenant_id: adminContext.tenantId,
          company_id: adminContext.companyId,
          posting_date: '2025-06-15',
          currency: 'INR',
          status: DocumentStatus.Approved,
          owner_id: adminContext.userId,
          created_by: adminContext.userId,
          updated_by: adminContext.userId,
          version: 1,
        },
      ]);

      // Attempting to post must fail with PeriodClosedError
      await assert.rejects(
        async () => {
          await service.transition('test_invoice', docId, DocumentAction.Post, adminContext);
        },
        (err: Error) => {
          assert.ok(err instanceof PeriodClosedError);
          assert.ok(err.message.includes('Cannot post to closed period'));
          assert.ok(err.message.includes('June 2025 Period Lock'));
          return true;
        }
      );
    });

    it('should allow posting when period is unlocked or posting date is outside closed period', async () => {
      // Seed locked period only for May 2025
      db.seed('period_lock', [
        {
          id: 'period-may-2025',
          tenant_id: adminContext.tenantId,
          company_id: adminContext.companyId,
          period_name: 'May 2025 Period Lock',
          start_date: '2025-05-01',
          end_date: '2025-05-31',
          is_locked: true,
        },
      ]);

      // Approved document dated 2025-06-15 (outside May)
      const docId = 'doc-approved-in-open-period';
      db.seed('test_invoices', [
        {
          id: docId,
          doctype: 'test_invoice',
          document_number: 'INV-2025-1000',
          tenant_id: adminContext.tenantId,
          company_id: adminContext.companyId,
          posting_date: '2025-06-15',
          currency: 'INR',
          status: DocumentStatus.Approved,
          owner_id: adminContext.userId,
          created_by: adminContext.userId,
          updated_by: adminContext.userId,
          version: 1,
        },
      ]);

      // Posting should succeed smoothly
      const posted = await service.transition('test_invoice', docId, DocumentAction.Post, adminContext);
      assert.strictEqual(posted.status, DocumentStatus.Posted);
    });
  });
});
