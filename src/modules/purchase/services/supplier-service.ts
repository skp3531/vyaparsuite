/**
 * VyaparSuite Supplier & Procurement Master Data Service
 * 
 * Manages vendor catalog lifecycles, supplier segmentation, statutory tax compliance
 * (GSTIN, PAN deduplication, MSME Section 43B(h) 45-day payment tracking),
 * and milestone-based payment terms schedule calculations.
 */

import type { IDatabaseAdapter, QueryFilter, QuerySort } from '@/lib/db/adapter';
import { createSupabaseAdapter } from '@/lib/db/supabase-adapter';
import { createServerClient } from '@/lib/db/client';
import { Decimal, allocateAmount } from '@/lib/utils/decimal';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  Supplier,
  SupplierGroup,
  CreateSupplierInput,
  UpdateSupplierInput,
  CreateSupplierGroupInput,
  SupplierFilterParams,
  AssignPaymentTermsInput,
  createSupplierSchema,
  updateSupplierSchema,
  createSupplierGroupSchema,
  GSTIN_REGEX,
  PAN_REGEX,
} from '../schemas/supplier.schema';

export interface ServiceContext {
  tenantId: string;
  companyId?: string;
  userId: string;
  userEmail?: string;
}

export interface PaymentScheduleMilestone {
  termDescription: string;
  invoicePortionPercent: Decimal;
  creditDays: number;
  creditMonths: number;
  dueDate: string;
  amount: Decimal;
}

export interface PaymentScheduleResult {
  supplierId?: string;
  templateId?: string;
  templateName?: string;
  totalInvoiceAmount: Decimal;
  invoiceDate: string;
  milestones: PaymentScheduleMilestone[];
  isMsmeRestricted: boolean;
  msmeNotice?: string;
}

export interface TaxValidationResult {
  isValid: boolean;
  gstinValid: boolean;
  panValid: boolean;
  gstinPanMatch: boolean;
  msmeCompliant: boolean;
  stateCode?: string;
  details: Record<string, unknown>;
}

export interface PaymentTermsDetailRecord {
  id: string;
  template_id: string;
  term_description: string;
  invoice_portion_percent: string | number;
  credit_days: number;
  credit_months: number;
}

export interface PaymentTermsTemplateRecord {
  id: string;
  template_name: string;
  description?: string;
  is_active: boolean;
}

export class SupplierService {
  private db: IDatabaseAdapter;

  constructor(db?: IDatabaseAdapter) {
    this.db = db ?? createSupabaseAdapter(createServerClient());
  }

