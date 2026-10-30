/**
 * Unit Tests for Fixed-Precision Decimal Utilities
 * Tests BigInt 6-decimal arithmetic, floating-point error avoidance,
 * GST/VAT tax calculations, penny-exact allocation, and INR formatting.
 */

import { describe, it, assert } from '../../../tests/helpers/test-runner';
import { Decimal, calculateTax, allocateAmount, sum, min, max } from './decimal';

describe('Decimal Fixed-Precision Utility (NUMERIC(20,6))', () => {
  describe('BigInt 6-Decimal Arithmetic', () => {
    it('should accurately perform addition', () => {
      const a = new Decimal('12345.678901');
      const b = new Decimal('54321.123456');
      const result = a.add(b);

      assert.strictEqual(result.toString(), '66666.802357');
      assert.strictEqual(result.toFixed(2), '66666.80');
    });

    it('should handle addition with negative numbers', () => {
      const a = new Decimal('100.500000');
      const b = new Decimal('-25.250000');
      const result = a.add(b);

      assert.strictEqual(result.toString(), '75.250000');
    });

    it('should accurately perform subtraction', () => {
      const a = new Decimal('5000.000000');
      const b = new Decimal('1234.567890');
      const result = a.subtract(b);

      assert.strictEqual(result.toString(), '3765.432110');
      assert.strictEqual(result.toFixed(2), '3765.43');
    });

    it('should produce negative results when subtracting larger values', () => {
      const a = new Decimal('100.000000');
      const b = new Decimal('250.750000');
      const result = a.subtract(b);

      assert.strictEqual(result.toString(), '-150.750000');
      assert.strictEqual(result.isNegative(), true);
    });

    it('should accurately perform multiplication', () => {
      const qty = new Decimal('15.500000');
      const rate = new Decimal('120.250000');
      const total = qty.multiply(rate);

      // 15.5 * 120.25 = 1863.875
      assert.strictEqual(total.toString(), '1863.875000');
      assert.strictEqual(total.toFixed(2), '1863.88');
    });

    it('should accurately perform multiplication with decimal fractions', () => {
      const a = new Decimal('0.000500');
      const b = new Decimal('2000.000000');
      const result = a.multiply(b);

      assert.strictEqual(result.toString(), '1.000000');
      assert.strictEqual(result.toFixed(2), '1.00');
    });

    it('should accurately perform division', () => {
      const total = new Decimal('1000.000000');
      const divisor = new Decimal('8.000000');
      const result = total.divide(divisor);

      assert.strictEqual(result.toString(), '125.000000');
      assert.strictEqual(result.toFixed(2), '125.00');
    });

    it('should handle division with recurring fractions and precision limit', () => {
      const total = new Decimal('10.000000');
      const divisor = new Decimal('3.000000');
      const result = total.divide(divisor);

      // 10 / 3 = 3.333333...
      assert.strictEqual(result.toString(), '3.333333');
      assert.strictEqual(result.toFixed(2), '3.33');
    });

    it('should throw an error on division by zero', () => {
      const a = new Decimal('100.000000');
      assert.throws(() => {
        a.divide(0);
      }, /Division by zero/);

      assert.throws(() => {
        a.divide(Decimal.zero());
      }, /Division by zero/);
    });
  });

  describe('Floating-Point Error Avoidance', () => {
    it('should compute 0.1 + 0.2 = 0.3 exact without IEEE-754 drift', () => {
      // In JavaScript native IEEE-754: 0.1 + 0.2 === 0.30000000000000004
      const jsSum = 0.1 + 0.2;
      assert.notStrictEqual(jsSum, 0.3);

      // With Decimal:
      const d1 = new Decimal('0.1');
      const d2 = new Decimal('0.2');
      const sum = d1.add(d2);

      assert.strictEqual(sum.toString(), '0.300000');
      assert.strictEqual(sum.toFixed(1), '0.3');
      assert.strictEqual(sum.toNumber(), 0.3);
      assert.strictEqual(sum.equals(new Decimal('0.3')), true);
    });

    it('should compute 0.3 - 0.2 = 0.1 exact', () => {
      const d3 = new Decimal('0.3');
      const d2 = new Decimal('0.2');
      const diff = d3.subtract(d2);

      assert.strictEqual(diff.toString(), '0.100000');
      assert.strictEqual(diff.toNumber(), 0.1);
    });

    it('should avoid drift in repeated operations and chains', () => {
      let current = Decimal.zero();
      for (let i = 0; i < 10; i++) {
        current = current.add('0.1');
      }

      // 10 * 0.1 must equal exactly 1.0
      assert.strictEqual(current.toString(), '1.000000');
      assert.strictEqual(current.equals(new Decimal('1.0')), true);
    });

    it('should preserve cents exactness for financial arithmetic', () => {
      // 19.99 * 3 = 59.97
      const price = new Decimal('19.99');
      const total = price.multiply(3);

      assert.strictEqual(total.toFixed(2), '59.97');
      assert.strictEqual(total.toString(), '59.970000');
    });
  });

  describe('Tax Calculation (calculateTax)', () => {
    it('should calculate exclusive tax accurately (e.g. 18% GST on ₹1000)', () => {
      const base = new Decimal('1000.00');
      const rate = new Decimal('18.00');

      const { taxAmount, baseAmount } = calculateTax(base, rate, false);

      assert.strictEqual(baseAmount.toFixed(2), '1000.00');
      assert.strictEqual(taxAmount.toFixed(2), '180.00');
      assert.strictEqual(baseAmount.add(taxAmount).toFixed(2), '1180.00');
    });

    it('should calculate inclusive tax accurately (e.g. 18% GST included in ₹1180)', () => {
      const total = new Decimal('1180.00');
      const rate = new Decimal('18.00');

      const { taxAmount, baseAmount } = calculateTax(total, rate, true);

      // Base = 1180 / 1.18 = 1000.00
      assert.strictEqual(baseAmount.toFixed(2), '1000.00');
      // Tax = 1180 - 1000 = 180.00
      assert.strictEqual(taxAmount.toFixed(2), '180.00');
      assert.strictEqual(baseAmount.add(taxAmount).toFixed(2), '1180.00');
    });

    it('should handle fractional GST tax rates (5%, 12%, 28%)', () => {
      // 5% inclusive on ₹105
      const res5 = calculateTax(new Decimal('105.00'), new Decimal('5.00'), true);
      assert.strictEqual(res5.baseAmount.toFixed(2), '100.00');
      assert.strictEqual(res5.taxAmount.toFixed(2), '5.00');

      // 12% exclusive on ₹250
      const res12 = calculateTax(new Decimal('250.00'), new Decimal('12.00'), false);
      assert.strictEqual(res12.baseAmount.toFixed(2), '250.00');
      assert.strictEqual(res12.taxAmount.toFixed(2), '30.00');

      // 28% exclusive on ₹1500
      const res28 = calculateTax(new Decimal('1500.00'), new Decimal('28.00'), false);
      assert.strictEqual(res28.taxAmount.toFixed(2), '420.00');
    });

    it('should handle zero tax rate', () => {
      const amount = new Decimal('500.00');
      const zeroRate = Decimal.zero();

      const exclusive = calculateTax(amount, zeroRate, false);
      assert.strictEqual(exclusive.taxAmount.toFixed(2), '0.00');
      assert.strictEqual(exclusive.baseAmount.toFixed(2), '500.00');

      const inclusive = calculateTax(amount, zeroRate, true);
      assert.strictEqual(inclusive.taxAmount.toFixed(2), '0.00');
      assert.strictEqual(inclusive.baseAmount.toFixed(2), '500.00');
    });
  });

  describe('Penny-Exact Remainder Allocation (allocateAmount)', () => {
    it('should allocate ₹100 equally across 3 parts without losing pennies', () => {
      const total = new Decimal('100.00');
      const ratios = [new Decimal(1), new Decimal(1), new Decimal(1)];

      const parts = allocateAmount(total, ratios);

      assert.strictEqual(parts.length, 3);
      assert.strictEqual(parts[0].toFixed(2), '33.33');
      assert.strictEqual(parts[1].toFixed(2), '33.33');
      // The last part absorbs the rounding remainder (100 - 66.66 = 33.34)
      assert.strictEqual(parts[2].toFixed(2), '33.34');

      // Crucial: sum of allocated parts MUST equal original total exactly
      const totalSum = sum(parts);
      assert.strictEqual(totalSum.toFixed(2), '100.00');
    });

    it('should allocate proportional amounts according to weight ratios', () => {
      const total = new Decimal('1000.00');
      const ratios = [new Decimal(2), new Decimal(3), new Decimal(5)];

      const parts = allocateAmount(total, ratios);

      assert.strictEqual(parts[0].toFixed(2), '200.00');
      assert.strictEqual(parts[1].toFixed(2), '300.00');
      assert.strictEqual(parts[2].toFixed(2), '500.00');
      assert.strictEqual(sum(parts).toFixed(2), '1000.00');
    });

    it('should handle allocations with awkward cents remainders', () => {
      const total = new Decimal('10.00');
      const ratios = [new Decimal(1), new Decimal(1), new Decimal(1), new Decimal(1), new Decimal(1), new Decimal(1), new Decimal(1)]; // 7 parts

      const parts = allocateAmount(total, ratios);
      assert.strictEqual(parts.length, 7);
      assert.strictEqual(sum(parts).toFixed(2), '10.00');
    });

    it('should throw when ratio sum is zero', () => {
      assert.throws(() => {
        allocateAmount(new Decimal('100.00'), [Decimal.zero(), Decimal.zero()]);
      }, /Sum of ratios cannot be zero/);
    });

    it('should return empty array when no ratios provided', () => {
      const res = allocateAmount(new Decimal('100.00'), []);
      assert.deepStrictEqual(res, []);
    });
  });

  describe('INR Currency Formatting', () => {
    it('should format amounts in Indian Lakh/Crore grouping with ₹ symbol', () => {
      const amount = new Decimal('123456.78');
      const formatted = amount.format({ currency: 'INR' });

      // In en-IN locale: 1,23,456.78 with currency symbol
      assert.ok(formatted.includes('₹'), 'Formatted string should contain ₹ symbol');
      assert.ok(formatted.includes('1,23,456.78'), 'Should follow Indian numbering system');
    });

    it('should format large amounts in Crores accurately', () => {
      const amount = new Decimal('10000000.00'); // 1 Crore
      const formatted = amount.format({ currency: 'INR' });

      assert.ok(formatted.includes('1,00,00,000.00'));
    });

    it('should format zero and negative INR amounts properly', () => {
      const zero = Decimal.zero();
      const zeroFormatted = zero.format({ currency: 'INR' });
      assert.ok(zeroFormatted.includes('0.00'));

      const negative = new Decimal('-500.50');
      const negFormatted = negative.format({ currency: 'INR' });
      assert.ok(negFormatted.includes('500.50'));
      assert.ok(negFormatted.includes('-'));
    });

    it('should support custom decimal places and non-currency number formatting', () => {
      const num = new Decimal('1234.5678');
      const standardFormatted = num.format({ places: 3 });
      assert.strictEqual(standardFormatted, '1,234.568');
    });
  });

  describe('Comparison & Utility Functions', () => {
    it('should compare equality, greater, and lesser values correctly', () => {
      const a = new Decimal('50.00');
      const b = new Decimal('50.000000');
      const c = new Decimal('75.00');

      assert.strictEqual(a.equals(b), true);
      assert.strictEqual(a.equals(c), false);
      assert.strictEqual(c.greaterThan(a), true);
      assert.strictEqual(a.lessThan(c), true);
      assert.strictEqual(a.greaterThanOrEqual(b), true);
      assert.strictEqual(a.lessThanOrEqual(b), true);
    });

    it('should calculate min and max across Decimal collections', () => {
      const d1 = new Decimal('10.50');
      const d2 = new Decimal('99.99');
      const d3 = new Decimal('5.25');

      assert.strictEqual(min(d1, d2, d3).toString(), '5.250000');
      assert.strictEqual(max(d1, d2, d3).toString(), '99.990000');
    });

    it('should calculate sum across Decimal arrays', () => {
      const items = [new Decimal('10.25'), new Decimal('20.50'), new Decimal('30.25')];
      assert.strictEqual(sum(items).toString(), '61.000000');
    });

    it('should handle abs and negate operations', () => {
      const pos = new Decimal('42.50');
      const neg = pos.negate();
      assert.strictEqual(neg.toString(), '-42.500000');
      assert.strictEqual(neg.abs().toString(), '42.500000');
    });
  });
});
