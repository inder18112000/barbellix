import fp from 'fastify-plugin';
import mongoose from 'mongoose';
import type { FastifyInstance } from 'fastify';

export default fp(async function databasePlugin(fastify: FastifyInstance) {
  const { MONGODB_URI } = fastify.config;

  mongoose.connection.on('error', (err) => {
    fastify.log.error({ err }, 'MongoDB connection error');
  });

  await mongoose.connect(MONGODB_URI);
  fastify.log.info('MongoDB connected');

  fastify.addHook('onClose', async () => {
    await mongoose.disconnect();
  });
});
