/**
 * useActiveWorkout -- Single-responsibility hook owning the entire
 * live workout state machine. No UI, no API calls -- pure state + logic.
 *
 * SOLID:
 *  S -- Only manages workout state. Timer lives in useRestTimer (ISP).
 *  O -- Extend by adding new actions without modifying existing ones.
 *  D -- Consumers depend on this hook interface, not on raw useState.
 */

import { useState, useCallback, useMemo } from 'react';
import type { WorkoutDay } from '@fitpulse/shared';

// -- Types --------------------------------------------------------------------

export interface LiveSet {
  exerciseId: string;
  exerciseName: string;
  muscleGroups: string[];
  setNumber: number;
  reps: string;       // string so TextInput works without conversion friction
  weightKg: string;
  completed: boolean;
}

export interface GroupedExercise {
  exerciseId: string;
  exerciseName: string;
  muscleGroups: string[];
  sets: LiveSet[];
}

export interface ActiveWorkoutState {
  sets: LiveSet[];
  notes: string;
  perceivedEffort: number;  // 1-10 RPE
  startedAt: Date;
}

export interface UseActiveWorkoutReturn {
  state: ActiveWorkoutState;
  grouped: GroupedExercise[];
  updateSet: (exerciseId: string, setIndex: number, field: 'reps' | 'weightKg', value: string) => void;
  toggleSetComplete: (exerciseId: string, setIndex: number) => void;
  setNotes: (notes: string) => void;
  setPerceivedEffort: (rpe: number) => void;
  completedCount: number;
  totalSets: number;
  progressPct: number;
  buildSessionPayload: (planId?: string) => object;
}

// -- Initialiser --------------------------------------------------------------

function buildInitialSets(day: WorkoutDay): LiveSet[] {
  return day.exercises.flatMap((ex) =>
    Array.from({ length: ex.sets }, (_, i) => ({
      exerciseId: ex.exerciseId,
      exerciseName: ex.exercise?.name ?? 'Exercise',
      muscleGroups: ex.exercise?.muscleGroups ?? [],
      setNumber: i + 1,
      reps: typeof ex.reps === 'number' ? String(ex.reps) : ex.reps.toString().split('-')[0],
      weightKg: '',
      completed: false,
    })),
  );
}

// -- Hook ---------------------------------------------------------------------

export function useActiveWorkout(day: WorkoutDay): UseActiveWorkoutReturn {
  const [state, setState] = useState<ActiveWorkoutState>({
    sets: buildInitialSets(day),
    notes: '',
    perceivedEffort: 7,
    startedAt: new Date(),
  });

  // Derive grouped view: one entry per exercise, sets[] in order
  const grouped = useMemo<GroupedExercise[]>(() => {
    const map = new Map<string, GroupedExercise>();
    state.sets.forEach((s) => {
      if (!map.has(s.exerciseId)) {
        map.set(s.exerciseId, {
          exerciseId: s.exerciseId,
          exerciseName: s.exerciseName,
          muscleGroups: s.muscleGroups,
          sets: [],
        });
      }
      map.get(s.exerciseId)!.sets.push(s);
    });
    return Array.from(map.values());
  }, [state.sets]);

  const updateSet = useCallback(
    (exerciseId: string, setIndex: number, field: 'reps' | 'weightKg', value: string) => {
      setState((prev) => {
        const exerciseSets = prev.sets.filter((s) => s.exerciseId === exerciseId);
        const globalIndex = prev.sets.indexOf(exerciseSets[setIndex]);
        if (globalIndex === -1) return prev;
        const updated = [...prev.sets];
        updated[globalIndex] = { ...updated[globalIndex], [field]: value };
        return { ...prev, sets: updated };
      });
    },
    [],
  );

  const toggleSetComplete = useCallback((exerciseId: string, setIndex: number) => {
    setState((prev) => {
      const exerciseSets = prev.sets.filter((s) => s.exerciseId === exerciseId);
      const globalIndex = prev.sets.indexOf(exerciseSets[setIndex]);
      if (globalIndex === -1) return prev;
      const updated = [...prev.sets];
      updated[globalIndex] = {
        ...updated[globalIndex],
        completed: !updated[globalIndex].completed,
      };
      return { ...prev, sets: updated };
    });
  }, []);

  const setNotes = useCallback((notes: string) => {
    setState((prev) => ({ ...prev, notes }));
  }, []);

  const setPerceivedEffort = useCallback((rpe: number) => {
    setState((prev) => ({ ...prev, perceivedEffort: rpe }));
  }, []);

  const completedCount = state.sets.filter((s) => s.completed).length;
  const totalSets = state.sets.length;
  const progressPct = totalSets > 0 ? (completedCount / totalSets) * 100 : 0;

  const buildSessionPayload = useCallback(
    (planId?: string) => {
      const durationMins = Math.round(
        (Date.now() - state.startedAt.getTime()) / 60000,
      );
      return {
        planId,
        date: new Date().toISOString().slice(0, 10),
        durationMins,
        notes: state.notes,
        perceivedEffort: state.perceivedEffort,
        sets: state.sets
          .filter((s) => s.completed)
          .map((s) => ({
            exerciseId: s.exerciseId,
            setNumber: s.setNumber,
            reps: parseInt(s.reps, 10) || 0,
            weightKg: parseFloat(s.weightKg) || 0,
          })),
      };
    },
    [state],
  );

  return {
    state,
    grouped,
    updateSet,
    toggleSetComplete,
    setNotes,
    setPerceivedEffort,
    completedCount,
    totalSets,
    progressPct,
    buildSessionPayload,
  };
}
