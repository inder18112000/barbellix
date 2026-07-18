/**
 * Data-driven local AI coach fallback.
 * Runs entirely on-device when Claude API credits are unavailable.
 * All responses reference the user's actual logged numbers — never generic.
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
import type { WorkoutSession, PersonalRecord, MealEntry, HabitEntry } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
}

function avgRPE(sessions: WorkoutSession[]): number {
  const vals = sessions.filter(s => s.perceivedEffort != null).map(s => s.perceivedEffort!);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
}

function totalVolume(sessions: WorkoutSession[]): number {
  return sessions.reduce(
    (t, s) => t + s.sets.reduce((a, st) => a + (st.weightKg ?? 0) * (st.reps ?? 0), 0), 0,
  );
}

// Muscle groups hit in a session
function musclesHit(session: WorkoutSession): string[] {
  return [...new Set(session.sets.flatMap(s => s.exercise?.muscleGroups ?? []))];
}

// Days-of-week label
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// ─── Response generators ──────────────────────────────────────────────────────

type CoachData = {
  firstName: string;
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
  meals: MealEntry[];
  habits: HabitEntry[];
  weightKg: number;
  streak: number;
};

function answerWhatToTrain(d: CoachData): string {
  const last = d.sessions[0];
  if (!last) return `No sessions logged yet, ${d.firstName}. Start with a full-body session — Squats 3×8, Bench Press 3×8, Pull-Ups 3×max. Log it afterwards so I can build a proper plan.`;

  const lastMuscles = musclesHit(last);
  const dayAgo = daysSince(last.date);
  const todayName = DAYS[new Date().getDay()];

  // Determine what was last trained and suggest opposite
  const isPush = lastMuscles.some(m => ['chest','triceps','shoulders'].includes(m));
  const isPull = lastMuscles.some(m => ['back','biceps'].includes(m));
  const isLegs = lastMuscles.some(m => ['quads','hamstrings','glutes','calves'].includes(m));

  if (dayAgo === 0) {
    return `You already trained ${last.durationMins}min today (RPE ${last.perceivedEffort}/10). Rest or do light mobility — recovery is where the gains happen.`;
  }

  if (avgRPE(d.sessions.slice(0, 3)) >= 8.5) {
    return `Your last 3 sessions averaged RPE ${avgRPE(d.sessions.slice(0, 3)).toFixed(1)} — that's very high. Do a deload today: same exercises as last time but 50% of the weight for 2–3 sets. Your body needs it.`;
  }

  let next = '';
  if (isPush) next = 'Pull day — your chest & triceps worked last session, now balance it with back & biceps.';
  else if (isPull) next = 'Legs day — back had its turn. Time for squats and hamstring work.';
  else if (isLegs) next = 'Push day — legs are recovering, hit chest/shoulders/triceps.';
  else next = 'A full-body session — mix of compound lifts.';

  const benchPR = d.prs.find(p => p.exercise?.name?.toLowerCase().includes('bench'));
  const sqPR = d.prs.find(p => p.exercise?.name?.toLowerCase().includes('squat'));
  const hint = benchPR && isPull ? ` Your bench PR is ${benchPR.value}kg — aim for that weight range on today's push work.`
    : sqPR && isLegs ? ` Your squat PR is ${sqPR.value}kg — work up to 85–90% of that today.`
    : '';

  return `${todayName} looks perfect for ${next}${hint} It's been ${dayAgo} day${dayAgo !== 1 ? 's' : ''} since your last session — muscles are recovered and ready.`;
}

function answerNutrition(d: CoachData): string {
  const totalCal = d.meals.reduce((a, m) => a + m.calories, 0);
  const totalPro = d.meals.reduce((a, m) => a + (m.proteinG ?? 0), 0);
  const calGoal = 2200;
  const proGoal = Math.round(d.weightKg * 2); // 2g/kg for muscle gain
  const calLeft = calGoal - totalCal;
  const proLeft = proGoal - totalPro;

  if (d.meals.length === 0) {
    return `Nothing logged yet today, ${d.firstName}. For your ${d.weightKg}kg body and muscle-building goal, aim for ${calGoal}kcal and ${proGoal}g protein. Start with a high-protein breakfast — 3 eggs + oats hits ~500kcal and 30g protein.`;
  }

  if (proLeft > 60) {
    const suggestions = proLeft > 100
      ? `2 chicken breasts (~60g P) + a protein shake (~25g P)`
      : `1 chicken breast (~30g P) + 200g Greek yoghurt (~20g P)`;
    return `You've had ${totalPro}g protein today but need ${proGoal}g — ${proLeft}g still to go. Add ${suggestions} across your remaining meals. You have ${calLeft > 0 ? `${calLeft}kcal` : 'no more calories'} to work with.`;
  }

  if (calLeft < 0) {
    return `You're ${Math.abs(calLeft)}kcal over your ${calGoal}kcal goal today (at ${totalCal}kcal). Protein is good at ${totalPro}g though. Keep dinner light — salad with grilled fish or just a protein shake.`;
  }

  return `Looking solid today — ${totalCal}kcal (${calLeft} left) and ${totalPro}g protein (${proLeft > 0 ? `${proLeft}g to go` : 'goal hit! ✅'}). ${proLeft <= 20 ? 'Protein goal nearly done.' : ''} Keep it up for the rest of the day.`;
}

function answerProgress(d: CoachData): string {
  if (d.sessions.length === 0) return `No sessions logged yet. Start training and log your sessions to see your progress here!`;

  const weekSessions = d.sessions.filter(s => daysSince(s.date) <= 7);
  const vol = totalVolume(weekSessions);
  const rpe = avgRPE(weekSessions);

  const prLines = d.prs.slice(0, 3).map(p => `${p.exercise?.name ?? p.exerciseId}: ${p.value}${p.unit}`).join(', ');

  return `This week: ${weekSessions.length} session${weekSessions.length !== 1 ? 's' : ''}, ${Math.round(vol / 1000 * 10) / 10}t total volume, avg RPE ${rpe.toFixed(1)}. ${d.streak > 0 ? `🔥 ${d.streak}-day streak going strong.` : ''} ${prLines ? `Current PRs — ${prLines}.` : ''} ${weekSessions.length < 3 ? 'Aim for 3–4 sessions/week to hit your muscle-building goal.' : 'Great training frequency!'}`;
}

function answerBenchPress(d: CoachData): string {
  const benchSets = d.sessions.flatMap(s => s.sets.filter(st => st.exercise?.name?.toLowerCase().includes('bench')));
  const benchPR = d.prs.find(p => p.exercise?.name?.toLowerCase().includes('bench'));
  const lastBenchSet = benchSets[0];

  if (!lastBenchSet && !benchPR) {
    return `I don't see any bench press data yet. Start at a weight where you can do 3×8 with good form, log it, and I'll track your progress from there.`;
  }

  const lastW = lastBenchSet?.weightKg ?? benchPR?.value ?? 0;
  const nextW = Math.round((lastW + 2.5) * 2) / 2;
  const estimatedRM = lastBenchSet ? Math.round(lastBenchSet.weightKg! * (1 + lastBenchSet.reps! / 30)) : benchPR?.value ?? 0;

  return `Your bench is at ${lastW}kg${benchPR ? ` (PR: ${benchPR.value}kg)` : ''}. Estimated 1RM: ~${estimatedRM}kg. Next session try ${nextW}kg — progressive overload of +2.5kg/week adds ~10kg in a month. Focus on controlled 3-second lowering for better hypertrophy at this weight range.`;
}

function answerRecovery(d: CoachData): string {
  const sleepHabit = d.habits.find(h => h.habitId === 'sleep');
  const waterHabit = d.habits.find(h => h.habitId === 'water');
  const stretchHabit = d.habits.find(h => h.habitId === 'stretch');
  const rpe = avgRPE(d.sessions.slice(0, 3));

  const tips: string[] = [];
  if (!sleepHabit?.completed) tips.push(`get 7–9h sleep tonight (you marked sleep incomplete today)`);
  if (!waterHabit?.completed) tips.push(`drink more water — aim for 3L on training days`);
  if (!stretchHabit?.completed) tips.push(`do 5 min of stretching before bed`);
  if (rpe >= 7.5) tips.push(`consider a deload — your recent avg RPE is ${rpe.toFixed(1)}`);

  if (tips.length === 0) {
    return `Recovery looking good today, ${d.firstName}! Sleep ✅, water ✅. Keep it consistent — recovery is 50% of the gains equation.`;
  }

  return `Recovery tips for today, ${d.firstName}: ${tips.map((t, i) => `${i + 1}) ${t}`).join(', ')}. Muscles grow outside the gym — treat recovery like part of the program.`;
}

function answerProtein(d: CoachData): string {
  const proGoal = Math.round((d.weightKg ?? 78) * 2);
  const logged = d.meals.reduce((a, m) => a + (m.proteinG ?? 0), 0);
  return `For your ${d.weightKg}kg body and muscle-building goal, aim for ${proGoal}g protein daily (2g/kg). You've hit ${logged}g today${logged >= proGoal ? ' — goal met! ✅' : ` — ${proGoal - logged}g still to go`}. Best sources: chicken breast (31g/100g), eggs (6g each), Greek yoghurt (10g/100g), whey protein (25g/scoop).`;
}

function answerStreak(d: CoachData): string {
  if (d.streak === 0) return `No active streak right now — get to the gym today and start one! Even a 20-min session counts. Consistency beats intensity every time.`;
  const next = d.streak % 5 === 0 ? d.streak + 5 : Math.ceil(d.streak / 5) * 5;
  return `🔥 ${d.streak}-day streak! That's seriously impressive consistency. Your next milestone is ${next} days. ${d.streak >= 7 ? 'A week of consecutive training is elite-level discipline.' : 'Keep showing up.'}`;
}

// ─── Keyword matcher ──────────────────────────────────────────────────────────

const INTENTS: Array<{ keywords: string[]; respond: (d: CoachData) => string }> = [
  { keywords: ['train today','workout today','should i train','what to do today','which day','next session','what session'], respond: answerWhatToTrain },
  { keywords: ['protein','meal','eat','nutrition','food','diet','calorie','macro'], respond: answerNutrition },
  { keywords: ['progress','week','how am i doing','stats','volume','sessions'], respond: answerProgress },
  { keywords: ['bench','chest','press'], respond: answerBenchPress },
  { keywords: ['recover','sleep','rest','deload','mobility','stretch'], respond: answerRecovery },
  { keywords: ['protein goal','how much protein','protein intake'], respond: answerProtein },
  { keywords: ['streak','consistent','consecutive'], respond: answerStreak },
];

export function localCoachReply(question: string, data: CoachData): string {
  const q = question.toLowerCase();
  for (const intent of INTENTS) {
    if (intent.keywords.some(kw => q.includes(kw))) {
      return intent.respond(data);
    }
  }
  // Default: check what they most need based on data
  const proLeft = Math.round(data.weightKg * 2) - data.meals.reduce((a, m) => a + (m.proteinG ?? 0), 0);
  const daysSinceLast = data.sessions[0] ? daysSince(data.sessions[0].date) : 99;
  if (daysSinceLast >= 2) return answerWhatToTrain(data);
  if (proLeft > 50) return answerNutrition(data);
  return answerProgress(data);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useLocalCoach() {
  const { data: user } = useQuery({ queryKey: queryKeys.me, queryFn: fetchMe });
  const { data: sessions = [] } = useQuery({ queryKey: queryKeys.workoutSessions, queryFn: fetchWorkoutSessions });
  const { data: prs = [] } = useQuery({ queryKey: queryKeys.progress.prs, queryFn: fetchPersonalRecords });
  const { data: meals = [] } = useQuery({ queryKey: queryKeys.nutrition.today, queryFn: fetchTodayMeals });
  const { data: habits = [] } = useQuery({ queryKey: queryKeys.habits.today, queryFn: fetchTodayHabits });
  const { data: attendance } = useQuery({ queryKey: queryKeys.attendance.summary, queryFn: fetchAttendanceSummary });

  const coachData: CoachData = useMemo(() => ({
    firstName: user?.firstName ?? 'there',
    sessions,
    prs,
    meals,
    habits,
    weightKg: user?.profile?.weightKg ?? 75,
    streak: attendance?.streak ?? 0,
  }), [user, sessions, prs, meals, habits, attendance]);

  return coachData;
}
