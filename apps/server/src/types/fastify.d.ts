import type { FastifyRequest, FastifyReply } from 'fastify';
import type { UserRole } from '@barbellix/shared';

export interface AuthUser {
  sub: string;
  tenantId: string;
  role: UserRole;
  branchId?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AuthUser;
    user: AuthUser;
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireRole: (...roles: UserRole[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
