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
  /** 6-digit code for the "No QR? Enter PIN instead" fallback in the mobile check-in flow -
   * front desk staff read it off to a member whose camera/QR isn't working. Verified server-side
   * in attendance/service.ts's checkIn(); editable here like any other branch setting. */
  checkInPin: string;
  capacity?: number;
  checkInMethods: CheckInMethod[];
  autoCheckoutEnabled: boolean;
  autoCheckoutAfterMins: number;
  guestPassEnabled: boolean;
  /** Days after membership expiry before access is blocked at login - 0 disables the grace
   * period entirely (block immediately on expiry). Enforced lazily at login/refresh time, not
   * by a background job - see billing/service.ts's isAccessBlocked(). */
  gracePeriodDays: number;
  /** How often (in days) a member is expected to submit a progress check-in before their plan is
   * eligible for AI regeneration. Same lazy-evaluation philosophy as gracePeriodDays above - no
   * scheduled job computes this, it's derived on request from the member's last logged metric.
   * See progress/service.ts's computeCheckInStatus(). Default 7, per the product's stated goal of
   * a weekly-by-default adaptive check-in. */
  checkInIntervalDays: number;
}

/** Cross-tenant summary row for the Super Admin's Platform Overview - the one capability on this
 * platform that structurally cannot belong to Admin, since Admin is always scoped to their own
 * tenant (see docs/prd/01-rbac-and-data-model.md §1.1's Tenant vs. Global scope distinction). */
export interface PlatformTenantSummary {
  id: string;
  name: string;
  planTier: PlanTier;
  memberCount: number;
  trainerCount: number;
  activeMembershipCount: number;
  createdAt: string;
  /** Members with at least one injury logged, not a count of injury entries - see
   * superadmin/repository.ts's countInjuriesReportedByTenant(). */
  injuriesReportedCount: number;
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

export type DietPreference = 'vegetarian' | 'vegan' | 'non_vegetarian';
export type GymAccess = 'full_gym' | 'home_bodyweight' | 'home_with_dumbbells';
export type InjurySeverity = 'mild' | 'moderate' | 'severe';

/** A curated set of common, named injury/rehab conditions, organized by region - picking one of
 * these (rather than only a coarse body part) is what lets the app show real condition-aware
 * guidance and seed real rehab exercise content (see constants.ts's
 * INJURY_CONDITION_MUSCLE_GROUPS and db/seed.ts's rehab exercise set on the server). Optional:
 * a member can still log an injury by body part alone without picking a specific condition. */
export type InjuryCondition =
  // Lower back
  | 'lumbar_strain'
  | 'disc_herniation'
  | 'radiculopathy_sciatica'
  | 'spinal_stenosis'
  | 'spondylolisthesis'
  // Knee
  | 'acl_tear'
  | 'pcl_tear'
  | 'mcl_tear'
  | 'lcl_tear'
  | 'meniscus_tear'
  | 'patellofemoral_pain'
  | 'patellar_tendinopathy'
  | 'quadriceps_tendinopathy'
  // Shoulder
  | 'rotator_cuff_tendinopathy'
  | 'rotator_cuff_tear'
  | 'shoulder_impingement'
  | 'shoulder_instability'
  | 'labral_tear'
  | 'frozen_shoulder'
  // Neck
  | 'cervical_strain'
  | 'cervical_radiculopathy'
  // Ankle
  | 'lateral_ankle_sprain'
  | 'high_ankle_sprain'
  | 'achilles_tendinopathy'
  | 'achilles_rupture'
  // Hip
  | 'hip_flexor_strain'
  | 'adductor_strain'
  | 'gluteal_tendinopathy'
  | 'hip_bursitis'
  | 'hip_osteoarthritis'
  // Thigh
  | 'hamstring_strain'
  | 'quadriceps_strain'
  // Calf
  | 'calf_strain'
  // Elbow
  | 'tennis_elbow'
  | 'golfers_elbow'
  // Wrist / hand
  | 'wrist_sprain'
  | 'wrist_tendinopathy'
  | 'carpal_tunnel'
  // Foot
  | 'plantar_fasciitis'
  | 'metatarsal_injury'
  // General / unclassified
  | 'muscle_strain'
  | 'ligament_sprain'
  | 'tendon_injury'
  | 'postoperative_rehabilitation';

/** A member-self-reported injury. `bodyPart` deliberately reuses the MuscleGroup enum (not a
 * separate taxonomy) so matching an injury against Exercise.muscleGroups is a plain set
 * intersection - see ai-coach/plan-generator.ts's injury-aware filtering. `condition`, if picked,
 * is the more clinically specific label (e.g. "ACL tear") and auto-suggests `bodyPart` via
 * INJURY_CONDITION_MUSCLE_GROUPS (constants.ts) - but `bodyPart` is what actually drives exercise
 * filtering, so it's always required even when `condition` is set. Deleting an entry means
 * "resolved" - there's no separate active flag to keep the CRUD surface (POST/DELETE) simple. */
export interface InjuryEntry {
  id: string;
  bodyPart: MuscleGroup;
  condition?: InjuryCondition;
  note?: string;
  severity: InjurySeverity;
  loggedAt: string;
}

export interface UserProfile {
  goals: FitnessGoal[];
  dob: string;
  heightCm: number;
  weightKg: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  avatarUrl?: string;
  bio?: string;
  /** What the AI goal wizard's plan generation optimizes toward, alongside `goals` above. */
  targetWeightKg?: number;
  dietPreference?: DietPreference;
  /** Constrains which Exercise.equipment values the AI plan generator will select from. */
  gymAccess?: GymAccess;
  injuries?: InjuryEntry[];
}

export type FitnessGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'improve_endurance'
  | 'increase_strength'
  | 'general_fitness'
  | 'sport_performance';

/** Per-trainer capability flags, settable only by admin/superadmin (see
 * trainer/service.ts's setTrainerPermissions()). Defaults true for both - a trainer keeps today's
 * full exercise/meal-library access until an admin/superadmin explicitly revokes it, rather than
 * every trainer starting locked out. */
export interface TrainerPermissions {
  canManageExerciseLibrary: boolean;
  canManageMealLibrary: boolean;
}

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
  /** The trainer (User.id, role 'trainer') this member is assigned to - unset if the member has
   * no trainer yet. Only the assigned trainer may view/edit this member's plans or message them;
   * see trainer/repository.ts's findMembersByTenant() and messaging/service.ts's scope check. */
  assignedTrainerId?: string;
  /** Trainer-only fields. `reportsToRole` decides who may manage this trainer's permissions and
   * whose Trainer Management view they appear in: 'admin' (their own tenant's admin, the default)
   * or 'superadmin' (escalated to platform-level oversight - only superadmin can set this). */
  trainerPermissions?: TrainerPermissions;
  reportsToRole?: 'admin' | 'superadmin';
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
  | 'full_body'
  /** Added for injury-region coverage (neck/hip/knee/ankle/foot/elbow/wrist strains and joint
   * injuries aren't well represented by the original 12 values above) - also usable as a real
   * Exercise.muscleGroups tag for exercises that target these areas (e.g. neck isometrics, ankle
   * mobility work). */
  | 'neck'
  | 'hip'
  | 'knee'
  | 'ankle'
  | 'foot'
  | 'elbow'
  | 'wrist_hand';

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

export type ExerciseTag = 'fat_loss' | 'muscle_gain' | 'mobility' | 'rehabilitation' | 'low_impact';

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  instructions: string;
  mediaUrl?: string;
  /** What kind of media mediaUrl points at, so clients know whether to render an image or hand
   * off to a video player. Unset/omitted is treated as 'image' for backward compatibility with
   * exercises created before video upload existed. */
  mediaType?: 'image' | 'video';
  tags?: ExerciseTag[];
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
  /** 1 for a plan created from scratch; incremented each time the AI regenerates it off a
   * progress check-in (see ai-coach/plan-generator.ts's regenerateWorkoutPlan()). */
  version: number;
  /** The plan this one replaced, if any - lets the UI show a version history / diff. */
  previousPlanId?: string;
  /** Human-readable bullet list of what changed vs. the previous version and why (e.g. "Reduced
   * squat/bench sets from 4 to 3 - recent RPE was very high"). Only set on regenerated plans. */
  changeSummary?: string[];
}

