import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import type { Exercise, GenerateFullPlanResult, MuscleGroup } from '@barbellix/shared';
import { aiCoachService } from './providers/index.js';
import { searchExercises, getExercisesByIds } from '../exercises/service.js';
import { createPlan, toDomainPlan, findActiveByUser, deactivatePlan, findRecentSessionsByUser } from '../workouts/repository.js';
import { createDietPlan, toDomainDietPlan } from '../nutrition/repository.js';
import { findMetrics } from '../progress/repository.js';
import { findById as findUserById } from '../users/repository.js';
import { computeAverageRPE } from './recommendations.js';
import { BadGatewayError, NotFoundError } from '../../lib/errors.js';

const FITNESS_GOALS = [
  'lose_weight',
  'build_muscle',
  'improve_endurance',
  'increase_strength',
  'general_fitness',
  'sport_performance',
] as const;

/** Fixed, deterministic weekday assignment for a generated plan's days - never left to the LLM to
 * decide, same "deterministic decision" philosophy as decidePlanChanges() further down. Values are
 * JS Date.getDay() indices (0 = Sunday). Falls back to spreading evenly from Monday for day counts
 * outside 1-7 (shouldn't happen given the 1-7 UI constraint, but keeps this total). */
const WEEKDAY_SCHEDULES: Record<number, number[]> = {
  1: [1],
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 4, 5],
  6: [1, 2, 3, 4, 5, 6],
  7: [0, 1, 2, 3, 4, 5, 6],
};

function assignWeekdays(dayCount: number): number[] {
  return WEEKDAY_SCHEDULES[dayCount] ?? Array.from({ length: dayCount }, (_, i) => (1 + i) % 7);
}

/** Exercises whose muscle groups touch a currently-logged injury, filtered out of the candidate
 * list *before* it's ever offered to the LLM - the model can't recommend what it never sees. Also
 * narrows by gym access when set, so equipment the member doesn't have is never suggested either. */
function filterExercisesForProfile(
  exercises: Exercise[],
  injuredMuscleGroups: Set<MuscleGroup>,
  gymAccess?: 'full_gym' | 'home_bodyweight' | 'home_with_dumbbells',
): Exercise[] {
  const allowedEquipment =
    gymAccess === 'home_bodyweight' ? new Set(['bodyweight']) : gymAccess === 'home_with_dumbbells' ? new Set(['bodyweight', 'dumbbell']) : null;

  return exercises.filter((ex) => {
    if (ex.muscleGroups.some((mg) => injuredMuscleGroups.has(mg))) return false;
    if (allowedEquipment && ex.equipment.length > 0 && !ex.equipment.every((eq) => allowedEquipment.has(eq))) return false;
    return true;
  });
}

function errorMessage(reason: unknown): string {
  return reason instanceof Error ? reason.message : 'Generation failed';
}

/** The model sometimes wraps its JSON in a ```json fence despite instructions not to - strip it
 * rather than fail the whole generation over a formatting quirk. */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  return JSON.parse(raw.trim());
}

/**
 * Shared core for every "ask the LLM for a structured plan" flow (workout, diet, and any future
 * one) - the only thing that differs between them is the prompt and the shape being validated,
 * so that's all callers provide. Keeping the actual LLM call + JSON parse/validate/error-handling
 * in exactly one place means a provider outage or a malformed response is handled identically
 * everywhere, not reimplemented per plan type.
 */
async function generateStructuredPlan<T>(
  fastify: FastifyInstance,
  systemPrompt: string,
  userMessage: string,
  schema: z.ZodType<T>,
  maxTokens: number,
): Promise<T> {
  let raw: string;
  try {
    const result = await aiCoachService.complete({ systemPrompt, history: [], userMessage, maxTokens });
    raw = result.text;
  } catch (err) {
    fastify.log.error({ err }, 'AI structured generation: all providers failed');
    throw new BadGatewayError('AI coach is temporarily unavailable');
  }

  try {
    return schema.parse(extractJson(raw));
  } catch (err) {
    fastify.log.error({ err, raw }, 'AI structured generation: model returned invalid JSON');
    throw new BadGatewayError('The AI returned an unexpected response - please try again');
  }
}

