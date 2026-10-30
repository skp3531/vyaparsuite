/**
 * VyaparSuite Naming Series Service
 * 
 * Provides thread-safe, transactional document numbering with support for:
 * - Dynamic pattern tokens (.YYYY., .YY., .MM., .DD., .FY., {COMPANY}, {BRANCH}, .####.)
 * - Fiscal-year-aware numbering with automatic year-boundary resets
 * - Multi-tenant and company-isolated counters
 * - Atomic PostgreSQL upserts with row-level locking for concurrency safety
 */

import type { IDatabaseAdapter } from '@/lib/db/adapter';
import { BusinessRuleError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export interface NamingContext {
  tenantId: string;
  companyId: string;
  branchId?: string;
  companyCode?: string;
  branchCode?: string;
  postingDate?: string | Date;
}

export interface NamingOptions {
  step?: number;
  customPadding?: number;
}

export interface FinancialYearInfo {
  startYear: number;
  endYear: number;
  shortCode: string; // e.g. '24-25'
  fullCode: string;  // e.g. '2024-2025'
}

export class NamingSeriesService {
  private doctypeSeriesMap: Map<string, string[]> = new Map();

  constructor(private db: IDatabaseAdapter) {}

  /**
   * Register default series patterns for a doctype.
   */
  registerSeriesForDoctype(doctype: string, series: string[]): void {
    this.doctypeSeriesMap.set(doctype, series);
  }

  /**
   * Get configured series for a doctype.
   */
  getSeriesForDoctype(doctype: string): string[] {
    return this.doctypeSeriesMap.get(doctype) || [];
  }

  /**
   * Compute Indian financial year (April 1 to March 31).
   */
  getFinancialYear(inputDate?: string | Date): FinancialYearInfo {
    const date = inputDate ? new Date(inputDate) : new Date();
    const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
    const fullYear = date.getFullYear();

    let startYear: number;
    let endYear: number;

    if (month >= 3) {
      // April to December
      startYear = fullYear;
      endYear = fullYear + 1;
    } else {
      // January to March
      startYear = fullYear - 1;
      endYear = fullYear;
    }

    const shortStart = String(startYear).slice(-2);
    const shortEnd = String(endYear).slice(-2);

    return {
      startYear,
      endYear,
      shortCode: `${shortStart}-${shortEnd}`,
      fullCode: `${startYear}-${endYear}`,
    };
  }

  /**
   * Parse pattern and extract prefix, padding length, and suffix.
   */
  parsePattern(
    pattern: string,
    context: NamingContext,
    dateInput?: string | Date
  ): { prefix: string; padding: number; suffix: string } {
    const date = dateInput ? new Date(dateInput) : new Date();
    const fy = this.getFinancialYear(date);

    const year4 = String(date.getFullYear());
    const year2 = year4.slice(-2);
    const month2 = String(date.getMonth() + 1).padStart(2, '0');
    const day2 = String(date.getDate()).padStart(2, '0');
    const compCode = (context.companyCode || context.companyId.slice(0, 4)).toUpperCase();
    const branchCode = (context.branchCode || context.branchId?.slice(0, 4) || '').toUpperCase();

    // Replace token placeholders (both .TOKEN. and {TOKEN} syntaxes)
    let resolved = pattern
      .replace(/\.YYYY\./g, `.${year4}.`)
      .replace(/\{YYYY\}/g, year4)
      .replace(/\.YY\./g, `.${year2}.`)
      .replace(/\{YY\}/g, year2)
      .replace(/\.MM\./g, `.${month2}.`)
      .replace(/\{MM\}/g, month2)
      .replace(/\.DD\./g, `.${day2}.`)
      .replace(/\{DD\}/g, day2)
      .replace(/\.FY\./g, `.${fy.shortCode}.`)
      .replace(/\{FY\}/g, fy.shortCode)
      .replace(/\{FY_LONG\}/g, fy.fullCode)
      .replace(/\{COMPANY\}/g, compCode)
      .replace(/\{BRANCH\}/g, branchCode);

    // Clean leading/trailing dots in segments if used with .TOKEN.
    resolved = resolved.replace(/\.\./g, '.');

    // Find hash pattern for numbering: e.g. .####. or {####} or ####
    const hashMatch = resolved.match(/(?:\.|\{)?(#+)(?:\.|\})?/);
    if (!hashMatch) {
      // Default to 4 digits at end if no # specified
      return {
        prefix: resolved.endsWith('-') || resolved.endsWith('/') ? resolved : `${resolved}-`,
        padding: 4,
        suffix: '',
      };
    }

    const hashes = hashMatch[1];
    const padding = hashes.length;
    const matchIndex = hashMatch.index!;
    const matchLength = hashMatch[0].length;

    const prefix = resolved.slice(0, matchIndex);
    const suffix = resolved.slice(matchIndex + matchLength);

    return {
      prefix,
      padding,
      suffix,
    };
  }

  /**
   * Generate next thread-safe document number.
   * Uses atomic PostgreSQL UPSERT with row-locking to prevent duplicate document numbers.
   */
  async getNextNumber(
    seriesPattern: string,
    context: NamingContext,
    options?: NamingOptions
  ): Promise<string> {
    const date = context.postingDate || new Date();
    const { prefix, padding, suffix } = this.parsePattern(seriesPattern, context, date);
    const step = options?.step || 1;
    const finalPadding = options?.customPadding || padding;

    const seriesKey = `${prefix}`;

    // Atomically increment counter in naming_series table using raw SQL
    // This uses PostgreSQL ON CONFLICT DO UPDATE RETURNING which acquires an exclusive row lock
    const sql = `
      INSERT INTO naming_series (
        tenant_id,
        company_id,
        series_key,
        current_value,
        prefix,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (tenant_id, company_id, series_key)
      DO UPDATE SET
        current_value = naming_series.current_value + $6,
        updated_at = NOW()
      RETURNING current_value;
    `;

    try {
      const result = await this.db.raw<{ current_value: number | string }>(sql, [
        context.tenantId,
        context.companyId,
        seriesKey,
        step,
        prefix,
        step,
      ]);

      if (!result.data || result.data.length === 0) {
        throw new BusinessRuleError(`Failed to allocate document number for series key: ${seriesKey}`);
      }

      const counterVal = Number(result.data[0].current_value);
      const paddedNumber = String(counterVal).padStart(finalPadding, '0');

      const fullDocumentNumber = `${prefix}${paddedNumber}${suffix}`;

      logger.debug('Generated document number', {
        seriesPattern,
        seriesKey,
        currentValue: counterVal,
        documentNumber: fullDocumentNumber,
        tenantId: context.tenantId,
        companyId: context.companyId,
      });

      return fullDocumentNumber;
    } catch (error) {
      logger.error('Error generating naming series number', error as Error, {
        seriesPattern,
        seriesKey,
        tenantId: context.tenantId,
      });
      throw error;
    }
  }

  /**
   * Preview the next document number without incrementing the counter.
   */
  async previewNextNumber(
    seriesPattern: string,
    context: NamingContext
  ): Promise<string> {
    const date = context.postingDate || new Date();
    const { prefix, padding, suffix } = this.parsePattern(seriesPattern, context, date);
    const seriesKey = `${prefix}`;

    const sql = `
      SELECT current_value
      FROM naming_series
      WHERE tenant_id = $1 AND company_id = $2 AND series_key = $3
      LIMIT 1;
    `;

    const result = await this.db.raw<{ current_value: number | string }>(sql, [
      context.tenantId,
      context.companyId,
      seriesKey,
    ]);

    const currentVal = result.data && result.data.length > 0 ? Number(result.data[0].current_value) : 0;
    const nextVal = currentVal + 1;
    const paddedNumber = String(nextVal).padStart(padding, '0');

    return `${prefix}${paddedNumber}${suffix}`;
  }

  /**
   * Manually set or adjust the counter for a series key.
   */
  async setCounter(
    seriesKey: string,
    value: number,
    context: NamingContext
  ): Promise<void> {
    const sql = `
      INSERT INTO naming_series (
        tenant_id,
        company_id,
        series_key,
        current_value,
        prefix,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      ON CONFLICT (tenant_id, company_id, series_key)
      DO UPDATE SET
        current_value = $4,
        updated_at = NOW();
    `;

    await this.db.raw(sql, [
      context.tenantId,
      context.companyId,
      seriesKey,
      value,
      seriesKey,
    ]);

    logger.info('Naming series counter manually updated', {
      seriesKey,
      newValue: value,
      tenantId: context.tenantId,
      companyId: context.companyId,
    });
  }
}
