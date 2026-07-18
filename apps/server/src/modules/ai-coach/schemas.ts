import { z } from 'zod';
import { aiCoachCompleteSchema } from '@fitpulse/shared';

export { aiCoachCompleteSchema as completeChatSchema };

export const recommendationIdParamSchema = z.object({ id: z.string() });
