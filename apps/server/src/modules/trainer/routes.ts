import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  assignPlanSchema,
  memberIdParamSchema,
  updateMemberStatusSchema,
  updateMemberInfoSchema,
  assignTrainerSchema,
  trainerIdParamSchema,
  setTrainerPermissionsSchema,
} from './schemas.js';
import * as trainerService from './service.js';

export default async function trainerRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  // 'superadmin' included alongside 'admin' - "gym owner" in the web dashboard is defined as
  // admin-or-superadmin, and the owner home page's real KPIs depend on these two routes.
  const preHandler = [fastify.authenticate, fastify.requireRole('trainer', 'admin', 'superadmin')];

  app.get('/trainer/members', { preHandler }, async (request) => {
    return trainerService.listMembers(request.user.tenantId, { id: request.user.sub, role: request.user.role });
  });

  app.get('/trainer/stats', { preHandler }, async (request) => {
    return trainerService.getStats(request.user.tenantId, { id: request.user.sub, role: request.user.role });
  });

  app.post(
    '/trainer/members/:memberId/assign-plan',
    { schema: { params: memberIdParamSchema, body: assignPlanSchema }, preHandler },
    async (request) => {
      return trainerService.assignPlan(
        { id: request.user.sub, role: request.user.role },
        request.user.tenantId,
        request.params.memberId,
        request.body.planId,
      );
    },
  );

  app.get(
    '/trainer/members/:memberId/injuries',
    { schema: { params: memberIdParamSchema }, preHandler },
    async (request) => {
      return trainerService.getMemberInjuries(
        { id: request.user.sub, role: request.user.role },
        request.user.tenantId,
        request.params.memberId,
      );
    },
  );

  app.get(
    '/trainer/available-trainers',
    { preHandler: [fastify.authenticate, fastify.requireRole('admin', 'superadmin')] },
    async (request) => {
      return trainerService.listAvailableTrainers(request.user.tenantId);
    },
  );

  // Path lives under /admin (not /trainer) since this is an owner-level governance action, same
  // convention as the member-status/info routes below - admin AND superadmin can call it, but the
  // service layer further restricts superadmin-reporting trainers to superadmin-only.
  app.patch(
    '/admin/trainers/:trainerId/permissions',
    {
      schema: { params: trainerIdParamSchema, body: setTrainerPermissionsSchema },
      preHandler: [fastify.authenticate, fastify.requireRole('admin', 'superadmin')],
    },
    async (request) => {
      return trainerService.setTrainerPermissions(
        request.user.tenantId,
        request.params.trainerId,
        request.body,
        request.user.role,
      );
    },
  );

  // Owner-level action, like suspend/status/info below - only admin/superadmin decide who a
  // member's trainer is, a trainer can't self-assign new members.
  app.patch(
    '/trainer/members/:memberId/assign-trainer',
    {
      schema: { params: memberIdParamSchema, body: assignTrainerSchema },
      preHandler: [fastify.authenticate, fastify.requireRole('admin', 'superadmin')],
    },
    async (request) => {
      return trainerService.assignTrainer(request.user.tenantId, request.params.memberId, request.body.trainerId);
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

  // Same admin-only scope as suspend/reactivate above - editing another member's contact info
  // is an owner-level action.
  app.patch(
    '/trainer/members/:memberId/info',
    {
      schema: { params: memberIdParamSchema, body: updateMemberInfoSchema },
      preHandler: [fastify.authenticate, fastify.requireRole('admin')],
    },
    async (request) => {
      return trainerService.updateMemberInfo(request.user.tenantId, request.params.memberId, request.body);
    },
  );

  app.post(
    '/trainer/members/:memberId/login-pairing',
    { schema: { params: memberIdParamSchema }, preHandler: [fastify.authenticate, fastify.requireRole('admin')] },
    async (request) => {
      return trainerService.generateLoginPairingToken(request.user.tenantId, request.params.memberId);
    },
  );
}
