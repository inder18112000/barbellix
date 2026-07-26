import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  createTemplateSchema,
  updateTemplateSchema,
  templateIdParamSchema,
  sessionIdParamSchema,
  bookingIdParamSchema,
  scheduleQuerySchema,
} from './schemas.js';
import * as classesService from './service.js';

export default async function classesRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const staffPreHandler = [fastify.authenticate, fastify.requireRole('trainer', 'admin', 'superadmin')];

  // ─── Member-facing ────────────────────────────────────────────────────────────

  app.get(
    '/classes/schedule',
    { schema: { querystring: scheduleQuerySchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      const { branchId, from, to } = request.query;
      return classesService.getSchedule(request.user.tenantId, branchId, from, to, request.user.sub);
    },
  );

  app.post(
    '/classes/sessions/:sessionId/book',
    { schema: { params: sessionIdParamSchema }, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = await classesService.bookSession(request.user.tenantId, request.user.sub, request.params.sessionId);
      return reply.status(201).send(result);
    },
  );

  app.post(
    '/classes/bookings/:bookingId/cancel',
    { schema: { params: bookingIdParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return classesService.cancelMyBooking(request.user.tenantId, request.user.sub, request.params.bookingId);
    },
  );

  app.get('/classes/my-bookings', { preHandler: [fastify.authenticate] }, async (request) => {
    return classesService.getMyBookings(request.user.sub);
  });

  // ─── Trainer/admin management ───────────────────────────────────────────────

  app.get('/admin/class-templates', { preHandler: staffPreHandler }, async (request) => {
    return classesService.listTemplates(request.user.tenantId);
  });

  app.post(
    '/admin/class-templates',
    { schema: { body: createTemplateSchema }, preHandler: staffPreHandler },
    async (request, reply) => {
      const template = await classesService.createTemplate(request.user.tenantId, request.body);
      return reply.status(201).send(template);
    },
  );

  app.put(
    '/admin/class-templates/:templateId',
    { schema: { params: templateIdParamSchema, body: updateTemplateSchema }, preHandler: staffPreHandler },
    async (request) => {
      return classesService.updateTemplate(request.user.tenantId, request.params.templateId, request.body);
    },
  );

  app.get(
    '/admin/class-sessions/:sessionId/roster',
    { schema: { params: sessionIdParamSchema }, preHandler: staffPreHandler },
    async (request) => {
      return classesService.getRoster(request.user.tenantId, request.params.sessionId);
    },
  );
}
