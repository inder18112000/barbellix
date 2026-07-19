/**
 * Seeds a default tenant/branch plus one admin, one trainer, and five members with real
 * attendance/session/plan data - without this, there is no way to log into apps/web (or test
 * the admin/trainer backend routes) as anything but a freshly self-registered 'member', since
 * registration always hardcodes role:'member'.
 *
 * Safe to re-run: users/tenant/branch/exercises are upserted by a stable key; time-series data
 * (attendance, sessions, plans) for the seeded members is cleared and regenerated each run so
 * the "last 30 days" data stays relative to "now" instead of drifting stale.
 */
import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import { loadEnv } from '../config/env.js';
import { hashPassword } from '../lib/password.js';
import { TenantModel } from './models/Tenant.js';
import { BranchModel } from './models/Branch.js';
import { UserModel } from './models/User.js';
import { ExerciseModel } from './models/Exercise.js';
import { WorkoutPlanModel } from './models/WorkoutPlan.js';
import { WorkoutSessionModel } from './models/WorkoutSession.js';
import { AttendanceRecordModel } from './models/AttendanceRecord.js';
import { PersonalRecordModel } from './models/PersonalRecord.js';

const SEED_PASSWORD = 'password123';

async function upsertTenant() {
  return TenantModel.findOneAndUpdate(
    { name: 'FitPulse Default' },
    { $setOnInsert: { name: 'FitPulse Default', planTier: 'free', themeConfig: { primaryColor: '#4F6EF7', brandName: 'FitPulse' } } },
    { new: true, upsert: true },
  );
}

async function upsertBranch(tenantId: Types.ObjectId) {
  return BranchModel.findOneAndUpdate(
    { tenantId, name: 'FitPulse Default Branch' },
    {
      $setOnInsert: {
        tenantId,
        name: 'FitPulse Default Branch',
        location: 'Main location',
        qrCodeToken: `default-branch-${tenantId.toString()}`,
        checkInMethods: ['qr', 'pin'],
        autoCheckoutEnabled: true,
        autoCheckoutAfterMins: 180,
        guestPassEnabled: false,
        capacity: 120,
      },
    },
    { new: true, upsert: true },
  );
}

async function upsertUser(input: {
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  role: 'admin' | 'trainer' | 'member';
  email: string;
  firstName: string;
  lastName: string;
}) {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  return UserModel.findOneAndUpdate(
    { email: input.email },
    {
      $setOnInsert: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        role: input.role,
        status: 'active',
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        profile: { goals: ['general_fitness'], experienceLevel: 'intermediate' },
      },
    },
    { new: true, upsert: true },
  );
}

async function upsertExercise(name: string, muscleGroups: string[], equipment: string[]) {
  return ExerciseModel.findOneAndUpdate(
    { name, isCustom: false },
    { $setOnInsert: { name, muscleGroups, equipment, instructions: `Perform ${name} with controlled form.`, isCustom: false } },
    { new: true, upsert: true },
  );
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(9, 0, 0, 0);
  return d;
}

