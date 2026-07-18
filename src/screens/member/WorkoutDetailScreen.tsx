import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchWorkoutSessions } from '../../api/queries';
import { ScreenShell } from '../../components/common/ScreenShell';
import type { WorkoutSet } from '../../types';
import type { WorkoutStackParams } from '../../navigation/types';
import { styles } from './WorkoutDetailScreen.styles';

type Route = RouteProp<WorkoutStackParams, 'WorkoutDetail'>;

const RPE_COLOR = (rpe: number) => rpe >= 8 ? colors.error : rpe >= 6 ? '#FFB347' : colors.success;

// ─── Set Table (SRP) ─────────────────────────────────────────────────────────

function SetTable({ sets }: { sets: WorkoutSet[] }) {
  return (
    <View style={styles.setTable}>
      <View style={styles.setHeaderRow}>
        <Text style={[styles.setHeaderCell, styles.col0]}>#</Text>
        <Text style={[styles.setHeaderCell, styles.col1]}>Weight</Text>
        <Text style={[styles.setHeaderCell, styles.col2]}>Reps</Text>
        <Text style={[styles.setHeaderCell, styles.col3]}>Volume</Text>
      </View>
      {sets.map((s) => (
        <View key={s.id} style={styles.setRow}>
          <Text style={[styles.setCell, styles.col0]}>{s.setNumber}</Text>
          <Text style={[styles.setCell, styles.col1]}>{s.weightKg != null ? `${s.weightKg} kg` : '—'}</Text>
          <Text style={[styles.setCell, styles.col2]}>{s.reps ?? '—'}</Text>
          <Text style={[styles.setCell, styles.col3]}>
            {s.weightKg != null && s.reps != null ? `${(s.weightKg * s.reps).toFixed(0)} kg` : '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Exercise Block (SRP) ────────────────────────────────────────────────────

function ExerciseBlock({ exerciseName, muscleGroups, sets }: { exerciseName: string; muscleGroups: string[]; sets: WorkoutSet[] }) {
  return (
    <View style={[styles.exerciseBlock, glass.card]}>
      <View style={styles.exerciseHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          <View style={{ flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {muscleGroups.map((m) => (
              <View key={m} style={styles.muscleTag}>
                <Text style={styles.muscleTagText}>{m}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={{ fontSize: 22 }}>💪</Text>
      </View>
      <SetTable sets={sets} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WorkoutDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { sessionId } = route.params;

  const { data: sessions = [] } = useQuery({
    queryKey: queryKeys.workoutSessions,
    queryFn: fetchWorkoutSessions,
  });

  const session = sessions.find((s) => s.id === sessionId);

  if (!session) return (
    <ScreenShell title="Session" onBack={() => navigation.goBack()}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textMuted }}>Session not found</Text>
      </View>
    </ScreenShell>
  );

  // Group sets by exercise
  const byExercise = session.sets.reduce<Record<string, WorkoutSet[]>>((acc, s) => {
    const key = s.exerciseId;
    (acc[key] = acc[key] ?? []).push(s);
    return acc;
  }, {});

  const totalVol = session.sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
  const date = parseISO(session.date);
  const rpe = session.perceivedEffort;

  return (
    <ScreenShell title={format(date, 'EEE, MMM d')} onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

          {/* Hero stats */}
          <View style={[styles.heroBand, glass.card]}>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{session.durationMins}m</Text>
              <Text style={styles.heroLabel}>Duration</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{session.sets.length}</Text>
              <Text style={styles.heroLabel}>Sets</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{Object.keys(byExercise).length}</Text>
              <Text style={styles.heroLabel}>Exercises</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroValue}>{totalVol > 0 ? `${(totalVol / 1000).toFixed(1)}t` : '—'}</Text>
              <Text style={styles.heroLabel}>Volume</Text>
            </View>
          </View>

          {/* RPE + notes */}
          {(rpe != null || session.notes) && (
            <View style={styles.metaRow}>
              {rpe != null && (
                <View style={[styles.rpePill, { borderColor: RPE_COLOR(rpe) }]}>
                  <Text style={[styles.rpePillText, { color: RPE_COLOR(rpe) }]}>RPE {rpe}/10</Text>
                </View>
              )}
              {session.notes && (
                <View style={[styles.notesCard, glass.card]}>
                  <Text style={styles.notesText}>{session.notes}</Text>
                </View>
              )}
            </View>
          )}

          {/* Exercise blocks */}
          {Object.entries(byExercise).map(([exId, sets]) => {
            const ex = sets[0]?.exercise;
            return (
              <ExerciseBlock
                key={exId}
                exerciseName={ex?.name ?? exId}
                muscleGroups={ex?.muscleGroups ?? []}
                sets={sets}
              />
            );
          })}

        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}
