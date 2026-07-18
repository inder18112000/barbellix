import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { logMetricSchema } from './schemas.js';
import * as progressService from './service.js';

export default async function progressRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get('/progress/metrics', { preHandler: [fastify.authenticate] }, async (request) => {
    return progressService.listMetrics(request.user.sub);
  });

  app.post(
    '/progress/metrics',
    { schema: { body: logMetricSchema }, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const metric = await progressService.logMetric(request.user.sub, request.body);
      return reply.status(201).send(metric);
    },
  );

  app.get('/progress/prs', { preHandler: [fastify.authenticate] }, async (request) => {
    return progressService.listPRs(request.user.sub);
  });
}