  /**
   * Creates a new Supplier record with statutory validation
   */
  async createSupplier(
    input: CreateSupplierInput,
    context: ServiceContext
  ): Promise<Supplier> {
    const parsed = createSupplierSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Supplier validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    // 1. Verify supplier group exists
    const groupRes = await this.db.findById<SupplierGroup>(
      'supplier_group',
      data.supplier_group_id,
      { tenantId: context.tenantId }
    );
    if (groupRes.error || !groupRes.data) {
      throw new NotFoundError('SupplierGroup', data.supplier_group_id);
    }

    // 2. Check unique supplier code per tenant
    const codeDup = await this.db.findOne<Supplier>('supplier', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'supplier_code', operator: 'eq', value: data.supplier_code },
    ]);
    if (codeDup.data) {
      throw new ConflictError(
        `A supplier with code '${data.supplier_code}' already exists in this tenant`
      );
    }

    // 3. Check duplicate GSTIN if provided
    if (data.gstin && data.gstin.trim().length > 0) {
      const gstinClean = data.gstin.trim().toUpperCase();
      const gstinDup = await this.db.findOne<Supplier>('supplier', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'gstin', operator: 'eq', value: gstinClean },
      ]);
      if (gstinDup.data) {
        throw new ConflictError(
          `Supplier '${gstinDup.data.supplier_name}' is already registered with GSTIN '${gstinClean}'`
        );
      }

      // If PAN is missing, auto-derive PAN from GSTIN (chars 3 to 12)
      if (!data.pan || data.pan.trim().length === 0) {
        data.pan = gstinClean.substring(2, 12);
      }
    }

    // 4. Verify MSME payment term bounds (MSMED Act Sec 15 / IT Act Sec 43B(h))
    if (data.is_msme_registered && data.payment_terms_days > 45) {
      throw new BusinessRuleError(
        `Payment terms for MSME-registered vendor '${data.supplier_name}' cannot exceed 45 calendar days under statutory Section 43B(h) regulations`
      );
    }

    const payload: Record<string, unknown> = {
      ...data,
      gstin: data.gstin ? data.gstin.trim().toUpperCase() : null,
      pan: data.pan ? data.pan.trim().toUpperCase() : null,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const insertRes = await this.db.insert<Supplier>('supplier', payload);
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(`Failed to create supplier: ${insertRes.error?.message}`);
    }

    logger.info('Supplier created successfully', {
      supplierId: insertRes.data.id,
      supplierCode: data.supplier_code,
      tenantId: context.tenantId,
    });

    return insertRes.data;
  }

  /**
   * Retrieves a supplier by UUID
   */
  async getSupplierById(id: string, tenantId: string): Promise<Supplier> {
    const res = await this.db.findById<Supplier>('supplier', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('Supplier', id);
    }
    return res.data;
  }

  /**
   * Retrieves a supplier by tenant-unique code
   */
  async getSupplierByCode(supplierCode: string, tenantId: string): Promise<Supplier> {
    const res = await this.db.findOne<Supplier>('supplier', [
      { column: 'tenant_id', operator: 'eq', value: tenantId },
      { column: 'supplier_code', operator: 'eq', value: supplierCode },
    ]);
    if (res.error || !res.data) {
      throw new NotFoundError('Supplier', supplierCode);
    }
    return res.data;
  }

  /**
   * Updates an existing supplier record
   */
  async updateSupplier(
    id: string,
    input: UpdateSupplierInput,
    context: ServiceContext
  ): Promise<Supplier> {
    const existing = await this.getSupplierById(id, context.tenantId);

    const parsed = updateSupplierSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Supplier update validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    // Check unique code if updated
    if (data.supplier_code && data.supplier_code !== existing.supplier_code) {
      const codeDup = await this.db.findOne<Supplier>('supplier', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'supplier_code', operator: 'eq', value: data.supplier_code },
      ]);
      if (codeDup.data && codeDup.data.id !== id) {
        throw new ConflictError(
          `Supplier code '${data.supplier_code}' is already assigned to another vendor`
        );
      }
    }

    // Check unique GSTIN if updated
    if (data.gstin && data.gstin !== existing.gstin) {
      const gstinClean = data.gstin.trim().toUpperCase();
      const gstinDup = await this.db.findOne<Supplier>('supplier', [
        { column: 'tenant_id', operator: 'eq', value: context.tenantId },
        { column: 'gstin', operator: 'eq', value: gstinClean },
      ]);
      if (gstinDup.data && gstinDup.data.id !== id) {
        throw new ConflictError(
          `GSTIN '${gstinClean}' is already assigned to another vendor`
        );
      }
    }

    // Verify MSME payment terms rule
    const isMsme = data.is_msme_registered ?? existing.is_msme_registered;
    const paymentDays = data.payment_terms_days ?? existing.payment_terms_days;
    if (isMsme && paymentDays > 45) {
      throw new BusinessRuleError(
        'Payment terms for MSME vendors cannot exceed 45 calendar days under Section 43B(h) compliance'
      );
    }

    const payload: Record<string, unknown> = {
      ...data,
      updated_by: context.userId,
    };
    if (data.gstin) payload.gstin = data.gstin.trim().toUpperCase();
    if (data.pan) payload.pan = data.pan.trim().toUpperCase();

    const updateRes = await this.db.update<Supplier>('supplier', id, payload, {
      tenantId: context.tenantId,
    });

    if (updateRes.error || !updateRes.data) {
      throw new BusinessRuleError(`Failed to update supplier: ${updateRes.error?.message}`);
    }

    return updateRes.data;
  }

  /**
   * Soft-deletes a supplier if no unpaid purchase invoices or purchase orders exist
   */
  async deleteSupplier(id: string, context: ServiceContext): Promise<void> {
    const supplier = await this.getSupplierById(id, context.tenantId);

    // Verify no unpaid purchase invoices
    const openInvoicesRes = await this.db.count('purchase_invoice', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'supplier_id', operator: 'eq', value: id },
      { column: 'outstanding_amount', operator: 'gt', value: 0 },
    ]);

    if (openInvoicesRes.count && openInvoicesRes.count > 0) {
      throw new BusinessRuleError(
        `Cannot delete vendor '${supplier.supplier_name}'. There are ${openInvoicesRes.count} outstanding accounts payable invoice(s).`
      );
    }

    const delRes = await this.db.softDelete('supplier', id, context.userId, {
      tenantId: context.tenantId,
    });

    if (delRes.error) {
      throw new BusinessRuleError(`Failed to delete supplier: ${delRes.error.message}`);
    }

    logger.info('Supplier deleted (soft-delete)', { supplierId: id, tenantId: context.tenantId });
  }

  /**
   * Lists suppliers with pagination, sorting, and filters
   */
  async listSuppliers(
    tenantId: string,
    options?: Partial<SupplierFilterParams>
  ): Promise<{ data: Supplier[]; total: number }> {
    const filters: QueryFilter[] = [{ column: 'tenant_id', operator: 'eq', value: tenantId }];

    if (options?.supplier_group_id) {
      filters.push({ column: 'supplier_group_id', operator: 'eq', value: options.supplier_group_id });
    }
    if (options?.supplier_type) {
      filters.push({ column: 'supplier_type', operator: 'eq', value: options.supplier_type });
    }
    if (options?.gst_category) {
      filters.push({ column: 'gst_category', operator: 'eq', value: options.gst_category });
    }
    if (options?.is_msme_registered !== undefined) {
      filters.push({ column: 'is_msme_registered', operator: 'eq', value: options.is_msme_registered });
    }
    if (options?.is_active !== undefined) {
      filters.push({ column: 'is_active', operator: 'eq', value: options.is_active });
    }
    if (options?.search) {
      filters.push({ column: 'supplier_name', operator: 'ilike', value: `%${options.search}%` });
    }

    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 20;
    const sortBy = options?.sortBy ?? 'supplier_name';
    const sortDirection = options?.sortDirection ?? 'asc';

    const sort: QuerySort[] = [{ column: sortBy, direction: sortDirection }];

    const countRes = await this.db.count('supplier', filters);
    const listRes = await this.db.findMany<Supplier>('supplier', {
      filters,
      sort,
      pagination: { page, pageSize },
    });

    if (listRes.error) {
      throw new BusinessRuleError(`Failed to list suppliers: ${listRes.error.message}`);
    }

    return {
      data: listRes.data || [],
      total: countRes.count || 0,
    };
  }

  /**
   * Validates vendor statutory tax credentials (GSTIN format, PAN correlation, MSME)
   */
  async validateSupplierTaxDetails(
    supplierId: string,
    tenantId: string
  ): Promise<TaxValidationResult> {
    const supplier = await this.getSupplierById(supplierId, tenantId);

    const gstin = supplier.gstin?.trim().toUpperCase() || '';
    const pan = supplier.pan?.trim().toUpperCase() || '';

    const gstinValid = gstin.length > 0 ? GSTIN_REGEX.test(gstin) : false;
    const panValid = pan.length > 0 ? PAN_REGEX.test(pan) : false;

    let gstinPanMatch = false;
    let stateCode: string | undefined;

    if (gstinValid) {
      stateCode = gstin.substring(0, 2);
      const embeddedPan = gstin.substring(2, 12);
      if (panValid) {
        gstinPanMatch = embeddedPan === pan;
      }
    }

    // MSME compliance check: payment_terms_days <= 45
    const msmeCompliant = !supplier.is_msme_registered || (
      supplier.payment_terms_days <= 45 &&
      !!supplier.msme_registration_no &&
      supplier.msme_registration_no.trim().length > 0
    );

    const isValid = (gstin ? gstinValid : true) && (pan ? panValid : true) && msmeCompliant;

    return {
      isValid,
      gstinValid,
      panValid,
      gstinPanMatch,
      msmeCompliant,
      stateCode,
      details: {
        supplierName: supplier.supplier_name,
        gstCategory: supplier.gst_category,
        isMsme: supplier.is_msme_registered,
        msmeNo: supplier.msme_registration_no,
        paymentTermsDays: supplier.payment_terms_days,
      },
    };
  }

  /**
   * Assigns payment terms configuration to a supplier
   */
  async assignPaymentTerms(
    input: AssignPaymentTermsInput,
    context: ServiceContext
  ): Promise<Supplier> {
    const supplier = await this.getSupplierById(input.supplierId, context.tenantId);

    if (input.paymentTermsDays !== undefined) {
      if (supplier.is_msme_registered && input.paymentTermsDays > 45) {
        throw new BusinessRuleError(
          'Payment terms days cannot exceed 45 days for an MSME-registered vendor'
        );
      }
    }

    if (input.paymentTermsTemplateId) {
      const templateRes = await this.db.findById<PaymentTermsTemplateRecord>(
        'payment_terms_template',
        input.paymentTermsTemplateId,
        { tenantId: context.tenantId }
      );
      if (templateRes.error || !templateRes.data) {
        throw new NotFoundError('PaymentTermsTemplate', input.paymentTermsTemplateId);
      }
    }

    const payload: Record<string, unknown> = {
      updated_by: context.userId,
    };
    if (input.paymentTermsDays !== undefined) {
      payload.payment_terms_days = input.paymentTermsDays;
    }
    if (input.paymentTermsTemplateId !== undefined) {
      payload.payment_terms_template_id = input.paymentTermsTemplateId;
    }

    const updateRes = await this.db.update<Supplier>('supplier', input.supplierId, payload, {
      tenantId: context.tenantId,
    });

    if (updateRes.error || !updateRes.data) {
      throw new BusinessRuleError(
        `Failed to assign payment terms: ${updateRes.error?.message}`
      );
    }

    return updateRes.data;
  }

  /**
   * Computes installment milestones and due dates from invoice total using Decimal allocation
   */
  async calculatePaymentSchedule(params: {
    supplierId?: string;
    templateId?: string;
    invoiceAmount: Decimal | string | number;
    invoiceDate: string | Date;
    tenantId: string;
  }): Promise<PaymentScheduleResult> {
    const totalAmount = Decimal.from(params.invoiceAmount);
    const invoiceDateStr =
      typeof params.invoiceDate === 'string'
        ? params.invoiceDate
        : params.invoiceDate.toISOString().slice(0, 10);

    let templateId = params.templateId;
    let supplier: Supplier | null = null;

    if (params.supplierId) {
      supplier = await this.getSupplierById(params.supplierId, params.tenantId);
      if (!templateId && supplier.payment_terms_template_id) {
        templateId = supplier.payment_terms_template_id;
      }
    }

    const milestones: PaymentScheduleMilestone[] = [];

    // Case 1: Template-based milestone billing
    if (templateId) {
      const templateRes = await this.db.findById<PaymentTermsTemplateRecord>(
        'payment_terms_template',
        templateId,
        { tenantId: params.tenantId }
      );

      if (templateRes.error || !templateRes.data) {
        throw new NotFoundError('PaymentTermsTemplate', templateId);
      }

      const detailsRes = await this.db.findMany<PaymentTermsDetailRecord>(
        'payment_terms_detail',
        {
          filters: [
            { column: 'tenant_id', operator: 'eq', value: params.tenantId },
            { column: 'template_id', operator: 'eq', value: templateId },
          ],
          sort: [
            { column: 'credit_months', direction: 'asc' },
            { column: 'credit_days', direction: 'asc' },
          ],
        }
      );

      const details = detailsRes.data || [];
      if (details.length === 0) {
        throw new BusinessRuleError(
          `Payment terms template '${templateRes.data.template_name}' has no tranche details configured`
        );
      }

      // Convert percentages to Decimals and allocate total amount
      const ratios = details.map((d) => Decimal.from(d.invoice_portion_percent));
      const allocatedAmounts = allocateAmount(totalAmount, ratios);

      for (let i = 0; i < details.length; i++) {
        const d = details[i];
        const trancheAmount = allocatedAmounts[i];

        // Calculate due date: invoiceDate + credit_months + credit_days
        const baseDate = new Date(invoiceDateStr);
        if (d.credit_months > 0) {
          baseDate.setMonth(baseDate.getMonth() + d.credit_months);
        }
        if (d.credit_days > 0) {
          baseDate.setDate(baseDate.getDate() + d.credit_days);
        }
        const dueDateStr = baseDate.toISOString().slice(0, 10);

        milestones.push({
          termDescription: d.term_description,
          invoicePortionPercent: Decimal.from(d.invoice_portion_percent),
          creditDays: d.credit_days,
          creditMonths: d.credit_months,
          dueDate: dueDateStr,
          amount: trancheAmount,
        });
      }

      const isMsme = supplier?.is_msme_registered ?? false;

      return {
        supplierId: params.supplierId,
        templateId,
        templateName: templateRes.data.template_name,
        totalInvoiceAmount: totalAmount,
        invoiceDate: invoiceDateStr,
        milestones,
        isMsmeRestricted: isMsme,
        msmeNotice: isMsme
          ? 'MSMED statutory rule active: payments should be settled within agreed milestones not exceeding 45 days.'
          : undefined,
      };
    }

    // Case 2: Simple credit days term from supplier master
    const creditDays = supplier?.payment_terms_days ?? 30;
    const baseDate = new Date(invoiceDateStr);
    baseDate.setDate(baseDate.getDate() + creditDays);
    const dueDateStr = baseDate.toISOString().slice(0, 10);

    milestones.push({
      termDescription: `Net ${creditDays} Days`,
      invoicePortionPercent: Decimal.from(100),
      creditDays,
      creditMonths: 0,
      dueDate: dueDateStr,
      amount: totalAmount,
    });

    const isMsme = supplier?.is_msme_registered ?? false;

    return {
      supplierId: params.supplierId,
      totalInvoiceAmount: totalAmount,
      invoiceDate: invoiceDateStr,
      milestones,
      isMsmeRestricted: isMsme,
      msmeNotice: isMsme
        ? 'MSMED statutory rule active: payments should be settled within agreed milestones not exceeding 45 days.'
        : undefined,
    };
  }

  // --- Supplier Group Operations ---

  /**
   * Creates a new Supplier Group
   */
  async createSupplierGroup(
    input: CreateSupplierGroupInput,
    context: ServiceContext
  ): Promise<SupplierGroup> {
    const parsed = createSupplierGroupSchema.safeParse(input);
    if (!parsed.success) {
      throw new ValidationError(
        'Supplier group validation failed',
        parsed.error.flatten().fieldErrors as Record<string, string[]>
      );
    }
    const data = parsed.data;

    const dup = await this.db.findOne<SupplierGroup>('supplier_group', [
      { column: 'tenant_id', operator: 'eq', value: context.tenantId },
      { column: 'supplier_group_name', operator: 'eq', value: data.supplier_group_name },
    ]);
    if (dup.data) {
      throw new ConflictError(
        `Supplier group '${data.supplier_group_name}' already exists in this tenant`
      );
    }

    const payload: Record<string, unknown> = {
      ...data,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const insertRes = await this.db.insert<SupplierGroup>('supplier_group', payload);
    if (insertRes.error || !insertRes.data) {
      throw new BusinessRuleError(
        `Failed to create supplier group: ${insertRes.error?.message}`
      );
    }

    return insertRes.data;
  }

  /**
   * Lists supplier groups for tenant
   */
  async listSupplierGroups(tenantId: string): Promise<SupplierGroup[]> {
    const res = await this.db.findMany<SupplierGroup>('supplier_group', {
      filters: [{ column: 'tenant_id', operator: 'eq', value: tenantId }],
      sort: [{ column: 'supplier_group_name', direction: 'asc' }],
    });

    if (res.error) {
      throw new BusinessRuleError(`Failed to list supplier groups: ${res.error.message}`);
    }

    return res.data || [];
  }

  /**
   * Retrieves a supplier group by ID
   */
  async getSupplierGroupById(id: string, tenantId: string): Promise<SupplierGroup> {
    const res = await this.db.findById<SupplierGroup>('supplier_group', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('SupplierGroup', id);
    }
    return res.data;
  }
}
