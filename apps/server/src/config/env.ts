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
  GROQ_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  // Stripe: STRIPE_SECRET_KEY absent -> billing module still works for plan CRUD/manual
  // mark-paid, just without real checkout sessions (see lib/stripe.ts's isConfigured()).
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SUCCESS_URL: z.string().default('http://localhost:5173/billing/success'),
  STRIPE_CANCEL_URL: z.string().default('http://localhost:5173/billing/cancel'),
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
