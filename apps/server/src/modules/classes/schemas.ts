import { z } from 'zod';

const occurrenceSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Expected HH:MM'),
  durationMins: z.number().min(1),
});

export const createTemplateSchema = z.object({
  branchId: z.string(),
  name: z.string().min(1),
  trainerId: z.string(),
  occurrences: z.array(occurrenceSchema).min(1),
  capacity: z.number().min(1),
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  trainerId: z.string().optional(),
  occurrences: z.array(occurrenceSchema).min(1).optional(),
  capacity: z.number().min(1).optional(),
  active: z.boolean().optional(),
});

export const templateIdParamSchema = z.object({ templateId: z.string() });
export const sessionIdParamSchema = z.object({ sessionId: z.string() });
export const bookingIdParamSchema = z.object({ bookingId: z.string() });

export const scheduleQuerySchema = z.object({
  branchId: z.string(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD'),
});
