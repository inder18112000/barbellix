import { z } from 'zod';

export const trainerIdParamSchema = z.object({ trainerId: z.string() });

export const updateReportsToSchema = z.object({
  reportsToRole: z.enum(['admin', 'superadmin']),
});
