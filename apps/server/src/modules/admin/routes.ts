import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { updateBranchSchema, recentAttendanceQuerySchema } from './schemas.js';
import * as adminService from './service.js';

const memberIdParamSchema = z.object({ memberId: z.string() });

export default async function adminRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const preHandler = [fastify.authenticate, fastify.requireRole('admin', 'superadmin')];

  app.get('/admin/analytics/attendance', { preHandler }, async (request) => {
    return adminService.getAttendanceAnalytics(request.user.tenantId);
  });

  app.get('/admin/dashboard-stats', { preHandler }, async (request) => {
    return adminService.getDashboardStats(request.user.tenantId);
  });

  app.get('/admin/branch', { preHandler }, async (request) => {
    return adminService.getBranch(request.user.tenantId);
  });

  app.put(
    '/admin/branch',
    { schema: { body: updateBranchSchema }, preHandler },
    async (request) => {
      return adminService.updateBranch(request.user.tenantId, request.body);
    },
  );

  app.get(
    '/admin/attendance/recent',
    { schema: { querystring: recentAttendanceQuerySchema }, preHandler },
    async (request) => {
      return adminService.getRecentAttendance(request.user.tenantId, request.query.limit);
    },
  );

  app.get(
    '/admin/members/:memberId/progress',
    { schema: { params: memberIdParamSchema }, preHandler },
    async (request) => {
      return adminService.getMemberProgress(request.user.tenantId, request.params.memberId);
    },
  );
}
