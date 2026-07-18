import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import * as workoutsService from './service.js';

const idParamSchema = z.object({ id: z.string() });

export default async function workoutsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get('/workout-plans', { preHandler: [fastify.authenticate] }, async (request) => {
    return workoutsService.listPlans(request.user.sub);
  });

  app.get(
    '/workout-plans/:id',
    { schema: { params: idParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return workoutsService.getPlan(request.params.id, request.user.sub);
    },
  );
}
