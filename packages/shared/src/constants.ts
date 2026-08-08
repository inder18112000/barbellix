import type {
  HabitId,
  InjuryCondition,
  MuscleGroup,
  InjurySeverity,
  DietPreference,
  GymAccess,
  FitnessGoal,
  Equipment,
  ExerciseTag,
} from './types';

export const DEFAULT_NUTRITION_GOALS = {
  calories: 2200,
  proteinG: 160,
  carbsG: 250,
  fatG: 70,
};

/** Single source of truth for every fixed enum-of-values list in the app - server Mongoose
 * schemas, server Zod schemas, and web/mobile pickers all import these instead of each
 * hand-typing their own copy of the same literal array (they used to; that's how these drift). */
export const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quads', 'hamstrings', 'glutes', 'calves', 'full_body',
  'neck', 'hip', 'knee', 'ankle', 'foot', 'elbow', 'wrist_hand',
] as const satisfies readonly MuscleGroup[];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', biceps: 'Biceps', triceps: 'Triceps',
  forearms: 'Forearms', core: 'Core', quads: 'Quads', hamstrings: 'Hamstrings', glutes: 'Glutes',
  calves: 'Calves', full_body: 'Full body', neck: 'Neck', hip: 'Hip', knee: 'Knee', ankle: 'Ankle',
  foot: 'Foot', elbow: 'Elbow', wrist_hand: 'Wrist / hand',
};

export const EQUIPMENT = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'resistance_band', 'smith_machine', 'other',
] as const satisfies readonly Equipment[];

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: 'Barbell', dumbbell: 'Dumbbell', cable: 'Cable', machine: 'Machine', bodyweight: 'Bodyweight',
  kettlebell: 'Kettlebell', resistance_band: 'Resistance band', smith_machine: 'Smith machine', other: 'Other',
};

export const EXERCISE_TAGS = ['fat_loss', 'muscle_gain', 'mobility', 'rehabilitation', 'low_impact'] as const satisfies readonly ExerciseTag[];

export const INJURY_SEVERITIES = ['mild', 'moderate', 'severe'] as const satisfies readonly InjurySeverity[];

export const DIET_PREFERENCES = ['vegetarian', 'vegan', 'non_vegetarian'] as const satisfies readonly DietPreference[];

export const DIET_PREFERENCE_LABELS: Record<DietPreference, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  non_vegetarian: 'Non-vegetarian',
};

export const GYM_ACCESS_OPTIONS = ['full_gym', 'home_bodyweight', 'home_with_dumbbells'] as const satisfies readonly GymAccess[];

export const GYM_ACCESS_LABELS: Record<GymAccess, string> = {
  full_gym: 'Full gym',
  home_bodyweight: 'Bodyweight only',
  home_with_dumbbells: 'Home + dumbbells',
};

export const FITNESS_GOALS = [
  'lose_weight', 'build_muscle', 'improve_endurance', 'increase_strength', 'general_fitness', 'sport_performance',
] as const satisfies readonly FitnessGoal[];

export const FITNESS_GOAL_LABELS: Record<FitnessGoal, string> = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  improve_endurance: 'Improve Endurance',
  increase_strength: 'Increase Strength',
  general_fitness: 'General Fitness',
  sport_performance: 'Sport Performance',
};

export const HABIT_LABELS: Record<HabitId, string> = {
  water: 'Drink 8 glasses of water',
  sleep: 'Sleep 7+ hours',
  steps: '10,000 steps',
  stretch: 'Stretch / mobility',
  no_junk: 'No junk food',
  meditation: 'Meditate 10 min',
};

