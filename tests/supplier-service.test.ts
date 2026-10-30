import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { SupplierService } from '@/modules/purchase/services/supplier-service';
import { MockDatabaseAdapter } from './helpers/mock-db-adapter';
import { BusinessRuleError } from '@/lib/utils/errors';

describe('SupplierService', () => {
  let db: MockDatabaseAdapter;
  let service: SupplierService;
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const companyId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const context = { tenantId, companyId, userId };

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    service = new SupplierService(db);
  });

  it('creates supplier and validates MSME Section 43B(h) payment terms', async () => {
    const group = await service.createSupplierGroup(
      { supplier_group_name: 'Raw Materials' },
      context
    );

    // Reject MSME payment terms exceeding 45 days
    await expect(
      service.createSupplier(
        {
          supplier_name: 'Small Foundry Works',
          supplier_code: 'SUPP-FOUNDRY',
          supplier_group_id: group.id!,
          is_msme_registered: true,
          msme_registration_no: 'UDYAM-MH-12-0012345',
          payment_terms_days: 60, // Exceeds 45 days
        },
        context
      )
    ).rejects.toThrow(BusinessRuleError);

    // Valid MSME supplier with 30 days terms
    const supplier = await service.createSupplier(
      {
        supplier_name: 'Small Foundry Works',
        supplier_code: 'SUPP-FOUNDRY',
        supplier_group_id: group.id!,
        is_msme_registered: true,
        msme_registration_no: 'UDYAM-MH-12-0012345',
        payment_terms_days: 30,
        gstin: '27AAACG9603R1ZM',
        pan: 'AAACG9603R',
      },
      context
    );

    expect(supplier.id).toBeDefined();

    const taxCheck = await service.validateSupplierTaxDetails(supplier.id!, tenantId);
    expect(taxCheck.isValid).toBe(true);
    expect(taxCheck.gstinPanMatch).toBe(true);
    expect(taxCheck.stateCode).toBe('27');
    expect(taxCheck.msmeCompliant).toBe(true);
  });

  it('calculates payment schedule with milestone allocations', async () => {
    const group = await service.createSupplierGroup(
      { supplier_group_name: 'Machinery' },
      context
    );

    // Seed payment terms template and details
    const templateId = 'tpl-milestone-01';
    db.seed('payment_terms_template', [
      {
        id: templateId,
        tenant_id: tenantId,
        template_name: '30-70 Dispatch Terms',
        is_active: true,
      },
    ]);

    db.seed('payment_terms_detail', [
      {
        id: 'ptd-1',
        tenant_id: tenantId,
        template_id: templateId,
        term_description: '30% Advance Deposit',
        invoice_portion_percent: '30.000000',
        credit_days: 0,
        credit_months: 0,
      },
      {
        id: 'ptd-2',
        tenant_id: tenantId,
        template_id: templateId,
        term_description: '70% on Dispatch',
        invoice_portion_percent: '70.000000',
        credit_days: 30,
        credit_months: 0,
      },
    ]);

    const schedule = await service.calculatePaymentSchedule({
      templateId,
      invoiceAmount: '100000.00',
      invoiceDate: '2026-11-01',
      tenantId,
    });

    expect(schedule.milestones.length).toBe(2);
    expect(schedule.milestones[0].amount.toFixed(2)).toBe('30000.00');
    expect(schedule.milestones[0].dueDate).toBe('2026-11-01');
    expect(schedule.milestones[1].amount.toFixed(2)).toBe('70000.00');
    expect(schedule.milestones[1].dueDate).toBe('2026-12-01');
  });
});
