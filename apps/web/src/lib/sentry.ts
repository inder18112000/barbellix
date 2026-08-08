import * as Sentry from '@sentry/react'

/** No-op when VITE_SENTRY_DSN is unset (e.g. local dev) - same "absent key disables the feature"
 * convention the server uses (see apps/server/src/lib/sentry.ts). Call once, before the first
 * render, so render-time errors are captured too. */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  })
}

export { Sentry }
