import { z } from 'zod';

export const assignPlanSchema = z.object({
  planId: z.string(),
});

export const memberIdParamSchema = z.object({
  memberId: z.string(),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});
