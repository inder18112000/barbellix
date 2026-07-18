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

// ─── Current User ─────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: 'user_001',
  tenantId: 'tenant_001',
  branchId: 'branch_001',
  role: 'member',
  email: 'inderjit@fitpulse.app',
  firstName: 'Inderjit',
  lastName: 'Babbar',
  profile: {
    goals: ['build_muscle', 'increase_strength'],
    dob: '2000-11-18',
    heightCm: 178,
    weightKg: 78,
    experienceLevel: 'intermediate',
    gender: 'male',
  },
  createdAt: '2026-01-10T00:00:00Z',
};

// ─── Exercises ────────────────────────────────────────────────────────────────

export const mockExercises: Exercise[] = [
  {
    id: 'ex_001',
    name: 'Barbell Bench Press',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    equipment: ['barbell'],
    instructions: 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.',
    isCustom: false,
  },
  {
    id: 'ex_002',
    name: 'Pull-Up',
    muscleGroups: ['back', 'biceps'],
    equipment: ['bodyweight'],
    instructions: 'Hang from bar, pull body up until chin clears bar, lower with control.',
    isCustom: false,
  },
  {
    id: 'ex_003',
    name: 'Back Squat',
    muscleGroups: ['quads', 'glutes', 'hamstrings', 'core'],
    equipment: ['barbell'],
    instructions: 'Bar on upper back, squat to parallel or below, drive through heels to stand.',
    isCustom: false,
  },
  {
    id: 'ex_004',
    name: 'Romanian Deadlift',
    muscleGroups: ['hamstrings', 'glutes', 'back'],
    equipment: ['barbell'],
    instructions: 'Hip hinge with slight knee bend, bar stays close to legs, feel hamstring stretch.',
    isCustom: false,
  },
  {
    id: 'ex_005',
    name: 'Overhead Press',
    muscleGroups: ['shoulders', 'triceps', 'core'],
    equipment: ['barbell'],
    instructions: 'Press bar from shoulder height to lockout overhead, keep core tight.',
    isCustom: false,
  },
  {
    id: 'ex_006',
    name: 'Cable Row',
    muscleGroups: ['back', 'biceps'],
    equipment: ['cable'],
    instructions: 'Sit at cable station, pull handle to lower chest, squeeze shoulder blades.',
    isCustom: false,
  },
  {
    id: 'ex_007',
    name: 'Plank',
    muscleGroups: ['core'],
    equipment: ['bodyweight'],
    instructions: 'Hold push-up position on forearms, keep body straight, breathe steadily.',
    isCustom: false,
  },
  {
    id: 'ex_008',
    name: 'Incline Dumbbell Press',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['dumbbell'],
    instructions: 'Set bench to 30-45°, press dumbbells from chest level to lockout.',
    isCustom: false,
  },
];

// ─── Workout Sessions ─────────────────────────────────────────────────────────

export const mockSessions: WorkoutSession[] = [
  {
    id: 'sess_001',
    userId: 'user_001',
    planId: 'plan_001',
    date: '2026-06-27',
    durationMins: 68,
    perceivedEffort: 7,
    notes: 'Felt strong on bench today. Increased weight.',
    sets: [
      { id: 's1', sessionId: 'sess_001', exerciseId: 'ex_001', exercise: mockExercises[0], setNumber: 1, reps: 8, weightKg: 85, completed: true },
      { id: 's2', sessionId: 'sess_001', exerciseId: 'ex_001', exercise: mockExercises[0], setNumber: 2, reps: 8, weightKg: 85, completed: true },
      { id: 's3', sessionId: 'sess_001', exerciseId: 'ex_001', exercise: mockExercises[0], setNumber: 3, reps: 7, weightKg: 85, completed: true },
      { id: 's4', sessionId: 'sess_001', exerciseId: 'ex_008', exercise: mockExercises[7], setNumber: 1, reps: 10, weightKg: 30, completed: true },
      { id: 's5', sessionId: 'sess_001', exerciseId: 'ex_008', exercise: mockExercises[7], setNumber: 2, reps: 10, weightKg: 30, completed: true },
      { id: 's6', sessionId: 'sess_001', exerciseId: 'ex_005', exercise: mockExercises[4], setNumber: 1, reps: 8, weightKg: 50, completed: true },
    ],
  },
  {
    id: 'sess_002',
    userId: 'user_001',
    planId: 'plan_001',
    date: '2026-06-25',
    durationMins: 55,
    perceivedEffort: 8,
    sets: [
      { id: 's7', sessionId: 'sess_002', exerciseId: 'ex_003', exercise: mockExercises[2], setNumber: 1, reps: 5, weightKg: 100, completed: true },
      { id: 's8', sessionId: 'sess_002', exerciseId: 'ex_003', exercise: mockExercises[2], setNumber: 2, reps: 5, weightKg: 100, completed: true },
      { id: 's9', sessionId: 'sess_002', exerciseId: 'ex_004', exercise: mockExercises[3], setNumber: 1, reps: 10, weightKg: 70, completed: true },
    ],
  },
  {
    id: 'sess_003',
    userId: 'user_001',
    planId: 'plan_001',
    date: '2026-06-23',
    durationMins: 72,
    perceivedEffort: 6,
    sets: [
      { id: 's10', sessionId: 'sess_003', exerciseId: 'ex_002', exercise: mockExercises[1], setNumber: 1, reps: 10, weightKg: 0, completed: true },
      { id: 's11', sessionId: 'sess_003', exerciseId: 'ex_006', exercise: mockExercises[5], setNumber: 1, reps: 12, weightKg: 55, completed: true },
    ],
  },
];

