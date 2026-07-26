import { z } from 'zod';
import { aiCoachCompleteSchema, generateWorkoutPlanSchema, generateDietPlanSchema } from '@fitpulse/shared';

export { aiCoachCompleteSchema as completeChatSchema, generateWorkoutPlanSchema, generateDietPlanSchema };

export const recommendationIdParamSchema = z.object({ id: z.string() });
