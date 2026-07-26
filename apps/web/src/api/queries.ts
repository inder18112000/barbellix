import type {
  User,
  TrainerMemberSummary,
  TrainerStats,
  AttendanceAnalytics,
  RecentCheckIn,
  Branch,
  MembershipPlan,
  UserStatus,
  WorkoutPlan,
  Exercise,
  Message,
  FitnessGoal,
  AdminDashboardStats,
  BodyMetric,
  PersonalRecord,
  WorkoutSession,
  Sponsor,
  PaymentEvent,
  NotificationPreferences,
  LoginPairingToken,
  ClassTemplate,
  ClassSession,
  ClassTemplateOccurrence,
} from '@fitpulse/shared'
import type { ChangePasswordInput } from '@fitpulse/shared'
import { api } from './client'

export const queryKeys = {
  me: ['me'] as const,
  trainer: {
    members: ['trainer', 'members'] as const,
    stats: ['trainer', 'stats'] as const,
    workoutPlans: ['trainer', 'workout-plans'] as const,
  },
  admin: {
    attendanceAnalytics: ['admin', 'analytics', 'attendance'] as const,
    recentAttendance: ['admin', 'attendance', 'recent'] as const,
    branch: ['admin', 'branch'] as const,
    membershipPlans: ['admin', 'membership-plans'] as const,
    dashboardStats: ['admin', 'dashboard-stats'] as const,
    memberProgress: (memberId: string) => ['admin', 'members', memberId, 'progress'] as const,
    paymentHistory: (memberId: string) => ['admin', 'members', memberId, 'payment-history'] as const,
    paymentGatewayStatus: ['admin', 'payment-gateway-status'] as const,
    sponsors: ['admin', 'sponsors'] as const,
    classTemplates: ['admin', 'class-templates'] as const,
    trainers: ['admin', 'trainers'] as const,
    classRoster: (sessionId: string) => ['admin', 'class-sessions', sessionId, 'roster'] as const,
    classSchedule: (branchId: string, from: string, to: string) => ['admin', 'class-schedule', branchId, from, to] as const,
  },
  myNotificationPreferences: ['me', 'notification-preferences'] as const,
  exercises: (q: string) => ['exercises', q] as const,
  messages: (otherUserId: string) => ['messages', otherUserId] as const,
}

export const fetchMe = () => api.get<User>('/me')

// ─── Members (shared by owner/admin and trainer views) ─────────────────────────

export const fetchTrainerMembers = () => api.get<TrainerMemberSummary[]>('/trainer/members')
export const fetchTrainerStats = () => api.get<TrainerStats>('/trainer/stats')

export const updateMemberStatus = (memberId: string, status: UserStatus) =>
  api.patch<{ memberId: string; status: UserStatus }>(`/trainer/members/${memberId}/status`, { status })

export const assignPlanToMember = (memberId: string, planId: string) =>
  api.post<{ memberId: string; planId: string; success: boolean }>(`/trainer/members/${memberId}/assign-plan`, { planId })

// ─── Admin: analytics, branch, attendance ───────────────────────────────────────

export const fetchAttendanceAnalytics = () => api.get<AttendanceAnalytics[]>('/admin/analytics/attendance')
export const fetchRecentAttendance = (limit = 50) => api.get<RecentCheckIn[]>(`/admin/attendance/recent?limit=${limit}`)

export const fetchBranch = () => api.get<Branch>('/admin/branch')
export const updateBranch = (updates: Partial<Omit<Branch, 'id' | 'tenantId' | 'qrCodeToken'>>) =>
  api.put<Branch>('/admin/branch', updates)

// ─── Billing ──────────────────────────────────────────────────────────────────

export const fetchMembershipPlans = () => api.get<MembershipPlan[]>('/admin/membership-plans')

export interface CreatePlanInput {
  name: string
  description?: string
  priceCents: number
  currency?: string
  billingInterval: 'month' | 'year'
}
export const createMembershipPlan = (input: CreatePlanInput) => api.post<MembershipPlan>('/admin/membership-plans', input)

export const updateMembershipPlan = (planId: string, updates: Partial<CreatePlanInput> & { active?: boolean }) =>
  api.put<MembershipPlan>(`/admin/membership-plans/${planId}`, updates)

export const createCheckoutSession = (memberId: string, planId: string) =>
  api.post<{ checkoutUrl: string }>(`/admin/members/${memberId}/membership/checkout-session`, { planId })

export const markMemberPaid = (memberId: string, planName: string) =>
  api.post(`/admin/members/${memberId}/membership/mark-paid`, { planName })

export const updateMembershipDates = (memberId: string, dates: { startDate?: string; endDate?: string }) =>
  api.put(`/admin/members/${memberId}/membership/dates`, dates)

