import { z } from 'zod';

export const sendMessageSchema = z.object({
  recipientId: z.string(),
  text: z.string().min(1),
});

export const otherUserIdParamSchema = z.object({ otherUserId: z.string() });
export const messageIdParamSchema = z.object({ id: z.string() });
