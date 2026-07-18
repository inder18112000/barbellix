/**
 * React Native-compatible mock server.
 * Patches global.fetch to intercept API calls — no Node.js built-ins required.
 * (msw/node uses async_hooks which doesn't exist in Hermes/JSC)
 */
import {
  mockUser,
  mockSessions,
  mockPlan,
  mockExercises,
  mockAttendanceSummary,
  mockAttendanceHistory,
  mockBodyMetrics,
  mockPRs,
  mockRecommendations,
  mockAttendanceAnalytics,
  mockTrainerMembers,
  mockTrainerStats,
  mockMeals,
  mockHabitLog,
} from './data';

const BASE = 'https://api.fitpulse.app/v1';
const delay = (ms = 400) => new Promise<void>((r) => setTimeout(r, ms));

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function body(init?: RequestInit): unknown {
  try {
    return init?.body ? JSON.parse(init.body as string) : {};
  } catch {
    return {};
  }
}

// Match a URL pathname against a pattern like /trainer/members/:memberId/assign-plan
function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patParts = pattern.split('/').filter(Boolean);
  const urlParts = pathname.split('/').filter(Boolean);
  if (patParts.length !== urlParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(':')) {
      params[patParts[i].slice(1)] = decodeURIComponent(urlParts[i]);
    } else if (patParts[i] !== urlParts[i]) {
      return null;
    }
  }
  return params;
}

type RouteHandler = (
  url: URL,
  init: RequestInit | undefined,
  params: Record<string, string>,
) => Promise<Response>;

