import type {
  User,
  TrainerMemberSummary,
  TrainerStats,
  AttendanceAnalytics,
  RecentCheckIn,
  Branch,
  MembershipPlan,
  UserStatus,
} from '@fitpulse/shared'
import { api } from './client'

export const queryKeys = {
  me: ['me'] as const,
  trainer: {
    members: ['trainer', 'members'] as const,
    stats: ['trainer', 'stats'] as const,
  },
  admin: {
    attendanceAnalytics: ['admin', 'analytics', 'attendance'] as const,
    recentAttendance: ['admin', 'attendance', 'recent'] as const,
    branch: ['admin', 'branch'] as const,
    membershipPlans: ['admin', 'membership-plans'] as const,
  },
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
