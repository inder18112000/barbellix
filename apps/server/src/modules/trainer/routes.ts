import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { assignPlanSchema, memberIdParamSchema, updateMemberStatusSchema } from './schemas.js';
import * as trainerService from './service.js';

export default async function trainerRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  // 'superadmin' included alongside 'admin' - "gym owner" in the web dashboard is defined as
  // admin-or-superadmin, and the owner home page's real KPIs depend on these two routes.
  const preHandler = [fastify.authenticate, fastify.requireRole('trainer', 'admin', 'superadmin')];

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

  // Suspending a member is an owner-level action, not something a trainer should be able to do -
  // admin only (superadmin excluded here on purpose, unlike the routes above: this is a
  // day-to-day gym-management action, not something needing platform-level access).
  app.patch(
    '/trainer/members/:memberId/status',
    {
      schema: { params: memberIdParamSchema, body: updateMemberStatusSchema },
      preHandler: [fastify.authenticate, fastify.requireRole('admin')],
    },
    async (request) => {
      return trainerService.updateMemberStatus(request.user.tenantId, request.params.memberId, request.body.status);
    },
  );
}
