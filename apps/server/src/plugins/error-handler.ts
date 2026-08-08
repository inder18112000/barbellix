import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { FastifyInstance, FastifyError } from 'fastify';
import { AppError } from '../lib/errors.js';
import { Sentry } from '../lib/sentry.js';

export default fp(async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message });
    }

    if (error instanceof ZodError || error.code === 'FST_ERR_VALIDATION') {
      return reply.status(400).send({ message: error.message });
    }

    if (error.statusCode === 401 || (typeof error.code === 'string' && error.code.startsWith('FST_JWT'))) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // Only truly unexpected failures reach here - AppError/validation/auth cases all returned
    // above - so this is exactly the "something is actually broken" signal Sentry should see.
    Sentry.captureException(error);
    request.log.error(error);
    return reply.status(error.statusCode ?? 500).send({ message: 'Internal server error' });
  });
});
