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
import { SponsorModel } from './models/Sponsor.js';

const SEED_PASSWORD = 'password123';

async function upsertTenant() {
  return TenantModel.findOneAndUpdate(
    { name: 'BarBellix Default' },
    { $setOnInsert: { name: 'BarBellix Default', planTier: 'free', themeConfig: { primaryColor: '#4F6EF7', brandName: 'BarBellix' } } },
    { new: true, upsert: true },
  );
}

async function upsertBranch(tenantId: Types.ObjectId) {
  return BranchModel.findOneAndUpdate(
    { tenantId, name: 'BarBellix Default Branch' },
    {
      $setOnInsert: {
        tenantId,
        name: 'BarBellix Default Branch',
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

async function upsertSponsors(tenantId: Types.ObjectId) {
  const sponsors = [
    { name: 'IronForge Supplements', description: 'Official protein & creatine partner - members get 15% off with code BARBELLIX15.', websiteUrl: 'https://example.com/ironforge' },
    { name: 'PulseWear Athletic', description: 'Performance apparel sponsor - new member welcome packs include a free PulseWear tee.', websiteUrl: 'https://example.com/pulsewear' },
    { name: 'RecoverFast Therapy', description: 'On-site recovery partner - members get a discounted rate on sports massage and cupping.', websiteUrl: 'https://example.com/recoverfast' },
  ];
  await Promise.all(
    sponsors.map((s) =>
      SponsorModel.findOneAndUpdate(
        { tenantId, name: s.name },
        { $setOnInsert: { tenantId, ...s, active: true } },
        { upsert: true },
      ),
    ),
  );
}

async function upsertUser(input: {
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  role: 'admin' | 'trainer' | 'member' | 'superadmin';
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

/** Real, standard physical-therapy rehab exercises (not the generic placeholder instructions
 * upsertExercise() above uses) - tagged 'rehabilitation' and 'low_impact' so they surface in the
 * AI plan generator's candidate list specifically for members with a logged injury in the
 * matching muscle group/region (see ai-coach/plan-generator.ts's filterExercisesForProfile()) and
 * are browsable/filterable in the exercise library by trainers building recovery-focused plans. */
async function upsertRehabExercise(name: string, muscleGroups: string[], equipment: string[], instructions: string) {
  return ExerciseModel.findOneAndUpdate(
    { name, isCustom: false },
    {
      $setOnInsert: {
        name,
        muscleGroups,
        equipment,
        instructions,
        tags: ['rehabilitation', 'low_impact'],
        isCustom: false,
      },
    },
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
  await upsertSponsors(tenant._id);

  const admin = await upsertUser({ tenantId: tenant._id, branchId: branch._id, role: 'admin', email: 'admin@barbellix.app', firstName: 'Ava', lastName: 'Owner' });
  const trainer = await upsertUser({ tenantId: tenant._id, branchId: branch._id, role: 'trainer', email: 'trainer@barbellix.app', firstName: 'Tom', lastName: 'Coach' });
  // Superadmin belongs to this same seeded tenant (every User requires one), but its role grants
  // platform-wide access regardless - see modules/superadmin/routes.ts, which never filters by
  // this or any other tenantId.
  await upsertUser({ tenantId: tenant._id, branchId: branch._id, role: 'superadmin', email: 'superadmin@barbellix.app', firstName: 'Sam', lastName: 'Platform' });

  const memberSeeds = [
    { email: 'alex@barbellix.app', firstName: 'Alex', lastName: 'Chen' },
    { email: 'priya@barbellix.app', firstName: 'Priya', lastName: 'Sharma' },
    { email: 'jake@barbellix.app', firstName: 'Jake', lastName: 'Wilson' },
    { email: 'maria@barbellix.app', firstName: 'Maria', lastName: 'Lopez' },
    { email: 'sam@barbellix.app', firstName: 'Sam', lastName: 'Park' },
  ];
  const members = await Promise.all(
    memberSeeds.map((m) => upsertUser({ tenantId: tenant._id, branchId: branch._id, role: 'member', ...m })),
  );

  const benchPress = await upsertExercise('Barbell Bench Press', ['chest'], ['barbell']);
  const squat = await upsertExercise('Barbell Back Squat', ['quads', 'glutes'], ['barbell']);
  const deadlift = await upsertExercise('Deadlift', ['back', 'hamstrings'], ['barbell']);
  const row = await upsertExercise('Dumbbell Row', ['back'], ['dumbbell']);
  await upsertExercise('Push-Up', ['chest', 'triceps'], ['bodyweight']);

  // A broader library so the AI plan generator (see ai-coach/plan-generator.ts) has enough real,
  // varied exercises per muscle group to build a convincing multi-day split from - five exercises
  // total isn't enough to avoid awkward repetition across a 5-day/6-exercise-per-day plan.
  await Promise.all([
    // Chest
    upsertExercise('Incline Dumbbell Press', ['chest'], ['dumbbell']),
    upsertExercise('Decline Barbell Bench Press', ['chest'], ['barbell']),
    upsertExercise('Dumbbell Flyes', ['chest'], ['dumbbell']),
    upsertExercise('Cable Crossover', ['chest'], ['cable']),
    upsertExercise('Chest Dip', ['chest', 'triceps'], ['bodyweight']),
    // Back
    upsertExercise('Pull-Up', ['back', 'biceps'], ['bodyweight']),
    upsertExercise('Lat Pulldown', ['back'], ['cable']),
    upsertExercise('Seated Cable Row', ['back'], ['cable']),
    upsertExercise('T-Bar Row', ['back'], ['barbell']),
    upsertExercise('Single-Arm Dumbbell Row', ['back'], ['dumbbell']),
    // Shoulders
    upsertExercise('Standing Overhead Press', ['shoulders'], ['barbell']),
    upsertExercise('Dumbbell Shoulder Press', ['shoulders'], ['dumbbell']),
    upsertExercise('Lateral Raises', ['shoulders'], ['dumbbell']),
    upsertExercise('Front Raise', ['shoulders'], ['dumbbell']),
    upsertExercise('Rear Delt Fly', ['shoulders'], ['dumbbell']),
    upsertExercise('Arnold Press', ['shoulders'], ['dumbbell']),
    // Biceps
    upsertExercise('Barbell Curl', ['biceps'], ['barbell']),
    upsertExercise('Dumbbell Curl', ['biceps'], ['dumbbell']),
    upsertExercise('Hammer Curl', ['biceps', 'forearms'], ['dumbbell']),
    upsertExercise('Preacher Curl', ['biceps'], ['barbell']),
    upsertExercise('Concentration Curl', ['biceps'], ['dumbbell']),
    // Triceps
    upsertExercise('Tricep Pushdown', ['triceps'], ['cable']),
    upsertExercise('Overhead Tricep Extension', ['triceps'], ['dumbbell']),
    upsertExercise('Skull Crusher', ['triceps'], ['barbell']),
    upsertExercise('Close-Grip Bench Press', ['triceps', 'chest'], ['barbell']),
    upsertExercise('Tricep Dips', ['triceps'], ['bodyweight']),
    // Forearms / core
    upsertExercise("Farmer's Carry", ['forearms', 'core'], ['dumbbell']),
    upsertExercise('Plank', ['core'], ['bodyweight']),
    upsertExercise('Hanging Leg Raise', ['core'], ['bodyweight']),
    upsertExercise('Cable Crunch', ['core'], ['cable']),
    upsertExercise('Russian Twist', ['core'], ['bodyweight']),
    // Quads
    upsertExercise('Leg Press', ['quads', 'glutes'], ['machine']),
    upsertExercise('Leg Extension', ['quads'], ['machine']),
    upsertExercise('Front Squat', ['quads'], ['barbell']),
    upsertExercise('Walking Lunge', ['quads', 'glutes'], ['dumbbell']),
    upsertExercise('Bulgarian Split Squat', ['quads', 'glutes'], ['dumbbell']),
    // Hamstrings / glutes
    upsertExercise('Romanian Deadlift', ['hamstrings', 'glutes'], ['barbell']),
    upsertExercise('Leg Curl', ['hamstrings'], ['machine']),
    upsertExercise('Hip Thrust', ['glutes'], ['barbell']),
    upsertExercise('Glute Bridge', ['glutes'], ['bodyweight']),
    // Calves / full body
    upsertExercise('Standing Calf Raise', ['calves'], ['machine']),
    upsertExercise('Seated Calf Raise', ['calves'], ['machine']),
    upsertExercise('Kettlebell Swing', ['full_body', 'glutes'], ['kettlebell']),
    upsertExercise('Burpee', ['full_body'], ['bodyweight']),
  ]);

  // Rehab library - standard physical-therapy exercises for the most common injuries/conditions,
  // one or more per region. Real content, not placeholders: this is what the injury-aware AI
  // filter (plan-generator.ts) and trainers building recovery plans actually have to work with.
  await Promise.all([
    // Lower back (lumbar strain, disc herniation, sciatica, spinal stenosis, spondylolisthesis)
    upsertRehabExercise('Cat-Cow Stretch', ['back', 'core'], ['bodyweight'], 'On hands and knees, alternate arching the back up (exhale) and dipping it down (inhale) through a pain-free range. 8-10 slow reps, 2-3 rounds. Stop if it increases leg pain or numbness.'),
    upsertRehabExercise('Bird Dog', ['back', 'core', 'glutes'], ['bodyweight'], 'On hands and knees, extend one arm and the opposite leg straight out while keeping the spine neutral and hips level. Hold 3-5s, return with control. 8-10 reps per side. Keep the low back still - the movement comes from the shoulder and hip.'),
    upsertRehabExercise('Dead Bug', ['core', 'back'], ['bodyweight'], 'Lying on your back, arms up and knees bent at 90°, slowly lower one arm and the opposite leg toward the floor while pressing the low back into the mat, then return. 8-10 reps per side. Never let the low back arch off the floor.'),
    // Knee (ACL/PCL/MCL/LCL, meniscus, patellofemoral pain, patellar/quad tendinopathy)
    upsertRehabExercise('Straight Leg Raise', ['quads', 'knee'], ['bodyweight'], 'Lying down with one leg bent and the other straight, tighten the straight leg\'s quad and lift it to hip height with no knee bend. Lower slowly. 2-3 sets of 10-15. Builds quad strength without loading the knee joint itself - a standard early post-injury/post-op exercise.'),
    upsertRehabExercise('Terminal Knee Extension', ['quads', 'knee'], ['resistance_band'], 'Anchor a band behind the knee at knee height, step forward until it\'s taut, soft bend in the knee, then straighten the knee fully against the band\'s pull without locking out hard. 2-3 sets of 12-15. Targets the last few degrees of extension that are often weak after knee injuries.'),
    upsertRehabExercise('Wall Sit', ['quads', 'knee'], ['bodyweight'], 'Back against a wall, slide down to a comfortable knee angle (start shallow, e.g. 45°, not a full 90° squat) and hold. Build up hold time as tolerated. Stop immediately if it produces sharp knee pain, not just muscle fatigue.'),
    upsertRehabExercise('Step-Up (Low Box)', ['quads', 'glutes', 'knee'], ['bodyweight'], 'Step up onto a low, stable step (start with 4-6 inches) leading with the affected leg, then step back down with control. 2-3 sets of 8-10 per side. Progress step height only once this is pain-free.'),
    // Shoulder (rotator cuff, impingement, instability, labral tear, frozen shoulder)
    upsertRehabExercise('Band External Rotation', ['shoulders'], ['resistance_band'], 'Elbow tucked at your side and bent 90°, hold a band anchored at waist height and rotate the forearm outward without letting the elbow drift from your side. 2-3 sets of 12-15 per arm. Classic rotator-cuff strengthening move - keep it slow and controlled.'),
    upsertRehabExercise('Scapular Wall Slides', ['shoulders', 'back'], ['bodyweight'], 'Back against a wall, arms in a "goalpost" position touching the wall, slide arms overhead while keeping them and the low back in contact with the wall, then return. 2 sets of 10. Improves shoulder blade mechanics - stop if it pinches.'),
    upsertRehabExercise('Pendulum Swing', ['shoulders'], ['bodyweight'], 'Lean on a table with the uninjured arm, let the affected arm hang loose, and gently swing it in small circles and side-to-side using body momentum, not the shoulder muscles. 1-2 minutes. A gentle early-stage mobility exercise, common after shoulder injury or surgery.'),
    // Neck (cervical strain, cervical radiculopathy)
    upsertRehabExercise('Chin Tuck', ['neck'], ['bodyweight'], 'Sitting tall, gently draw the chin straight back (as if making a double chin) without tilting the head up or down. Hold 3-5s. 10 reps, several times a day. Improves neck posture and relieves strain on the cervical spine.'),
    upsertRehabExercise('Neck Isometric Hold', ['neck'], ['bodyweight'], 'Place a hand against the side, front, or back of the head and gently push the head into the hand without letting the head actually move, holding steady resistance. 5s holds, 5-8 reps per direction. Builds neck strength without moving a potentially irritated joint.'),
    // Ankle (lateral/high ankle sprain, Achilles tendinopathy/rupture)
    upsertRehabExercise('Ankle Alphabet', ['ankle'], ['bodyweight'], 'Sitting with the leg extended, use the big toe to "write" the letters of the alphabet in the air, moving only the ankle. One full pass. Restores ankle range of motion after a sprain - keep it pain-free, not forced.'),
    upsertRehabExercise('Single-Leg Balance Hold', ['ankle', 'calves'], ['bodyweight'], 'Stand on the affected leg only, knee soft, and hold your balance for 20-30s; progress to standing on a pillow or closing your eyes as it gets easy. 3 attempts. Rebuilds the ankle\'s proprioception (position sense), which is commonly lost after a sprain.'),
    upsertRehabExercise('Eccentric Calf Raise', ['calves', 'ankle'], ['bodyweight'], 'Rise onto both toes, shift weight onto the affected leg, then lower down on that leg alone as slowly as possible (3-4 seconds). 3 sets of 15. The standard evidence-based protocol for Achilles tendinopathy - stop and scale back if it produces sharp pain rather than a manageable stretch/ache.'),
    // Hip (flexor strain, adductor/groin strain, gluteal tendinopathy, bursitis, OA)
    upsertRehabExercise('Clamshell', ['glutes', 'hip'], ['bodyweight'], 'Lying on your side, knees bent and stacked, feet together, lift the top knee open like a clamshell while keeping the feet touching and hips still. 2-3 sets of 12-15 per side. Targets the hip stabilizers commonly weak in hip and knee injuries alike.'),
    upsertRehabExercise('Standing Hip Flexor Stretch', ['hip'], ['bodyweight'], 'In a half-kneeling lunge position, tuck the pelvis under and gently shift weight forward until a stretch is felt at the front of the back hip. Hold 20-30s per side, 2-3 rounds. Ease off if it causes lower-back discomfort instead.'),
    // Thigh (hamstring/quad strain)
    upsertRehabExercise('Eccentric Nordic Hamstring Lower', ['hamstrings'], ['bodyweight'], 'Kneeling with ankles anchored (a partner or a bar), slowly lower your torso forward from the knees as far as controllable, using the hamstrings to resist, then catch yourself with your hands. Start with 2-3 sets of 3-5 - this is advanced; earlier-stage hamstring strains should start with gentle straight-leg raises instead.'),
    // Calf strain
    upsertRehabExercise('Standing Calf Stretch', ['calves'], ['bodyweight'], 'Hands on a wall, affected leg back with the heel down and knee straight, lean forward until a gentle stretch is felt in the calf. Hold 20-30s, 2-3 rounds per leg. Should feel like a stretch, never a sharp pull.'),
    // Elbow (tennis elbow, golfer's elbow)
    upsertRehabExercise('Wrist Extensor Stretch', ['forearms', 'elbow'], ['bodyweight'], 'Arm extended in front, palm down, gently pull the hand down and back with the other hand until a stretch is felt along the top of the forearm. Hold 20-30s, 2-3 rounds. Standard tennis-elbow stretch.'),
    upsertRehabExercise('Eccentric Wrist Curl', ['forearms', 'elbow'], ['dumbbell'], 'Forearm supported on a table or thigh, palm up (for golfer\'s elbow) or palm down (for tennis elbow), use the other hand to lift the weight up then lower it on your own as slowly as possible over 3-4 seconds. 3 sets of 12-15. The evidence-based rehab standard for elbow tendinopathies.'),
    // Wrist / hand (sprain, tendinopathy, carpal tunnel)
    upsertRehabExercise('Wrist Flexor/Extensor Stretch', ['wrist_hand', 'forearms'], ['bodyweight'], 'Arm extended, gently pull the hand back (fingers up) then down (fingers down) with the other hand, holding each 20-30s. 2-3 rounds. Improves wrist mobility and forearm flexibility.'),
    upsertRehabExercise('Median Nerve Glide', ['wrist_hand'], ['bodyweight'], 'Make a fist, then slowly extend the fingers, thumb, and wrist back one segment at a time until the arm is fully open with the wrist extended, then reverse. 5-10 slow reps. A common carpal-tunnel nerve-mobility exercise - stop if it causes tingling or numbness rather than a mild stretch.'),
    // Foot (plantar fasciitis, Achilles, metatarsal injuries)
    upsertRehabExercise('Towel Scrunches', ['foot'], ['bodyweight'], 'Sitting with a towel flat under bare feet, use the toes to scrunch and pull the towel toward you. 2-3 sets of 10-12. Strengthens the small foot muscles that support the arch - helpful for plantar fasciitis.'),
    upsertRehabExercise('Plantar Fascia Stretch', ['foot', 'calves'], ['bodyweight'], 'Sitting, cross the affected foot over the other knee and pull the toes back toward the shin until a stretch is felt along the arch. Hold 20-30s, 2-3 rounds - classically done first thing in the morning before standing.'),
  ]);

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
  console.log('  superadmin: superadmin@barbellix.app');
  console.log('  admin:      admin@barbellix.app');
  console.log('  trainer:    trainer@barbellix.app');
  for (const m of memberSeeds) console.log('  member:     %s', m.email);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
