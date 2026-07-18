/**
 * useProgressData — SRP: derives chart-ready data from raw API responses.
 * Pure transformation — no side effects, no UI.
 * DIP: ProgressHomeScreen depends on this hook, not on raw query data.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getISOWeek } from 'date-fns';
import { queryKeys, fetchProgressMetrics, fetchPersonalRecords, fetchWorkoutSessions } from '../api/queries';
import type { ChartDataPoint } from '../components/progress/MetricChart';
import type { VolumeDataPoint } from '../components/progress/VolumeBarChart';

export function useProgressData() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: queryKeys.progress.metrics,
    queryFn: fetchProgressMetrics,
  });

  const { data: prs, isLoading: prsLoading } = useQuery({
    queryKey: queryKeys.progress.prs,
    queryFn: fetchPersonalRecords,
  });

  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: queryKeys.workoutSessions,
    queryFn: fetchWorkoutSessions,
  });

  // ── Weight chart data ──────────────────────────────────────────────────────
  const weightData: ChartDataPoint[] = useMemo(
    () =>
      (metrics ?? [])
        .filter((m) => m.weightKg !== undefined)
        .map((m) => ({
          x: m.recordedAt,
          y: m.weightKg!,
        }))
        .sort((a, b) => a.x.localeCompare(b.x)),
    [metrics],
  );

  const weightDelta = useMemo(() => {
    if (weightData.length < 2) return undefined;
    return weightData[weightData.length - 1].y - weightData[0].y;
  }, [weightData]);

  // ── Body fat chart data ────────────────────────────────────────────────────
  const bodyFatData: ChartDataPoint[] = useMemo(
    () =>
      (metrics ?? [])
        .filter((m) => m.bodyFatPct !== undefined)
        .map((m) => ({ x: m.recordedAt, y: m.bodyFatPct! }))
        .sort((a, b) => a.x.localeCompare(b.x)),
    [metrics],
  );

  // ── Weekly volume bar chart data ───────────────────────────────────────────
  const volumeData: VolumeDataPoint[] = useMemo(() => {
    if (!sessions) return [];

    const byWeek: Record<string, number> = {};
    sessions.forEach((s) => {
      const weekLabel = `W${getISOWeek(new Date(s.date))}`;
      const vol = s.sets.reduce(
        (acc, set) => acc + (set.weightKg ?? 0) * (set.reps ?? 1),
        0,
      );
      byWeek[weekLabel] = (byWeek[weekLabel] ?? 0) + vol;
    });

    return Object.entries(byWeek)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)  // last 8 weeks
      .map(([x, y]) => ({ x, y }));
  }, [sessions]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalSessions = sessions?.length ?? 0;
  const totalVolume = sessions?.reduce(
    (acc, s) => acc + s.sets.reduce((a, set) => a + (set.weightKg ?? 0) * (set.reps ?? 1), 0),
    0,
  ) ?? 0;

  const avgSessionDuration = useMemo(() => {
    if (!sessions || sessions.length === 0) return 0;
    return Math.round(sessions.reduce((acc, s) => acc + s.durationMins, 0) / sessions.length);
  }, [sessions]);

  return {
    weightData,
    weightDelta,
    bodyFatData,
    volumeData,
    prs: prs ?? [],
    totalSessions,
    totalVolume,
    avgSessionDuration,
    isLoading: metricsLoading || prsLoading || sessionsLoading,
  };
}
