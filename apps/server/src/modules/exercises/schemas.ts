import { z } from 'zod';
import { MUSCLE_GROUPS, EQUIPMENT, EXERCISE_TAGS } from '@barbellix/shared';

export const createExerciseSchema = z.object({
  name: z.string().min(1),
  muscleGroups: z.array(z.enum(MUSCLE_GROUPS)).default([]),
  equipment: z.array(z.enum(EQUIPMENT)).default([]),
  instructions: z.string().min(1),
  mediaUrl: z.string().optional(),
  tags: z.array(z.enum(EXERCISE_TAGS)).optional(),
});

export const updateExerciseSchema = z.object({
  name: z.string().min(1).optional(),
  muscleGroups: z.array(z.enum(MUSCLE_GROUPS)).optional(),
  equipment: z.array(z.enum(EQUIPMENT)).optional(),
  instructions: z.string().min(1).optional(),
  mediaUrl: z.string().optional(),
  tags: z.array(z.enum(EXERCISE_TAGS)).optional(),
});

export const exerciseIdParamSchema = z.object({ id: z.string() });
