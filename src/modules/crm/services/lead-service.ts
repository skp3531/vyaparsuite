/**
 * VyaparSuite CRM Lead Service
 * Manages lead qualification, scoring heuristic algorithms,
 * source channels, and automated conversion into Customer accounts.
 */

import type { IDatabaseAdapter, QueryFilter, QuerySort } from '@/lib/db/adapter';
import { createSupabaseAdapter } from '@/lib/db/supabase-adapter';
import { createServerClient } from '@/lib/db/client';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  Lead,
  CreateLeadInput,
  UpdateLeadInput,
  ConvertLeadInput,
  LeadFilterParams,
  LeadSource,
  CreateLeadSourceInput,
  createLeadSchema,
  updateLeadSchema,
  convertLeadSchema,
  createLeadSourceSchema,
} from '../schemas/lead.schema';
import { CustomerService } from '@/modules/sales/services/customer-service';

export interface ServiceContext {
  tenantId: string;
  userId: string;
  userEmail?: string;
}

export class LeadService {
  private db: IDatabaseAdapter;

  constructor(db?: IDatabaseAdapter) {
    this.db = db || createSupabaseAdapter(createServerClient());
  }

  /**
   * Lead scoring algorithm: assigns points for data completeness and qualification metrics
   */
  public calculateLeadScore(lead: Partial<CreateLeadInput>): number {
    let score = 10; // Baseline for capture
    if (lead.company_name) score += 20;
    if (lead.email) score += 15;
    if (lead.phone || lead.mobile_no) score += 15;
    if (lead.annual_revenue && parseFloat(lead.annual_revenue) > 0) score += 20;
    if (lead.no_of_employees && lead.no_of_employees > 10) score += 10;
    if (lead.website) score += 10;
    return Math.min(score, 100);
  }

  /**
   * Create a prospective Lead
   */
  async createLead(data: CreateLeadInput, context: ServiceContext): Promise<Lead> {
    const validated = createLeadSchema.parse(data);
    const computedScore = data.lead_score || this.calculateLeadScore(validated);

    const payload = {
      ...validated,
      lead_score: computedScore,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const res = await this.db.insert<Lead>('lead', payload);
    if (res.error || !res.data) {
      logger.error('Failed to create lead', res.error as unknown as Error, { tenantId: context.tenantId });
      throw new ConflictError(res.error?.message || 'Failed to create lead record');
    }

    logger.info('Lead created successfully', {
      leadId: res.data.id,
      tenantId: context.tenantId,
      score: computedScore,
    });
    return res.data;
  }

  /**
   * Update Lead details
   */
  async updateLead(id: string, data: UpdateLeadInput, context: ServiceContext): Promise<Lead> {
    const validated = updateLeadSchema.parse(data);
    const existing = await this.getLeadById(id, context.tenantId);

    const merged = { ...existing, ...validated };
    const newScore = this.calculateLeadScore(merged as CreateLeadInput);

    const res = await this.db.update<Lead>('lead', id, {
      ...validated,
      lead_score: newScore,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    if (res.error || !res.data) {
      throw new NotFoundError('Lead', id);
    }

    return res.data;
  }

  /**
   * Get Lead by ID
   */
  async getLeadById(id: string, tenantId: string): Promise<Lead> {
    const res = await this.db.findById<Lead>('lead', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('Lead', id);
    }
    return res.data;
  }

  /**
   * List Leads with filtering and pagination
   */
  async listLeads(params: LeadFilterParams, tenantId: string): Promise<{ data: Lead[]; total: number }> {
    const filters: QueryFilter[] = [{ column: 'tenant_id', operator: 'eq', value: tenantId }];

    if (params.status) {
      filters.push({ column: 'status', operator: 'eq', value: params.status });
    }
    if (params.assigned_to_id) {
      filters.push({ column: 'assigned_to_id', operator: 'eq', value: params.assigned_to_id });
    }
    if (params.lead_source_id) {
      filters.push({ column: 'lead_source_id', operator: 'eq', value: params.lead_source_id });
    }
    if (params.min_score) {
      filters.push({ column: 'lead_score', operator: 'gte', value: params.min_score });
    }
    if (params.search) {
      filters.push({ column: 'lead_name', operator: 'ilike', value: `%${params.search}%` });
    }

    const sort: QuerySort[] = [
      { column: params.sortBy || 'created_at', direction: params.sortDirection || 'desc' },
    ];

    const res = await this.db.findMany<Lead>('lead', {
      filters,
      sort,
      pagination: {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
      },
    });

    return {
      data: res.data || [],
      total: res.count ?? (res.data ? res.data.length : 0),
    };
  }

  /**
   * Qualify Lead
   */
  async qualifyLead(id: string, context: ServiceContext): Promise<Lead> {
    const lead = await this.getLeadById(id, context.tenantId);
    if (lead.status === 'Converted' || lead.status === 'Lost') {
      throw new BusinessRuleError(`Cannot qualify lead in ${lead.status} status`);
    }

    return this.updateLead(
      id,
      {
        status: 'Qualified',
        qualification_status: 'Qualified by sales representative',
      },
      context
    );
  }

  /**
   * Convert Lead to Customer Account
   */
  async convertLead(
    input: ConvertLeadInput,
    context: ServiceContext
  ): Promise<{ lead: Lead; customerId: string }> {
    const validated = convertLeadSchema.parse(input);
    const lead = await this.getLeadById(validated.leadId, context.tenantId);

    if (lead.converted_customer_id) {
      throw new ConflictError(`Lead has already been converted to Customer ${lead.converted_customer_id}`);
    }

    // Build customer code derived from name
    const sanitizedPrefix = (lead.company_name || lead.lead_name)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const customerCode = `CUST-${sanitizedPrefix}-${randomSuffix}`;

    const customerService = new CustomerService(this.db);
    const customer = await customerService.createCustomer(
      {
        customer_name: lead.company_name || lead.lead_name,
        customer_code: customerCode,
        customer_group_id: validated.customerGroupId,
        customer_type: validated.customerType,
        gst_category: validated.gstCategory,
        gstin: validated.gstin,
        pan: validated.pan,
        credit_limit: '100000.000000', // Default ₹1,00,000 credit limit
      },
      {
        tenantId: context.tenantId,
        userId: context.userId,
      }
    );

    // Update lead status
    const updatedLeadRes = await this.db.update<Lead>('lead', lead.id!, {
      status: 'Converted',
      converted_customer_id: customer.id,
      converted_at: new Date().toISOString(),
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    logger.info('Lead converted to Customer successfully', {
      leadId: lead.id,
      customerId: customer.id,
      tenantId: context.tenantId,
    });

    return {
      lead: updatedLeadRes.data!,
      customerId: customer.id!,
    };
  }

  /**
   * Create Lead Source
   */
  async createLeadSource(data: CreateLeadSourceInput, context: ServiceContext): Promise<LeadSource> {
    const validated = createLeadSourceSchema.parse(data);
    const res = await this.db.insert<LeadSource>('lead_source', {
      ...validated,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    });

    if (res.error || !res.data) {
      throw new ConflictError(res.error?.message || 'Failed to create lead source');
    }
    return res.data;
  }

  /**
   * List Lead Sources
   */
  async listLeadSources(tenantId: string): Promise<LeadSource[]> {
    const res = await this.db.findMany<LeadSource>('lead_source', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'is_active', operator: 'eq', value: true },
      ],
      sort: [{ column: 'source_name', direction: 'asc' }],
    });
    return res.data || [];
  }
}