// ─── Workout plan ─────────────────────────────────────────────────────────────

const generatedExerciseSchema = z.object({
  exerciseName: z.string(),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1),
  restSecs: z.number().int().min(0).max(600),
  notes: z.string().optional(),
});

const generatedWorkoutPlanSchema = z.object({
  planName: z.string().min(1),
  goal: z.enum(FITNESS_GOALS),
  days: z.array(
    z.object({
      dayLabel: z.string().min(1),
      exercises: z.array(generatedExerciseSchema).min(1),
    }),
  ).min(1),
});

export async function generateWorkoutPlan(
  fastify: FastifyInstance,
  userId: string,
  tenantId: string,
  goal: string,
  daysPerWeek: number,
) {
  const member = await findUserById(userId);
  if (!member) throw new NotFoundError('User not found');

  const injuredMuscleGroups = new Set(member.profile.injuries.map((i) => i.bodyPart));
  const allExercises = await searchExercises(tenantId);
  const exercises = filterExercisesForProfile(allExercises, injuredMuscleGroups, member.profile.gymAccess);
  if (exercises.length === 0) throw new BadGatewayError('No exercises available to build a plan from - your equipment/injury settings may be excluding the whole library');

  const exerciseMenu = exercises.map((e) => e.name).join(', ');
  const injuryNote =
    injuredMuscleGroups.size > 0
      ? `\n- IMPORTANT: this client has reported injuries affecting: ${[...injuredMuscleGroups].join(', ')}. The exercise list below has already been filtered to exclude exercises targeting these muscle groups - only choose from what's listed.`
      : '';

  const systemPrompt = `You are an expert strength & conditioning coach. Build a real, structured workout split.

Rules:
- Output ONLY valid JSON, no markdown, no commentary, no code fences - just the raw JSON object.
- The JSON must match this exact shape:
  { "planName": string, "goal": one of [${FITNESS_GOALS.join(', ')}], "days": [ { "dayLabel": string, "exercises": [ { "exerciseName": string, "sets": number, "reps": string (e.g. "8-10"), "restSecs": number, "notes": string } ] } ] }
- Produce exactly ${daysPerWeek} days.
- Each day should have 5-7 exercises appropriate for its focus (e.g. "Push (Chest, Shoulders, Triceps)").
- "exerciseName" MUST be copied exactly (same spelling/case) from this list of real available exercises - never invent a name: ${exerciseMenu}
- "goal" must be exactly one of the six enum values listed above - pick the closest match to what the user asked for.
- "notes" should be a short (under 12 words) coaching cue, e.g. "Control the eccentric."${injuryNote}`;

  const userMessage = `Build me a ${daysPerWeek}-day-per-week workout plan. My goal: ${goal}`;

  const parsed = await generateStructuredPlan(fastify, systemPrompt, userMessage, generatedWorkoutPlanSchema, 3000);

  const exerciseIdByName = new Map(exercises.map((e) => [e.name.toLowerCase().trim(), e.id]));

  const days = parsed.days
    .map((day) => ({
      dayLabel: day.dayLabel,
      exercises: day.exercises
        .map((ex) => {
          const exerciseId = exerciseIdByName.get(ex.exerciseName.toLowerCase().trim());
          if (!exerciseId) return null;
          return { exerciseId, sets: ex.sets, reps: ex.reps, restSecs: ex.restSecs, notes: ex.notes };
        })
        .filter((e): e is NonNullable<typeof e> => e !== null),
    }))
    .filter((day) => day.exercises.length > 0);

  if (days.length === 0) {
    throw new BadGatewayError('The AI could not match any of its suggested exercises to the real exercise library - please try again');
  }

  const weekdays = assignWeekdays(days.length);
  const daysWithSchedule = days.map((day, i) => ({ ...day, dayOfWeek: weekdays[i] }));

  const doc = await createPlan({ userId, name: parsed.planName, goal: parsed.goal, generatedBy: 'ai', days: daysWithSchedule });
  return toDomainPlan(doc);
}

