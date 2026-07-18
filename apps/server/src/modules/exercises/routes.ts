import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as exercisesService from './service.js';

const querySchema = z.object({ q: z.string().optional() });

export default async function exercisesRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    '/exercises',
    { schema: { querystring: querySchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return exercisesService.searchExercises(request.user.tenantId, request.query.q);
    },
  );
}
