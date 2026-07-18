import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { assignPlanSchema, memberIdParamSchema } from './schemas.js';
import * as trainerService from './service.js';

export default async function trainerRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const preHandler = [fastify.authenticate, fastify.requireRole('trainer', 'admin')];

  app.get('/trainer/members', { preHandler }, async (request) => {
    return trainerService.listMembers(request.user.tenantId);
  });

  app.get('/trainer/stats', { preHandler }, async (request) => {
    return trainerService.getStats(request.user.tenantId);
  });

  app.post(
    '/trainer/members/:memberId/assign-plan',
    { schema: { params: memberIdParamSchema, body: assignPlanSchema }, preHandler },
    async (request) => {
      return trainerService.assignPlan(
        request.user.sub,
        request.user.tenantId,
        request.params.memberId,
        request.body.planId,
      );
    },
  );
}
