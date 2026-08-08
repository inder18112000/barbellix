import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app.js';
import { initSentry } from '../src/lib/sentry.js';

initSentry(process.env.SENTRY_DSN);

// Cached at module scope so a warm Vercel function instance reuses the same Fastify app - and
// therefore the same MongoDB connection (see src/plugins/database.ts) - across invocations
// instead of rebuilding/reconnecting on every request. A cold instance builds it exactly once;
// concurrent requests during that first build all await the same in-flight promise rather than
// racing to build it multiple times.
let appPromise: Promise<FastifyInstance> | undefined;

async function getApp(): Promise<FastifyInstance> {
  if (!appPromise) {
    appPromise = buildApp();
  }
  const app = await appPromise;
  await app.ready();
  return app;
}

// Fastify's documented Vercel integration pattern: don't call app.listen() (there's no long-lived
// process to listen with), just hand the raw req/res to Fastify's underlying Node HTTP server.
// See https://fastify.dev/docs/latest/Guides/Serverless/#vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  app.server.emit('request', req, res);
}
