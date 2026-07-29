import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@barbellix/shared';
import { ForbiddenError } from '../lib/errors.js';

export default fp(async function authPlugin(fastify: FastifyInstance) {
  await fastify.register(jwt, {
    secret: fastify.config.JWT_ACCESS_SECRET,
    sign: { expiresIn: fastify.config.JWT_ACCESS_EXPIRES_IN },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    await request.jwtVerify();
  });

  fastify.decorate('requireRole', (...roles: UserRole[]) => {
    return async (request: FastifyRequest, _reply: FastifyReply) => {
      if (!roles.includes(request.user.role)) {
        throw new ForbiddenError('Insufficient permissions');
      }
    };
  });
});
