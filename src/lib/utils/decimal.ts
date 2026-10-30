/**
 * Fixed-precision decimal utilities for financial calculations.
 * All monetary values are stored as strings and computed using
 * integer arithmetic to avoid floating-point errors.
 * 
 * Uses 6 decimal places internally (matching NUMERIC(20,6) in PostgreSQL).
 */

const PRECISION = 6;
const SCALE = Math.pow(10, PRECISION);

export class Decimal {
  private readonly value: bigint;

  constructor(value: string | number | bigint | Decimal) {
    if (value instanceof Decimal) {
      this.value = value.value;
    } else if (typeof value === 'bigint') {
      this.value = value * BigInt(SCALE);
    } else {
      let str = String(value).trim();

      // Handle scientific notation for numbers like 1e-4
      if (str.includes('e') || str.includes('E')) {
        const num = Number(str);
        str = num.toFixed(PRECISION);
      }

      const [integerPart = '0', fractionPart = ''] = str.replace(/,/g, '').split('.');
      const paddedFraction = fractionPart.padEnd(PRECISION, '0').slice(0, PRECISION);
      const isNegative = integerPart.startsWith('-');
      const absInteger = integerPart.replace('-', '') || '0';
      const rawBigInt = BigInt(`${absInteger}${paddedFraction}`);
      this.value = isNegative ? -rawBigInt : rawBigInt;
    }
  }

  // Factory methods
  static from(value: string | number | bigint | Decimal): Decimal {
    return new Decimal(value);
  }

  static zero(): Decimal {
    return new Decimal(0);
  }

  static fromCents(cents: bigint): Decimal {
    const d = new Decimal(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d as any).value = cents;
    return d;
  }

  // Arithmetic
  add(other: Decimal | string | number): Decimal {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return Decimal.fromCents(this.value + o.value);
  }

  subtract(other: Decimal | string | number): Decimal {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return Decimal.fromCents(this.value - o.value);
  }

  multiply(other: Decimal | string | number): Decimal {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return Decimal.fromCents((this.value * o.value) / BigInt(SCALE));
  }

  divide(other: Decimal | string | number): Decimal {
    const o = other instanceof Decimal ? other : new Decimal(other);
    if (o.value === 0n) throw new Error('Division by zero');
    return Decimal.fromCents((this.value * BigInt(SCALE)) / o.value);
  }

  // Comparison
  equals(other: Decimal | string | number): boolean {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return this.value === o.value;
  }

  greaterThan(other: Decimal | string | number): boolean {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return this.value > o.value;
  }

  lessThan(other: Decimal | string | number): boolean {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return this.value < o.value;
  }

  greaterThanOrEqual(other: Decimal | string | number): boolean {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return this.value >= o.value;
  }

  lessThanOrEqual(other: Decimal | string | number): boolean {
    const o = other instanceof Decimal ? other : new Decimal(other);
    return this.value <= o.value;
  }

  isZero(): boolean {
    return this.value === 0n;
  }

  isPositive(): boolean {
    return this.value > 0n;
  }

  isNegative(): boolean {
    return this.value < 0n;
  }

  // Utility
  abs(): Decimal {
    return this.isNegative() ? Decimal.fromCents(-this.value) : this;
  }

  negate(): Decimal {
    return Decimal.fromCents(-this.value);
  }

  round(places: number = 2): Decimal {
    if (places >= PRECISION) return this;
    const isNeg = this.value < 0n;
    const absVal = isNeg ? -this.value : this.value;
    const factor = BigInt(Math.pow(10, PRECISION - places));
    const rounded = ((absVal + factor / 2n) / factor) * factor;
    return Decimal.fromCents(isNeg ? -rounded : rounded);
  }

  // Conversion
  toString(places: number = PRECISION): string {
    const isNeg = this.value < 0n;
    const abs = isNeg ? -this.value : this.value;
    const intPart = abs / BigInt(SCALE);
    const fracPart = abs % BigInt(SCALE);
    const fracStr = String(fracPart).padStart(PRECISION, '0').slice(0, places);
    return `${isNeg ? '-' : ''}${intPart}${places > 0 ? '.' + fracStr : ''}`;
  }

  toNumber(): number {
    return Number(this.toString());
  }

  toFixed(places: number = 2): string {
    return this.round(places).toString(places);
  }

  toJSON(): string {
    return this.toString();
  }

  // Display formatting
  format(options?: { locale?: string; currency?: string; places?: number }): string {
    const num = this.toNumber();
    if (options?.currency) {
      return new Intl.NumberFormat(options.locale || 'en-IN', {
        style: 'currency',
        currency: options.currency,
        minimumFractionDigits: options.places ?? 2,
        maximumFractionDigits: options.places ?? 2,
      }).format(num);
    }
    return new Intl.NumberFormat(options?.locale || 'en-IN', {
      minimumFractionDigits: options?.places ?? 2,
      maximumFractionDigits: options?.places ?? 2,
    }).format(num);
  }
}

// Helper functions
export function sum(values: Decimal[]): Decimal {
  return values.reduce((acc, val) => acc.add(val), Decimal.zero());
}

export function min(...values: Decimal[]): Decimal {
  if (values.length === 0) throw new Error('Cannot calculate min of empty array');
  return values.reduce((m, v) => (v.lessThan(m) ? v : m));
}

export function max(...values: Decimal[]): Decimal {
  if (values.length === 0) throw new Error('Cannot calculate max of empty array');
  return values.reduce((m, v) => (v.greaterThan(m) ? v : m));
}

// Tax calculation helpers
export function calculateTax(
  amount: Decimal,
  rate: Decimal,
  inclusive: boolean = false
): { taxAmount: Decimal; baseAmount: Decimal } {
  if (inclusive) {
    // Back-calculate: base = amount / (1 + rate/100)
    const divisor = Decimal.from(100).add(rate);
    const baseAmount = amount.multiply(100).divide(divisor);
    const taxAmount = amount.subtract(baseAmount);
    return { taxAmount: taxAmount.round(2), baseAmount: baseAmount.round(2) };
  } else {
    const taxAmount = amount.multiply(rate).divide(100);
    return { taxAmount: taxAmount.round(2), baseAmount: amount };
  }
}

export function allocateAmount(total: Decimal, ratios: Decimal[]): Decimal[] {
  if (ratios.length === 0) return [];
  const sumRatios = sum(ratios);
  if (sumRatios.isZero()) throw new Error('Sum of ratios cannot be zero');

  const allocated: Decimal[] = [];
  let remaining = total;

  for (let i = 0; i < ratios.length - 1; i++) {
    const share = total.multiply(ratios[i]).divide(sumRatios).round(2);
    allocated.push(share);
    remaining = remaining.subtract(share);
  }

  // Last item gets the remainder to avoid rounding errors
  allocated.push(remaining);
  return allocated;
}
