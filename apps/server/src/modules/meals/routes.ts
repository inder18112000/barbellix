import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createMealSchema, updateMealSchema, mealIdParamSchema, mealQuerySchema } from './schemas.js';
import * as mealsService from './service.js';

export default async function mealsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const staffPreHandler = [fastify.authenticate, fastify.requireRole('trainer', 'admin', 'superadmin')];

  app.get(
    '/meals',
    { schema: { querystring: mealQuerySchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return mealsService.searchMeals(request.user.tenantId, request.query.q);
    },
  );

  app.post(
    '/meals',
    { schema: { body: createMealSchema }, preHandler: staffPreHandler },
    async (request, reply) => {
      const meal = await mealsService.createMeal(
        request.user.tenantId,
        { id: request.user.sub, role: request.user.role },
        request.body,
      );
      return reply.status(201).send(meal);
    },
  );

  app.patch(
    '/meals/:id',
    { schema: { params: mealIdParamSchema, body: updateMealSchema }, preHandler: staffPreHandler },
    async (request) => {
      return mealsService.updateMeal(
        request.user.tenantId,
        { id: request.user.sub, role: request.user.role },
        request.params.id,
        request.body,
      );
    },
  );

  app.delete(
    '/meals/:id',
    { schema: { params: mealIdParamSchema }, preHandler: staffPreHandler },
    async (request) => {
      return mealsService.deleteMeal(
        request.user.tenantId,
        { id: request.user.sub, role: request.user.role },
        request.params.id,
      );
    },
  );
}
