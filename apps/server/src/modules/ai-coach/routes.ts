import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { completeChatSchema, recommendationIdParamSchema } from './schemas.js';
import * as aiCoachService from './service.js';

export default async function aiCoachRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();

  app.get('/ai/recommendations', { preHandler: [fastify.authenticate] }, async (request) => {
    return aiCoachService.getRecommendations(request.user.sub);
  });

  app.post(
    '/ai/recommendations/:id/accept',
    { schema: { params: recommendationIdParamSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return aiCoachService.acceptRecommendation(request.user.sub, request.params.id);
    },
  );

  app.post(
    '/ai/coach/complete',
    {
      schema: { body: completeChatSchema },
      preHandler: [fastify.authenticate],
      // Per-user (not per-IP): this endpoint now fans out to a shared server-side
      // key pool across every user, unlike before when each user needed their own
      // provider key. 20/hour is a placeholder until per-tenant key overrides exist.
      //
      // Rate-limit's keyGenerator runs at the onRequest stage, before the
      // preHandler auth check above has populated request.user - so it decodes
      // the JWT itself here just to extract the user id for bucketing. This is
      // safe because it's only used to group requests, not to authorize the
      // request; fastify.authenticate still does the real verification.
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 hour',
          keyGenerator: (request: FastifyRequest) => {
            const header = request.headers.authorization;
            const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
            const decoded = token ? (fastify.jwt.decode(token) as { sub?: string } | null) : null;
            return decoded?.sub ?? request.ip;
          },
        },
      },
    },
    async (request) => {
      const result = await aiCoachService.completeChat(
        fastify,
        request.user.sub,
        request.body.history,
        request.body.userMessage,
      );
      return result;
    },
  );
}
