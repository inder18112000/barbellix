import * as Sentry from '@sentry/node';

/** No-op when SENTRY_DSN is unset (e.g. local dev) - same "absent key disables the feature"
 * convention as the AI provider keys and Stripe in config/env.ts. Called from server.ts before
 * the Fastify app is built, so startup failures are captured too, not just request-time ones. */
export function initSentry(dsn: string | undefined) {
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
