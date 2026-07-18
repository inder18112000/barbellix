import { http, HttpResponse } from 'msw';
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
} from '../data';

const BASE = 'https://api.fitpulse.app/v1';

// Simulate network latency
const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const handlers = [
  // Auth
  http.post(`${BASE}/auth/login`, async () => {
    await delay();
    return HttpResponse.json({
      user: mockUser,
      accessToken: 'mock_jwt_token',
      refreshToken: 'mock_refresh_token',
    });
  }),

  http.post(`${BASE}/auth/register`, async () => {
    await delay();
    return HttpResponse.json({ message: 'Account created. Please verify your email.' });
  }),

  http.post(`${BASE}/auth/forgot-password`, async () => {
    await delay(600);
    return HttpResponse.json({ message: 'Password reset link sent. Check your inbox.' });
  }),

  http.post(`${BASE}/auth/logout`, async () => {
    await delay(200);
    return HttpResponse.json({ message: 'Logged out.' });
  }),

  http.post(`${BASE}/auth/refresh`, async () => {
    await delay(200);
    return HttpResponse.json({ accessToken: 'mock_jwt_token_refreshed', refreshToken: 'mock_refresh_token' });
  }),

  // Me
  http.get(`${BASE}/me`, async () => {
    await delay(200);
    return HttpResponse.json(mockUser);
  }),

  http.put(`${BASE}/me/profile`, async ({ request }) => {
    await delay();
    const body = await request.json();
    return HttpResponse.json({ ...mockUser, profile: { ...mockUser.profile, ...(body as object) } });
  }),

  // Attendance
  http.post(`${BASE}/attendance/check-in`, async () => {
    await delay(600);
    return HttpResponse.json({
      record: mockAttendanceHistory[0],
      summary: { ...mockAttendanceSummary, streak: mockAttendanceSummary.streak + 1 },
    });
  }),

  http.get(`${BASE}/attendance/history`, async () => {
    await delay();
    return HttpResponse.json(mockAttendanceHistory);
  }),

  http.get(`${BASE}/attendance/summary`, async () => {
    await delay(200);
    return HttpResponse.json(mockAttendanceSummary);
  }),

  // Exercises
  http.get(`${BASE}/exercises`, async ({ request }) => {
    await delay(300);
    const url = new URL(request.url);
    const search = url.searchParams.get('q')?.toLowerCase();
    const filtered = search
      ? mockExercises.filter((e) => e.name.toLowerCase().includes(search))
      : mockExercises;
    return HttpResponse.json(filtered);
  }),

  // Workout Plans
  http.get(`${BASE}/workout-plans`, async () => {
    await delay();
    return HttpResponse.json([mockPlan]);
  }),

  http.get(`${BASE}/workout-plans/:id`, async () => {
    await delay(200);
    return HttpResponse.json(mockPlan);
  }),

  // Workout Sessions
  http.get(`${BASE}/workout-sessions`, async () => {
    await delay();
    return HttpResponse.json(mockSessions);
  }),

  http.post(`${BASE}/workout-sessions`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as object;
    return HttpResponse.json({ id: `sess_new_${Date.now()}`, ...body }, { status: 201 });
  }),

  // Progress
  http.get(`${BASE}/progress/metrics`, async () => {
    await delay();
    return HttpResponse.json(mockBodyMetrics);
  }),

  http.post(`${BASE}/progress/metrics`, async ({ request }) => {
    await delay();
    const body = await request.json() as object;
    return HttpResponse.json({ id: `bm_new_${Date.now()}`, userId: mockUser.id, ...body }, { status: 201 });
  }),

  http.get(`${BASE}/progress/prs`, async () => {
    await delay();
    return HttpResponse.json(mockPRs);
  }),

  // AI
  http.get(`${BASE}/ai/recommendations`, async () => {
    await delay(300);
    return HttpResponse.json(mockRecommendations);
  }),

  http.post(`${BASE}/ai/recommend`, async () => {
    await delay(800);
    return HttpResponse.json(mockRecommendations[0]);
  }),

  http.post(`${BASE}/ai/recommendations/:id/accept`, async ({ params }) => {
    await delay(200);
    return HttpResponse.json({ id: params.id, accepted: true });
  }),

  // Admin Analytics
  http.get(`${BASE}/admin/analytics/attendance`, async () => {
    await delay();
    return HttpResponse.json(mockAttendanceAnalytics);
  }),

  // Trainer
  http.get(`${BASE}/trainer/members`, async () => {
    await delay();
    return HttpResponse.json(mockTrainerMembers);
  }),

  http.get(`${BASE}/trainer/stats`, async () => {
    await delay(200);
    return HttpResponse.json(mockTrainerStats);
  }),

  http.post(`${BASE}/trainer/members/:memberId/assign-plan`, async ({ params }) => {
    await delay(500);
    return HttpResponse.json({ memberId: params.memberId, planId: 'assigned', success: true });
  }),
];
