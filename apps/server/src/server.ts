import 'dotenv/config';
import { buildApp } from './app.js';
import { initSentry } from './lib/sentry.js';

initSentry(process.env.SENTRY_DSN);

const app = await buildApp();

try {
  await app.listen({ port: app.config.PORT, host: '0.0.0.0' });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