export interface WorkoutDay {
  dayLabel: string; // e.g. "Day 1 - Push"
  /** 0-6, matches JS Date.getDay() - same convention as ClassTemplateOccurrence.dayOfWeek. Unset
   * for plans created before this existed; clients fall back to a rotation-based "today" instead
   * of a calendar-based one in that case. Assigned deterministically by the AI generator (never
   * left to the LLM to decide) - see ai-coach/plan-generator.ts. */
  dayOfWeek?: DayOfWeek;
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
  /** Where this reading came from. Defaults to 'manual' server-side when omitted. Purely a
   * provenance field today - no wearable sync is implemented - but keeps the door open for Apple
   * Health / Google Fit ingestion later without a schema change. */
  source?: 'manual' | 'apple_health' | 'google_fit';
}

export interface BodyMeasurements {
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  armCm?: number;
  thighCm?: number;
}

/** Whether this member is due for a periodic progress check-in, computed lazily from their last
 * logged BodyMetric and the branch's checkInIntervalDays - never from a scheduled job. See
 * progress/service.ts's computeCheckInStatus(). */
export interface CheckInStatus {
  dueAt: string;
  isDue: boolean;
  lastCheckInAt?: string;
  intervalDays: number;
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

/** Result of the AI goal wizard's combined generation call - built from Promise.allSettled, so
 * either half may be absent with an error message instead, rather than the whole request failing
 * if only one of the two LLM calls fails. */
export interface GenerateFullPlanResult {
  workoutPlan?: WorkoutPlan;
  workoutPlanError?: string;
  dietPlan?: DietPlan;
  dietPlanError?: string;
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Reusable meal-library entry, authored once by a trainer and referenced from any DietPlan -
 * Exercise's dietary counterpart. `tenantId` unset means the shared global catalog, same
 * global-vs-tenant convention as Exercise.tenantId. Distinct from MealEntry (a member's log of
 * what they actually ate) below. */
export interface Meal {
  id: string;
  tenantId?: string;
  name: string;
  mealType: MealType;
  calories: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  isCustom: boolean;
}

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
  assignedTrainerId?: string;
  assignedTrainerName?: string;
}

/** A tenant's trainer roster row - backs both the admin assign-trainer dropdown (id/name only)
 * and the Trainer Management page (also shows/edits trainerPermissions and reportsToRole). */
export interface TrainerSummary {
  id: string;
  name: string;
  email: string;
  trainerPermissions: TrainerPermissions;
  reportsToRole: 'admin' | 'superadmin';
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
  /** Members with at least one injury logged, not a count of injury entries. */
  activeInjuriesMemberCount: number;
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
  classBookings: boolean;
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