// ─── Diet plan ────────────────────────────────────────────────────────────────

const generatedMealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string().min(1),
  calories: z.number().int().min(0),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
  notes: z.string().optional(),
});

const generatedDietPlanSchema = z.object({
  planName: z.string().min(1),
  goal: z.enum(FITNESS_GOALS),
  dailyCalorieTarget: z.number().int().min(800).max(6000),
  dailyProteinG: z.number().min(0),
  dailyCarbsG: z.number().min(0),
  dailyFatG: z.number().min(0),
  meals: z.array(generatedMealSchema).min(3),
});

export async function generateDietPlan(fastify: FastifyInstance, userId: string, goal: string) {
  const member = await findUserById(userId);
  if (!member) throw new NotFoundError('User not found');
  const { weightKg, heightCm, targetWeightKg, dietPreference } = member.profile;

  const bodyLine = `- Client's current weight: ${weightKg ?? 'unknown'} kg, height: ${heightCm ?? 'unknown'} cm${targetWeightKg ? `, target weight: ${targetWeightKg} kg` : ''}. Use this to reason about a calorie deficit/surplus/maintenance appropriate for the goal and target.`;
  const dietPreferenceLine = dietPreference
    ? `\n- STRICT dietary requirement: every meal must be ${dietPreference.replace('_', '-')} - no exceptions.`
    : '';

  const systemPrompt = `You are an expert sports nutritionist. Build a real, structured one-day meal template the client repeats daily.

Rules:
- Output ONLY valid JSON, no markdown, no commentary, no code fences - just the raw JSON object.
- The JSON must match this exact shape:
  { "planName": string, "goal": one of [${FITNESS_GOALS.join(', ')}], "dailyCalorieTarget": number, "dailyProteinG": number, "dailyCarbsG": number, "dailyFatG": number, "meals": [ { "mealType": one of [breakfast, lunch, dinner, snack], "name": string, "calories": number, "proteinG": number, "carbsG": number, "fatG": number, "notes": string } ] }
- Include exactly 4 meals: breakfast, lunch, dinner, and one snack.
- Each meal's macros should be realistic for a real dish (not just numbers) - "name" should read like something a person would actually eat and cook.
- The meals' combined calories/macros should add up close to the daily targets.
- "goal" must be exactly one of the six enum values listed above - pick the closest match to what the user asked for.
- "notes" should be a short (under 12 words) practical tip, e.g. "Swap rice for quinoa for more protein."
${bodyLine}${dietPreferenceLine}`;

  const userMessage = `Build me a daily meal plan. My goal: ${goal}`;

  const parsed = await generateStructuredPlan(fastify, systemPrompt, userMessage, generatedDietPlanSchema, 2000);

  const doc = await createDietPlan({
    userId,
    name: parsed.planName,
    goal: parsed.goal,
    generatedBy: 'ai',
    dailyCalorieTarget: parsed.dailyCalorieTarget,
    dailyProteinG: parsed.dailyProteinG,
    dailyCarbsG: parsed.dailyCarbsG,
    dailyFatG: parsed.dailyFatG,
    meals: parsed.meals,
  });
  return toDomainDietPlan(doc);
}

// ─── Interval-based plan regeneration ─────────────────────────────────────────

const MIN_SETS = 1;
const MAX_SETS = 6;

/**
 * Deterministic decision engine - no LLM call. Same philosophy as recommendations.ts's rule-based
 * cards: given real, measurable inputs (recent RPE, session adherence, weight delta), it applies
 * a fixed, explainable set of rules rather than asking a model to "figure it out." This keeps
 * every regeneration reproducible and free of hallucinated exercises, since it only ever adjusts
 * `sets` on exercises the plan already references - it never invents a new exerciseId.
 *
 * Rules are checked in priority order for the volume adjustment (only one applies), plus
 * independent advisory notes that can stack alongside it.
 */
