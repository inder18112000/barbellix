import { z } from 'zod';

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const completeChatSchema = z.object({
  history: z.array(historyMessageSchema).default([]),
  userMessage: z.string().min(1),
});

export const recommendationIdParamSchema = z.object({ id: z.string() });
