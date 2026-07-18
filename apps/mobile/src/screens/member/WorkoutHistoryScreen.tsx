import React, { useState, useRef, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, isThisWeek, isThisMonth } from 'date-fns';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchWorkoutSessions } from '../../api/queries';
import { ScreenShell } from '../../components/common/ScreenShell';
import type { WorkoutSession } from '@fitpulse/shared';
import { styles } from './WorkoutHistoryScreen.styles';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RPE_COLOR = (rpe: number) => rpe >= 8 ? colors.error : rpe >= 6 ? '#FFB347' : colors.success;

function totalVolume(session: WorkoutSession) {
  return session.sets.reduce((sum, s) => sum + (s.weightKg ?? 0) * (s.reps ?? 0), 0);
}

function uniqueExercises(session: WorkoutSession) {
  const names = new Set(session.sets.map((s) => s.exercise?.name ?? ''));
  return [...names].filter(Boolean);
}

// ─── Filter Bar (SRP) ────────────────────────────────────────────────────────

type Filter = 'all' | 'week' | 'month';

function FilterBar({ active, onSelect }: { active: Filter; onSelect: (f: Filter) => void }) {
  const options: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];
  return (
    <View style={styles.filterBar}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.filterChip, active === opt.id && styles.filterChipActive]}
            onPress={() => onSelect(opt.id)}
          >
            <Text style={[styles.filterChipText, active === opt.id && styles.filterChipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Session Card (SRP) ───────────────────────────────────────────────────────

function SessionCard({ session, onPress, index }: { session: WorkoutSession; onPress: () => void; index: number }) {
  const slideAnim = useRef(new Animated.Value(24)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, delay: index * 60, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const date = parseISO(session.date);
  const exercises = uniqueExercises(session);
  const vol = totalVolume(session);
  const rpe = session.perceivedEffort;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity style={[styles.card, glass.card]} onPress={onPress} activeOpacity={0.85}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardDate}>{format(date, 'MMM d, yyyy')}</Text>
            <Text style={styles.cardDay}>{format(date, 'EEEE')}</Text>
          </View>
          {rpe != null && (
            <View style={[styles.rpeBadge, { backgroundColor: RPE_COLOR(rpe) + '30', borderWidth: 1, borderColor: RPE_COLOR(rpe) }]}>
              <Text style={[styles.rpeBadgeText, { color: RPE_COLOR(rpe) }]}>RPE {rpe}</Text>
            </View>
          )}
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{session.durationMins}m</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{session.sets.length}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{vol > 0 ? `${(vol / 1000).toFixed(1)}t` : '—'}</Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>
        </View>

        {exercises.length > 0 && (
          <Text style={styles.exercisePreview} numberOfLines={1}>
            {exercises.slice(0, 3).join(' · ')}{exercises.length > 3 ? ` +${exercises.length - 3} more` : ''}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WorkoutHistoryScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<Filter>('all');

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: queryKeys.workoutSessions,
    queryFn: fetchWorkoutSessions,
  });

  const filtered = sessions.filter((s) => {
    const d = parseISO(s.date);
    if (filter === 'week') return isThisWeek(d, { weekStartsOn: 1 });
    if (filter === 'month') return isThisMonth(d);
    return true;
  });

  return (
    <ScreenShell title="Workout History" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FilterBar active={filter} onSelect={setFilter} />
        {filtered.length === 0 && !isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏋️</Text>
            <Text style={styles.emptyTitle}>No sessions yet</Text>
            <Text style={styles.emptyBody}>Complete a workout to see it here.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(s) => s.id}
            renderItem={({ item, index }) => (
              <SessionCard
                session={item}
                index={index}
                onPress={() => navigation.navigate('WorkoutDetail', { sessionId: item.id })}
              />
            )}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </ScreenShell>
  );
}