async function main() {
  const env = loadEnv();
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB for seeding.');

  const tenant = await upsertTenant();
  const branch = await upsertBranch(tenant._id);

  const admin = await upsertUser({ tenantId: tenant._id, branchId: branch._id, role: 'admin', email: 'admin@fitpulse.app', firstName: 'Ava', lastName: 'Owner' });
  const trainer = await upsertUser({ tenantId: tenant._id, branchId: branch._id, role: 'trainer', email: 'trainer@fitpulse.app', firstName: 'Tom', lastName: 'Coach' });

  const memberSeeds = [
    { email: 'alex@fitpulse.app', firstName: 'Alex', lastName: 'Chen' },
    { email: 'priya@fitpulse.app', firstName: 'Priya', lastName: 'Sharma' },
    { email: 'jake@fitpulse.app', firstName: 'Jake', lastName: 'Wilson' },
    { email: 'maria@fitpulse.app', firstName: 'Maria', lastName: 'Lopez' },
    { email: 'sam@fitpulse.app', firstName: 'Sam', lastName: 'Park' },
  ];
  const members = await Promise.all(
    memberSeeds.map((m) => upsertUser({ tenantId: tenant._id, branchId: branch._id, role: 'member', ...m })),
  );

  const benchPress = await upsertExercise('Barbell Bench Press', ['chest'], ['barbell']);
  const squat = await upsertExercise('Barbell Back Squat', ['quads', 'glutes'], ['barbell']);
  const deadlift = await upsertExercise('Deadlift', ['back', 'hamstrings'], ['barbell']);
  const row = await upsertExercise('Dumbbell Row', ['back'], ['dumbbell']);
  await upsertExercise('Push-Up', ['chest', 'triceps'], ['bodyweight']);

  const memberIds = members.map((m) => m._id);
  await Promise.all([
    WorkoutPlanModel.deleteMany({ userId: { $in: memberIds } }),
    WorkoutSessionModel.deleteMany({ userId: { $in: memberIds } }),
    AttendanceRecordModel.deleteMany({ userId: { $in: memberIds } }),
    PersonalRecordModel.deleteMany({ userId: { $in: memberIds } }),
  ]);

  // Trainer's own template plans (source plans for CreatePlanPage/AssignPlanPage to work with).
  await WorkoutPlanModel.deleteMany({ userId: trainer._id });
  const pplPlan = await WorkoutPlanModel.create({
    userId: trainer._id,
    trainerId: trainer._id,
    name: 'Push Pull Legs',
    goal: 'build_muscle',
    generatedBy: 'trainer',
    active: true,
    days: [
      { dayLabel: 'Day 1 - Push', exercises: [{ exerciseId: benchPress._id, sets: 4, reps: '8-10', restSecs: 90 }] },
      { dayLabel: 'Day 2 - Pull', exercises: [{ exerciseId: row._id, sets: 4, reps: '10-12', restSecs: 75 }] },
      { dayLabel: 'Day 3 - Legs', exercises: [{ exerciseId: squat._id, sets: 4, reps: '6-8', restSecs: 120 }] },
    ],
  });

  // Give the first 2 members an assigned copy of that plan, and real attendance/session history
  // for all 5 so the analytics chart, roster stats, and PRs all have genuine data to show.
  for (let i = 0; i < members.length; i++) {
    const member = members[i];

    if (i < 2) {
      await WorkoutPlanModel.create({
        userId: member._id,
        trainerId: trainer._id,
        name: pplPlan.name,
        goal: pplPlan.goal,
        generatedBy: 'trainer',
        active: true,
        days: pplPlan.days,
      });
    }

    // Attendance: a streak of consecutive recent days, varying per member, plus some older spread.
    const streakLength = 1 + i * 2; // 1,3,5,7,9
    const attendanceDocs = [];
    for (let d = 0; d < streakLength; d++) {
      attendanceDocs.push({ userId: member._id, branchId: branch._id, checkedInAt: daysAgo(d), method: 'qr' as const });
    }
    for (const d of [10, 14, 18, 22]) {
      attendanceDocs.push({ userId: member._id, branchId: branch._id, checkedInAt: daysAgo(d), method: 'manual' as const });
    }
    await AttendanceRecordModel.insertMany(attendanceDocs);

    // A couple of logged sessions with real weights, so PR detection and volume stats are real.
    const baseWeight = 40 + i * 10;
    await WorkoutSessionModel.create({
      userId: member._id,
      date: daysAgo(1),
      durationMins: 45,
      perceivedEffort: 7,
      sets: [
        { exerciseId: benchPress._id, setNumber: 1, weightKg: baseWeight, reps: 8, completed: true },
        { exerciseId: benchPress._id, setNumber: 2, weightKg: baseWeight, reps: 8, completed: true },
        { exerciseId: squat._id, setNumber: 1, weightKg: baseWeight + 20, reps: 6, completed: true },
      ],
    });
    await WorkoutSessionModel.create({
      userId: member._id,
      date: daysAgo(4),
      durationMins: 40,
      perceivedEffort: 6,
      sets: [{ exerciseId: deadlift._id, setNumber: 1, weightKg: baseWeight + 30, reps: 5, completed: true }],
    });
    await PersonalRecordModel.create([
      { userId: member._id, exerciseId: benchPress._id, value: baseWeight, unit: 'kg', achievedAt: daysAgo(1) },
      { userId: member._id, exerciseId: squat._id, value: baseWeight + 20, unit: 'kg', achievedAt: daysAgo(1) },
      { userId: member._id, exerciseId: deadlift._id, value: baseWeight + 30, unit: 'kg', achievedAt: daysAgo(4) },
    ]);
  }

  await mongoose.disconnect();

  console.log('\nSeed complete.');
  console.log('Login with any of these (password: "%s"):', SEED_PASSWORD);
  console.log('  admin:   admin@fitpulse.app');
  console.log('  trainer: trainer@fitpulse.app');
  for (const m of memberSeeds) console.log('  member:  %s', m.email);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
