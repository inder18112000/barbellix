// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'member' | 'trainer' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type PlanTier = 'free' | 'pro' | 'gym_starter' | 'gym_business' | 'enterprise';
export type CheckInMethod = 'qr' | 'nfc' | 'pin' | 'manual';
export type RecommendationType = 'workout' | 'nutrition' | 'recovery';
export type WorkoutGeneratedBy = 'ai' | 'trainer' | 'user';
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'paused' | 'incomplete';
export type PaymentStatus = 'paid' | 'due' | 'overdue' | 'comp';

// ─── Tenant / Gym ─────────────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  name: string;
  planTier: PlanTier;
  themeConfig: ThemeConfig;
  createdAt: string;
}

export interface ThemeConfig {
  primaryColor: string;
  logoUrl?: string;
  brandName: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  location: string;
  qrCodeToken: string;
  capacity?: number;
  checkInMethods: CheckInMethod[];
  autoCheckoutEnabled: boolean;
  autoCheckoutAfterMins: number;
  guestPassEnabled: boolean;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  goals: FitnessGoal[];
  dob: string;
  heightCm: number;
  weightKg: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  avatarUrl?: string;
}

export type FitnessGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'improve_endurance'
  | 'increase_strength'
  | 'general_fitness'
  | 'sport_performance';

export interface User {
  id: string;
  tenantId: string;
  branchId?: string;
  role: UserRole;
  status: UserStatus;
  email: string;
  firstName: string;
  lastName: string;
  profile: UserProfile;
  createdAt: string;
}

export interface MembershipPlan {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  priceCents: number;
  currency: string;
  billingInterval: 'month' | 'year';
  stripeProductId?: string;
  stripePriceId?: string;
  active: boolean;
}

export interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  planId?: string;
  plan: string;
  status: MembershipStatus;
  paymentStatus: PaymentStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  startDate: string;
  endDate?: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceRecord {
  id: string;
  userId: string;
  branchId: string;
  checkedInAt: string;
  checkOutAt?: string;
  method: CheckInMethod;
}

export interface AttendanceSummary {
  totalThisMonth: number;
  streak: number;
  lastCheckedIn?: string;
}

// ─── Exercise & Workout ───────────────────────────────────────────────────────

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'full_body';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'smith_machine'
  | 'other';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  instructions: string;
  mediaUrl?: string;
  isCustom: boolean;
  tenantId?: string;
}

export interface WorkoutPlan {
  id: string;
  userId: string;
  trainerId?: string;
  name: string;
  goal: FitnessGoal;
  generatedBy: WorkoutGeneratedBy;
  active: boolean;
  days: WorkoutDay[];
  createdAt: string;
}

export interface WorkoutDay {
  dayLabel: string; // e.g. "Day 1 - Push"
  exercises: PlannedExercise[];
}

export interface PlannedExercise {
  exerciseId: string;
  exercise?: Exercise;
  sets: number;
  reps: number | string; // string for ranges like "8-12"
  restSecs: number;
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  planId?: string;
  date: string;
  durationMins: number;
  notes?: string;
  perceivedEffort?: number; // 1-10 RPE
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  sessionId: string;
  exerciseId: string;
  exercise?: Exercise;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  durationSecs?: number;
  restSecs?: number;
  completed: boolean;
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface BodyMetric {
  id: string;
  userId: string;
  recordedAt: string;
  weightKg?: number;
  bodyFatPct?: number;
  measurements?: BodyMeasurements;
}

export interface BodyMeasurements {
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
}

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseId: string;
  exercise?: Exercise;
  value: number;
  unit: 'kg' | 'lbs' | 'reps' | 'secs';
  achievedAt: string;
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AIRecommendation {
  id: string;
  userId: string;
  type: RecommendationType;
  title: string;
  description: string;
  content: Record<string, unknown>;
  generatedAt: string;
  accepted?: boolean;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealEntry {
  id: string;
  userId: string;
  loggedAt: string;
  name: string;
  mealType: MealType;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export type HabitId = 'water' | 'sleep' | 'steps' | 'stretch' | 'no_junk' | 'meditation';

export interface HabitEntry {
  habitId: HabitId;
  date: string;
  completed: boolean;
  value?: number;
}

// ─── Analytics (Admin) ────────────────────────────────────────────────────────

export interface AttendanceAnalytics {
  date: string;
  count: number;
}

export interface RecentCheckIn {
  id: string;
  memberId: string;
  memberName: string;
  method: CheckInMethod;
  checkedInAt: string;
}

export interface RetentionMetrics {
  activeMembers: number;
  newThisMonth: number;
  churnedThisMonth: number;
  retentionRate: number;
}

// ─── Trainer ──────────────────────────────────────────────────────────────────

export interface TrainerMemberSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  plan: string;
  streak: number;
  lastSeenAt?: string;
  sessionsCount: number;
  joinDate: string;
  /** Billing membership - distinct from `plan` above, which is the workout plan name. */
  membershipPlan?: string;
  membershipStatus?: MembershipStatus;
  paymentStatus?: PaymentStatus;
}

export interface TrainerStats {
  activeMembersCount: number;
  sessionsTodayCount: number;
  attendanceRate: number;
}

// ─── Messaging ────────────────────────────────────────────────────────────────

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

// ─── Notification Preferences ──────────────────────────────────────────────────

export interface NotificationPreferences {
  workoutReminders: boolean;
  workoutReminderTime: string;
  streakAlerts: boolean;
  aiTips: boolean;
  checkInConfirmations: boolean;
  weeklyReport: boolean;
  personalRecords: boolean;
  trainerMessages: boolean;
}
