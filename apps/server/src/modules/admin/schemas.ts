import { z } from 'zod';

export const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  location: z.string().optional(),
  capacity: z.number().optional(),
  checkInPin: z.string().regex(/^\d{6}$/, 'PIN must be 6 digits').optional(),
  checkInMethods: z.array(z.enum(['qr', 'nfc', 'pin', 'manual'])).optional(),
  autoCheckoutEnabled: z.boolean().optional(),
  autoCheckoutAfterMins: z.number().optional(),
  guestPassEnabled: z.boolean().optional(),
  gracePeriodDays: z.number().min(0).max(30).optional(),
  checkInIntervalDays: z.number().min(1).max(90).optional(),
});

export const recentAttendanceQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
});