// ─── Admin dashboard + client progress ─────────────────────────────────────────

export const fetchDashboardStats = () => api.get<AdminDashboardStats>('/admin/dashboard-stats')

export interface MemberProgress {
  metrics: BodyMetric[]
  prs: PersonalRecord[]
  sessions: WorkoutSession[]
  plans: WorkoutPlan[]
}
export const fetchMemberProgress = (memberId: string) => api.get<MemberProgress>(`/admin/members/${memberId}/progress`)

export const fetchPaymentHistory = (memberId: string) => api.get<PaymentEvent[]>(`/admin/members/${memberId}/payment-history`)

export const fetchPaymentGatewayStatus = () => api.get<{ stripeConfigured: boolean }>('/admin/payment-gateway-status')

export const updateMemberInfo = (memberId: string, updates: { firstName?: string; lastName?: string; phone?: string }) =>
  api.patch<TrainerMemberSummary>(`/trainer/members/${memberId}/info`, updates)

export const generateLoginPairingToken = (memberId: string) =>
  api.post<LoginPairingToken>(`/trainer/members/${memberId}/login-pairing`, {})

// ─── Sponsors ─────────────────────────────────────────────────────────────────

export const fetchAllSponsors = () => api.get<Sponsor[]>('/admin/sponsors')

export interface CreateSponsorInput {
  name: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
}
export const createSponsor = (input: CreateSponsorInput) => api.post<Sponsor>('/admin/sponsors', input)

export const updateSponsor = (sponsorId: string, updates: Partial<CreateSponsorInput> & { active?: boolean }) =>
  api.put<Sponsor>(`/admin/sponsors/${sponsorId}`, updates)

// ─── Classes ──────────────────────────────────────────────────────────────────

export const fetchTrainersList = () => api.get<{ id: string; name: string }[]>('/admin/trainers')

export const fetchClassTemplates = () => api.get<(ClassTemplate & { trainerName?: string })[]>('/admin/class-templates')

export interface CreateClassTemplateInput {
  branchId: string
  name: string
  trainerId: string
  occurrences: ClassTemplateOccurrence[]
  capacity: number
}
export const createClassTemplate = (input: CreateClassTemplateInput) =>
  api.post<ClassTemplate>('/admin/class-templates', input)

export const updateClassTemplate = (templateId: string, updates: Partial<CreateClassTemplateInput> & { active?: boolean }) =>
  api.put<ClassTemplate>(`/admin/class-templates/${templateId}`, updates)

export const fetchClassSchedule = (branchId: string, from: string, to: string) =>
  api.get<(ClassSession & { trainerName?: string })[]>(`/classes/schedule?branchId=${branchId}&from=${from}&to=${to}`)

export const fetchClassRoster = (sessionId: string) =>
  api.get<{
    session: ClassSession
    bookings: { id: string; userId: string; status: string; memberName?: string; memberEmail?: string }[]
  }>(`/admin/class-sessions/${sessionId}/roster`)

// ─── My account (Settings) ─────────────────────────────────────────────────────

export const updateMyInfo = (updates: { firstName?: string; lastName?: string; phone?: string }) =>
  api.put<User>('/me', updates)

export const changeMyPassword = (input: ChangePasswordInput) => api.put<{ message: string }>('/me/password', input)

export const fetchMyNotificationPreferences = () => api.get<NotificationPreferences>('/me/notification-preferences')
export const updateMyNotificationPreferences = (updates: Partial<NotificationPreferences>) =>
  api.put<NotificationPreferences>('/me/notification-preferences', updates)

// ─── Trainer: workout plans ─────────────────────────────────────────────────

/** The caller's own template plans - a trainer's building blocks for assigning to members. */
export const fetchWorkoutPlans = () => api.get<WorkoutPlan[]>('/workout-plans')

export interface CreateWorkoutPlanInput {
  name: string
  goal: FitnessGoal
  days: Array<{
    dayLabel: string
    exercises: Array<{ exerciseId: string; sets: number; reps: string; restSecs: number; notes?: string }>
  }>
}
export const createWorkoutPlan = (input: CreateWorkoutPlanInput) => api.post<WorkoutPlan>('/workout-plans', input)

export const fetchExercises = (q: string) => api.get<Exercise[]>(`/exercises?q=${encodeURIComponent(q)}`)

// ─── Messaging ────────────────────────────────────────────────────────────────

export const fetchMessageThread = (otherUserId: string) => api.get<Message[]>(`/messages/${otherUserId}`)
export const sendMessage = (recipientId: string, text: string) => api.post<Message>('/messages', { recipientId, text })
export const markMessageRead = (id: string) => api.put<Message>(`/messages/${id}/read`, {})
