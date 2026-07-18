import { z } from 'zod';

export const checkInSchema = z.object({
  qrToken: z.string().optional(),
  pin: z.string().optional(),
});
