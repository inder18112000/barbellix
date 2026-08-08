import type { FastifyInstance } from 'fastify';
import type { AIMessage } from './providers/index.js';
import { aiCoachService } from './providers/index.js';
import { buildSystemPrompt } from './context-builder.js';
import { getRecommendations } from './recommendations.js';
import {
  generateWorkoutPlan as generateWorkoutPlanCore,
  generateDietPlan as generateDietPlanCore,
  regenerateWorkoutPlan as regenerateWorkoutPlanCore,
  generateFullPlan as generateFullPlanCore,
} from './plan-generator.js';
import { BadGatewayError } from '../../lib/errors.js';
import * as repo from './repository.js';

export { getRecommendations };

export async function generateWorkoutPlan(fastify: FastifyInstance, userId: string, tenantId: string, goal: string, daysPerWeek: number) {
  return generateWorkoutPlanCore(fastify, userId, tenantId, goal, daysPerWeek);
}

export async function generateDietPlan(fastify: FastifyInstance, userId: string, goal: string) {
  return generateDietPlanCore(fastify, userId, goal);
}

/** Powers the mobile AI goal wizard's single "generate everything" step. */
export async function generateFullPlan(fastify: FastifyInstance, userId: string, tenantId: string, goal: string, daysPerWeek: number) {
  return generateFullPlanCore(fastify, userId, tenantId, goal, daysPerWeek);
}

/** No fastify param needed unlike the two generators above - this is a pure deterministic
 * decision engine, not an LLM call (see plan-generator.ts's decidePlanChanges()). */
export async function regenerateWorkoutPlan(userId: string) {
  return regenerateWorkoutPlanCore(userId);
}

export async function acceptRecommendation(userId: string, recommendationId: string) {
  await repo.markAccepted(userId, recommendationId);
  return { id: recommendationId, accepted: true };
}

export async function completeChat(
  fastify: FastifyInstance,
  userId: string,
  history: AIMessage[],
  userMessage: string,
) {
  const systemPrompt = await buildSystemPrompt(userId);

  try {
    return await aiCoachService.complete({ systemPrompt, history, userMessage });
  } catch (err) {
    // Detailed per-provider errors are logged server-side only - never sent to the
    // client, which falls back to its own local keyword-based coach on a 502.
    fastify.log.error({ err }, 'AI coach: all providers failed');
    throw new BadGatewayError('AI coach is temporarily unavailable');
  }
}
