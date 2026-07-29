import { z } from 'zod';
import { aiCoachCompleteSchema, generateWorkoutPlanSchema, generateDietPlanSchema } from '@barbellix/shared';

export { aiCoachCompleteSchema as completeChatSchema, generateWorkoutPlanSchema, generateDietPlanSchema };

export const recommendationIdParamSchema = z.object({ id: z.string() });
