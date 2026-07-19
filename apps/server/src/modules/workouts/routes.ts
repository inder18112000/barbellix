import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { logSessionSchema, createPlanSchema } from './schemas.js';
import * as workoutsService from './service.js';

const idParamSchema = z.object({ id: z.string() });

export default async function workoutsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get('/workout-plans', { preHandler: [fastify.authenticate] }, async (request) => {
    return workoutsService.listPlans(request.user.sub);
  });

  app.post(
    '/workout-plans',
    { schema: { body: createPlanSchema }, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const plan = await workoutsService.createPlan(request.user.sub, request.user.role, request.body);
      return reply.status(201).send(plan);
    },
  );

  app.get(
    '/workout-plans/:id',
    { schema: { params: idParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return workoutsService.getPlan(request.params.id, request.user.sub);
    },
  );

  app.get('/workout-sessions', { preHandler: [fastify.authenticate] }, async (request) => {
    return workoutsService.listSessions(request.user.sub);
  });

  app.post(
    '/workout-sessions',
    { schema: { body: logSessionSchema }, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const session = await workoutsService.logSession(request.user.sub, request.body);
      return reply.status(201).send(session);
    },
  );
}