function decidePlanChanges(input: {
  goal: string;
  avgRPE: number;
  sessionsInWindow: number;
  expectedSessions: number;
  weightDeltaKg?: number;
  hasPreviousMetric: boolean;
}): { setsDelta: number; changeSummary: string[] } {
  const { goal, avgRPE, sessionsInWindow, expectedSessions, weightDeltaKg, hasPreviousMetric } = input;
  const changeSummary: string[] = [];
  let setsDelta = 0;

  if (avgRPE >= 8.5 && sessionsInWindow >= 3) {
    setsDelta = -1;
    changeSummary.push(`Recent sessions averaged a high RPE of ${avgRPE.toFixed(1)} — reduced sets per exercise by 1 to let you recover.`);
  } else if (sessionsInWindow < expectedSessions * 0.5) {
    changeSummary.push(
      `Only ${sessionsInWindow} of an expected ~${expectedSessions} sessions were logged since your last check-in — keeping volume steady rather than increasing difficulty until consistency improves.`,
    );
  } else if (avgRPE > 0 && avgRPE < 6.5 && sessionsInWindow >= expectedSessions) {
    setsDelta = 1;
    changeSummary.push(`Effort has been comfortably low (avg RPE ${avgRPE.toFixed(1)}) with full adherence — added 1 set per exercise for progressive overload.`);
  } else {
    changeSummary.push('No strong signal for a change yet — kept your current volume. Keep logging sessions and check-ins for more precise future adjustments.');
  }

  if (!hasPreviousMetric) {
    changeSummary.push('This is your first check-in since starting this plan — log another after your next interval for weight/measurement-based adjustments.');
  } else if (weightDeltaKg !== undefined) {
    if (goal === 'lose_weight' && weightDeltaKg > -0.2) {
      changeSummary.push('Weight change since your last check-in was minimal for a fat-loss goal — consider asking your trainer about a calorie adjustment or an added cardio session.');
    } else if (goal === 'build_muscle' && weightDeltaKg < 0.1) {
      changeSummary.push('Little to no weight gain since your last check-in for a muscle-gain goal — consider asking your trainer about increasing your calorie target.');
    }
  }

  return { setsDelta, changeSummary };
}

/**
 * The member (or their trainer) triggers this once a check-in is due (see
 * progress/service.ts's getCheckInStatus()) - there is no scheduled job that calls it on its own,
 * matching this codebase's established lazy-evaluation pattern (see billing/service.ts's
 * isAccessBlocked() for the same philosophy applied to membership grace periods). It compares the
 * member's two most recent BodyMetric entries and recent session history against their current
 * active plan, applies decidePlanChanges() above, and saves the result as a new, versioned plan -
 * the prior version is deactivated but never deleted, so its full history stays comparable.
 */
