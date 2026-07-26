import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createSponsorSchema, updateSponsorSchema, sponsorIdParamSchema } from './schemas.js';
import * as sponsorsService from './service.js';

export default async function sponsorsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const adminOnly = [fastify.authenticate, fastify.requireRole('admin', 'superadmin')];

  // Member-facing: any authenticated user in the tenant can see active sponsors.
  app.get('/sponsors', { preHandler: [fastify.authenticate] }, async (request) => {
    return sponsorsService.listActiveSponsors(request.user.tenantId);
  });

  app.get('/admin/sponsors', { preHandler: adminOnly }, async (request) => {
    return sponsorsService.listAllSponsors(request.user.tenantId);
  });

  app.post(
    '/admin/sponsors',
    { schema: { body: createSponsorSchema }, preHandler: adminOnly },
    async (request, reply) => {
      const sponsor = await sponsorsService.createSponsor(request.user.tenantId, request.body);
      return reply.status(201).send(sponsor);
    },
  );

  app.put(
    '/admin/sponsors/:sponsorId',
    { schema: { params: sponsorIdParamSchema, body: updateSponsorSchema }, preHandler: adminOnly },
    async (request) => {
      return sponsorsService.updateSponsor(request.user.tenantId, request.params.sponsorId, request.body);
    },
  );
}
