/**
 * Compiles all of the logged-in user's data into a structured system prompt
 * that the Claude AI coach uses to give genuinely personalized advice.
 * Re-computed only when the underlying query data changes.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  queryKeys,
  fetchMe,
  fetchWorkoutSessions,
  fetchPersonalRecords,
  fetchProgressMetrics,
  fetchTodayMeals,
  fetchTodayHabits,
  fetchAttendanceSummary,
} from '../api/queries';

function calcAge(dob: string): number {
  const today = new Date();
  const birth = new Date(dob);
  let a = today.getFullYear() - birth.getFullYear();
  if (
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
  ) a--;
  return a;
}

const HABIT_LABELS: Record<string, string> = {
  water: 'Drink 8 glasses of water',
  sleep: 'Sleep 7+ hours',
  steps: '10,000 steps',
  stretch: 'Stretch / mobility',
  no_junk: 'No junk food',
  meditation: 'Meditate 10 min',
};

export function useClientContext(): string {
  const { data: user } = useQuery({ queryKey: queryKeys.me, queryFn: fetchMe });
  const { data: sessions = [] } = useQuery({ queryKey: queryKeys.workoutSessions, queryFn: fetchWorkoutSessions });
  const { data: prs = [] } = useQuery({ queryKey: queryKeys.progress.prs, queryFn: fetchPersonalRecords });
  const { data: metrics = [] } = useQuery({ queryKey: queryKeys.progress.metrics, queryFn: fetchProgressMetrics });
  const { data: meals = [] } = useQuery({ queryKey: queryKeys.nutrition.today, queryFn: fetchTodayMeals });
  const { data: habits = [] } = useQuery({ queryKey: queryKeys.habits.today, queryFn: fetchTodayHabits });
  const { data: attendance } = useQuery({ queryKey: queryKeys.attendance.summary, queryFn: fetchAttendanceSummary });

  return useMemo(() => {
    if (!user) return '';

    const p = user.profile;
    const goals = p.goals.map(g => g.replace(/_/g, ' ')).join(', ');
    const ageStr = p.dob ? String(calcAge(p.dob)) : 'unknown';

    // ── Profile ──────────────────────────────────────────────────────────────
    let ctx = `You are an expert personal AI fitness coach inside the FitPulse gym app. Your client is ${user.firstName} ${user.lastName}.

CLIENT PROFILE:
- Age: ${ageStr} | Gender: ${p.gender ?? 'not specified'}
- Height: ${p.heightCm}cm | Current weight: ${p.weightKg}kg
- Experience level: ${p.experienceLevel}
- Fitness goals: ${goals}
- Gym streak: ${attendance?.streak ?? 0} consecutive days | Sessions this month: ${attendance?.totalThisMonth ?? 0}

`;

    // ── Workout history ───────────────────────────────────────────────────────
    const recent = sessions.slice(0, 5);
    if (recent.length > 0) {
      ctx += `RECENT WORKOUT SESSIONS (last ${recent.length}):\n`;
      for (const s of recent) {
        const exercises = [...new Set(s.sets.map(st => st.exercise?.name ?? st.exerciseId))];
        const volume = s.sets.reduce((t, st) => t + (st.weightKg ?? 0) * (st.reps ?? 0), 0);
        ctx += `• ${s.date} — ${s.durationMins}min, RPE ${s.perceivedEffort ?? '?'}/10, volume ${Math.round(volume)}kg\n`;
        ctx += `  Exercises: ${exercises.join(', ')}\n`;
        // First 4 sets detail
        for (const st of s.sets.slice(0, 4)) {
          const w = st.weightKg ? `${st.weightKg}kg` : 'BW';
          ctx += `  · ${st.exercise?.name ?? st.exerciseId}: ${w} × ${st.reps} reps\n`;
        }
      }
      ctx += '\n';
    } else {
      ctx += 'WORKOUT HISTORY: No sessions logged yet.\n\n';
    }

    // ── Personal records ─────────────────────────────────────────────────────
    if (prs.length > 0) {
      ctx += 'PERSONAL RECORDS:\n';
      for (const pr of prs) {
        ctx += `• ${pr.exercise?.name ?? pr.exerciseId}: ${pr.value}${pr.unit} — set on ${pr.achievedAt}\n`;
      }
      ctx += '\n';
    }

    // ── Body metrics ─────────────────────────────────────────────────────────
    const sortedMetrics = [...metrics].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    const first = sortedMetrics[0];
    const latest = sortedMetrics[sortedMetrics.length - 1];
    if (latest) {
      ctx += `BODY METRICS (latest — ${latest.recordedAt}):\n`;
      if (latest.weightKg) {
        const delta = first && first.weightKg ? latest.weightKg - first.weightKg : 0;
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

    // ── Nutrition today ───────────────────────────────────────────────────────
    const totals = meals.reduce(
      (acc, m) => ({
        cal: acc.cal + m.calories,
        pro: acc.pro + (m.proteinG ?? 0),
        carb: acc.carb + (m.carbsG ?? 0),
        fat: acc.fat + (m.fatG ?? 0),
      }),
      { cal: 0, pro: 0, carb: 0, fat: 0 },
    );
    ctx += `NUTRITION TODAY:\n`;
    ctx += `• Calories: ${totals.cal} / 2200 kcal goal (${2200 - totals.cal > 0 ? `${2200 - totals.cal}kcal remaining` : 'goal met'})\n`;
    ctx += `• Protein: ${totals.pro}g / 160g goal | Carbs: ${totals.carb}g / 250g | Fat: ${totals.fat}g / 70g\n`;
    if (meals.length > 0) {
      ctx += `• Meals logged: ${meals.map(m => `${m.mealType}: ${m.name} (${m.calories}kcal, P:${m.proteinG ?? 0}g)`).join(' | ')}\n`;
    } else {
      ctx += '• No meals logged yet today\n';
    }
    ctx += '\n';

    // ── Habits today ─────────────────────────────────────────────────────────
    ctx += 'HABITS TODAY:\n';
    for (const h of habits) {
      const label = HABIT_LABELS[h.habitId] ?? h.habitId;
      const val = h.value != null ? ` — logged value: ${h.value}` : '';
      ctx += `• ${h.completed ? '✅' : '❌'} ${label}${val}\n`;
    }
    ctx += '\n';

    // ── Coach instructions ────────────────────────────────────────────────────
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
  }, [user, sessions, prs, metrics, meals, habits, attendance]);
}
