import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as habitsService from './service.js';

const habitParamSchema = z.object({
  habitId: z.enum(['water', 'sleep', 'steps', 'stretch', 'no_junk', 'meditation']),
});

export default async function habitsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get('/habits/today', { preHandler: [fastify.authenticate] }, async (request) => {
    return habitsService.listToday(request.user.sub);
  });

  app.post(
    '/habits/:habitId/toggle',
    { schema: { params: habitParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return habitsService.toggleHabit(request.user.sub, request.params.habitId);
    },
  );
}
