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

const plannedExerciseInputSchema = z.object({
  exerciseId: z.string(),
  sets: z.number(),
  reps: z.string(),
  restSecs: z.number(),
  notes: z.string().optional(),
});

const workoutDayInputSchema = z.object({
  dayLabel: z.string().min(1),
  exercises: z.array(plannedExerciseInputSchema).default([]),
});

export const createPlanSchema = z.object({
  name: z.string().min(1),
  goal: z.enum([
    'lose_weight',
    'build_muscle',
    'improve_endurance',
    'increase_strength',
    'general_fitness',
    'sport_performance',
  ]),
  days: z.array(workoutDayInputSchema).default([]),
});
