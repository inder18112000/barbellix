import * as Sentry from '@sentry/react-native';

/** No-op when EXPO_PUBLIC_SENTRY_DSN is unset (e.g. local dev) - same "absent key disables the
 * feature" convention as EXPO_PUBLIC_API_BASE_URL and the server/web Sentry setups. Call once,
 * before the root component mounts, so startup crashes are captured too. Native crash capture
 * only takes effect in a real dev-client/EAS build, not Expo Go - see Sentry's Expo docs. */
export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
