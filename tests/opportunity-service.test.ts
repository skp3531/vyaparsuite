import { describe, it, expect, beforeEach } from './helpers/test-runner';
import { OpportunityService } from '@/modules/crm/services/opportunity-service';
import { MockDatabaseAdapter } from './helpers/mock-db-adapter';
import { Decimal } from '@/lib/utils/decimal';

describe('OpportunityService', () => {
  let db: MockDatabaseAdapter;
  let service: OpportunityService;
  const tenantId = '00000000-0000-4000-a000-000000000001';
  const userId = '22222222-2222-4222-a222-222222222222';
  const context = { tenantId, userId };

  let propStageId: string;
  let wonStageId: string;
  let lostStageId: string;

  beforeEach(async () => {
    db = new MockDatabaseAdapter();
    service = new OpportunityService(db);

    const s1 = await service.createStage(
      {
        stage_name: 'Proposal / Quote',
        probability_percentage: '50.000000',
        stage_order: 1,
      },
      context
    );
    propStageId = s1.id!;

    const s2 = await service.createStage(
      {
        stage_name: 'Closed Won',
        probability_percentage: '100.000000',
        stage_order: 2,
        is_won_stage: true,
      },
      context
    );
    wonStageId = s2.id!;

    const s3 = await service.createStage(
      {
        stage_name: 'Closed Lost',
        probability_percentage: '0.000000',
        stage_order: 3,
        is_lost_stage: true,
      },
      context
    );
    lostStageId = s3.id!;
  });

  it('computes weighted pipeline revenue accurately using Decimal math', async () => {
    const opp = await service.createOpportunity(
      {
        opportunity_name: '500-ton hydraulic press procurement',
        pipeline_stage_id: propStageId,
        expected_revenue: '2500000.000000', // ₹25,00,000
        probability_percentage: '50.000000', // 50%
      },
      context
    );

    expect(opp.id).toBeDefined();
    // 25,00,000 * 50% = 12,50,000
    const weighted = Decimal.from(opp.weighted_revenue);
    expect(weighted.toNumber()).toBe(1250000);
  });

  it('advances stages to Closed Won and sets 100% win probability', async () => {
    const opp = await service.createOpportunity(
      {
        opportunity_name: 'Solar Panel Grid Inverters',
        pipeline_stage_id: propStageId,
        expected_revenue: '1000000.000000',
      },
      context
    );

    const won = await service.advanceStage(
      {
        opportunityId: opp.id!,
        newStageId: wonStageId,
      },
      context
    );

    expect(won.status).toBe('Won');
    expect(Decimal.from(won.probability_percentage).toNumber()).toBe(100);
    expect(Decimal.from(won.weighted_revenue).toNumber()).toBe(1000000);
  });

  it('aggregates pipeline forecast summaries across stages', async () => {
    await service.createOpportunity(
      {
        opportunity_name: 'Deal Alpha',
        pipeline_stage_id: propStageId,
        expected_revenue: '100000.000000',
        probability_percentage: '50.000000',
      },
      context
    );

    await service.createOpportunity(
      {
        opportunity_name: 'Deal Beta',
        pipeline_stage_id: propStageId,
        expected_revenue: '200000.000000',
        probability_percentage: '50.000000',
      },
      context
    );

    const forecast = await service.getPipelineForecast(tenantId);
    expect(forecast.totalOpportunities).toBe(2);
    expect(forecast.totalExpectedRevenue.toNumber()).toBe(300000);
    expect(forecast.totalWeightedRevenue.toNumber()).toBe(150000);
  });
});
