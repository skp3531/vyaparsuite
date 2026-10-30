import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { TaxService } from '@/modules/setup/services/tax-service';
import { MockDatabaseAdapter } from './helpers/mock-db-adapter';
import { Decimal } from '@/lib/utils/decimal';

describe('TaxService', () => {
  let db: MockDatabaseAdapter;
  let service: TaxService;
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const companyId = '11111111-1111-1111-1111-111111111111';
  const userId = '22222222-2222-2222-2222-222222222222';
  const context = { tenantId, companyId, userId };

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    service = new TaxService(db);

    // Seed company in Maharashtra (State 27)
    db.seed('company', [
      {
        id: companyId,
        tenant_id: tenantId,
        company_name: 'VyaparSuite Corp India',
        gstin: '27AABCU9603R1ZM',
      },
    ]);
  });

  it('determines Intra-State (CGST + SGST) when buyer is in same state', async () => {
    const res = await service.determineTaxTemplate({
      tenantId,
      companyId,
      taxType: 'Sales',
      partyGstin: '27BBBCU1234F1ZN', // Same state (27 - Maharashtra)
    });

    expect(res.jurisdiction).toBe('Intra-State');
    expect(res.isInterState).toBe(false);
    expect(res.companyStateCode).toBe('27');
    expect(res.partyStateCode).toBe('27');
    expect(res.summary).toContain('Intra-State');
  });

  it('determines Inter-State (IGST) when buyer is in different state', async () => {
    const res = await service.determineTaxTemplate({
      tenantId,
      companyId,
      taxType: 'Sales',
      partyGstin: '29BBBCU1234F1ZN', // Different state (29 - Karnataka)
    });

    expect(res.jurisdiction).toBe('Inter-State');
    expect(res.isInterState).toBe(true);
    expect(res.companyStateCode).toBe('27');
    expect(res.partyStateCode).toBe('29');
    expect(res.summary).toContain('Inter-State');
    expect(res.summary).toContain('IGST');
  });

  it('determines Export when buyer is outside India', async () => {
    const res = await service.determineTaxTemplate({
      tenantId,
      companyId,
      taxType: 'Sales',
      partyCountry: 'Germany',
    });

    expect(res.jurisdiction).toBe('Export');
    expect(res.isInterState).toBe(true);
    expect(res.summary).toContain('Export');
  });

  it('computes GST tax lines, component breakdowns, and rounding adjustment', async () => {
    // 18% GST template: 9% CGST + 9% SGST
    const calc = await service.calculateTaxes({
      items: [
        {
          itemCode: 'ITEM-A',
          quantity: 2,
          rate: '100.00', // net 200
        },
        {
          itemCode: 'ITEM-B',
          quantity: 1,
          rate: '50.33', // net 50.33
        },
      ],
      taxDetails: [
        {
          accountId: 'acc-cgst',
          description: 'CGST 9%',
          ratePercent: '9.000000',
        },
        {
          accountId: 'acc-sgst',
          description: 'SGST 9%',
          ratePercent: '9.000000',
        },
      ],
    });

    // Net Total = 200 + 50.33 = 250.33
    expect(calc.netTotal.toFixed(2)).toBe('250.33');

    // Total tax at 18% = 250.33 * 0.18 = 45.06
    expect(calc.totalTax.toFixed(2)).toBe('45.06');

    // Grand total before round = 250.33 + 45.06 = 295.39
    expect(calc.grandTotal.toFixed(2)).toBe('295.39');

    // Rounded total = 295.00
    expect(calc.roundedTotal.toFixed(2)).toBe('295.00');
    // Rounding adjustment = -0.39
    expect(calc.roundingAdjustment.toFixed(2)).toBe('-0.39');

    // CGST and SGST splits
    expect(calc.taxComponents.length).toBe(2);
    expect(calc.taxComponents[0].taxAmount.toFixed(2)).toBe('22.53');
    expect(calc.taxComponents[1].taxAmount.toFixed(2)).toBe('22.53');
  });
});
