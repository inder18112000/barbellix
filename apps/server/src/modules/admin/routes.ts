import type { FastifyInstance } from 'fastify';
import * as adminService from './service.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  const preHandler = [fastify.authenticate, fastify.requireRole('admin', 'superadmin')];

  fastify.get('/admin/analytics/attendance', { preHandler }, async (request) => {
    return adminService.getAttendanceAnalytics(request.user.tenantId);
  });
}
