import React, { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, logWorkoutSession } from '../../api/queries';
import { useActiveWorkout } from '../../hooks/useActiveWorkout';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useStopwatch } from '../../hooks/useStopwatch';
import { WorkoutProgressBar } from '../../components/workout/WorkoutProgressBar';
import { RestTimer } from '../../components/workout/RestTimer';
import { RPESelector } from '../../components/workout/RPESelector';
import { ExerciseBlock } from '../../components/workout/ExerciseBlock';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import type { WorkoutStackParams } from '../../navigation/types';
import { styles } from './ActiveWorkoutScreen.styles';

type Route = RouteProp<WorkoutStackParams, 'ActiveWorkout'>;


// ─── Finish Modal (SRP) ──────────────────────────────────────────────────────

function FinishModal({ visible, onConfirm, onCancel, loading }: { visible: boolean; onConfirm: (rpe: number, notes: string) => void; onCancel: () => void; loading: boolean }) {
  const [rpe, setRpe] = useState(7);
  const [notes, setNotes] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.modalSheet, glass.card]}>
            <Text style={styles.modalTitle}>Finish Workout 🎉</Text>
            <Text style={styles.modalLabel}>How hard was it? (RPE)</Text>
            <RPESelector value={rpe} onChange={setRpe} />
            <Text style={[styles.modalLabel, { marginTop: 8 }]}>Notes (optional)</Text>
            <TextInput
              style={[styles.notesInput, glass.card]}
              value={notes}
              onChangeText={setNotes}
              placeholder="How did it feel? Any PRs?"
              placeholderTextColor={colors.textMuted}
              multiline
            />
            <PrimaryButton label="Save Session" onPress={() => onConfirm(rpe, notes)} loading={loading} />
            <PrimaryButton label="Cancel" onPress={onCancel} variant="ghost" />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ActiveWorkoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<Route>();
  const { day, planId } = route.params as { day: import('@barbellix/shared').WorkoutDay; planId?: string };
  const qc = useQueryClient();
  const [showFinish, setShowFinish] = useState(false);

  const { grouped, updateSet, toggleSetComplete, buildSessionPayload, completedCount, totalSets, progressPct } = useActiveWorkout(day);
  const restTimer = useRestTimer();
  const stopwatch = useStopwatch();

  const { mutate: saveSession, isPending } = useMutation({
    mutationFn: (payload: any) => logWorkoutSession(payload),
  });

  const handleDone = (exerciseId: string, setIdx: number) => {
    toggleSetComplete(exerciseId, setIdx);
    restTimer.start(90);
  };

  const handleFinish = (rpe: number, notes: string) => {
    const durationMins = Math.ceil(stopwatch.seconds / 60);
    const totalVolume = grouped.reduce(
      (t, ex) => t + ex.sets.filter(s => s.completed).reduce((a, s) => a + (s.weightKg ?? 0) * (s.reps ?? 0), 0),
      0,
    );
    const payload = { ...buildSessionPayload(planId), perceivedEffort: rpe, notes, durationMins };
    saveSession(payload, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: queryKeys.workoutSessions });
        navigation.replace('WorkoutSummary', {
          durationMins,
          totalSets: completedCount,
          totalVolume: Math.round(totalVolume),
          exerciseCount: grouped.length,
          exerciseNames: grouped.map(g => g.exerciseName),
        });
      },
    });
  };

  const handleDiscard = () => {
    Alert.alert('Discard Workout', 'All progress will be lost.', [
      { text: 'Keep Going', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTimer}>⏱ {stopwatch.formatted}</Text>
        <Text style={styles.headerProgress}>{completedCount}/{totalSets} sets</Text>
        <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
          <Text style={styles.discardText}>Discard</Text>
        </TouchableOpacity>
      </View>

      <WorkoutProgressBar completedCount={completedCount} totalSets={totalSets} progressPct={progressPct} elapsedFormatted={stopwatch.formatted} />

      {restTimer.secondsLeft > 0 && (
        <RestTimer secondsLeft={restTimer.secondsLeft} totalSeconds={90} isRunning={restTimer.secondsLeft > 0} onSkip={restTimer.stop} onAddTime={(s) => restTimer.start(restTimer.secondsLeft + s)} />
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {grouped.map((ex) => (
          <ExerciseBlock
            key={ex.exerciseId}
            exerciseId={ex.exerciseId}
            exerciseName={ex.exerciseName}
            muscleGroups={ex.muscleGroups}
            sets={ex.sets}
            onSetChange={(setIdx, field, val) => updateSet(ex.exerciseId, setIdx, field, val)}
            onSetDone={(setIdx) => handleDone(ex.exerciseId, setIdx)}
          />
        ))}

        <View style={styles.finishRow}>
          <PrimaryButton label="Finish Workout" onPress={() => setShowFinish(true)} />
        </View>
      </ScrollView>

      <FinishModal visible={showFinish} onConfirm={handleFinish} onCancel={() => setShowFinish(false)} loading={isPending} />
    </SafeAreaView>
  );
}
