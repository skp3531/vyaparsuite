/**
 * VyaparSuite CRM Opportunity & Pipeline Service
 * Manages deal progression, sales forecasting, weighted pipeline calculations,
 * and stage transitions from Prospecting through Closed Won/Lost.
 */

import type { IDatabaseAdapter, QueryFilter, QuerySort } from '@/lib/db/adapter';
import { createSupabaseAdapter } from '@/lib/db/supabase-adapter';
import { createServerClient } from '@/lib/db/client';
import { Decimal } from '@/lib/utils/decimal';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
  BusinessRuleError,
} from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import {
  Opportunity,
  CreateOpportunityInput,
  UpdateOpportunityInput,
  AdvanceStageInput,
  OpportunityFilterParams,
  createOpportunitySchema,
  updateOpportunitySchema,
  advanceStageSchema,
} from '../schemas/opportunity.schema';
import {
  PipelineStage,
  CreatePipelineStageInput,
  createPipelineStageSchema,
} from '../schemas/lead.schema';

export interface ServiceContext {
  tenantId: string;
  userId: string;
  userEmail?: string;
}

export interface PipelineForecast {
  totalExpectedRevenue: Decimal;
  totalWeightedRevenue: Decimal;
  totalOpportunities: number;
  stageBreakdown: Array<{
    stageId: string;
    stageName: string;
    count: number;
    expectedRevenue: Decimal;
    weightedRevenue: Decimal;
  }>;
}

export class OpportunityService {
  private db: IDatabaseAdapter;

  constructor(db?: IDatabaseAdapter) {
    this.db = db || createSupabaseAdapter(createServerClient());
  }

  /**
   * Calculate weighted revenue using Decimal math:
   * weighted = expectedRevenue * (probability / 100)
   */
  public calculateWeightedRevenue(expectedRevenue: string, probability: string): string {
    const revenue = Decimal.from(expectedRevenue || '0');
    const prob = Decimal.from(probability || '0');
    const weighted = revenue.multiply(prob).divide(100);
    return weighted.toString(6);
  }

  /**
   * Create an Opportunity
   */
  async createOpportunity(data: CreateOpportunityInput, context: ServiceContext): Promise<Opportunity> {
    const validated = createOpportunitySchema.parse(data);

    // Look up stage to verify existence and get default probability if not explicitly supplied
    const stage = await this.getStageById(validated.pipeline_stage_id, context.tenantId);
    const probability = validated.probability_percentage || stage.probability_percentage;
    const weighted = this.calculateWeightedRevenue(validated.expected_revenue, probability);

    const { items, ...headerData } = validated;

    const payload = {
      ...headerData,
      probability_percentage: probability,
      weighted_revenue: weighted,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    };

    const res = await this.db.insert<Opportunity>('opportunity', payload);
    if (res.error || !res.data) {
      throw new ConflictError(res.error?.message || 'Failed to create opportunity');
    }

    const createdOpp = res.data;

    // Insert items if supplied
    if (items && items.length > 0) {
      const itemRows = items.map((item) => ({
        ...item,
        tenant_id: context.tenantId,
        opportunity_id: createdOpp.id,
        created_by: context.userId,
        updated_by: context.userId,
      }));
      await this.db.insertMany('opportunity_item', itemRows);
    }

    logger.info('Opportunity created successfully', {
      opportunityId: createdOpp.id,
      tenantId: context.tenantId,
      revenue: validated.expected_revenue,
    });

    return createdOpp;
  }

