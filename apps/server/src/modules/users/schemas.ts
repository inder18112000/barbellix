import { z } from 'zod';
import { FITNESS_GOALS, MUSCLE_GROUPS, INJURY_CONDITIONS, INJURY_SEVERITIES, DIET_PREFERENCES, GYM_ACCESS_OPTIONS } from '@barbellix/shared';

export const updateProfileSchema = z.object({
  goals: z.array(z.enum(FITNESS_GOALS)).optional(),
  dob: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().max(280).optional(),
  targetWeightKg: z.number().optional(),
  dietPreference: z.enum(DIET_PREFERENCES).optional(),
  gymAccess: z.enum(GYM_ACCESS_OPTIONS).optional(),
});

export const addInjurySchema = z.object({
  bodyPart: z.enum(MUSCLE_GROUPS),
  condition: z.enum(INJURY_CONDITIONS).optional(),
  note: z.string().max(280).optional(),
  severity: z.enum(INJURY_SEVERITIES),
});

export const injuryIdParamSchema = z.object({ id: z.string() });

export const updateMyInfoSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
});

export const updateNotificationPreferencesSchema = z.object({
  workoutReminders: z.boolean().optional(),
  workoutReminderTime: z.string().optional(),
  streakAlerts: z.boolean().optional(),
  aiTips: z.boolean().optional(),
  checkInConfirmations: z.boolean().optional(),
  weeklyReport: z.boolean().optional(),
  personalRecords: z.boolean().optional(),
  trainerMessages: z.boolean().optional(),
  classBookings: z.boolean().optional(),
});