// ─── Workout Plan ─────────────────────────────────────────────────────────────

export const mockPlan: WorkoutPlan = {
  id: 'plan_001',
  userId: 'user_001',
  name: 'Push Pull Legs — Intermediate',
  goal: 'build_muscle',
  generatedBy: 'ai',
  active: true,
  createdAt: '2026-06-01T00:00:00Z',
  days: [
    {
      dayLabel: 'Day 1 — Push',
      exercises: [
        { exerciseId: 'ex_001', exercise: mockExercises[0], sets: 4, reps: '6-8', restSecs: 120 },
        { exerciseId: 'ex_008', exercise: mockExercises[7], sets: 3, reps: '10-12', restSecs: 90 },
        { exerciseId: 'ex_005', exercise: mockExercises[4], sets: 3, reps: '8-10', restSecs: 90 },
      ],
    },
    {
      dayLabel: 'Day 2 — Pull',
      exercises: [
        { exerciseId: 'ex_002', exercise: mockExercises[1], sets: 4, reps: '6-10', restSecs: 120 },
        { exerciseId: 'ex_006', exercise: mockExercises[5], sets: 3, reps: '10-12', restSecs: 90 },
      ],
    },
    {
      dayLabel: 'Day 3 — Legs',
      exercises: [
        { exerciseId: 'ex_003', exercise: mockExercises[2], sets: 4, reps: '5', restSecs: 180 },
        { exerciseId: 'ex_004', exercise: mockExercises[3], sets: 3, reps: '10', restSecs: 120 },
        { exerciseId: 'ex_007', exercise: mockExercises[6], sets: 3, reps: '60s', restSecs: 60 },
      ],
    },
  ],
};

// ─── Attendance ───────────────────────────────────────────────────────────────

export const mockAttendanceSummary: AttendanceSummary = {
  totalThisMonth: 18,
  streak: 5,
  lastCheckedIn: '2026-06-27T09:15:00Z',
};

export const mockAttendanceHistory: AttendanceRecord[] = [
  { id: 'att_001', userId: 'user_001', branchId: 'branch_001', checkedInAt: '2026-06-27T09:15:00Z', checkOutAt: '2026-06-27T10:23:00Z', method: 'qr' },
  { id: 'att_002', userId: 'user_001', branchId: 'branch_001', checkedInAt: '2026-06-25T07:45:00Z', checkOutAt: '2026-06-25T08:40:00Z', method: 'qr' },
  { id: 'att_003', userId: 'user_001', branchId: 'branch_001', checkedInAt: '2026-06-23T18:00:00Z', checkOutAt: '2026-06-23T19:12:00Z', method: 'pin' },
];

// ─── Body Metrics ─────────────────────────────────────────────────────────────

export const mockBodyMetrics: BodyMetric[] = [
  { id: 'bm_001', userId: 'user_001', recordedAt: '2026-01-01', weightKg: 82, bodyFatPct: 18 },
  { id: 'bm_002', userId: 'user_001', recordedAt: '2026-02-01', weightKg: 81, bodyFatPct: 17.5 },
  { id: 'bm_003', userId: 'user_001', recordedAt: '2026-03-01', weightKg: 80, bodyFatPct: 17 },
  { id: 'bm_004', userId: 'user_001', recordedAt: '2026-04-01', weightKg: 79.5, bodyFatPct: 16.5 },
  { id: 'bm_005', userId: 'user_001', recordedAt: '2026-05-01', weightKg: 79, bodyFatPct: 16 },
  { id: 'bm_006', userId: 'user_001', recordedAt: '2026-06-01', weightKg: 78, bodyFatPct: 15.5 },
];

// ─── Personal Records ─────────────────────────────────────────────────────────

