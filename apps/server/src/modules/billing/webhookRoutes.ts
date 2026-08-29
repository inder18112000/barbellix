import type { FastifyInstance } from 'fastify';
import { handleCashfreeWebhook } from './service.js';

/**
 * Registered as its own plugin (not merged into billing/routes.ts) specifically so the raw-body
 * content-type parser below - required to verify Cashfree's signature - stays scoped to this one
 * route via Fastify's plugin encapsulation, instead of breaking JSON parsing for every other
 * route in the app.
 */
export default async function cashfreeWebhookRoutes(fastify: FastifyInstance) {
  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
    done(null, body);
  });

  // Public route - authenticated via Cashfree's signature, not a JWT. Never trust this payload
  // without a verified signature.
  fastify.post('/webhooks/cashfree', async (request, reply) => {
    const signature = request.headers['x-webhook-signature'];
    const timestamp = request.headers['x-webhook-timestamp'];
    if (typeof signature !== 'string' || typeof timestamp !== 'string') {
      return reply.status(400).send({ message: 'Missing webhook signature headers' });
    }

    try {
      await handleCashfreeWebhook(request.body as string, signature, timestamp);
    } catch (err) {
      request.log.warn({ err }, 'Cashfree webhook signature verification failed');
      return reply.status(400).send({ message: 'Invalid signature' });
    }

    return reply.status(200).send({ received: true });
  });
}
