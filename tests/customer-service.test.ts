import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { CustomerService } from '@/modules/sales/services/customer-service';
import { MockDatabaseAdapter } from './helpers/mock-db-adapter';
import { Decimal } from '@/lib/utils/decimal';

describe('CustomerService', () => {
  let db: MockDatabaseAdapter;
  let service: CustomerService;
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const companyId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const context = { tenantId, companyId, userId };

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    service = new CustomerService(db);
  });

  it('creates customer and enforces credit limits', async () => {
    const group = await service.createCustomerGroup(
      {
        customer_group_name: 'Commercial Wholesale',
      },
      context
    );

    const customer = await service.createCustomer(
      {
        customer_name: 'Acme Enterprises Pvt Ltd',
        customer_code: 'CUST-ACME-01',
        customer_group_id: group.id!,
        credit_limit: '100000.000000',
        credit_days: 30,
        gstin: '27AABCU9603R1ZM',
        pan: 'AABCU9603R',
        gst_category: 'Registered Regular',
      },
      context
    );

    expect(customer.id).toBeDefined();

    // Check credit limit when under threshold
    const check1 = await service.checkCreditLimit(customer.id!, '50000.00', tenantId, companyId);
    expect(check1.allowed).toBe(true);
    expect(check1.totalExposure.toFixed(2)).toBe('50000.00');

    // Simulate existing unpaid sales invoice of 70000
    db.seed('sales_invoice', [
      {
        id: 'inv-1',
        tenant_id: tenantId,
        company_id: companyId,
        customer_id: customer.id,
        outstanding_amount: '70000.00',
        status: 'Submitted',
      },
    ]);

    // Check credit limit when new order of 40000 pushes exposure to 110000 > 100000
    const check2 = await service.checkCreditLimit(customer.id!, '40000.00', tenantId, companyId);
    expect(check2.allowed).toBe(false);
    expect(check2.totalExposure.toFixed(2)).toBe('110000.00');
    expect(check2.reason).toContain('Credit limit exceeded');
  });

  it('blocks orders if customer is credit frozen', async () => {
    const group = await service.createCustomerGroup(
      { customer_group_name: 'Retail' },
      context
    );

    const customer = await service.createCustomer(
      {
        customer_name: 'Frozen Client Inc',
        customer_code: 'CUST-FROZEN',
        customer_group_id: group.id!,
        credit_limit: '500000.000000',
        is_credit_freeze: true,
      },
      context
    );

    const check = await service.checkCreditLimit(customer.id!, '1000.00', tenantId, companyId);
    expect(check.allowed).toBe(false);
    expect(check.isCreditFrozen).toBe(true);
    expect(check.reason).toContain('credit frozen');
  });

  it('recalculates outstanding balance from sales invoices accurately', async () => {
    const group = await service.createCustomerGroup(
      { customer_group_name: 'Corporate' },
      context
    );

    const customer = await service.createCustomer(
      {
        customer_name: 'Beta Global',
        customer_code: 'CUST-BETA',
        customer_group_id: group.id!,
      },
      context
    );

    db.seed('sales_invoice', [
      {
        tenant_id: tenantId,
        company_id: companyId,
        customer_id: customer.id,
        outstanding_amount: '12500.50',
      },
      {
        tenant_id: tenantId,
        company_id: companyId,
        customer_id: customer.id,
        outstanding_amount: '7500.25',
      },
    ]);

    const total = await service.recalculateCustomerOutstanding(customer.id!, tenantId, companyId);
    expect(total.toFixed(2)).toBe('20000.75');
  });
});
