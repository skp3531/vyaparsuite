/**
 * VyaparSuite Tax Engine & Statutory Determination Service
 * 
 * Provides automated statutory tax calculations and jurisdiction determination:
 * - Real-time determination of Intra-State (CGST + SGST) vs Inter-State (IGST) vs Export/SEZ
 * - Indian GSTIN state code parsing (first 2 digits)
 * - Fixed-precision multi-item tax schedule calculation using Decimal arithmetic
 * - Support for tax-inclusive and tax-exclusive pricing models
 * - Tax templates and component ledger detail management
 */

import type { IDatabaseAdapter, QueryFilter, QuerySort } from '@/lib/db/adapter';
import { createSupabaseAdapter } from '@/lib/db/supabase-adapter';
import { createServerClient } from '@/lib/db/client';
import { Decimal, calculateTax } from '@/lib/utils/decimal';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export interface ServiceContext {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
}

export type TaxType = 'Sales' | 'Purchase';
export type TradeJurisdiction = 'Intra-State' | 'Inter-State' | 'Export' | 'SEZ Zero-Rated';

export interface TaxTemplateRecord {
  id: string;
  tenant_id: string;
  company_id: string;
  title: string;
  tax_type: TaxType;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TaxTemplateDetailRecord {
  id: string;
  tenant_id: string;
  tax_template_id: string;
  account_id: string;
  rate_percent: string | number;
  description: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyRecord {
  id: string;
  company_name: string;
  gstin?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface DetermineTaxTemplateParams {
  tenantId: string;
  companyId: string;
  taxType: TaxType;
  partyGstin?: string | null;
  partyState?: string | null;
  partyCountry?: string | null;
  partyGstCategory?: string | null;
  companyGstin?: string | null;
  companyState?: string | null;
}

export interface TaxTemplateDeterminationResult {
  jurisdiction: TradeJurisdiction;
  isInterState: boolean;
  companyStateCode: string;
  partyStateCode: string;
  taxTemplate: TaxTemplateRecord | null;
  details: TaxTemplateDetailRecord[];
  summary: string;
}

export interface LineItemTaxInput {
  itemId?: string;
  itemCode?: string;
  description?: string;
  quantity: Decimal | string | number;
  rate: Decimal | string | number;
  amount?: Decimal | string | number;
  taxInclusive?: boolean;
  taxRatePercent?: Decimal | string | number; // override if applicable
}

export interface LineItemTaxResult {
  itemCode?: string;
  quantity: Decimal;
  rate: Decimal;
  netBaseAmount: Decimal;
  taxAmount: Decimal;
  grossAmount: Decimal;
  effectiveTaxRate: Decimal;
}

export interface TaxComponentBreakdown {
  accountId: string;
  description: string;
  ratePercent: Decimal;
  taxAmount: Decimal;
}

export interface TaxCalculationResult {
  netTotal: Decimal;
  totalTax: Decimal;
  grandTotal: Decimal;
  roundingAdjustment: Decimal;
  roundedTotal: Decimal;
  lines: LineItemTaxResult[];
  taxComponents: TaxComponentBreakdown[];
}

export interface TaxCalculationParams {
  items: LineItemTaxInput[];
  taxTemplateId?: string;
  taxDetails?: Array<{
    accountId: string;
    ratePercent: Decimal | string | number;
    description: string;
  }>;
  tenantId?: string;
  companyId?: string;
}

// 2-digit Indian GST State Codes mapping
export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
};

export class TaxService {
  private db: IDatabaseAdapter;

  constructor(db?: IDatabaseAdapter) {
    this.db = db ?? createSupabaseAdapter(createServerClient());
  }

  // =========================================================================
  // STATUTORY TAX DETERMINATION (INTRA-STATE VS INTER-STATE)
  // =========================================================================

  /**
   * Automatically determines whether a transaction requires Intra-State (CGST + SGST),
   * Inter-State (IGST), or Export Zero-Rated tax treatment.
   */
  async determineTaxTemplate(
    params: DetermineTaxTemplateParams
  ): Promise<TaxTemplateDeterminationResult> {
    logger.debug('Determining statutory tax template', {
      companyId: params.companyId,
      taxType: params.taxType,
      partyGstin: params.partyGstin,
    });

    // 1. Resolve Company GSTIN & State
    let companyGstin = params.companyGstin?.trim().toUpperCase() || '';
    let companyStateCode = '';

    if (!companyGstin) {
      const compRes = await this.db.findById<CompanyRecord>('company', params.companyId, {
        tenantId: params.tenantId,
      });
      if (compRes.data?.gstin) {
        companyGstin = compRes.data.gstin.trim().toUpperCase();
      }
    }

    if (companyGstin && companyGstin.length >= 2) {
      companyStateCode = companyGstin.substring(0, 2);
    } else if (params.companyState) {
      companyStateCode = this.lookupStateCode(params.companyState);
    }

    // 2. Resolve Party State Code
    const partyGstin = params.partyGstin?.trim().toUpperCase() || '';
    let partyStateCode = '';

    if (partyGstin && partyGstin.length >= 2) {
      partyStateCode = partyGstin.substring(0, 2);
    } else if (params.partyState) {
      partyStateCode = this.lookupStateCode(params.partyState);
    }

    // 3. Determine trade classification
    let jurisdiction: TradeJurisdiction = 'Intra-State';
    let isInterState = false;
    let summary = '';

    const partyCountry = (params.partyCountry || 'India').trim().toLowerCase();
    const isOverseas = partyCountry !== 'india' && partyCountry !== 'in';
    const isSez =
      params.partyGstCategory === 'SEZ' ||
      params.partyGstCategory === 'Overseas' ||
      params.partyGstCategory === 'Deemed Export';

    if (isOverseas) {
      jurisdiction = 'Export';
      isInterState = true;
      summary = `Export transaction outside India to ${params.partyCountry}. Zero-rated GST.`;
    } else if (isSez) {
      jurisdiction = 'SEZ Zero-Rated';
      isInterState = true;
      summary = `Special Economic Zone (SEZ) supply treated as inter-state zero-rated under IGST Act Sec 16.`;
    } else if (
      companyStateCode &&
      partyStateCode &&
      companyStateCode !== partyStateCode
    ) {
      jurisdiction = 'Inter-State';
      isInterState = true;
      const compStateName = GST_STATE_CODES[companyStateCode] || companyStateCode;
      const partyStateName = GST_STATE_CODES[partyStateCode] || partyStateCode;
      summary = `Inter-State supply: Supplier in ${compStateName} (${companyStateCode}), Buyer in ${partyStateName} (${partyStateCode}). Applicable statutory levy: IGST.`;
    } else {
      jurisdiction = 'Intra-State';
      isInterState = false;
      const stateName = GST_STATE_CODES[companyStateCode] || companyStateCode || 'State';
      summary = `Intra-State supply within ${stateName}. Applicable statutory levies: CGST + SGST (split 50/50).`;
    }

    // 4. Find matching tax template in database for company & taxType
    const keyword = isInterState ? 'inter' : 'intra';
    const templatesRes = await this.db.findMany<TaxTemplateRecord>('tax_template', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: params.tenantId },
        { column: 'company_id', operator: 'eq', value: params.companyId },
        { column: 'tax_type', operator: 'eq', value: params.taxType },
        { column: 'is_active', operator: 'eq', value: true },
      ],
      sort: [{ column: 'is_default', direction: 'desc' }],
    });

