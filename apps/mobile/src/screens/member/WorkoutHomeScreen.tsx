import React, { useRef, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, FlatList, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import {
  queryKeys,
  fetchWorkoutPlans,
  fetchWorkoutSessions,
  fetchAttendanceSummary,
  generateWorkoutPlan,
  fetchCheckInStatus,
  regeneratePlanFromProgress,
} from '../../api/queries';
import type { WorkoutStackParams } from '../../navigation/types';
import type { WorkoutDay } from '@barbellix/shared';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { styles } from './WorkoutHomeScreen.styles';

const DAY_OPTIONS = [3, 4, 5, 6, 7];

// ─── AI plan generator sheet (SRP) ───────────────────────────────────────────

function GeneratePlanSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [goal, setGoal] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState(5);

  const { mutate: generate, isPending } = useMutation({
    mutationFn: () => generateWorkoutPlan(goal.trim(), daysPerWeek),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workoutPlans });
      setGoal('');
      onClose();
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, glass.card]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Generate Plan</Text>

            <View>
              <Text style={styles.fieldLabel}>Your Goal</Text>
              <TextInput
                style={[styles.goalInput, { marginTop: 6 }]}
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g. gain weight and build muscle"
                placeholderTextColor={colors.textMuted}
                editable={!isPending}
              />
            </View>

            <View>
              <Text style={styles.fieldLabel}>Days Per Week</Text>
              <View style={[styles.daysRow, { marginTop: 6 }]}>
                {DAY_OPTIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayChip, d === daysPerWeek && styles.dayChipActive]}
                    onPress={() => setDaysPerWeek(d)}
                    disabled={isPending}
                  >
                    <Text style={[styles.dayChipText, d === daysPerWeek && styles.dayChipTextActive]}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.generateSubmitBtn, (!goal.trim() || isPending) && { opacity: 0.5 }]}
              onPress={() => generate()}
              disabled={!goal.trim() || isPending}
              activeOpacity={0.85}
            >
              <Text style={styles.generateSubmitBtnText}>{isPending ? 'Generating…' : '✨ Generate with AI'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

type Nav = NativeStackNavigationProp<WorkoutStackParams, 'WorkoutHome'>;

function getTodayDayIndex(sessionCount: number, totalDays: number) {
  return totalDays > 0 ? sessionCount % totalDays : 0;
}

// ─── Day Card (SRP) ──────────────────────────────────────────────────────────

function DayCard({ day, isToday, index, onStart }: { day: WorkoutDay; isToday: boolean; index: number; onStart: () => void }) {
  const slideAnim = useRef(new Animated.Value(40)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: index * 100, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.dayCard,
          glass.card,
          isToday && styles.dayCardToday,
          isToday && glow.primary,
        ]}
        onPress={onStart}
        activeOpacity={0.85}
      >
        <Text style={styles.dayName}>{isToday ? 'TODAY' : `Day ${index + 1}`}</Text>
        <Text style={styles.dayNumber}>{day.dayLabel}</Text>
        <Text style={styles.exerciseCount}>{day.exercises.length} exercises</Text>
        {day.exercises.slice(0, 3).map((ex, i) => (
          <Text key={i} style={styles.exercisePreviewItem} numberOfLines={1}>· {ex.exercise?.name ?? ex.exerciseId}</Text>
        ))}
        {day.exercises.length > 3 && <Text style={styles.exercisePreviewItem}>+{day.exercises.length - 3} more</Text>}
        <TouchableOpacity style={[styles.startBtn, { backgroundColor: isToday ? colors.primary : colors.surfaceElevated }]} onPress={onStart}>
          <Text style={[styles.startBtnText, { color: isToday ? '#fff' : colors.textPrimary }]}>{isToday ? '▶ Start Workout' : 'Preview'}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Recent Session Row (SRP) ─────────────────────────────────────────────────

function RecentSummaryCard({ date, duration, sets }: { date: string; duration: number; sets: number }) {
  return (
    <View style={[styles.recentCard, glass.card]}>
      <Text style={{ fontSize: 28 }}>🏋️</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.recentDate}>{format(parseISO(date), 'EEE, MMM d')}</Text>
        <Text style={styles.recentStats}>{duration}m · {sets} sets</Text>
      </View>
    </View>
  );
}

// ─── Check-in-due banner (SRP) ────────────────────────────────────────────────

