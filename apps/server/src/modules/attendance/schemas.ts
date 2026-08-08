import { z } from 'zod';

export const checkInSchema = z
  .object({
    qrToken: z.string().min(1).max(256).optional(),
    pin: z.string().regex(/^\d{6}$/, 'PIN must be 6 digits').optional(),
  })
  .refine((data) => data.qrToken || data.pin, {
    message: 'Either qrToken or pin is required',
  });
