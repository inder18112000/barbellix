import { z } from 'zod';

export const updateProfileSchema = z.object({
  goals: z
    .array(
      z.enum([
        'lose_weight',
        'build_muscle',
        'improve_endurance',
        'increase_strength',
        'general_fitness',
        'sport_performance',
      ]),
    )
    .optional(),
  dob: z.string().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  avatarUrl: z.string().optional(),
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
});
