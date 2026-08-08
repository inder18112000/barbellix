import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import mongoose from 'mongoose';
import { validatorCompiler, serializerCompiler } from 'fastify-type-provider-zod';
import configPlugin from './plugins/config.js';
import databasePlugin from './plugins/database.js';
import authPlugin from './plugins/auth.js';
import errorHandlerPlugin from './plugins/error-handler.js';
import authRoutes from './modules/auth/routes.js';
import usersRoutes from './modules/users/routes.js';
import exercisesRoutes from './modules/exercises/routes.js';
import workoutsRoutes from './modules/workouts/routes.js';
import attendanceRoutes from './modules/attendance/routes.js';
import progressRoutes from './modules/progress/routes.js';
import nutritionRoutes from './modules/nutrition/routes.js';
import mealsRoutes from './modules/meals/routes.js';
import uploadsRoutes from './modules/uploads/routes.js';
import habitsRoutes from './modules/habits/routes.js';
import trainerRoutes from './modules/trainer/routes.js';
import adminRoutes from './modules/admin/routes.js';
import messagingRoutes from './modules/messaging/routes.js';
import aiCoachRoutes from './modules/ai-coach/routes.js';
import billingRoutes from './modules/billing/routes.js';
import stripeWebhookRoutes from './modules/billing/webhookRoutes.js';
import sponsorsRoutes from './modules/sponsors/routes.js';
import classesRoutes from './modules/classes/routes.js';
import notificationsRoutes from './modules/notifications/routes.js';
import superadminRoutes from './modules/superadmin/routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: {
      transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
    },
  });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(configPlugin);
  await app.register(errorHandlerPlugin);
  await app.register(cors, { origin: app.config.CORS_ORIGIN });
  await app.register(helmet);
  await app.register(databasePlugin);
  await app.register(authPlugin);
  // global: false - only routes that explicitly opt in via config.rateLimit are limited
  await app.register(rateLimit, { global: false });
  // Video uploads only (exercises/routes.ts's POST /exercises/:id/video) - the JSON body parser's
  // default limit is unrelated and unaffected by this.
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } });

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(usersRoutes);
  await app.register(exercisesRoutes);
  await app.register(workoutsRoutes);
  await app.register(attendanceRoutes);
  await app.register(progressRoutes);
  await app.register(nutritionRoutes);
  await app.register(mealsRoutes);
  await app.register(uploadsRoutes);
  await app.register(habitsRoutes);
  await app.register(trainerRoutes);
  await app.register(adminRoutes);
  await app.register(messagingRoutes);
  await app.register(aiCoachRoutes);
  await app.register(billingRoutes);
  await app.register(stripeWebhookRoutes);
  await app.register(sponsorsRoutes);
  await app.register(classesRoutes);
  await app.register(notificationsRoutes);
  await app.register(superadminRoutes);

  app.get('/health', async () => ({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  }));

  return app;
}