    const templates = templatesRes.data || [];
    let matchedTemplate: TaxTemplateRecord | null = null;

    // Pick template matching keyword in title, or default
    for (const t of templates) {
      if (t.title.toLowerCase().includes(keyword)) {
        matchedTemplate = t;
        break;
      }
    }
    if (!matchedTemplate && templates.length > 0) {
      matchedTemplate = templates[0];
    }

    // 5. Fetch details if template found
    let details: TaxTemplateDetailRecord[] = [];
    if (matchedTemplate) {
      const detailsRes = await this.db.findMany<TaxTemplateDetailRecord>(
        'tax_template_detail',
        {
          filters: [
            { column: 'tenant_id', operator: 'eq', value: params.tenantId },
            { column: 'tax_template_id', operator: 'eq', value: matchedTemplate.id },
          ],
        }
      );
      details = detailsRes.data || [];
    }

    return {
      jurisdiction,
      isInterState,
      companyStateCode,
      partyStateCode,
      taxTemplate: matchedTemplate,
      details,
      summary,
    };
  }

  // =========================================================================
  // TAX SCHEDULE CALCULATION
  // =========================================================================

  /**
   * Computes multi-item invoice taxes, component breakdowns, and rounding adjustments
   * with zero floating-point loss using Decimal arithmetic.
   */
  async calculateTaxes(params: TaxCalculationParams): Promise<TaxCalculationResult> {
    let taxDetails = params.taxDetails || [];

    // If templateId provided without details, fetch from DB
    if ((!taxDetails || taxDetails.length === 0) && params.taxTemplateId) {
      const dbDetailsRes = await this.db.findMany<TaxTemplateDetailRecord>(
        'tax_template_detail',
        {
          filters: [
            { column: 'tax_template_id', operator: 'eq', value: params.taxTemplateId },
          ],
        }
      );
      taxDetails = (dbDetailsRes.data || []).map((d) => ({
        accountId: d.account_id,
        ratePercent: d.rate_percent,
        description: d.description,
      }));
    }

    // Sum total tax template rate
    const totalTemplateRate = taxDetails.reduce(
      (acc, d) => acc.add(Decimal.from(d.ratePercent)),
      Decimal.zero()
    );

    let netTotal = Decimal.zero();
    let totalTax = Decimal.zero();
    const lineResults: LineItemTaxResult[] = [];

    // Track per-account tax amounts
    const accountTaxMap = new Map<
      string,
      { description: string; ratePercent: Decimal; taxAmount: Decimal }
    >();

    for (const d of taxDetails) {
      accountTaxMap.set(d.accountId, {
        description: d.description,
        ratePercent: Decimal.from(d.ratePercent),
        taxAmount: Decimal.zero(),
      });
    }

    // Process each line item
    for (const item of params.items) {
      const qty = Decimal.from(item.quantity);
      const rate = Decimal.from(item.rate);
      const rawAmount = item.amount ? Decimal.from(item.amount) : qty.multiply(rate);
      const isInclusive = item.taxInclusive ?? false;

      // Line tax rate: either item-specific override or template rate
      const effectiveRate = item.taxRatePercent !== undefined
        ? Decimal.from(item.taxRatePercent)
        : totalTemplateRate;

      const { baseAmount, taxAmount } = calculateTax(rawAmount, effectiveRate, isInclusive);
      const grossAmount = baseAmount.add(taxAmount);

      netTotal = netTotal.add(baseAmount);
      totalTax = totalTax.add(taxAmount);

      lineResults.push({
        itemCode: item.itemCode,
        quantity: qty,
        rate,
        netBaseAmount: baseAmount.round(2),
        taxAmount: taxAmount.round(2),
        grossAmount: grossAmount.round(2),
        effectiveTaxRate: effectiveRate,
      });

      // Distribute line tax across tax template component accounts proportionally
      if (!totalTemplateRate.isZero() && taxDetails.length > 0) {
        for (const d of taxDetails) {
          const compRate = Decimal.from(d.ratePercent);
          // Component share = taxAmount * (compRate / totalTemplateRate)
          const compTax = taxAmount.multiply(compRate).divide(totalTemplateRate).round(2);
          const current = accountTaxMap.get(d.accountId)!;
          current.taxAmount = current.taxAmount.add(compTax);
        }
      }
    }

    const unroundedGrandTotal = netTotal.add(totalTax);
    // Round to nearest integer (statutory Indian GST Rule 26 for final tax invoice amount)
    const roundedTotal = unroundedGrandTotal.round(0);
    const roundingAdjustment = roundedTotal.subtract(unroundedGrandTotal).round(2);

    const taxComponents: TaxComponentBreakdown[] = Array.from(accountTaxMap.entries()).map(
      ([accountId, info]) => ({
        accountId,
        description: info.description,
        ratePercent: info.ratePercent,
        taxAmount: info.taxAmount.round(2),
      })
    );

    return {
      netTotal: netTotal.round(2),
      totalTax: totalTax.round(2),
      grandTotal: unroundedGrandTotal.round(2),
      roundingAdjustment,
      roundedTotal,
      lines: lineResults,
      taxComponents,
    };
  }

  // =========================================================================
  // TAX TEMPLATE CRUD
  // =========================================================================

  /**
   * Creates a new Tax Template with component details
   */
  async createTaxTemplate(
    input: {
      companyId: string;
      title: string;
      taxType: TaxType;
      isDefault?: boolean;
      details: Array<{
        accountId: string;
        ratePercent: Decimal | string | number;
        description: string;
      }>;
    },
    context: ServiceContext
  ): Promise<TaxTemplateRecord> {
    if (!input.title || input.title.trim().length === 0) {
      throw new ValidationError('Tax template title is required');
    }
    if (!input.details || input.details.length === 0) {
      throw new ValidationError('At least one tax component detail is required');
    }

    // Check unique title per company
    const dupRes = await this.db.findOne<TaxTemplateRecord>('tax_template', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'company_id', operator: 'eq', value: input.companyId },
      { column: 'title', operator: 'eq', value: input.title.trim() },
    ]);
    if (dupRes.data) {
      throw new ConflictError(
        `Tax template with title '${input.title}' already exists for this company`
      );
    }

    // Insert master template
    const templatePayload: Record<string, unknown> = {
      tenant_id: context.tenantId,
      company_id: input.companyId,
      title: input.title.trim(),
      tax_type: input.taxType,
      is_default: input.isDefault ?? false,
      is_active: true,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const templateRes = await this.db.insert<TaxTemplateRecord>(
      'tax_template',
      templatePayload
    );
    if (templateRes.error || !templateRes.data) {
      throw new BusinessRuleError(
        `Failed to create tax template: ${templateRes.error?.message}`
      );
    }
    const template = templateRes.data;

    // Insert child detail rows
    const detailsToInsert = input.details.map((d) => ({
      tenant_id: context.tenantId,
      tax_template_id: template.id,
      account_id: d.accountId,
      rate_percent: Decimal.from(d.ratePercent).toFixed(6),
      description: d.description,
      created_by: context.userId,
      updated_by: context.userId,
    }));

    const detailRes = await this.db.insertMany<TaxTemplateDetailRecord>(
      'tax_template_detail',
      detailsToInsert
    );
    if (detailRes.error) {
      throw new BusinessRuleError(
        `Failed to insert tax template details: ${detailRes.error.message}`
      );
    }

    logger.info('Tax template created successfully', {
      templateId: template.id,
      title: template.title,
      companyId: input.companyId,
    });

    return template;
  }

  /**
   * Retrieves a tax template along with all its child accounts and rates
   */
  async getTaxTemplateWithDetails(
    id: string,
    tenantId: string
  ): Promise<{ template: TaxTemplateRecord; details: TaxTemplateDetailRecord[] }> {
    const templateRes = await this.db.findById<TaxTemplateRecord>('tax_template', id, {
      tenantId,
    });
    if (templateRes.error || !templateRes.data) {
      throw new NotFoundError('TaxTemplate', id);
    }

    const detailsRes = await this.db.findMany<TaxTemplateDetailRecord>(
      'tax_template_detail',
      {
        filters: [
          { column: 'tenant_id', operator: 'eq', value: tenantId },
          { column: 'tax_template_id', operator: 'eq', value: id },
        ],
      }
    );

    return {
      template: templateRes.data,
      details: detailsRes.data || [],
    };
  }

  /**
   * Lists active tax templates for a company
   */
  async listTaxTemplates(
    tenantId: string,
    companyId: string,
    taxType?: TaxType
  ): Promise<TaxTemplateRecord[]> {
    const filters: QueryFilter[] = [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
      { column: 'company_id', operator: 'eq', value: companyId },
      { column: 'is_active', operator: 'eq', value: true },
    ];
    if (taxType) {
      filters.push({ column: 'tax_type', operator: 'eq', value: taxType });
    }

    const res = await this.db.findMany<TaxTemplateRecord>('tax_template', {
      filters,
      sort: [{ column: 'title', direction: 'asc' }],
    });

    if (res.error) {
      throw new BusinessRuleError(`Failed to list tax templates: ${res.error.message}`);
    }

    return res.data || [];
  }

  // --- Helper Methods ---

  private lookupStateCode(stateNameOrCode: string): string {
    const trimmed = stateNameOrCode.trim();
    if (GST_STATE_CODES[trimmed]) return trimmed;

    const lower = trimmed.toLowerCase();
    for (const [code, name] of Object.entries(GST_STATE_CODES)) {
      if (name.toLowerCase() === lower || name.toLowerCase().includes(lower)) {
        return code;
      }
    }
    return '';
  }
}