export const INJURY_CONDITION_LABELS: Record<InjuryCondition, string> = {
  lumbar_strain: 'Lumbar strain',
  disc_herniation: 'Disc herniation',
  radiculopathy_sciatica: 'Radiculopathy / sciatica',
  spinal_stenosis: 'Spinal stenosis',
  spondylolisthesis: 'Spondylolisthesis',
  acl_tear: 'ACL tear',
  pcl_tear: 'PCL tear',
  mcl_tear: 'MCL tear',
  lcl_tear: 'LCL tear',
  meniscus_tear: 'Meniscus tear',
  patellofemoral_pain: 'Patellofemoral pain',
  patellar_tendinopathy: 'Patellar tendinopathy',
  quadriceps_tendinopathy: 'Quadriceps tendinopathy',
  rotator_cuff_tendinopathy: 'Rotator cuff tendinopathy',
  rotator_cuff_tear: 'Rotator cuff tear',
  shoulder_impingement: 'Shoulder impingement',
  shoulder_instability: 'Shoulder instability',
  labral_tear: 'Labral tear',
  frozen_shoulder: 'Frozen shoulder',
  cervical_strain: 'Cervical strain',
  cervical_radiculopathy: 'Cervical radiculopathy',
  lateral_ankle_sprain: 'Lateral ankle sprain',
  high_ankle_sprain: 'High ankle sprain',
  achilles_tendinopathy: 'Achilles tendinopathy',
  achilles_rupture: 'Achilles rupture',
  hip_flexor_strain: 'Hip flexor strain',
  adductor_strain: 'Adductor / groin strain',
  gluteal_tendinopathy: 'Gluteal tendinopathy',
  hip_bursitis: 'Hip bursitis',
  hip_osteoarthritis: 'Hip osteoarthritis',
  hamstring_strain: 'Hamstring strain',
  quadriceps_strain: 'Quadriceps strain',
  calf_strain: 'Calf strain',
  tennis_elbow: "Tennis elbow",
  golfers_elbow: "Golfer's elbow",
  wrist_sprain: 'Wrist sprain',
  wrist_tendinopathy: 'Wrist tendinopathy',
  carpal_tunnel: 'Carpal tunnel syndrome',
  plantar_fasciitis: 'Plantar fasciitis',
  metatarsal_injury: 'Metatarsal injury',
  muscle_strain: 'Muscle strain (unspecified)',
  ligament_sprain: 'Ligament sprain (unspecified)',
  tendon_injury: 'Tendon injury (unspecified)',
  postoperative_rehabilitation: 'Post-operative rehabilitation',
};

/** Derived from INJURY_CONDITION_LABELS's keys rather than a second hand-typed list of the same
 * conditions - z.enum() needs a non-empty literal tuple, which Object.keys() alone can't give us,
 * but INJURY_CONDITION_LABELS's Record<InjuryCondition, string> type already guarantees every
 * condition is present, so the cast is safe. */
export const INJURY_CONDITIONS = Object.keys(INJURY_CONDITION_LABELS) as [InjuryCondition, ...InjuryCondition[]];

/** What each condition means for the AI exercise-safety filter (ai-coach/plan-generator.ts) -
 * picking a condition in the injury-logging UI auto-suggests these as the InjuryEntry.bodyPart
 * value(s), since bodyPart (not condition) is what actually drives filtering. The four
 * "general/unspecified" conditions intentionally map to an empty list - too generic to safely
 * infer a body part, so the member picks one manually instead. */
export const INJURY_CONDITION_MUSCLE_GROUPS: Record<InjuryCondition, MuscleGroup[]> = {
  lumbar_strain: ['back'],
  disc_herniation: ['back'],
  radiculopathy_sciatica: ['back', 'glutes', 'hamstrings'],
  spinal_stenosis: ['back'],
  spondylolisthesis: ['back'],
  acl_tear: ['knee', 'quads', 'hamstrings'],
  pcl_tear: ['knee', 'quads', 'hamstrings'],
  mcl_tear: ['knee'],
  lcl_tear: ['knee'],
  meniscus_tear: ['knee'],
  patellofemoral_pain: ['knee', 'quads'],
  patellar_tendinopathy: ['knee', 'quads'],
  quadriceps_tendinopathy: ['quads', 'knee'],
  rotator_cuff_tendinopathy: ['shoulders'],
  rotator_cuff_tear: ['shoulders'],
  shoulder_impingement: ['shoulders'],
  shoulder_instability: ['shoulders'],
  labral_tear: ['shoulders'],
  frozen_shoulder: ['shoulders'],
  cervical_strain: ['neck'],
  cervical_radiculopathy: ['neck', 'shoulders'],
  lateral_ankle_sprain: ['ankle'],
  high_ankle_sprain: ['ankle'],
  achilles_tendinopathy: ['ankle', 'calves'],
  achilles_rupture: ['ankle', 'calves'],
  hip_flexor_strain: ['hip'],
  adductor_strain: ['hip'],
  gluteal_tendinopathy: ['hip', 'glutes'],
  hip_bursitis: ['hip'],
  hip_osteoarthritis: ['hip'],
  hamstring_strain: ['hamstrings'],
  quadriceps_strain: ['quads'],
  calf_strain: ['calves'],
  tennis_elbow: ['elbow', 'forearms'],
  golfers_elbow: ['elbow', 'forearms'],
  wrist_sprain: ['wrist_hand'],
  wrist_tendinopathy: ['wrist_hand', 'forearms'],
  carpal_tunnel: ['wrist_hand', 'forearms'],
  plantar_fasciitis: ['foot', 'calves'],
  metatarsal_injury: ['foot'],
  muscle_strain: [],
  ligament_sprain: [],
  tendon_injury: [],
  postoperative_rehabilitation: [],
};
