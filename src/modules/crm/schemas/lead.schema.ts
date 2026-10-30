/**
 * VyaparSuite CRM Lead & Pipeline Validation Schemas
 * Strict runtime validation for lead capture, scoring, qualification, and customer conversion.
 */

import { z } from 'zod';

export const leadStatusEnum = z.enum([
  'Open',
  'Contacted',
  'Qualified',
  'Unqualified',
  'Converted',
  'Lost',
]);
export type LeadStatus = z.infer<typeof leadStatusEnum>;

export const leadSourceSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  source_name: z.string().trim().min(1, 'Source name is required').max(100),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const createLeadSourceSchema = leadSourceSchema.omit({ id: true });

export const pipelineStageSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  stage_name: z.string().trim().min(1, 'Stage name is required').max(100),
  probability_percentage: z.string().regex(/^\d+(\.\d+)?$/, 'Probability must be a decimal string').default('10.000000'),
  stage_order: z.number().int().default(1),
  is_won_stage: z.boolean().default(false),
  is_lost_stage: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const createPipelineStageSchema = pipelineStageSchema.omit({ id: true });

export const leadSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid().optional(),
  lead_name: z.string().trim().min(1, 'Lead name is required').max(150),
  company_name: z.string().trim().max(150).optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  mobile_no: z.string().trim().max(30).optional().nullable(),
  lead_source_id: z.string().uuid().optional().nullable(),
  campaign_id: z.string().uuid().optional().nullable(),
  territory_id: z.string().uuid().optional().nullable(),
  status: leadStatusEnum.default('Open'),
  qualification_status: z.string().optional().nullable(),
  lead_score: z.number().int().min(0).max(100).default(0),
  assigned_to_id: z.string().uuid().optional().nullable(),
  annual_revenue: z.string().regex(/^\d+(\.\d+)?$/).optional().nullable(),
  no_of_employees: z.number().int().positive().optional().nullable(),
  industry: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  notes: z.string().optional().nullable(),
  converted_customer_id: z.string().uuid().optional().nullable(),
  converted_at: z.string().datetime().optional().nullable(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  created_by: z.string().uuid().optional().nullable(),
  updated_by: z.string().uuid().optional().nullable(),
});

export const createLeadSchema = leadSchema.omit({
  id: true,
  converted_customer_id: true,
  converted_at: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const updateLeadSchema = createLeadSchema.partial();

export const convertLeadSchema = z.object({
  leadId: z.string().uuid('Lead ID must be a valid UUID'),
  customerGroupId: z.string().uuid('Customer Group ID must be a valid UUID'),
  customerType: z.enum(['Company', 'Individual']).default('Company'),
  gstCategory: z.enum([
    'Registered Regular',
    'Registered Composition',
    'Unregistered',
    'SEZ',
    'Overseas',
    'Deemed Export',
  ]).default('Unregistered'),
  gstin: z.string().optional(),
  pan: z.string().optional(),
});

export const leadFilterSchema = z.object({
  status: leadStatusEnum.optional(),
  assigned_to_id: z.string().uuid().optional(),
  lead_source_id: z.string().uuid().optional(),
  search: z.string().optional(),
  min_score: z.number().int().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['lead_name', 'company_name', 'lead_score', 'created_at']).default('created_at'),
  sortDirection: z.enum(['asc', 'desc']).default('desc'),
});

// Types
export type Lead = z.infer<typeof leadSchema>;
export type CreateLeadInput = z.input<typeof createLeadSchema>;
export type UpdateLeadInput = z.input<typeof updateLeadSchema>;
export type ConvertLeadInput = z.input<typeof convertLeadSchema>;
export type LeadFilterParams = z.input<typeof leadFilterSchema>;

export type LeadSource = z.infer<typeof leadSourceSchema>;
export type CreateLeadSourceInput = z.input<typeof createLeadSourceSchema>;

export type PipelineStage = z.infer<typeof pipelineStageSchema>;
export type CreatePipelineStageInput = z.input<typeof createPipelineStageSchema>;
