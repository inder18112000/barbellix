import { DEFAULT_NUTRITION_GOALS, HABIT_LABELS } from '@fitpulse/shared';
import { getMe } from '../users/service.js';
import { findRecentSessions } from '../workouts/service.js';
import { listPRs, listMetrics } from '../progress/service.js';
import { listToday as listTodayMeals } from '../nutrition/service.js';
import { listToday as listTodayHabits } from '../habits/service.js';
import { computeSummary } from '../attendance/service.js';
import { findNamesByIds } from '../exercises/repository.js';

function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let a = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) {
    a--;
  }
  return a;
}

/**
 * Server-side port of the client's src/hooks/useClientContext.ts - this is what
 * makes the AI proxy migration real personalization, not a generic chatbot.
 * Every useQuery() becomes a direct repository/service call against the
 * authenticated user's OWN data; the prompt-building itself is pure string
 * formatting ported verbatim.
 */
export async function buildSystemPrompt(userId: string): Promise<string> {
  const [user, sessions, prs, metrics, meals, habits, attendance] = await Promise.all([
    getMe(userId),
    findRecentSessions(userId, 5),
    listPRs(userId),
    listMetrics(userId),
    listTodayMeals(userId),
    listTodayHabits(userId),
    computeSummary(userId),
  ]);

  const exerciseIds = new Set<string>();
  for (const s of sessions) for (const set of s.sets) exerciseIds.add(set.exerciseId);
  for (const pr of prs) exerciseIds.add(pr.exerciseId);
  const exerciseNames = await findNamesByIds([...exerciseIds]);
  const nameFor = (exerciseId: string) => exerciseNames.get(exerciseId) ?? exerciseId;

  const p = user.profile;
  const goals = p.goals.map((g) => g.replace(/_/g, ' ')).join(', ');
  const ageStr = p.dob ? String(calcAge(p.dob)) : 'unknown';

  // ── Profile ────────────────────────────────────────────────────────────────
  let ctx = `You are an expert personal AI fitness coach inside the FitPulse gym app. Your client is ${user.firstName} ${user.lastName}.

CLIENT PROFILE:
- Age: ${ageStr} | Gender: ${p.gender ?? 'not specified'}
- Height: ${p.heightCm}cm | Current weight: ${p.weightKg}kg
- Experience level: ${p.experienceLevel}
- Fitness goals: ${goals}
- Gym streak: ${attendance.streak} consecutive days | Sessions this month: ${attendance.totalThisMonth}

`;

  // ── Workout history ───────────────────────────────────────────────────────
  if (sessions.length > 0) {
    ctx += `RECENT WORKOUT SESSIONS (last ${sessions.length}):\n`;
    for (const s of sessions) {
      const exerciseList = [...new Set(s.sets.map((st) => nameFor(st.exerciseId)))];
      const volume = s.sets.reduce((t, st) => t + (st.weightKg ?? 0) * (st.reps ?? 0), 0);
      ctx += `• ${s.date} — ${s.durationMins}min, RPE ${s.perceivedEffort ?? '?'}/10, volume ${Math.round(volume)}kg\n`;
      ctx += `  Exercises: ${exerciseList.join(', ')}\n`;
      for (const st of s.sets.slice(0, 4)) {
        const w = st.weightKg ? `${st.weightKg}kg` : 'BW';
        ctx += `  · ${nameFor(st.exerciseId)}: ${w} × ${st.reps} reps\n`;
      }
    }
    ctx += '\n';
  } else {
    ctx += 'WORKOUT HISTORY: No sessions logged yet.\n\n';
  }

  // ── Personal records ──────────────────────────────────────────────────────
  if (prs.length > 0) {
    ctx += 'PERSONAL RECORDS:\n';
    for (const pr of prs) {
      ctx += `• ${nameFor(pr.exerciseId)}: ${pr.value}${pr.unit} — set on ${pr.achievedAt}\n`;
    }
    ctx += '\n';
  }

  // ── Body metrics ───────────────────────────────────────────────────────────
  const sortedMetrics = [...metrics].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  const first = sortedMetrics[0];
  const latest = sortedMetrics[sortedMetrics.length - 1];
  if (latest) {
    ctx += `BODY METRICS (latest — ${latest.recordedAt}):\n`;
    if (latest.weightKg) {
      const delta = first?.weightKg ? latest.weightKg - first.weightKg : 0;
      const trend = delta < 0 ? `↓${Math.abs(delta)}kg since ${first!.recordedAt}` : delta > 0 ? `↑${delta}kg since ${first!.recordedAt}` : '';
      ctx += `• Weight: ${latest.weightKg}kg ${trend}\n`;
    }
    if (latest.bodyFatPct) ctx += `• Body fat: ${latest.bodyFatPct}%\n`;
    if (latest.measurements) {
      const m = latest.measurements;
      const parts = [
        m.chestCm != null ? `Chest ${m.chestCm}cm` : null,
        m.waistCm != null ? `Waist ${m.waistCm}cm` : null,
        m.hipsCm != null ? `Hips ${m.hipsCm}cm` : null,
        m.armCm != null ? `Arm ${m.armCm}cm` : null,
        m.thighCm != null ? `Thigh ${m.thighCm}cm` : null,
      ].filter(Boolean);
      if (parts.length > 0) ctx += `• Measurements: ${parts.join(' | ')}\n`;
    }
    ctx += '\n';
  }

  // ── Nutrition today ────────────────────────────────────────────────────────
  const totals = meals.reduce(
    (acc, m) => ({
      cal: acc.cal + m.calories,
      pro: acc.pro + (m.proteinG ?? 0),
      carb: acc.carb + (m.carbsG ?? 0),
      fat: acc.fat + (m.fatG ?? 0),
    }),
    { cal: 0, pro: 0, carb: 0, fat: 0 },
  );
  const goal = DEFAULT_NUTRITION_GOALS;
  ctx += `NUTRITION TODAY:\n`;
  ctx += `• Calories: ${totals.cal} / ${goal.calories} kcal goal (${goal.calories - totals.cal > 0 ? `${goal.calories - totals.cal}kcal remaining` : 'goal met'})\n`;
  ctx += `• Protein: ${totals.pro}g / ${goal.proteinG}g goal | Carbs: ${totals.carb}g / ${goal.carbsG}g | Fat: ${totals.fat}g / ${goal.fatG}g\n`;
  if (meals.length > 0) {
    ctx += `• Meals logged: ${meals.map((m) => `${m.mealType}: ${m.name} (${m.calories}kcal, P:${m.proteinG ?? 0}g)`).join(' | ')}\n`;
  } else {
    ctx += '• No meals logged yet today\n';
  }
  ctx += '\n';

  // ── Habits today ───────────────────────────────────────────────────────────
  ctx += 'HABITS TODAY:\n';
  for (const h of habits) {
    const label = HABIT_LABELS[h.habitId] ?? h.habitId;
    const val = h.value != null ? ` — logged value: ${h.value}` : '';
    ctx += `• ${h.completed ? '✅' : '❌'} ${label}${val}\n`;
  }
  ctx += '\n';

  // ── Coach instructions ─────────────────────────────────────────────────────
  ctx += `COACHING STYLE:
- ALWAYS reference ${user.firstName}'s actual data — never give generic unrelated advice
- Keep responses short: 2–4 sentences max unless the user asks for detail
- For exercise suggestions: give specific sets/reps/load relative to their logged weights and PRs
- For meal advice: reference today's actual calorie/protein gap; suggest meals with approximate macros
- When recommending today's workout: check which muscles were last trained and suggest the next logical session
- Call out specific achievements by name (e.g. "Your squat hit 100kg last session…")
- Be encouraging but evidence-based. Use metric units only (kg, cm).
- If asked something outside fitness/nutrition, gently redirect to their training goals`;

  return ctx;
}
