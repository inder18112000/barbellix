import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { registerDeviceTokenSchema, deviceTokenParamSchema } from './schemas.js';
import * as notificationsService from './service.js';

export default async function notificationsRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/me/device-tokens',
    { schema: { body: registerDeviceTokenSchema }, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const result = await notificationsService.registerDeviceToken(request.user.sub, request.user.tenantId, request.body);
      return reply.status(201).send(result);
    },
  );

  app.delete(
    '/me/device-tokens/:token',
    { schema: { params: deviceTokenParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return notificationsService.unregisterDeviceToken(request.params.token);
    },
  );
}