export const mockPRs: PersonalRecord[] = [
  { id: 'pr_001', userId: 'user_001', exerciseId: 'ex_001', exercise: mockExercises[0], value: 90, unit: 'kg', achievedAt: '2026-06-15' },
  { id: 'pr_002', userId: 'user_001', exerciseId: 'ex_003', exercise: mockExercises[2], value: 110, unit: 'kg', achievedAt: '2026-06-20' },
  { id: 'pr_003', userId: 'user_001', exerciseId: 'ex_002', exercise: mockExercises[1], value: 15, unit: 'reps', achievedAt: '2026-06-10' },
  { id: 'pr_004', userId: 'user_001', exerciseId: 'ex_005', exercise: mockExercises[4], value: 55, unit: 'kg', achievedAt: '2026-06-25' },
];

// ─── AI Recommendations ───────────────────────────────────────────────────────

export const mockRecommendations: AIRecommendation[] = [
  {
    id: 'ai_001',
    userId: 'user_001',
    type: 'workout',
    title: "Today's Suggested Workout",
    description: "Based on your 5-day streak and last Push session, it's time for Pull. Your back volume is slightly behind — let's fix that.",
    content: { planDayIndex: 1 },
    generatedAt: new Date().toISOString(),
  },
  {
    id: 'ai_002',
    userId: 'user_001',
    type: 'recovery',
    title: 'Recovery Alert',
    description: 'Your average RPE over the last 3 sessions is 7.3. Consider a lighter session today or focus on mobility work.',
    content: {},
    generatedAt: new Date().toISOString(),
  },
];

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export const mockAttendanceAnalytics: AttendanceAnalytics[] = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 86400000).toISOString().slice(0, 10),
  count: Math.floor(Math.random() * 80) + 40,
}));

// ─── Trainer ─────────────────────────────────────────────────────────────────

export const mockTrainerMembers: TrainerMemberSummary[] = [
  { id: 'm1', firstName: 'Alex',  lastName: 'Chen',   email: 'alex@gym.com',  plan: 'PPL',         streak: 12, sessionsCount: 48, lastSeenAt: '2026-06-29T08:00:00Z', joinDate: '2025-01-10' },
  { id: 'm2', firstName: 'Priya', lastName: 'Sharma',  email: 'priya@gym.com', plan: 'Strength',    streak: 7,  sessionsCount: 22, lastSeenAt: '2026-06-28T10:00:00Z', joinDate: '2025-03-22' },
  { id: 'm3', firstName: 'Jake',  lastName: 'Wilson',  email: 'jake@gym.com',  plan: 'Cut',         streak: 3,  sessionsCount: 9,  lastSeenAt: '2026-06-29T07:45:00Z', joinDate: '2025-06-01' },
  { id: 'm4', firstName: 'Maria', lastName: 'Lopez',   email: 'maria@gym.com', plan: 'Hypertrophy', streak: 21, sessionsCount: 67, lastSeenAt: '2026-06-29T06:30:00Z', joinDate: '2024-11-15' },
  { id: 'm5', firstName: 'Sam',   lastName: 'Park',    email: 'sam@gym.com',   plan: 'General',     streak: 0,  sessionsCount: 2,  lastSeenAt: '2026-06-20T09:00:00Z', joinDate: '2026-01-05' },
];

export const mockTrainerStats: TrainerStats = {
  activeMembersCount: 4,
  sessionsTodayCount: 12,
  attendanceRate: 87,
};

// ─── Nutrition ────────────────────────────────────────────────────────────────

export const mockMeals: MealEntry[] = [
  {
    id: 'meal_001', userId: 'user_001', loggedAt: '2026-06-30T07:45:00Z',
    name: 'Overnight Oats', mealType: 'breakfast',
    calories: 420, proteinG: 18, carbsG: 62, fatG: 11,
  },
  {
    id: 'meal_002', userId: 'user_001', loggedAt: '2026-06-30T12:30:00Z',
    name: 'Chicken Rice Bowl', mealType: 'lunch',
    calories: 680, proteinG: 52, carbsG: 78, fatG: 14,
  },
  {
    id: 'meal_003', userId: 'user_001', loggedAt: '2026-06-30T16:00:00Z',
    name: 'Greek Yoghurt + Almonds', mealType: 'snack',
    calories: 230, proteinG: 14, carbsG: 18, fatG: 9,
  },
];

// ─── Habits ───────────────────────────────────────────────────────────────────

export const mockHabitLog: HabitEntry[] = [
  { habitId: 'water',      date: '2026-06-30', completed: true,  value: 8 },
  { habitId: 'sleep',      date: '2026-06-30', completed: true,  value: 7.5 },
  { habitId: 'steps',      date: '2026-06-30', completed: false, value: 6200 },
  { habitId: 'stretch',    date: '2026-06-30', completed: false },
  { habitId: 'no_junk',    date: '2026-06-30', completed: true  },
  { habitId: 'meditation', date: '2026-06-30', completed: false },
];
