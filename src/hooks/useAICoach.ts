/**
 * useAICoach — SRP: rule-based recommendation engine.
 * Produces AIRecommendation[] from workout + attendance data.
 * No UI, no network calls — pure deterministic logic.
 * Phase 1: rules only. Phase 2: swap internals for ML model, same interface (OCP).
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, fetchWorkoutSessions, fetchAttendanceSummary, fetchAIRecommendations } from '../api/queries';
import type { AIRecommendation } from '../types';

// ─── Rule engine ──────────────────────────────────────────────────────────────

function computeAverageRPE(sessions: { perceivedEffort?: number }[]): number {
  const rpeValues = sessions
    .filter((s) => s.perceivedEffort !== undefined)
    .map((s) => s.perceivedEffort!);
  if (rpeValues.length === 0) return 0;
  return rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length;
}

function daysSinceLastSession(sessions: { date: string }[]): number {
  if (sessions.length === 0) return 999;
  const last = new Date(sessions[0].date);
  return Math.floor((Date.now() - last.getTime()) / 86400000);
}

function buildRuleBasedRecs(
  sessions: ReturnType<typeof useQuery>['data'] & any[],
  streak: number,
): AIRecommendation[] {
  const recs: AIRecommendation[] = [];
  const now = new Date().toISOString();
  const recentSessions = sessions.slice(0, 5);
  const avgRPE = computeAverageRPE(recentSessions);
  const daysSince = daysSinceLastSession(recentSessions);

  // Rule 1: Deload warning — avg RPE > 8.5 over last 3 sessions
  if (avgRPE >= 8.5 && recentSessions.length >= 3) {
    recs.push({
      id: 'rule_deload',
      userId: '',
      type: 'recovery',
      title: 'Deload Week Recommended',
      description: `Your average RPE over the last ${recentSessions.length} sessions is ${avgRPE.toFixed(1)} — that's very high. Consider reducing weight by 40–50% this week to let your body recover and come back stronger.`,
      content: { ruleId: 'deload', avgRPE },
      generatedAt: now,
    });
  }

  // Rule 2: Streak milestone nudge
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

  // Rule 3: Missed session nudge
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

  // Rule 4: Progressive overload suggestion — if last 2 sessions same weight
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

  // Rule 5: Hydration / rest (always present, low priority)
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


// -- Hook ---------------------------------------------------------------------

export function useAICoach() {
  const { data: sessions = [] } = useQuery({
    queryKey: queryKeys.workoutSessions,
    queryFn: fetchWorkoutSessions,
  });

  const { data: attendance } = useQuery({
    queryKey: queryKeys.attendance.summary,
    queryFn: fetchAttendanceSummary,
  });

  const { data: apiRecs = [], isLoading } = useQuery({
    queryKey: queryKeys.ai.recommendations,
    queryFn: fetchAIRecommendations,
  });

  const ruleRecs = useMemo(
    () => buildRuleBasedRecs(sessions, attendance?.streak ?? 0),
    [sessions, attendance],
  );

  const allRecs = useMemo(() => {
    const apiIds = new Set(apiRecs.map((r) => r.id));
    const unique = ruleRecs.filter((r) => !apiIds.has(r.id));
    return [...apiRecs, ...unique];
  }, [apiRecs, ruleRecs]);

  return {
    recommendations: allRecs,
    streak: attendance?.streak ?? 0,
    totalSessions: sessions.length,
    isLoading,
  };
}
