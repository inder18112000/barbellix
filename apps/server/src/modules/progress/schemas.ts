import { z } from 'zod';

const measurementsSchema = z.object({
  chestCm: z.number().optional(),
  waistCm: z.number().optional(),
  hipsCm: z.number().optional(),
  armCm: z.number().optional(),
  thighCm: z.number().optional(),
});

export const logMetricSchema = z.object({
  weightKg: z.number().optional(),
  bodyFatPct: z.number().optional(),
  measurements: measurementsSchema.optional(),
});
