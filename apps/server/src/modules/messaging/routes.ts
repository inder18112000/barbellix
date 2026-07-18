import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { sendMessageSchema, otherUserIdParamSchema, messageIdParamSchema } from './schemas.js';
import * as messagingService from './service.js';

export default async function messagingRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get(
    '/messages/:otherUserId',
    { schema: { params: otherUserIdParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return messagingService.getThread(request.user.sub, request.user.tenantId, request.params.otherUserId);
    },
  );

  app.post(
    '/messages',
    { schema: { body: sendMessageSchema }, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const message = await messagingService.sendMessage(
        request.user.sub,
        request.user.tenantId,
        request.body.recipientId,
        request.body.text,
      );
      return reply.status(201).send(message);
    },
  );

  app.put(
    '/messages/:id/read',
    { schema: { params: messageIdParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return messagingService.markMessageRead(request.params.id, request.user.sub);
    },
  );
}
