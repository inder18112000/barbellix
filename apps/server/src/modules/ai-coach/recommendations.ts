import type { AIRecommendation, WorkoutSession } from '@fitpulse/shared';
import { findRecentSessions } from '../workouts/service.js';
import { computeSummary } from '../attendance/service.js';

function computeAverageRPE(sessions: Array<{ perceivedEffort?: number }>): number {
  const rpeValues = sessions
    .filter((s) => s.perceivedEffort !== undefined)
    .map((s) => s.perceivedEffort!);
  if (rpeValues.length === 0) return 0;
  return rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length;
}

function daysSinceLastSession(sessions: Array<{ date: string }>): number {
  if (sessions.length === 0) return 999;
  const last = new Date(sessions[0].date);
  return Math.floor((Date.now() - last.getTime()) / 86400000);
}

/**
 * Server-side port of the client's src/hooks/useAICoach.ts rule engine.
 * Deliberately produces the same stable ids (rule_deload, rule_streak, ...) the
 * client already expects, so the client's own merge-by-id logic in useAICoach.ts
 * dedupes cleanly against these once it starts calling this endpoint instead of
 * computing the same rules locally (a Milestone 10 client change, not this one).
 */
function buildRuleBasedRecs(sessions: WorkoutSession[], streak: number): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  const now = new Date().toISOString();
  const avgRPE = computeAverageRPE(sessions);
  const daysSince = daysSinceLastSession(sessions);

  if (avgRPE >= 8.5 && sessions.length >= 3) {
    recs.push({
      id: 'rule_deload',
      userId: '',
      type: 'recovery',
      title: 'Deload Week Recommended',
      description: `Your average RPE over the last ${sessions.length} sessions is ${avgRPE.toFixed(1)} — that's very high. Consider reducing weight by 40–50% this week to let your body recover and come back stronger.`,
      content: { ruleId: 'deload', avgRPE },
      generatedAt: now,
    });
  }

  if (streak > 0 && streak % 5 === 0) {
    recs.push({
      id: 'rule_streak',
      userId: '',
      type: 'workout',
      title: `🔥 ${streak}-Day Streak!`,
      description: `You've been to the gym ${streak} days in a row. That's a serious habit. Keep it going — your next milestone is ${streak + 5} days.`,
      content: { ruleId: 'streak', streak },
      generatedAt: now,
    });
  }

  if (daysSince >= 2 && daysSince < 7) {
    recs.push({
      id: 'rule_missed',
      userId: '',
      type: 'workout',
      title: 'Time to Get Back In',
      description: `It's been ${daysSince} days since your last session. Your muscles have recovered — today is a great day to train. Even 30 minutes counts.`,
      content: { ruleId: 'missed', daysSince },
      generatedAt: now,
    });
  }

  const lastSession = sessions[0];
  if (lastSession && avgRPE < 7 && avgRPE > 0) {
    recs.push({
      id: 'rule_overload',
      userId: '',
      type: 'workout',
      title: 'Ready to Level Up',
      description: `Your RPE has been ${avgRPE.toFixed(1)} — you have capacity. Try adding 2.5kg to your main compound lifts today (progressive overload principle).`,
      content: { ruleId: 'progressive_overload', avgRPE },
      generatedAt: now,
    });
  }

  recs.push({
    id: 'rule_recovery',
    userId: '',
    type: 'recovery',
    title: 'Recovery Tip',
    description: 'Aim for 7–9 hours of sleep tonight. Studies show sleep is the #1 factor in muscle recovery and performance. Even 30 extra minutes makes a measurable difference.',
    content: { ruleId: 'sleep' },
    generatedAt: now,
  });

  return recs;
}

export async function getRecommendations(userId: string): Promise<AIRecommendation[]> {
  const [sessions, attendance] = await Promise.all([
    findRecentSessions(userId, 5),
    computeSummary(userId),
  ]);

  return buildRuleBasedRecs(sessions, attendance.streak);
}
