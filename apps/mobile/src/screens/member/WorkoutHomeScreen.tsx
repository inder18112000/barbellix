import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { queryKeys, fetchWorkoutPlans, fetchWorkoutSessions, fetchAttendanceSummary } from '../../api/queries';
import type { WorkoutStackParams } from '../../navigation/types';
import type { WorkoutDay } from '../../types';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { styles } from './WorkoutHomeScreen.styles';

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

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WorkoutHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { data: plans = [], isLoading, isError, refetch } = useQuery({ queryKey: queryKeys.workoutPlans, queryFn: fetchWorkoutPlans });
  const { data: sessions = [] } = useQuery({ queryKey: queryKeys.workoutSessions, queryFn: fetchWorkoutSessions });
  const { data: attendance } = useQuery({ queryKey: queryKeys.attendance.summary, queryFn: fetchAttendanceSummary });

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

        {plan ? (
          <>
            <Text style={styles.sectionTitle}>Your Plan</Text>
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
            <Text style={styles.emptyBody}>Ask your trainer to assign a plan, or start a quick workout.</Text>
            <TouchableOpacity
              style={[styles.quickWorkoutCta, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('ExercisePicker')}
              activeOpacity={0.85}
            >
              <Text style={styles.quickWorkoutCtaText}>⚡ Start Quick Workout</Text>
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
    </SafeAreaView>
  );
}
