import type { FastifyInstance } from 'fastify';
import { constructWebhookEvent } from '../../lib/stripe.js';
import { handleWebhookEvent } from './service.js';

/**
 * Registered as its own plugin (not merged into billing/routes.ts) specifically so the raw-body
 * content-type parser below - required to verify Stripe's signature - stays scoped to this one
 * route via Fastify's plugin encapsulation, instead of breaking JSON parsing for every other
 * route in the app.
 */
export default async function stripeWebhookRoutes(fastify: FastifyInstance) {
  fastify.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_request, body, done) => {
    done(null, body);
  });

  // Public route - authenticated via Stripe's signature, not a JWT. Never trust this payload
  // without a verified signature.
  fastify.post('/webhooks/stripe', async (request, reply) => {
    const secret = fastify.config.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      request.log.warn('Received a Stripe webhook but STRIPE_WEBHOOK_SECRET is not configured');
      return reply.status(503).send({ message: 'Webhook not configured' });
    }

    const signature = request.headers['stripe-signature'];
    if (typeof signature !== 'string') {
      return reply.status(400).send({ message: 'Missing stripe-signature header' });
    }

    let event;
    try {
      event = constructWebhookEvent(request.body as Buffer, signature, secret);
    } catch (err) {
      request.log.warn({ err }, 'Stripe webhook signature verification failed');
      return reply.status(400).send({ message: 'Invalid signature' });
    }

    await handleWebhookEvent(event);
    return reply.status(200).send({ received: true });
  });
}
