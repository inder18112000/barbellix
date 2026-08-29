import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().default(30),
  // Comma-separated list, e.g. "http://localhost:8081,http://localhost:5173" so the mobile
  // (Expo web, :8081) and web (Vite, :5173) dev servers can both hit the API at once.
  CORS_ORIGIN: z
    .string()
    .default('*')
    .transform((val) => (val === '*' ? true : val.split(',').map((origin) => origin.trim()))),
  // Error monitoring - absent means Sentry.init() is skipped entirely (see lib/sentry.ts), so
  // local dev works unchanged with no account needed. Same optional-key convention as the AI
  // provider keys below.
  SENTRY_DSN: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Absolute origin this server is reachable at, used to build URLs for locally-stored uploads
  // (lib/storage.ts). Defaults to http://localhost:${PORT} - only needs setting in a real
  // deployment where the public origin differs from that.
  PUBLIC_URL: z.string().optional(),
  // Object storage backend for uploaded media (avatars, exercise videos) - 'local' (default)
  // writes to apps/server/uploads/; 'gcs' needs GCS_BUCKET_NAME and either GCS_CREDENTIALS_JSON
  // or a GOOGLE_APPLICATION_CREDENTIALS file path (standard Google SDK convention). See
  // lib/storage.ts.
  STORAGE_BACKEND: z.enum(['local', 'gcs']).default('local'),
  GCS_BUCKET_NAME: z.string().optional(),
  GCS_CREDENTIALS_JSON: z.string().optional(),
  // OAuth client ID from Google Cloud Console (APIs & Services > Credentials) - absent means
  // POST /auth/google rejects with a clear "not configured" error instead of a crash (see
  // lib/googleAuth.ts). The web and mobile clients need this same value on their side too, since
  // Google Identity Services ties the ID token's audience to whichever client ID requested it.
  GOOGLE_CLIENT_ID: z.string().optional(),
  // SMS delivery for cash-payment OTP confirmation - swappable backend, same convention as
  // STORAGE_BACKEND above; only 'twilio' exists today. Absent Twilio credentials means the
  // cash-payment OTP flow rejects clearly (see lib/sms.ts) rather than crashing.
  SMS_PROVIDER: z.enum(['twilio']).default('twilio'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  // Cashfree payment gateway (replaces Stripe) - Orders API for one-time payment collection, not
  // their Subscriptions product (this app's philosophy is lazy/on-demand checks, not
  // scheduled-job-driven auto-renewal - see billing/service.ts's isAccessBlocked()). Absent means
  // plan CRUD still works (no real gateway ids attached), same "optional key disables just the
  // live-checkout path" convention as Stripe had.
  CASHFREE_APP_ID: z.string().optional(),
  CASHFREE_SECRET_KEY: z.string().optional(),
  CASHFREE_ENV: z.enum(['sandbox', 'production']).default('sandbox'),
  CASHFREE_WEBHOOK_SECRET: z.string().optional(),
  CASHFREE_RETURN_URL: z.string().default('http://localhost:5173/billing/return'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return result.data;
}
