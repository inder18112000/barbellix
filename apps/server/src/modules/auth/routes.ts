import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loginSchema, registerSchema, forgotPasswordSchema, redeemPairingTokenSchema } from '@barbellix/shared';
import * as authService from './service.js';

const refreshBodySchema = z.object({ refreshToken: z.string().min(1) });

export default async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post('/register', { schema: { body: registerSchema } }, async (request, reply) => {
    const result = await authService.register(fastify, request.body);
    return reply.status(201).send(result);
  });

  app.post('/login', { schema: { body: loginSchema } }, async (request) => {
    return authService.login(fastify, request.body);
  });

  // Public - identity is proven by possessing the (single-use, short-lived) QR pairing token
  // itself, not by a bearer session. See lib/pairingToken.ts.
  app.post('/pair', { schema: { body: redeemPairingTokenSchema } }, async (request) => {
    return authService.pairDevice(fastify, request.body.token);
  });

  app.post('/refresh', { schema: { body: refreshBodySchema } }, async (request) => {
    return authService.refresh(fastify, request.body.refreshToken);
  });

  app.post(
    '/logout',
    { schema: { body: refreshBodySchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      await authService.logout(request.body.refreshToken);
      return { message: 'Logged out' };
    },
  );

  app.post('/forgot-password', { schema: { body: forgotPasswordSchema } }, async (request) => {
    return authService.forgotPassword(fastify, request.body.email);
  });
}
