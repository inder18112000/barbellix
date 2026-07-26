import { z } from 'zod';
import { aiCoachCompleteSchema, generateWorkoutPlanSchema } from '@fitpulse/shared';

export { aiCoachCompleteSchema as completeChatSchema, generateWorkoutPlanSchema };

export const recommendationIdParamSchema = z.object({ id: z.string() });
