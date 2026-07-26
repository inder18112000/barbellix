import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
  memberIdParamSchema,
  checkoutSessionSchema,
  markPaidSchema,
  updateMembershipDatesSchema,
} from './schemas.js';
import * as billingService from './service.js';

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
      // memberEmail is looked up from the roster rather than trusted from the request body -
      // the checkout session must be for the real member's real email.
      return billingService.createCheckoutSessionForMember(
        request.user.tenantId,
        request.params.memberId,
        request.body.planId,
        fastify.config,
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
}
