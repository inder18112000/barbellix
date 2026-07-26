import { z } from 'zod';
import type { FastifyInstance } from 'fastify';
import { aiCoachService } from './providers/index.js';
import { searchExercises } from '../exercises/service.js';
import { createPlan, toDomainPlan } from '../workouts/repository.js';
import { createDietPlan, toDomainDietPlan } from '../nutrition/repository.js';
import { BadGatewayError } from '../../lib/errors.js';

const FITNESS_GOALS = [
  'lose_weight',
  'build_muscle',
  'improve_endurance',
  'increase_strength',
  'general_fitness',
  'sport_performance',
] as const;

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
  const exercises = await searchExercises(tenantId);
  if (exercises.length === 0) throw new BadGatewayError('No exercises available to build a plan from');

  const exerciseMenu = exercises.map((e) => e.name).join(', ');

  const systemPrompt = `You are an expert strength & conditioning coach. Build a real, structured workout split.

Rules:
- Output ONLY valid JSON, no markdown, no commentary, no code fences - just the raw JSON object.
- The JSON must match this exact shape:
  { "planName": string, "goal": one of [${FITNESS_GOALS.join(', ')}], "days": [ { "dayLabel": string, "exercises": [ { "exerciseName": string, "sets": number, "reps": string (e.g. "8-10"), "restSecs": number, "notes": string } ] } ] }
- Produce exactly ${daysPerWeek} days.
- Each day should have 5-7 exercises appropriate for its focus (e.g. "Push (Chest, Shoulders, Triceps)").
- "exerciseName" MUST be copied exactly (same spelling/case) from this list of real available exercises - never invent a name: ${exerciseMenu}
- "goal" must be exactly one of the six enum values listed above - pick the closest match to what the user asked for.
- "notes" should be a short (under 12 words) coaching cue, e.g. "Control the eccentric."`;

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

  const doc = await createPlan({ userId, name: parsed.planName, goal: parsed.goal, generatedBy: 'ai', days });
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
  const systemPrompt = `You are an expert sports nutritionist. Build a real, structured one-day meal template the client repeats daily.

Rules:
- Output ONLY valid JSON, no markdown, no commentary, no code fences - just the raw JSON object.
- The JSON must match this exact shape:
  { "planName": string, "goal": one of [${FITNESS_GOALS.join(', ')}], "dailyCalorieTarget": number, "dailyProteinG": number, "dailyCarbsG": number, "dailyFatG": number, "meals": [ { "mealType": one of [breakfast, lunch, dinner, snack], "name": string, "calories": number, "proteinG": number, "carbsG": number, "fatG": number, "notes": string } ] }
- Include exactly 4 meals: breakfast, lunch, dinner, and one snack.
- Each meal's macros should be realistic for a real dish (not just numbers) - "name" should read like something a person would actually eat and cook.
- The meals' combined calories/macros should add up close to the daily targets.
- "goal" must be exactly one of the six enum values listed above - pick the closest match to what the user asked for.
- "notes" should be a short (under 12 words) practical tip, e.g. "Swap rice for quinoa for more protein."`;

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
