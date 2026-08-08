import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createExerciseSchema, updateExerciseSchema, exerciseIdParamSchema } from './schemas.js';
import { ValidationError } from '../../lib/errors.js';
import * as exercisesService from './service.js';

const querySchema = z.object({ q: z.string().optional() });

export default async function exercisesRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const staffPreHandler = [fastify.authenticate, fastify.requireRole('trainer', 'admin', 'superadmin')];

  app.get(
    '/exercises',
    { schema: { querystring: querySchema }, preHandler: [fastify.authenticate] },
    async (request) => {
      return exercisesService.searchExercises(request.user.tenantId, request.query.q);
    },
  );

  app.post(
    '/exercises',
    { schema: { body: createExerciseSchema }, preHandler: staffPreHandler },
    async (request, reply) => {
      const exercise = await exercisesService.createExercise(
        request.user.tenantId,
        { id: request.user.sub, role: request.user.role },
        request.body,
      );
      return reply.status(201).send(exercise);
    },
  );

  app.patch(
    '/exercises/:id',
    { schema: { params: exerciseIdParamSchema, body: updateExerciseSchema }, preHandler: staffPreHandler },
    async (request) => {
      return exercisesService.updateExercise(
        request.user.tenantId,
        { id: request.user.sub, role: request.user.role },
        request.params.id,
        request.body,
      );
    },
  );

  app.delete(
    '/exercises/:id',
    { schema: { params: exerciseIdParamSchema }, preHandler: staffPreHandler },
    async (request) => {
      return exercisesService.deleteExercise(
        request.user.tenantId,
        { id: request.user.sub, role: request.user.role },
        request.params.id,
      );
    },
  );

  app.post(
    '/exercises/:id/video',
    { schema: { params: exerciseIdParamSchema }, preHandler: staffPreHandler },
    async (request) => {
      const upload = await request.file();
      if (!upload) throw new ValidationError('No video file provided');

      return exercisesService.uploadExerciseVideo(
        request.user.tenantId,
        { id: request.user.sub, role: request.user.role },
        request.params.id,
        upload.file,
        upload.mimetype,
      );
    },
  );
}
