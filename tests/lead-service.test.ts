import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { LeadService } from '@/modules/crm/services/lead-service';
import { MockDatabaseAdapter } from './helpers/mock-db-adapter';
import { BusinessRuleError, ConflictError } from '@/lib/utils/errors';

import { CustomerService } from '@/modules/sales/services/customer-service';

describe('LeadService', () => {
  let db: MockDatabaseAdapter;
  let service: LeadService;
  let customerService: CustomerService;
  const tenantId = '00000000-0000-4000-a000-000000000001';
  const userId = '22222222-2222-4222-a222-222222222222';
  let customerGroupId: string;
  const context = { tenantId, userId };

  beforeEach(async () => {
    db = new MockDatabaseAdapter();
    service = new LeadService(db);
    customerService = new CustomerService(db);

    const cg = await customerService.createCustomerGroup(
      { customer_group_name: 'Commercial' },
      context
    );
    customerGroupId = cg.id!;
  });

  it('computes algorithmic lead score and creates open lead', async () => {
    const lead = await service.createLead(
      {
        lead_name: 'Rajesh Sharma',
        company_name: 'Sharma Precision Engineering Pvt Ltd',
        email: 'rajesh@sharmaprecision.com',
        phone: '+91 98200 12345',
        annual_revenue: '50000000.000000',
        no_of_employees: 45,
        website: 'https://sharmaprecision.com',
      },
      context
    );

    expect(lead.id).toBeDefined();
    expect(lead.status).toBe('Open');
    expect(lead.lead_score).toBeGreaterThanOrEqual(80); // High-value qualified enterprise lead
  });

  it('qualifies a lead through sales outreach', async () => {
    const lead = await service.createLead(
      {
        lead_name: 'Amit Patel',
        company_name: 'Patel Trading Co',
        email: 'amit@pateltrading.in',
      },
      context
    );

    const qualified = await service.qualifyLead(lead.id!, context);
    expect(qualified.status).toBe('Qualified');
    expect(qualified.qualification_status).toBe('Qualified by sales representative');
  });

  it('converts a qualified lead into a permanent Customer account', async () => {
    const lead = await service.createLead(
      {
        lead_name: 'Priya Verma',
        company_name: 'Verma Automations',
        email: 'priya@verma-auto.com',
        phone: '+91 98765 43210',
      },
      context
    );

    const conversion = await service.convertLead(
      {
        leadId: lead.id!,
        customerGroupId,
        customerType: 'Company',
        gstCategory: 'Registered Regular',
        gstin: '27AABCU9603R1ZM',
        pan: 'AABCU9603R',
      },
      context
    );

    expect(conversion.customerId).toBeDefined();
    expect(conversion.lead.status).toBe('Converted');
    expect(conversion.lead.converted_customer_id).toBe(conversion.customerId);

    // Re-conversion must be rejected
    await expect(
      service.convertLead(
        {
          leadId: lead.id!,
          customerGroupId,
          customerType: 'Company',
          gstCategory: 'Registered Regular',
        },
        context
      )
    ).rejects.toThrow(ConflictError);
  });
});
