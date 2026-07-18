import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { logMealSchema } from './schemas.js';
import * as nutritionService from './service.js';

const idParamSchema = z.object({ id: z.string() });

export default async function nutritionRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get('/nutrition/meals/today', { preHandler: [fastify.authenticate] }, async (request) => {
    return nutritionService.listToday(request.user.sub);
  });

  app.post(
    '/nutrition/meals',
    { schema: { body: logMealSchema }, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const meal = await nutritionService.logMeal(request.user.sub, request.body);
      return reply.status(201).send(meal);
    },
  );

  app.delete(
    '/nutrition/meals/:id',
    { schema: { params: idParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return nutritionService.deleteMeal(request.params.id, request.user.sub);
    },
  );
}
