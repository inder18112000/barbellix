// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'member' | 'trainer' | 'admin' | 'superadmin';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type PlanTier = 'free' | 'pro' | 'gym_starter' | 'gym_business' | 'enterprise';
export type CheckInMethod = 'qr' | 'nfc' | 'pin' | 'manual';
export type RecommendationType = 'workout' | 'nutrition' | 'recovery';
export type WorkoutGeneratedBy = 'ai' | 'trainer' | 'user';
export type MembershipStatus = 'active' | 'expired' | 'cancelled' | 'paused' | 'incomplete';
export type PaymentStatus = 'paid' | 'due' | 'overdue' | 'comp';
export type PaymentMethod = 'online' | 'cash';
/** A simplified 3-state view of MembershipStatus + PaymentStatus, for the client-facing
 * traffic-light display (Active/Pending/Expired) - derived server-side, never stored. */
export type SubscriptionStatus = 'active' | 'pending' | 'expired';

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
  /** Days after membership expiry before access is blocked at login - 0 disables the grace
   * period entirely (block immediately on expiry). Enforced lazily at login/refresh time, not
   * by a background job - see billing/service.ts's isAccessBlocked(). */
  gracePeriodDays: number;
}

export interface Sponsor {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  active: boolean;
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
  bio?: string;
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
  phone?: string;
  firstName: string;
  lastName: string;
  profile: UserProfile;
  createdAt: string;
}

/** Returned when an admin generates a device-pairing QR for a member's first login - the token
 * itself is what gets encoded into the QR image; scanning it redeems the same shape a normal
 * POST /auth/login returns (user + accessToken + refreshToken). Single-use, short-lived. */
export interface LoginPairingToken {
  token: string;
  expiresAt: string;
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
  paymentMethod?: PaymentMethod;
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

/** A prescribed template day (repeat daily) - distinct from MealEntry above, which is a log of
 * what was actually eaten on a specific day. */
export interface DietPlan {
  id: string;
  userId: string;
  name: string;
  goal: FitnessGoal;
  generatedBy: WorkoutGeneratedBy;
  dailyCalorieTarget: number;
  dailyProteinG: number;
  dailyCarbsG: number;
  dailyFatG: number;
  meals: DietPlanMeal[];
  active: boolean;
  createdAt: string;
}

export interface DietPlanMeal {
  mealType: MealType;
  name: string;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  notes?: string;
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
  phone?: string;
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
  paymentMethod?: PaymentMethod;
  subscriptionStatus?: SubscriptionStatus;
  membershipStartDate?: string;
  membershipEndDate?: string;
}

export interface TrainerStats {
  activeMembersCount: number;
  sessionsTodayCount: number;
  attendanceRate: number;
}

export interface AdminDashboardStats {
  totalClients: number;
  activeClients: number;
  expiredSubscriptions: number;
  newEnrollmentsThisMonth: number;
  pendingPayments: number;
  onlinePayments: number;
  cashPayments: number;
}

export type PaymentEventType = 'checkout_completed' | 'subscription_renewed' | 'subscription_cancelled' | 'payment_failed' | 'marked_paid';

export interface PaymentEvent {
  id: string;
  tenantId: string;
  userId: string;
  type: PaymentEventType;
  amountCents?: number;
  currency?: string;
  planName?: string;
  occurredAt: string;
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

// ─── Group Classes ──────────────────────────────────────────────────────────────

/** 0-6, 0 = Sunday, matches JS Date.getDay() - kept as a plain number (not a literal union) so it
 * round-trips cleanly through Zod's z.number() and Mongoose's Number type without extra casting. */
export type DayOfWeek = number;

export interface ClassTemplateOccurrence {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM", 24h
  durationMins: number;
}

export interface ClassTemplate {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  trainerId: string;
  trainerName?: string;
  occurrences: ClassTemplateOccurrence[];
  capacity: number;
  active: boolean;
}

export type ClassSessionStatus = 'scheduled' | 'cancelled';

export interface ClassSession {
  id: string;
  tenantId: string;
  branchId: string;
  templateId: string;
  name: string;
  trainerId: string;
  trainerName?: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  durationMins: number;
  capacity: number;
  bookedCount: number;
  waitlistCount: number;
  status: ClassSessionStatus;
  /** Present only when the requesting member has a booking for this session. */
  myBookingStatus?: BookingStatus;
}

export type BookingStatus = 'booked' | 'waitlisted' | 'cancelled';

export interface Booking {
  id: string;
  tenantId: string;
  sessionId: string;
  userId: string;
  status: BookingStatus;
  createdAt: string;
}

/** A booking joined with its session's display info, for "My Bookings" style views. */
export interface BookingWithSession extends Booking {
  session: ClassSession;
}
