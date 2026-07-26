import { z } from 'zod';

export const registerDeviceTokenSchema = z.object({
  expoPushToken: z.string().min(1),
  platform: z.enum(['ios', 'android', 'web']),
});

export const deviceTokenParamSchema = z.object({ token: z.string() });