const routes: Array<{ method: string; pattern: string; handler: RouteHandler }> = [
  // ── Auth ────────────────────────────────────────────────────────────────────
  {
    method: 'POST', pattern: '/auth/login',
    handler: async () => { await delay(); return json({ user: mockUser, accessToken: 'mock_jwt_token', refreshToken: 'mock_refresh_token' }); },
  },
  {
    method: 'POST', pattern: '/auth/register',
    handler: async () => { await delay(); return json({ message: 'Account created. Please verify your email.' }); },
  },
  {
    method: 'POST', pattern: '/auth/forgot-password',
    handler: async () => { await delay(600); return json({ message: 'Password reset link sent. Check your inbox.' }); },
  },
  {
    method: 'POST', pattern: '/auth/logout',
    handler: async () => { await delay(200); return json({ message: 'Logged out.' }); },
  },
  {
    method: 'POST', pattern: '/auth/refresh',
    handler: async () => { await delay(200); return json({ accessToken: 'mock_jwt_token_refreshed', refreshToken: 'mock_refresh_token' }); },
  },

  // ── Me ──────────────────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/me',
    handler: async () => { await delay(200); return json(mockUser); },
  },
  {
    method: 'PUT', pattern: '/me/profile',
    handler: async (_url, init) => {
      await delay();
      return json({ ...mockUser, profile: { ...mockUser.profile, ...(body(init) as object) } });
    },
  },

  // ── Attendance ──────────────────────────────────────────────────────────────
  {
    method: 'POST', pattern: '/attendance/check-in',
    handler: async () => {
      await delay(600);
      return json({ record: mockAttendanceHistory[0], summary: { ...mockAttendanceSummary, streak: mockAttendanceSummary.streak + 1 } });
    },
  },
  {
    method: 'GET', pattern: '/attendance/history',
    handler: async () => { await delay(); return json(mockAttendanceHistory); },
  },
  {
    method: 'GET', pattern: '/attendance/summary',
    handler: async () => { await delay(200); return json(mockAttendanceSummary); },
  },

  // ── Exercises ───────────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/exercises',
    handler: async (url) => {
      await delay(300);
      const search = url.searchParams.get('q')?.toLowerCase();
      const filtered = search
        ? mockExercises.filter((e) => e.name.toLowerCase().includes(search))
        : mockExercises;
      return json(filtered);
    },
  },

  // ── Workout Plans ───────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/workout-plans',
    handler: async () => { await delay(); return json([mockPlan]); },
  },
  {
    method: 'GET', pattern: '/workout-plans/:id',
    handler: async () => { await delay(200); return json(mockPlan); },
  },

  // ── Workout Sessions ────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/workout-sessions',
    handler: async () => { await delay(); return json(mockSessions); },
  },
  {
    method: 'POST', pattern: '/workout-sessions',
    handler: async (_url, init) => {
      await delay(500);
      return json({ id: `sess_new_${Date.now()}`, ...(body(init) as object) }, 201);
    },
  },

  // ── Progress ────────────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/progress/metrics',
    handler: async () => { await delay(); return json(mockBodyMetrics); },
  },
  {
    method: 'POST', pattern: '/progress/metrics',
    handler: async (_url, init) => {
      await delay();
      return json({ id: `bm_new_${Date.now()}`, userId: mockUser.id, recordedAt: new Date().toISOString(), ...(body(init) as object) }, 201);
    },
  },
  {
    method: 'GET', pattern: '/progress/prs',
    handler: async () => { await delay(); return json(mockPRs); },
  },

  // ── AI ──────────────────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/ai/recommendations',
    handler: async () => { await delay(300); return json(mockRecommendations); },
  },
  {
    method: 'POST', pattern: '/ai/recommend',
    handler: async () => { await delay(800); return json(mockRecommendations[0]); },
  },
  {
    method: 'POST', pattern: '/ai/recommendations/:id/accept',
    handler: async (_url, _init, params) => { await delay(200); return json({ id: params.id, accepted: true }); },
  },

  // ── Admin ───────────────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/admin/analytics/attendance',
    handler: async () => { await delay(); return json(mockAttendanceAnalytics); },
  },

  // ── Trainer ─────────────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/trainer/members',
    handler: async () => { await delay(); return json(mockTrainerMembers); },
  },
  {
    method: 'GET', pattern: '/trainer/stats',
    handler: async () => { await delay(200); return json(mockTrainerStats); },
  },
  {
    method: 'POST', pattern: '/trainer/members/:memberId/assign-plan',
    handler: async (_url, _init, params) => {
      await delay(500);
      return json({ memberId: params.memberId, planId: 'assigned', success: true });
    },
  },

  // ── Nutrition ────────────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/nutrition/meals/today',
    handler: async () => { await delay(300); return json(mockMeals); },
  },
  {
    method: 'POST', pattern: '/nutrition/meals',
    handler: async (_url, init) => {
      await delay(400);
      return json({
        id: `meal_${Date.now()}`,
        userId: mockUser.id,
        loggedAt: new Date().toISOString(),
        ...(body(init) as object),
      }, 201);
    },
  },
  {
    method: 'DELETE', pattern: '/nutrition/meals/:id',
    handler: async () => { await delay(200); return json({ success: true }); },
  },

  // ── Habits ──────────────────────────────────────────────────────────────────
  {
    method: 'GET', pattern: '/habits/today',
    handler: async () => { await delay(200); return json(mockHabitLog); },
  },
  {
    method: 'POST', pattern: '/habits/:habitId/toggle',
    handler: async (_url, _init, params) => {
      await delay(150);
      const existing = mockHabitLog.find((h) => h.habitId === params.habitId);
      return json({
        habitId: params.habitId,
        date: new Date().toISOString().slice(0, 10),
        completed: !existing?.completed,
        value: existing?.value,
      });
    },
  },
];

const originalFetch = global.fetch;

// Expose the real fetch globally so claude.ts can bypass the mock entirely.
// Must be set before startMockServer() replaces global.fetch.
(global as any)._realFetch = originalFetch;

export function startMockServer() {
  global.fetch = async function mockFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const reqUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;

    // Pass through requests that aren't aimed at our API
    if (!reqUrl.startsWith(BASE)) {
      return originalFetch(input, init);
    }

    const url = new URL(reqUrl);
    const method = (init?.method ?? (typeof input !== 'string' && !(input instanceof URL) ? (input as Request).method : undefined) ?? 'GET').toUpperCase();
    const pathname = url.pathname.replace(/^\/v1/, '');

    for (const route of routes) {
      if (route.method !== method) continue;
      const params = matchPath(route.pattern, pathname);
      if (params !== null) {
        return route.handler(url, init, params);
      }
    }

    console.warn(`[Mock] No handler for ${method} ${reqUrl}`);
    return new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  console.log('[FitPulse] 🟢 Mock server running');
}