export async function regenerateWorkoutPlan(userId: string) {
  const activePlan = await findActiveByUser(userId);
  if (!activePlan) throw new NotFoundError('No active workout plan to regenerate - generate one first');

  const member = await findUserById(userId);
  if (!member) throw new NotFoundError('User not found');
  const injuredMuscleGroups = new Set(member.profile.injuries.map((i) => i.bodyPart));

  const [metrics, recentSessions] = await Promise.all([findMetrics(userId), findRecentSessionsByUser(userId, 30)]);
  const [latestMetric, previousMetric] = metrics;

  const sinceDate = previousMetric?.recordedAt ?? new Date(0);
  const sessionsInWindow = recentSessions.filter((s) => s.date >= sinceDate).length;
  const expectedSessions = Math.max(activePlan.days.length, 1);
  const avgRPE = computeAverageRPE(recentSessions.filter((s) => s.date >= sinceDate));

  const weightDeltaKg =
    latestMetric?.weightKg !== undefined && previousMetric?.weightKg !== undefined
      ? latestMetric.weightKg - previousMetric.weightKg
      : undefined;

  const { setsDelta, changeSummary } = decidePlanChanges({
    goal: activePlan.goal,
    avgRPE,
    sessionsInWindow,
    expectedSessions,
    weightDeltaKg,
    hasPreviousMetric: !!previousMetric,
  });

  // Injury-aware stripping needs each referenced exercise's muscleGroups, which the plan's own
  // subdocuments don't carry (only exerciseId) - one batched lookup covers every exercise across
  // every day, same batching philosophy as the rest of this codebase's roster/member queries.
  const allExerciseIds = [...new Set(activePlan.days.flatMap((day) => day.exercises.map((ex) => ex.exerciseId.toString())))];
  const exerciseById = new Map((await getExercisesByIds(allExerciseIds)).map((e) => [e.id, e]));
  const removedExerciseNames = new Set<string>();

  const adjustedDays = activePlan.days
    .map((day) => ({
      dayLabel: day.dayLabel,
      dayOfWeek: day.dayOfWeek,
      exercises: day.exercises
        .filter((ex) => {
          const detail = exerciseById.get(ex.exerciseId.toString());
          const touchesInjury = detail ? detail.muscleGroups.some((mg) => injuredMuscleGroups.has(mg)) : false;
          if (touchesInjury && detail) removedExerciseNames.add(detail.name);
          return !touchesInjury;
        })
        .map((ex) => ({
          exerciseId: ex.exerciseId.toString(),
          sets: Math.min(MAX_SETS, Math.max(MIN_SETS, ex.sets + setsDelta)),
          reps: ex.reps,
          restSecs: ex.restSecs,
          notes: ex.notes,
        })),
    }))
    .filter((day) => day.exercises.length > 0);

  if (adjustedDays.length === 0) {
    throw new BadGatewayError('Every exercise in your current plan touches a currently logged injury - this needs trainer review rather than automatic adjustment.');
  }

  if (removedExerciseNames.size > 0) {
    changeSummary.push(`Removed ${[...removedExerciseNames].join(', ')} — currently logged injuries affect this muscle group.`);
  }

  const newDoc = await createPlan({
    userId,
    name: activePlan.name,
    goal: activePlan.goal,
    generatedBy: 'ai',
    days: adjustedDays,
    trainerId: activePlan.trainerId?.toString(),
    version: activePlan.version + 1,
    previousPlanId: activePlan._id.toString(),
    changeSummary,
  });

  await deactivatePlan(activePlan._id.toString());

  return toDomainPlan(newDoc);
}

// ─── Combined AI goal-wizard generation ────────────────────────────────────────

/** Powers the AI goal wizard's single "generate everything" step - internally just calls the two
 * existing generators above via Promise.allSettled (not Promise.all): generateWorkoutPlan already
 * persists to Mongo before returning, so if diet generation failed after workout generation
 * succeeded, an all()-style rejection would throw away a plan that's already saved. Returning
 * whichever half succeeded lets the client show a partial result instead of a hard failure. */
export async function generateFullPlan(
  fastify: FastifyInstance,
  userId: string,
  tenantId: string,
  goal: string,
  daysPerWeek: number,
): Promise<GenerateFullPlanResult> {
  const [workoutResult, dietResult] = await Promise.allSettled([
    generateWorkoutPlan(fastify, userId, tenantId, goal, daysPerWeek),
    generateDietPlan(fastify, userId, goal),
  ]);

  return {
    workoutPlan: workoutResult.status === 'fulfilled' ? workoutResult.value : undefined,
    workoutPlanError: workoutResult.status === 'rejected' ? errorMessage(workoutResult.reason) : undefined,
    dietPlan: dietResult.status === 'fulfilled' ? dietResult.value : undefined,
    dietPlanError: dietResult.status === 'rejected' ? errorMessage(dietResult.reason) : undefined,
  };
}
