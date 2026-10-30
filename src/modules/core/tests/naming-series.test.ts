/**
 * Unit & Integration Tests for VyaparSuite Naming Series Service
 * Tests thread-safe counter increments, pattern parsing, prefix/suffix formatting,
 * padding lengths, Indian fiscal year resolution, and tenant/company isolation.
 */

import { describe, it, beforeEach, assert } from '../../../../tests/helpers/test-runner';
import { MockDatabaseAdapter } from '../../../../tests/helpers/mock-db';
import { NamingSeriesService, NamingContext } from '../services/naming-series-service';

describe('NamingSeriesService', () => {
  let db: MockDatabaseAdapter;
  let service: NamingSeriesService;
  let baseContext: NamingContext;

  beforeEach(() => {
    db = new MockDatabaseAdapter();
    service = new NamingSeriesService(db);
    baseContext = {
      tenantId: 'tenant-100',
      companyId: 'comp-100',
      companyCode: 'ACME',
      branchCode: 'BLR',
      postingDate: '2025-05-15',
    };
  });

  describe('Fiscal Year Prefix Resolution', () => {
    it('should resolve Indian fiscal year (Apr 1 to Mar 31) for April-December dates', () => {
      // April 1, 2024 -> FY 2024-2025 (24-25)
      const aprDate = service.getFinancialYear('2024-04-01');
      assert.strictEqual(aprDate.startYear, 2024);
      assert.strictEqual(aprDate.endYear, 2025);
      assert.strictEqual(aprDate.shortCode, '24-25');
      assert.strictEqual(aprDate.fullCode, '2024-2025');

      // December 31, 2024 -> FY 2024-2025 (24-25)
      const decDate = service.getFinancialYear('2024-12-31');
      assert.strictEqual(decDate.shortCode, '24-25');
      assert.strictEqual(decDate.fullCode, '2024-2025');
    });

    it('should resolve Indian fiscal year for January-March dates (prior start year)', () => {
      // January 15, 2025 -> Still FY 2024-2025 (24-25)
      const janDate = service.getFinancialYear('2025-01-15');
      assert.strictEqual(janDate.startYear, 2024);
      assert.strictEqual(janDate.endYear, 2025);
      assert.strictEqual(janDate.shortCode, '24-25');
      assert.strictEqual(janDate.fullCode, '2024-2025');

      // March 31, 2025 -> Final day of FY 2024-2025
      const marDate = service.getFinancialYear('2025-03-31');
      assert.strictEqual(marDate.shortCode, '24-25');
      assert.strictEqual(marDate.fullCode, '2024-2025');
    });

    it('should advance fiscal year on April 1', () => {
      // April 1, 2025 -> FY 2025-2026 (25-26)
      const newFyDate = service.getFinancialYear('2025-04-01');
      assert.strictEqual(newFyDate.startYear, 2025);
      assert.strictEqual(newFyDate.endYear, 2026);
      assert.strictEqual(newFyDate.shortCode, '25-26');
      assert.strictEqual(newFyDate.fullCode, '2025-2026');
    });

    it('should resolve {FY} and {FY_LONG} tokens in patterns', async () => {
      const numberShort = await service.getNextNumber('INV-{FY}-####', {
        ...baseContext,
        postingDate: '2024-06-15',
      });
      assert.strictEqual(numberShort, 'INV-24-25-0001');

      const numberLong = await service.getNextNumber('BILL-{FY_LONG}-####', {
        ...baseContext,
        postingDate: '2024-06-15',
      });
      assert.strictEqual(numberLong, 'BILL-2024-2025-0001');
    });
  });

  describe('Pattern Formatting, Prefix, Suffix, and Padding', () => {
    it('should parse prefixes and hash padding correctly', () => {
      const parsed3 = service.parsePattern('INV-###', baseContext, '2025-05-15');
      assert.strictEqual(parsed3.prefix, 'INV-');
      assert.strictEqual(parsed3.padding, 3);
      assert.strictEqual(parsed3.suffix, '');

      const parsed5 = service.parsePattern('SO-#####', baseContext, '2025-05-15');
      assert.strictEqual(parsed5.prefix, 'SO-');
      assert.strictEqual(parsed5.padding, 5);
      assert.strictEqual(parsed5.suffix, '');
    });

    it('should format document number with custom suffix', async () => {
      const pattern = 'TAX-{FY}-####-GST';
      const docNum = await service.getNextNumber(pattern, {
        ...baseContext,
        postingDate: '2025-05-15',
      });

      assert.strictEqual(docNum, 'TAX-25-26-0001-GST');
    });

    it('should substitute date tokens {YYYY}, {YY}, {MM}, {DD}', () => {
      const parsed = service.parsePattern('{COMPANY}/{BRANCH}/{YYYY}/{MM}/{DD}/####', baseContext, '2025-09-08');
      assert.strictEqual(parsed.prefix, 'ACME/BLR/2025/09/08/');
      assert.strictEqual(parsed.padding, 4);
    });

    it('should fallback to 4-digit padding when no hash symbols are provided', () => {
      const parsed = service.parsePattern('DOC-DEFAULT-', baseContext, '2025-05-15');
      assert.strictEqual(parsed.prefix, 'DOC-DEFAULT-');
      assert.strictEqual(parsed.padding, 4);
    });

    it('should support customPadding option in getNextNumber', async () => {
      const docNum = await service.getNextNumber(
        'INV-####',
        baseContext,
        { customPadding: 6 }
      );
      assert.strictEqual(docNum, 'INV-000001');
    });
  });

  describe('Counter Increments & Sequence Lifecycle', () => {
    it('should atomically increment counter sequentially', async () => {
      const pattern = 'INV-####';

      const num1 = await service.getNextNumber(pattern, baseContext);
      const num2 = await service.getNextNumber(pattern, baseContext);
      const num3 = await service.getNextNumber(pattern, baseContext);

      assert.strictEqual(num1, 'INV-0001');
      assert.strictEqual(num2, 'INV-0002');
      assert.strictEqual(num3, 'INV-0003');
    });

    it('should support incrementing with custom step', async () => {
      const pattern = 'BATCH-####';

      const num1 = await service.getNextNumber(pattern, baseContext, { step: 5 });
      const num2 = await service.getNextNumber(pattern, baseContext, { step: 10 });

      assert.strictEqual(num1, 'BATCH-0005');
      assert.strictEqual(num2, 'BATCH-0015');
    });

    it('should preview next number without advancing the counter', async () => {
      const pattern = 'ORDER-####';

      // 1. First allocation
      const first = await service.getNextNumber(pattern, baseContext);
      assert.strictEqual(first, 'ORDER-0001');

      // 2. Preview should show what the next number will be
      const preview1 = await service.previewNextNumber(pattern, baseContext);
      assert.strictEqual(preview1, 'ORDER-0002');

      // 3. Second preview should remain the same
      const preview2 = await service.previewNextNumber(pattern, baseContext);
      assert.strictEqual(preview2, 'ORDER-0002');

      // 4. Actual next number consumes 0002
      const second = await service.getNextNumber(pattern, baseContext);
      assert.strictEqual(second, 'ORDER-0002');

      // 5. Next preview should now show 0003
      const preview3 = await service.previewNextNumber(pattern, baseContext);
      assert.strictEqual(preview3, 'ORDER-0003');
    });

    it('should manually set and adjust counter value via setCounter', async () => {
      const pattern = 'MANUAL-####';
      const seriesKey = 'MANUAL-';

      // Advance to 1
      const initial = await service.getNextNumber(pattern, baseContext);
      assert.strictEqual(initial, 'MANUAL-0001');

      // Manually set counter to 500
      await service.setCounter(seriesKey, 500, baseContext);

      // Next generated number should be 501
      const afterJump = await service.getNextNumber(pattern, baseContext);
      assert.strictEqual(afterJump, 'MANUAL-0501');
    });
  });

  describe('Multi-Tenant & Multi-Company Isolation', () => {
    it('should isolate counters across tenants for the same pattern', async () => {
      const pattern = 'INV-####';

      const ctxTenantA: NamingContext = { ...baseContext, tenantId: 'tenant-AAA' };
      const ctxTenantB: NamingContext = { ...baseContext, tenantId: 'tenant-BBB' };

      const a1 = await service.getNextNumber(pattern, ctxTenantA);
      const a2 = await service.getNextNumber(pattern, ctxTenantA);

      const b1 = await service.getNextNumber(pattern, ctxTenantB);

      assert.strictEqual(a1, 'INV-0001');
      assert.strictEqual(a2, 'INV-0002');
      assert.strictEqual(b1, 'INV-0001'); // Tenant B starts fresh at 0001
    });

    it('should isolate counters across companies within the same tenant', async () => {
      const pattern = 'PO-####';

      const ctxCompany1: NamingContext = { ...baseContext, companyId: 'company-01' };
      const ctxCompany2: NamingContext = { ...baseContext, companyId: 'company-02' };

      const c1_1 = await service.getNextNumber(pattern, ctxCompany1);
      const c1_2 = await service.getNextNumber(pattern, ctxCompany1);

      const c2_1 = await service.getNextNumber(pattern, ctxCompany2);

      assert.strictEqual(c1_1, 'PO-0001');
      assert.strictEqual(c1_2, 'PO-0002');
      assert.strictEqual(c2_1, 'PO-0001');
    });
  });

  describe('Doctype Series Registry', () => {
    it('should register and retrieve series for doctypes', () => {
      service.registerSeriesForDoctype('sales_invoice', ['SINV-.YYYY.-.####', 'SINV-RET-.####']);
      const series = service.getSeriesForDoctype('sales_invoice');

      assert.strictEqual(series.length, 2);
      assert.strictEqual(series[0], 'SINV-.YYYY.-.####');
      assert.strictEqual(series[1], 'SINV-RET-.####');
    });

    it('should return empty array for unregistered doctypes', () => {
      const series = service.getSeriesForDoctype('unknown_doctype');
      assert.deepStrictEqual(series, []);
    });
  });
});
