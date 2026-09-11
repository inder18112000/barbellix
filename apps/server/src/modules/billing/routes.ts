import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
  memberIdParamSchema,
  checkoutSessionSchema,
  markPaidSchema,
  updateMembershipDatesSchema,
  initiateCashPaymentSchema,
  confirmCashPaymentSchema,
} from './schemas.js';
import * as billingService from './service.js';

// Keys rate limits by the member the action is about (route param), not the admin performing it -
// bounds SMS sent to any one member regardless of which admin account triggers it. Route params
// are already parsed by the time rate-limit's keyGenerator runs (onRequest, after routing), so
// this needs no JWT-decoding workaround the way per-caller limiters elsewhere in this codebase do.
function memberIdRateLimitKey(request: FastifyRequest) {
  return (request.params as { memberId: string }).memberId;
}

export default async function billingRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const preHandler = [fastify.authenticate, fastify.requireRole('admin', 'superadmin')];

  app.get('/admin/membership-plans', { preHandler }, async (request) => {
    return billingService.listPlans(request.user.tenantId);
  });

  app.post(
    '/admin/membership-plans',
    { schema: { body: createPlanSchema }, preHandler },
    async (request, reply) => {
      const plan = await billingService.createPlan(request.user.tenantId, request.body);
      return reply.status(201).send(plan);
    },
  );

  app.put(
    '/admin/membership-plans/:planId',
    { schema: { params: planIdParamSchema, body: updatePlanSchema }, preHandler },
    async (request) => {
      return billingService.updatePlan(request.user.tenantId, request.params.planId, request.body);
    },
  );

  app.post(
    '/admin/members/:memberId/membership/checkout-session',
    { schema: { params: memberIdParamSchema, body: checkoutSessionSchema }, preHandler },
    async (request) => {
      // memberEmail/phone are looked up from the roster rather than trusted from the request body -
      // the checkout session must be for the real member's real contact details.
      return billingService.createCheckoutSessionForMember(
        request.user.tenantId,
        request.params.memberId,
        request.body.planId,
        fastify.config,
        request.body.returnUrl,
      );
    },
  );

  app.post(
    '/admin/members/:memberId/membership/mark-paid',
    { schema: { params: memberIdParamSchema, body: markPaidSchema }, preHandler },
    async (request) => {
      return billingService.markPaid(request.user.tenantId, request.params.memberId, request.body.planName);
    },
  );

  app.put(
    '/admin/members/:memberId/membership/dates',
    { schema: { params: memberIdParamSchema, body: updateMembershipDatesSchema }, preHandler },
    async (request) => {
      return billingService.updateMembershipDates(request.user.tenantId, request.params.memberId, request.body);
    },
  );

  app.get(
    '/admin/members/:memberId/payment-history',
    { schema: { params: memberIdParamSchema }, preHandler },
    async (request) => {
      return billingService.getPaymentHistory(request.user.tenantId, request.params.memberId);
    },
  );

  app.get('/admin/payment-gateway-status', { preHandler }, async () => {
    return billingService.getPaymentGatewayStatus();
  });

  // Cash-payment OTP confirmation - member gets a code by SMS, admin re-enters it to confirm the
  // payment happened with the member's knowledge. Rate-limited per member (not per admin) since
  // SMS costs money and this is the surface most exposed to spam/abuse.
  app.post(
    '/admin/members/:memberId/cash-payment/initiate',
    {
      schema: { params: memberIdParamSchema, body: initiateCashPaymentSchema },
      preHandler,
      config: { rateLimit: { max: 3, timeWindow: '1 hour', keyGenerator: memberIdRateLimitKey } },
    },
    async (request) => {
      return billingService.initiateCashPayment(request.user.tenantId, request.params.memberId, request.user.sub, request.body);
    },
  );

  app.post(
    '/admin/members/:memberId/cash-payment/confirm',
    {
      schema: { params: memberIdParamSchema, body: confirmCashPaymentSchema },
      preHandler,
      config: { rateLimit: { max: 10, timeWindow: '1 hour', keyGenerator: memberIdRateLimitKey } },
    },
    async (request) => {
      return billingService.confirmCashPayment(request.user.tenantId, request.params.memberId, request.body);
    },
  );

  // Manual, admin-triggered payment-due push - deliberately not a scheduled reminder job (see
  // billing/service.ts's sendPaymentReminder doc comment). Rate-limited per member so repeated
  // clicks can't spam one person.
  app.post(
    '/admin/members/:memberId/payment-reminder',
    {
      schema: { params: memberIdParamSchema },
      preHandler,
      config: { rateLimit: { max: 1, timeWindow: '6 hours', keyGenerator: memberIdRateLimitKey } },
    },
    async (request) => {
      return billingService.sendPaymentReminder(request.user.tenantId, request.params.memberId);
    },
  );

  // Self-service equivalents of the admin actions above - a member paying for their own
  // membership from the mobile app, scoped to request.user.sub rather than a memberId param.
  app.post(
    '/me/membership/checkout-session',
    { schema: { body: checkoutSessionSchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return billingService.createCheckoutSessionForMember(
        request.user.tenantId,
        request.user.sub,
        request.body.planId,
        fastify.config,
        request.body.returnUrl,
      );
    },
  );

  app.get('/me/membership', { preHandler: [fastify.authenticate] }, async (request) => {
    return billingService.getMembershipForSelf(request.user.sub);
  });

  app.get('/me/membership-plans', { preHandler: [fastify.authenticate] }, async (request) => {
    return billingService.listActivePlans(request.user.tenantId);
  });
}