  /**
   * Update Opportunity
   */
  async updateOpportunity(
    id: string,
    data: UpdateOpportunityInput,
    context: ServiceContext
  ): Promise<Opportunity> {
    const validated = updateOpportunitySchema.parse(data);
    const existing = await this.getOpportunityById(id, context.tenantId);

    const expectedRevenue = validated.expected_revenue ?? existing.expected_revenue;
    const probability = validated.probability_percentage ?? existing.probability_percentage;
    const weighted = this.calculateWeightedRevenue(expectedRevenue, probability);

    const { items: _, ...headerData } = validated;

    const res = await this.db.update<Opportunity>('opportunity', id, {
      ...headerData,
      weighted_revenue: weighted,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    if (res.error || !res.data) {
      throw new NotFoundError('Opportunity', id);
    }

    return res.data;
  }

  /**
   * Advance Opportunity through Pipeline Stages
   */
  async advanceStage(input: AdvanceStageInput, context: ServiceContext): Promise<Opportunity> {
    const validated = advanceStageSchema.parse(input);
    const opp = await this.getOpportunityById(validated.opportunityId, context.tenantId);
    const targetStage = await this.getStageById(validated.newStageId, context.tenantId);

    let status = opp.status;
    let probability = targetStage.probability_percentage;
    let lossReason = opp.loss_reason;

    if (targetStage.is_won_stage) {
      status = 'Won';
      probability = '100.000000';
    } else if (targetStage.is_lost_stage) {
      status = 'Lost';
      probability = '0.000000';
      lossReason = validated.lossReason || 'Competitor pricing / not specified';
    } else {
      status = 'Open';
    }

    const weighted = this.calculateWeightedRevenue(opp.expected_revenue, probability);

    const res = await this.db.update<Opportunity>('opportunity', opp.id!, {
      pipeline_stage_id: targetStage.id!,
      status,
      probability_percentage: probability,
      weighted_revenue: weighted,
      loss_reason: lossReason,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    });

    if (res.error || !res.data) {
      throw new NotFoundError('Opportunity', opp.id!);
    }

    logger.info('Opportunity pipeline stage advanced', {
      opportunityId: opp.id,
      fromStage: opp.pipeline_stage_id,
      toStage: targetStage.stage_name,
      status,
    });

    return res.data;
  }

  /**
   * Get Opportunity by ID
   */
  async getOpportunityById(id: string, tenantId: string): Promise<Opportunity> {
    const res = await this.db.findById<Opportunity>('opportunity', id, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('Opportunity', id);
    }
    return res.data;
  }

  /**
   * List Opportunities with filtering and pagination
   */
  async listOpportunities(
    params: OpportunityFilterParams,
    tenantId: string
  ): Promise<{ data: Opportunity[]; total: number }> {
    const filters: QueryFilter[] = [{ column: 'tenant_id', operator: 'eq', value: tenantId }];

    if (params.status) {
      filters.push({ column: 'status', operator: 'eq', value: params.status });
    }
    if (params.pipeline_stage_id) {
      filters.push({ column: 'pipeline_stage_id', operator: 'eq', value: params.pipeline_stage_id });
    }
    if (params.assigned_to_id) {
      filters.push({ column: 'assigned_to_id', operator: 'eq', value: params.assigned_to_id });
    }
    if (params.search) {
      filters.push({ column: 'opportunity_name', operator: 'ilike', value: `%${params.search}%` });
    }

    const sort: QuerySort[] = [
      { column: params.sortBy || 'created_at', direction: params.sortDirection || 'desc' },
    ];

    const res = await this.db.findMany<Opportunity>('opportunity', {
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
   * Aggregate Pipeline Forecast across all open stages
   */
  async getPipelineForecast(tenantId: string): Promise<PipelineForecast> {
    const stages = await this.listStages(tenantId);
    const oppsRes = await this.db.findMany<Opportunity>('opportunity', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'status', operator: 'eq', value: 'Open' },
      ],
    });

    const opps = oppsRes.data || [];
    let totalExpected = Decimal.zero();
    let totalWeighted = Decimal.zero();

    const stageMap = new Map<string, { count: number; expected: Decimal; weighted: Decimal }>();
    for (const stage of stages) {
      stageMap.set(stage.id!, {
        count: 0,
        expected: Decimal.zero(),
        weighted: Decimal.zero(),
      });
    }

    for (const opp of opps) {
      const exp = Decimal.from(opp.expected_revenue || '0');
      const wght = Decimal.from(opp.weighted_revenue || '0');

      totalExpected = totalExpected.add(exp);
      totalWeighted = totalWeighted.add(wght);

      const entry = stageMap.get(opp.pipeline_stage_id);
      if (entry) {
        entry.count += 1;
        entry.expected = entry.expected.add(exp);
        entry.weighted = entry.weighted.add(wght);
      }
    }

    const stageBreakdown = stages.map((stage) => {
      const stats = stageMap.get(stage.id!) || {
        count: 0,
        expected: Decimal.zero(),
        weighted: Decimal.zero(),
      };
      return {
        stageId: stage.id!,
        stageName: stage.stage_name,
        count: stats.count,
        expectedRevenue: stats.expected,
        weightedRevenue: stats.weighted,
      };
    });

    return {
      totalExpectedRevenue: totalExpected,
      totalWeightedRevenue: totalWeighted,
      totalOpportunities: opps.length,
      stageBreakdown,
    };
  }

  /**
   * Stage Operations
   */
  async createStage(data: CreatePipelineStageInput, context: ServiceContext): Promise<PipelineStage> {
    const validated = createPipelineStageSchema.parse(data);
    const res = await this.db.insert<PipelineStage>('pipeline_stage', {
      ...validated,
      tenant_id: context.tenantId,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (res.error || !res.data) {
      throw new ConflictError(res.error?.message || 'Failed to create pipeline stage');
    }
    return res.data;
  }

  async listStages(tenantId: string): Promise<PipelineStage[]> {
    const res = await this.db.findMany<PipelineStage>('pipeline_stage', {
      filters: [
        { column: 'tenant_id', operator: 'eq', value: tenantId },
        { column: 'is_active', operator: 'eq', value: true },
      ],
      sort: [{ column: 'stage_order', direction: 'asc' }],
    });
    return res.data || [];
  }

  async getStageById(stageId: string, tenantId: string): Promise<PipelineStage> {
    const res = await this.db.findById<PipelineStage>('pipeline_stage', stageId, { tenantId });
    if (res.error || !res.data) {
      throw new NotFoundError('PipelineStage', stageId);
    }
    return res.data;
  }
}
