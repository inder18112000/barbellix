import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { completeChatSchema, generateWorkoutPlanSchema, generateDietPlanSchema, recommendationIdParamSchema } from './schemas.js';
import * as aiCoachService from './service.js';

function rateLimitKeyGenerator(fastify: FastifyInstance) {
  // Rate-limit's keyGenerator runs at the onRequest stage, before the preHandler auth check has
  // populated request.user - so it decodes the JWT itself here just to extract the user id for
  // bucketing. Safe because it's only used to group requests, not to authorize them.
  return (request: FastifyRequest) => {
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    const decoded = token ? (fastify.jwt.decode(token) as { sub?: string } | null) : null;
    return decoded?.sub ?? request.ip;
  };
}

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
      config: { rateLimit: { max: 20, timeWindow: '1 hour', keyGenerator: rateLimitKeyGenerator(fastify) } },
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

  app.post(
    '/ai/coach/generate-plan',
    {
      schema: { body: generateWorkoutPlanSchema },
      preHandler: [fastify.authenticate],
      // Lower ceiling than /complete - a full structured plan is a much heavier generation
      // (thousands of tokens) than a short chat reply.
      config: { rateLimit: { max: 8, timeWindow: '1 hour', keyGenerator: rateLimitKeyGenerator(fastify) } },
    },
    async (request, reply) => {
      const plan = await aiCoachService.generateWorkoutPlan(
        fastify,
        request.user.sub,
        request.user.tenantId,
        request.body.goal,
        request.body.daysPerWeek,
      );
      return reply.status(201).send(plan);
    },
  );

  app.post(
    '/ai/coach/generate-diet-plan',
    {
      schema: { body: generateDietPlanSchema },
      preHandler: [fastify.authenticate],
      config: { rateLimit: { max: 8, timeWindow: '1 hour', keyGenerator: rateLimitKeyGenerator(fastify) } },
    },
    async (request, reply) => {
      const plan = await aiCoachService.generateDietPlan(fastify, request.user.sub, request.body.goal);
      return reply.status(201).send(plan);
    },
  );
}
