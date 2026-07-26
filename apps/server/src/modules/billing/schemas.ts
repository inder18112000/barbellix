import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  priceCents: z.number().min(0),
  currency: z.string().optional(),
  billingInterval: z.enum(['month', 'year']),
});

export const updatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
  priceCents: z.number().min(0).optional(),
  billingInterval: z.enum(['month', 'year']).optional(),
});

export const planIdParamSchema = z.object({ planId: z.string() });
export const memberIdParamSchema = z.object({ memberId: z.string() });

export const checkoutSessionSchema = z.object({
  planId: z.string(),
});

export const markPaidSchema = z.object({
  planName: z.string().min(1),
});

export const updateMembershipDatesSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
