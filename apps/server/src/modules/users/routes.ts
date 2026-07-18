import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { updateProfileSchema, updateNotificationPreferencesSchema } from './schemas.js';
import * as usersService from './service.js';

export default async function usersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get('/me', { preHandler: [fastify.authenticate] }, async (request) => {
    return usersService.getMe(request.user.sub);
  });

  app.put(
    '/me/profile',
    { schema: { body: updateProfileSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return usersService.updateMyProfile(request.user.sub, request.body);
    },
  );

  app.get(
    '/me/notification-preferences',
    { preHandler: [fastify.authenticate] },
    async (request) => {
      return usersService.getNotificationPreferences(request.user.sub);
    },
  );

  app.put(
    '/me/notification-preferences',
    { schema: { body: updateNotificationPreferencesSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return usersService.updateNotificationPreferences(request.user.sub, request.body);
    },
  );
}
