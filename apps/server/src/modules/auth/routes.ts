import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { loginSchema, registerSchema, forgotPasswordSchema, redeemPairingTokenSchema } from '@barbellix/shared';
import * as authService from './service.js';

const refreshBodySchema = z.object({ refreshToken: z.string().min(1) });

export default async function authRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.post(
    '/register',
    { schema: { body: registerSchema }, config: { rateLimit: { max: 5, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const result = await authService.register(fastify, request.body);
      return reply.status(201).send(result);
    },
  );

  // IP-keyed (the default) rather than per-account, since the account isn't known until after
  // the password is checked - this is what stops credential-stuffing sweeps across many emails
  // from one source, not just repeated guesses against one account.
  app.post(
    '/login',
    { schema: { body: loginSchema }, config: { rateLimit: { max: 10, timeWindow: '15 minutes' } } },
    async (request) => {
      return authService.login(fastify, request.body);
    },
  );

  // Public - identity is proven by possessing the (single-use, short-lived) QR pairing token
  // itself, not by a bearer session. See lib/pairingToken.ts. Rate-limited anyway to slow down
  // naive scanning of the token space, even though 24 random bytes makes brute force infeasible.
  app.post(
    '/pair',
    { schema: { body: redeemPairingTokenSchema }, config: { rateLimit: { max: 20, timeWindow: '1 hour' } } },
    async (request) => {
      return authService.pairDevice(fastify, request.body.token);
    },
  );

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

  app.post(
    '/forgot-password',
    { schema: { body: forgotPasswordSchema }, config: { rateLimit: { max: 3, timeWindow: '1 hour' } } },
    async (request) => {
      return authService.forgotPassword(fastify, request.body.email);
    },
  );
}
