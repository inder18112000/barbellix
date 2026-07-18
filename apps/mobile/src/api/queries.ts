import { api } from './client';
import type {
  User,
  WorkoutSession,
  WorkoutPlan,
  Exercise,
  AttendanceRecord,
  AttendanceSummary,
  BodyMetric,
  PersonalRecord,
  AIRecommendation,
  AttendanceAnalytics,
  TrainerMemberSummary,
  TrainerStats,
  MealEntry,
  HabitEntry,
} from '@fitpulse/shared';

// Query keys — centralised to avoid typos and enable targeted invalidation
export const queryKeys = {
  me: ['me'] as const,
  attendance: {
    summary: ['attendance', 'summary'] as const,
    history: ['attendance', 'history'] as const,
  },
  exercises: (search?: string) => ['exercises', search] as const,
  workoutPlans: ['workout-plans'] as const,
  workoutPlan: (id: string) => ['workout-plans', id] as const,
  workoutSessions: ['workout-sessions'] as const,
  progress: {
    metrics: ['progress', 'metrics'] as const,
    prs: ['progress', 'prs'] as const,
  },
  ai: {
    recommendations: ['ai', 'recommendations'] as const,
  },
  admin: {
    attendanceAnalytics: ['admin', 'analytics', 'attendance'] as const,
  },
  trainer: {
    members: ['trainer', 'members'] as const,
    stats:   ['trainer', 'stats'] as const,
  },
  nutrition: {
    today: ['nutrition', 'today'] as const,
  },
  habits: {
    today: ['habits', 'today'] as const,
  },
};

// ─── Query Functions ──────────────────────────────────────────────────────────

export const fetchMe = () => api.get<User>('/me');

export const fetchAttendanceSummary = () =>
  api.get<AttendanceSummary>('/attendance/summary');

export const fetchAttendanceHistory = () =>
  api.get<AttendanceRecord[]>('/attendance/history');

export const fetchExercises = (search?: string) =>
  api.get<Exercise[]>(`/exercises${search ? `?q=${search}` : ''}`);

export const fetchWorkoutPlans = () =>
  api.get<WorkoutPlan[]>('/workout-plans');

export const fetchWorkoutPlan = (id: string) =>
  api.get<WorkoutPlan>(`/workout-plans/${id}`);

export const fetchWorkoutSessions = () =>
  api.get<WorkoutSession[]>('/workout-sessions');

export const fetchProgressMetrics = () =>
  api.get<BodyMetric[]>('/progress/metrics');

export const fetchPersonalRecords = () =>
  api.get<PersonalRecord[]>('/progress/prs');

export const fetchAIRecommendations = () =>
  api.get<AIRecommendation[]>('/ai/recommendations');

export const fetchAdminAttendanceAnalytics = () =>
  api.get<AttendanceAnalytics[]>('/admin/analytics/attendance');

// ─── Mutation Functions ───────────────────────────────────────────────────────

export const checkIn = (payload: { qrToken?: string; pin?: string }) =>
  api.post<{ record: AttendanceRecord; summary: AttendanceSummary }>(
    '/attendance/check-in',
    payload,
  );

export const logWorkoutSession = (session: Partial<WorkoutSession>) =>
  api.post<WorkoutSession>('/workout-sessions', session);

export const logBodyMetric = (metric: Partial<BodyMetric>) =>
  api.post<BodyMetric>('/progress/metrics', metric);

export const acceptRecommendation = (id: string) =>
  api.post<{ id: string; accepted: boolean }>(`/ai/recommendations/${id}/accept`, {});

export const updateProfile = (profile: Partial<User['profile']>) =>
  api.put<User>('/me/profile', profile);

export const fetchTrainerMembers = () =>
  api.get<TrainerMemberSummary[]>('/trainer/members');

export const fetchTrainerStats = () =>
  api.get<TrainerStats>('/trainer/stats');

export const assignPlanToMember = (memberId: string, planId: string) =>
  api.post<{ memberId: string; planId: string; success: boolean }>(
    `/trainer/members/${memberId}/assign-plan`,
    { planId },
  );

export const fetchTodayMeals = () => api.get<MealEntry[]>('/nutrition/meals/today');
export const logMeal = (meal: Partial<MealEntry>) => api.post<MealEntry>('/nutrition/meals', meal);
export const deleteMeal = (id: string) => api.delete<{ success: boolean }>(`/nutrition/meals/${id}`);

export const fetchTodayHabits = () => api.get<HabitEntry[]>('/habits/today');
export const toggleHabit = (habitId: string) => api.post<HabitEntry>(`/habits/${habitId}/toggle`, {});
