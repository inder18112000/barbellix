import { z } from 'zod';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const createMealSchema = z.object({
  name: z.string().min(1),
  mealType: z.enum(MEAL_TYPES),
  calories: z.number().min(0),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
});

export const updateMealSchema = z.object({
  name: z.string().min(1).optional(),
  mealType: z.enum(MEAL_TYPES).optional(),
  calories: z.number().min(0).optional(),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
});

export const mealIdParamSchema = z.object({ id: z.string() });
export const mealQuerySchema = z.object({ q: z.string().optional() });
