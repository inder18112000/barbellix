import { z } from 'zod';
import { workoutDayInputSchema } from '../workouts/schemas.js';

export const assignPlanSchema = z.object({
  planId: z.string(),
});

export const memberIdParamSchema = z.object({
  memberId: z.string(),
});

export const memberPlanParamSchema = z.object({
  memberId: z.string(),
  planId: z.string(),
});

export const updateMemberPlanSchema = z.object({
  name: z.string().min(1).optional(),
  goal: z
    .enum(['lose_weight', 'build_muscle', 'improve_endurance', 'increase_strength', 'general_fitness', 'sport_performance'])
    .optional(),
  days: z.array(workoutDayInputSchema).optional(),
  changeNote: z.string().optional(),
});

export const updateMemberStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});

export const updateMemberInfoSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export const assignTrainerSchema = z.object({
  trainerId: z.string().nullable(),
});

export const trainerIdParamSchema = z.object({
  trainerId: z.string(),
});

export const setTrainerPermissionsSchema = z.object({
  canManageExerciseLibrary: z.boolean().optional(),
  canManageMealLibrary: z.boolean().optional(),
});

export const createStaffAccountSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
});
