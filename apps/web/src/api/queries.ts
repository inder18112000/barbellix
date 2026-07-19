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
} from '@fitpulse/shared'
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
  },
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