function CheckInDueBanner({ onUpdate, isUpdating }: { onUpdate: () => void; isUpdating: boolean }) {
  return (
    <View style={[styles.recentCard, glass.card, { marginBottom: 12 }]}>
      <Text style={{ fontSize: 24 }}>📈</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.recentDate}>Progress check-in due</Text>
        <Text style={styles.recentStats}>Update your plan based on your recent progress and effort.</Text>
      </View>
      <TouchableOpacity
        style={[styles.regenerateBtn, glass.card, isUpdating && { opacity: 0.6 }]}
        onPress={onUpdate}
        disabled={isUpdating}
      >
        <Text style={styles.regenerateBtnText}>{isUpdating ? 'Updating…' : '🔄 Update plan'}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WorkoutHomeScreen() {
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const { data: plans = [], isLoading, isError, refetch } = useQuery({ queryKey: queryKeys.workoutPlans, queryFn: fetchWorkoutPlans });
  const { data: sessions = [] } = useQuery({ queryKey: queryKeys.workoutSessions, queryFn: fetchWorkoutSessions });
  const { data: attendance } = useQuery({ queryKey: queryKeys.attendance.summary, queryFn: fetchAttendanceSummary });
  const { data: checkInStatus } = useQuery({ queryKey: queryKeys.progress.checkInStatus, queryFn: fetchCheckInStatus });

  const { mutate: updateFromProgress, isPending: isUpdatingPlan } = useMutation({
    mutationFn: regeneratePlanFromProgress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.workoutPlans });
      qc.invalidateQueries({ queryKey: queryKeys.progress.checkInStatus });
    },
  });

  if (isLoading) return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonCard lines={1} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </View>
    </SafeAreaView>
  );
  if (isError) return <ErrorState message="Couldn't load your workout plan." onRetry={refetch} />;

  const plan = plans[0];
  const todayIndex = plan ? getTodayDayIndex(sessions.length, plan.days.length) : 0;
  const recentSessions = sessions.slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Workout</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {attendance && (
                <View style={[styles.streakBadge, glass.card]}>
                  <Text style={styles.streakText}>🔥 {attendance.streak} streak</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.quickBtn, glass.card]}
                onPress={() => navigation.navigate('ExercisePicker')}
                activeOpacity={0.85}
              >
                <Text style={styles.quickBtnText}>+ Quick</Text>
              </TouchableOpacity>
            </View>
          </View>
          {plan && <Text style={styles.subtitle}>{plan.name}</Text>}
        </View>

        {plan && checkInStatus?.isDue && (
          <CheckInDueBanner onUpdate={() => updateFromProgress()} isUpdating={isUpdatingPlan} />
        )}

        {plan ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { marginHorizontal: 0, marginBottom: 0 }]}>Your Plan</Text>
              <TouchableOpacity style={[styles.regenerateBtn, glass.card]} onPress={() => setShowGenerate(true)}>
                <Text style={styles.regenerateBtnText}>✨ Regenerate with AI</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={plan.days}
              keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              renderItem={({ item: day, index }) => (
                <DayCard
                  day={day}
                  isToday={index === todayIndex}
                  index={index}
                  onStart={() => navigation.navigate('ActiveWorkout', { day: day as any, planId: plan.id })}
                />
              )}
            />
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Plan Yet</Text>
            <Text style={styles.emptyBody}>Ask the AI Coach to build a customized weekly plan tailored to your goal.</Text>
            <TouchableOpacity style={styles.aiGenerateBtn} onPress={() => setShowGenerate(true)} activeOpacity={0.85}>
              <Text style={styles.aiGenerateBtnText}>✨ Generate with AI</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickWorkoutCta, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => navigation.navigate('ExercisePicker')}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickWorkoutCtaText, { color: colors.textPrimary }]}>⚡ Start Quick Workout</Text>
            </TouchableOpacity>
          </View>
        )}

        {recentSessions.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Sessions</Text>
            {recentSessions.map((s) => (
              <RecentSummaryCard key={s.id} date={s.date} duration={s.durationMins} sets={s.sets.length} />
            ))}
          </>
        )}

      </ScrollView>

      <GeneratePlanSheet visible={showGenerate} onClose={() => setShowGenerate(false)} />
    </SafeAreaView>
  );
}
