import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { trainerIdParamSchema, updateReportsToSchema } from './schemas.js';
import * as superadminService from './service.js';

/** Every route here is superadmin-only (never admin) - this module exists specifically to give
 * the superadmin role a real, distinct capability instead of it being an unused alias for admin. */
export default async function superadminRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  fastify.get(
    '/superadmin/tenants',
    { preHandler: [fastify.authenticate, fastify.requireRole('superadmin')] },
    async () => {
      return superadminService.listTenants();
    },
  );

  app.patch(
    '/superadmin/trainers/:trainerId/reports-to',
    {
      schema: { params: trainerIdParamSchema, body: updateReportsToSchema },
      preHandler: [fastify.authenticate, fastify.requireRole('superadmin')],
    },
    async (request) => {
      return superadminService.setTrainerReportsTo(request.params.trainerId, request.body.reportsToRole);
    },
  );
}
