import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
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

  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(usersRoutes);
  await app.register(exercisesRoutes);
  await app.register(workoutsRoutes);

  app.get('/health', async () => ({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  }));

  return app;
}
