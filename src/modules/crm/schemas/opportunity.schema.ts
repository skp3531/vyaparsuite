/**
 * VyaparSuite CRM Opportunity Validation Schemas
 * Strict runtime validation for deal stages, pipeline forecasting, and weighted revenue tracking.
 */

import { z } from 'zod';

export const opportunityStatusEnum = z.enum(['Open', 'Won', 'Lost', 'On Hold']);
export type OpportunityStatus = z.infer<typeof opportunityStatusEnum>;

export const opportunityItemSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  opportunity_id: z.string().uuid().optional(),
  item_id: z.string().uuid('Item ID must be a valid UUID'),
  qty: z.string().regex(/^\d+(\.\d+)?$/, 'Qty must be a positive decimal').default('1.000000'),
  rate: z.string().regex(/^\d+(\.\d+)?$/, 'Rate must be a positive decimal').default('0.000000'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Amount must be a positive decimal').default('0.000000'),
});

export const opportunitySchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  opportunity_name: z.string().trim().min(1, 'Opportunity name is required').max(200),
  party_type: z.enum(['Customer', 'Lead']).default('Customer'),
  party_id: z.string().uuid().optional().nullable(),
  lead_id: z.string().uuid().optional().nullable(),
  pipeline_stage_id: z.string().uuid('Pipeline Stage ID must be a valid UUID'),
  expected_closing_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional().nullable(),
  expected_revenue: z.string().regex(/^\d+(\.\d+)?$/, 'Revenue must be a decimal string').default('0.000000'),
  probability_percentage: z.string().regex(/^\d+(\.\d+)?$/, 'Probability must be a decimal string').default('20.000000'),
  weighted_revenue: z.string().regex(/^\d+(\.\d+)?$/).default('0.000000'),
  currency: z.string().default('INR'),
  status: opportunityStatusEnum.default('Open'),
  assigned_to_id: z.string().uuid().optional().nullable(),
  loss_reason: z.string().optional().nullable(),
  items: z.array(opportunityItemSchema).optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
});

export const createOpportunitySchema = opportunitySchema.omit({
  id: true,
  weighted_revenue: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateOpportunitySchema = createOpportunitySchema.partial();

export const advanceStageSchema = z.object({
  opportunityId: z.string().uuid(),
  newStageId: z.string().uuid(),
  lossReason: z.string().optional(),
});

export const opportunityFilterSchema = z.object({
  status: opportunityStatusEnum.optional(),
  pipeline_stage_id: z.string().uuid().optional(),
  assigned_to_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['opportunity_name', 'expected_revenue', 'expected_closing_date', 'created_at']).default('created_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type Opportunity = z.infer<typeof opportunitySchema>;
export type CreateOpportunityInput = z.input<typeof createOpportunitySchema>;
export type UpdateOpportunityInput = z.input<typeof updateOpportunitySchema>;
export type OpportunityItem = z.infer<typeof opportunityItemSchema>;
export type AdvanceStageInput = z.input<typeof advanceStageSchema>;
export type OpportunityFilterParams = z.input<typeof opportunityFilterSchema>;
