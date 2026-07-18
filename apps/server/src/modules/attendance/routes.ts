import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { checkInSchema } from './schemas.js';
import * as attendanceService from './service.js';

export default async function attendanceRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/attendance/check-in',
    { schema: { body: checkInSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return attendanceService.checkIn(request.user.sub, request.user.tenantId, request.body);
    },
  );

  app.get('/attendance/history', { preHandler: [fastify.authenticate] }, async (request) => {
    return attendanceService.getHistory(request.user.sub);
  });

  app.get('/attendance/summary', { preHandler: [fastify.authenticate] }, async (request) => {
    return attendanceService.computeSummary(request.user.sub);
  });
}
