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
  RecentCheckIn,
  TrainerMemberSummary,
  TrainerStats,
  MealEntry,
  HabitEntry,
  UserStatus,
  Message,
  Sponsor,
  DietPlan,
  ClassSession,
  ClassTemplate,
  BookingWithSession,
  NotificationPreferences,
  CheckInStatus,
  MuscleGroup,
  InjuryCondition,
  InjurySeverity,
  GenerateFullPlanResult,
} from '@barbellix/shared';

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
    checkInStatus: ['progress', 'check-in-status'] as const,
  },
  ai: {
    recommendations: ['ai', 'recommendations'] as const,
  },
  admin: {
    attendanceAnalytics: ['admin', 'analytics', 'attendance'] as const,
    recentAttendance: ['admin', 'attendance', 'recent'] as const,
  },
  trainer: {
    members: ['trainer', 'members'] as const,
    stats:   ['trainer', 'stats'] as const,
  },
  messages: (otherUserId: string) => ['messages', otherUserId] as const,
  nutrition: {
    today: ['nutrition', 'today'] as const,
    dietPlans: ['nutrition', 'diet-plans'] as const,
  },
  habits: {
    today: ['habits', 'today'] as const,
  },
  sponsors: ['sponsors'] as const,
  classes: {
    schedule: (branchId: string, from: string, to: string) => ['classes', 'schedule', branchId, from, to] as const,
    myBookings: ['classes', 'my-bookings'] as const,
    roster: (sessionId: string) => ['classes', 'roster', sessionId] as const,
  },
  notificationPreferences: ['me', 'notification-preferences'] as const,
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

export const generateWorkoutPlan = (goal: string, daysPerWeek: number) =>
  api.post<WorkoutPlan>('/ai/coach/generate-plan', { goal, daysPerWeek });

/** Adjusts the member's *existing* active plan (sets/reps volume only) based on their two most
 * recent progress check-ins - distinct from generateWorkoutPlan above, which replaces the plan
 * with a brand new one built from a fresh goal/day-count prompt. */
export const regeneratePlanFromProgress = () =>
  api.post<WorkoutPlan>('/ai/coach/regenerate-plan', {});

export const fetchCheckInStatus = () => api.get<CheckInStatus>('/progress/check-in-status');

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

export const fetchRecentAttendance = (limit = 30) =>
  api.get<RecentCheckIn[]>(`/admin/attendance/recent?limit=${limit}`);

export const fetchMessageThread = (otherUserId: string) =>
  api.get<Message[]>(`/messages/${otherUserId}`);

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

export const addInjury = (injury: { bodyPart: MuscleGroup; condition?: InjuryCondition; severity: InjurySeverity; note?: string }) =>
  api.post<User>('/me/injuries', injury);

export const removeInjury = (id: string) => api.delete<User>(`/me/injuries/${id}`);

/** Runs the workout + diet AI generators together off the member's already-saved profile
 * (goal/gymAccess/dietPreference/injuries) - see the wizard screens in screens/member/AIWizard*.
 * Uses Promise.allSettled server-side, so a partial result (one plan created, the other errored)
 * is a success response, not a thrown error - check workoutPlanError/dietPlanError on the result. */
export const generateFullPlan = (goal: string, daysPerWeek: number) =>
  api.post<GenerateFullPlanResult>('/ai/coach/generate-full-plan', { goal, daysPerWeek });

export const fetchTrainerMembers = () =>
  api.get<TrainerMemberSummary[]>('/trainer/members');

export const fetchTrainerStats = () =>
  api.get<TrainerStats>('/trainer/stats');

export const assignPlanToMember = (memberId: string, planId: string) =>
  api.post<{ memberId: string; planId: string; success: boolean }>(
    `/trainer/members/${memberId}/assign-plan`,
    { planId },
  );

export const updateMemberStatus = (memberId: string, status: UserStatus) =>
  api.patch<{ memberId: string; status: UserStatus }>(`/trainer/members/${memberId}/status`, { status });

export const sendMessage = (recipientId: string, text: string) =>
  api.post<Message>('/messages', { recipientId, text });

export const markMessageRead = (id: string) =>
  api.put<Message>(`/messages/${id}/read`, {});

export const fetchTodayMeals = () => api.get<MealEntry[]>('/nutrition/meals/today');
export const logMeal = (meal: Partial<MealEntry>) => api.post<MealEntry>('/nutrition/meals', meal);
export const deleteMeal = (id: string) => api.delete<{ success: boolean }>(`/nutrition/meals/${id}`);

export const fetchTodayHabits = () => api.get<HabitEntry[]>('/habits/today');
export const toggleHabit = (habitId: string) => api.post<HabitEntry>(`/habits/${habitId}/toggle`, {});

export const fetchSponsors = () => api.get<Sponsor[]>('/sponsors');

export const fetchDietPlans = () => api.get<DietPlan[]>('/nutrition/diet-plans');
export const generateDietPlan = (goal: string) => api.post<DietPlan>('/ai/coach/generate-diet-plan', { goal });

export const fetchClassSchedule = (branchId: string, from: string, to: string) =>
  api.get<(ClassSession & { trainerName?: string })[]>(`/classes/schedule?branchId=${branchId}&from=${from}&to=${to}`);

export const bookClassSession = (sessionId: string) =>
  api.post<{ booking: { id: string }; status: 'booked' | 'waitlisted' }>(`/classes/sessions/${sessionId}/book`, {});

export const cancelClassBooking = (bookingId: string) =>
  api.post<{ cancelled: boolean; promotedUserId?: string }>(`/classes/bookings/${bookingId}/cancel`, {});

export const fetchMyBookings = () => api.get<BookingWithSession[]>('/classes/my-bookings');

export const fetchClassTemplates = () => api.get<(ClassTemplate & { trainerName?: string })[]>('/admin/class-templates');
export const createClassTemplate = (input: Omit<ClassTemplate, 'id' | 'tenantId' | 'active'>) =>
  api.post<ClassTemplate>('/admin/class-templates', input);
export const updateClassTemplate = (templateId: string, updates: Partial<Omit<ClassTemplate, 'id' | 'tenantId'>>) =>
  api.put<ClassTemplate>(`/admin/class-templates/${templateId}`, updates);
export const registerDeviceToken = (expoPushToken: string, platform: 'ios' | 'android' | 'web') =>
  api.post<{ id: string; registered: boolean }>('/me/device-tokens', { expoPushToken, platform });

export const fetchNotificationPreferences = () => api.get<NotificationPreferences>('/me/notification-preferences');
export const updateNotificationPreferences = (updates: Partial<NotificationPreferences>) =>
  api.put<NotificationPreferences>('/me/notification-preferences', updates);

export const fetchClassRoster = (sessionId: string) =>
  api.get<{ session: ClassSession; bookings: { id: string; userId: string; status: string; memberName?: string; memberEmail?: string }[] }>(
    `/admin/class-sessions/${sessionId}/roster`,
  );
