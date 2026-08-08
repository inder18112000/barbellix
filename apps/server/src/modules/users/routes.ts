import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { changePasswordSchema } from '@barbellix/shared';
import { updateProfileSchema, updateNotificationPreferencesSchema, updateMyInfoSchema, addInjurySchema, injuryIdParamSchema } from './schemas.js';
import * as usersService from './service.js';

export default async function usersRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get('/me', { preHandler: [fastify.authenticate] }, async (request) => {
    return usersService.getMe(request.user.sub);
  });

  app.put(
    '/me',
    { schema: { body: updateMyInfoSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return usersService.updateMyInfo(request.user.sub, request.body);
    },
  );

  app.put(
    '/me/password',
    { schema: { body: changePasswordSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return usersService.changeMyPassword(request.user.sub, request.body.currentPassword, request.body.newPassword);
    },
  );

  app.put(
    '/me/profile',
    { schema: { body: updateProfileSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return usersService.updateMyProfile(request.user.sub, request.body);
    },
  );

  app.post(
    '/me/injuries',
    { schema: { body: addInjurySchema }, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await usersService.addMyInjury(request.user.sub, request.body);
      return reply.status(201).send(user);
    },
  );

  app.delete(
    '/me/injuries/:id',
    { schema: { params: injuryIdParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return usersService.removeMyInjury(request.user.sub, request.params.id);
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
