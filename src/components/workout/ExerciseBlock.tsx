/**
 * ExerciseBlock -- SRP: renders one exercise card with all its sets.
 * Receives grouped state from useActiveWorkout via props (DIP).
 * OCP: add new set fields (tempo, RPE per set) without modifying core.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass } from '../../theme/effects';
import { SetRow } from './SetRow';
import type { LiveSet } from '../../hooks/useActiveWorkout';

const MUSCLE_COLOR: Record<string, string> = {
  chest: '#FF6B6B', back: '#4F6EF7', shoulders: '#FFB347',
  biceps: '#00D4AA', triceps: '#7B4FD8', core: '#F7C948',
  quads: '#FF8C00', hamstrings: '#20B2AA', glutes: '#DA70D6',
  calves: '#32CD32',
};

interface ExerciseBlockProps {
  exerciseId: string;
  exerciseName: string;
  muscleGroups: string[];
  sets: LiveSet[];
  onSetChange: (setIndex: number, field: 'reps' | 'weightKg', value: string) => void;
  onSetDone: (setIndex: number) => void;
}

export function ExerciseBlock({
  exerciseName,
  muscleGroups,
  sets,
  onSetChange,
  onSetDone,
}: ExerciseBlockProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const primaryMuscle = muscleGroups[0] ?? 'core';
  const accentColor = MUSCLE_COLOR[primaryMuscle] ?? colors.primary;
  const completedSets = sets.filter((s) => s.completed).length;

  return (
    <Animated.View
      style={[
        styles.container,
        glass.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        { borderLeftWidth: 3, borderLeftColor: accentColor },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <View style={styles.tagsRow}>
            {muscleGroups.slice(0, 3).map((m) => (
              <View
                key={m}
                style={[
                  styles.muscleTag,
                  { backgroundColor: (MUSCLE_COLOR[m] ?? colors.primary) + '25' },
                ]}
              >
                <Text style={[styles.muscleTagText, { color: MUSCLE_COLOR[m] ?? colors.primary }]}>
                  {m}
                </Text>
              </View>
            ))}
          </View>
        </View>
        <View style={[styles.progressBadge, { backgroundColor: accentColor + '20' }]}>
          <Text style={[styles.progressText, { color: accentColor }]}>
            {completedSets}/{sets.length}
          </Text>
        </View>
      </View>

      {/* Column headers */}
      <View style={styles.colHeaders}>
        <Text style={[styles.colHeader, { width: 28 }]}>SET</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>PREV</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>KG</Text>
        <Text style={[styles.colHeader, { flex: 1 }]}>REPS</Text>
        <Text style={[styles.colHeader, { width: 44 }]}></Text>
      </View>

      {/* Set rows */}
      {sets.map((set, idx) => (
        <SetRow
          key={set.setNumber}
          set={set}
          setIndex={idx}
          onChangeWeight={(v) => onSetChange(idx, 'weightKg', v)}
          onChangeReps={(v) => onSetChange(idx, 'reps', v)}
          onToggleComplete={() => onSetDone(idx)}
          onCompleteWithTimer={() => onSetDone(idx)}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  exerciseName: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  muscleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  muscleTagText: {
    ...typography.caption,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  progressBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginLeft: spacing.sm,
  },
  progressText: {
    ...typography.label,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  colHeaders: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  colHeader: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
