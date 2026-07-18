import { z } from 'zod';

const setInputSchema = z.object({
  exerciseId: z.string(),
  setNumber: z.number(),
  reps: z.number().optional(),
  weightKg: z.number().optional(),
  durationSecs: z.number().optional(),
  restSecs: z.number().optional(),
  completed: z.boolean().default(false),
});

export const logSessionSchema = z.object({
  planId: z.string().optional(),
  date: z.string().optional(),
  durationMins: z.number().optional(),
  notes: z.string().optional(),
  perceivedEffort: z.number().min(1).max(10).optional(),
  sets: z.array(setInputSchema).default([]),
});
