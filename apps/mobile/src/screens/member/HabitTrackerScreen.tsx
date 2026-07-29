import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchTodayHabits, toggleHabit } from '../../api/queries';
import type { HabitId } from '@barbellix/shared';

type HabitDef = {
  id: HabitId;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  description: string;
  unit?: string;
};

const HABITS: HabitDef[] = [
  { id: 'water',      label: 'Drink Water',    icon: 'water-outline',       color: '#0099CC', description: '8 glasses / day',    unit: 'glasses' },
  { id: 'sleep',      label: 'Sleep 7h+',      icon: 'moon-outline',        color: '#6C5CE7', description: '7–9 hours of sleep',  unit: 'hrs' },
  { id: 'steps',      label: '10k Steps',      icon: 'footsteps-outline',   color: colors.primary, description: '10,000 steps',   unit: 'steps' },
  { id: 'stretch',    label: 'Stretch',         icon: 'body-outline',        color: '#FF9500', description: '5 min mobility',     unit: undefined },
  { id: 'no_junk',   label: 'No Junk Food',   icon: 'fast-food-outline',   color: '#FF3B30', description: 'Clean eating',        unit: undefined },
  { id: 'meditation', label: 'Meditate',        icon: 'leaf-outline',        color: '#17A046', description: '10 min mindfulness', unit: undefined },
];

// Mock last-7-days completion data (future: fetch from API)
const WEEK_MOCK: Record<HabitId, boolean[]> = {
  water:      [true, true, false, true, true, false, true],
  sleep:      [true, false, true, true, true, true, false],
  steps:      [false, true, false, false, true, true, false],
  stretch:    [true, true, true, false, false, true, false],
  no_junk:    [true, false, false, true, true, true, false],
  meditation: [false, false, true, false, false, false, false],
};
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function HabitTrackerScreen() {
  const navigation = useNavigation();
  const qc = useQueryClient();
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const { data: habits = [] } = useQuery({
    queryKey: queryKeys.habits.today,
    queryFn: fetchTodayHabits,
  });

  const { mutate: toggle } = useMutation({
    mutationFn: (habitId: HabitId) => toggleHabit(habitId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.habits.today }),
  });

  const isCompleted = (id: HabitId) => {
    if (optimistic[id] !== undefined) return optimistic[id];
    return habits.find(h => h.habitId === id)?.completed ?? false;
  };

  const handleToggle = (id: HabitId) => {
    setOptimistic(prev => ({ ...prev, [id]: !isCompleted(id) }));
    toggle(id);
  };

  const completedCount = HABITS.filter(h => isCompleted(h.id)).length;
  const pct = Math.round((completedCount / HABITS.length) * 100);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Habits</Text>
        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>{pct}%</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Progress card */}
        <View style={[styles.progressCard, glass.cardStrong]}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressText}>
              <Text style={styles.progressHighlight}>{completedCount}</Text> of {HABITS.length} habits completed
            </Text>
            <Text style={styles.progressSub}>
              {completedCount === HABITS.length ? '🎉 Perfect day!' : completedCount >= 4 ? '🔥 Great progress!' : 'Keep going!'}
            </Text>
          </View>
        </View>

        {/* Habit cards */}
        <Text style={styles.sectionTitle}>Today's Habits</Text>
        {HABITS.map(habit => {
          const done = isCompleted(habit.id);
          const entry = habits.find(h => h.habitId === habit.id);
          return (
            <TouchableOpacity
              key={habit.id}
              style={[styles.habitCard, glass.card, done && styles.habitCardDone]}
              onPress={() => handleToggle(habit.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.habitIcon, { backgroundColor: habit.color + '18' }]}>
                <Ionicons name={habit.icon} size={22} color={done ? habit.color : colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.habitLabel, done && { color: colors.textPrimary }]}>{habit.label}</Text>
                <Text style={styles.habitDesc}>
                  {entry?.value != null ? `${entry.value} ${habit.unit ?? ''}` : habit.description}
                </Text>
              </View>
              <View style={[styles.checkCircle, done && styles.checkCircleDone]}>
                <Ionicons name={done ? 'checkmark' : 'ellipse-outline'} size={18} color={done ? '#fff' : colors.border} />
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Weekly overview */}
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={[styles.weekCard, glass.card]}>
          {/* Day row header */}
          <View style={styles.weekDayRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={styles.weekDayLabel}>{d}</Text>
            ))}
          </View>
          {HABITS.map(habit => (
            <View key={habit.id} style={styles.weekRow}>
              <Text style={[styles.weekHabitName, { color: habit.color }]}>{habit.label.split(' ')[0]}</Text>
              <View style={styles.weekDots}>
                {WEEK_MOCK[habit.id].map((done, i) => (
                  <View key={i} style={[styles.weekDot, done && { backgroundColor: habit.color }]} />
                ))}
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
  },
  headerTitle: { flex: 1, ...typography.h3, color: colors.textPrimary },
  scorePill: {
    backgroundColor: colors.primary + '18', borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md, paddingVertical: 4,
  },
  scoreText: { ...typography.label, color: colors.primary },

  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md },

  progressCard: { borderRadius: borderRadius.xl, padding: spacing.lg, gap: spacing.md },
  progressBar: {
    height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: colors.primary, borderRadius: 5,
  },
  progressMeta: { gap: 2 },
  progressText: { ...typography.body, color: colors.textSecondary },
  progressHighlight: { fontWeight: '700', color: colors.textPrimary },
  progressSub: { ...typography.caption, color: colors.textMuted },

  sectionTitle: { ...typography.h4, color: colors.textPrimary },

  habitCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: borderRadius.lg,
  },
  habitCardDone: {
    borderColor: colors.primary + '40',
    backgroundColor: '#F0F6FF',
  },
  habitIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  habitLabel: { ...typography.h4, color: colors.textPrimary },
  habitDesc: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  checkCircle: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkCircleDone: { backgroundColor: colors.primary, borderColor: colors.primary },

  weekCard: { padding: spacing.md, borderRadius: borderRadius.xl, gap: spacing.sm },
  weekDayRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, paddingLeft: 90 },
  weekDayLabel: { width: 22, textAlign: 'center', ...typography.caption, color: colors.textMuted },
  weekRow: { flexDirection: 'row', alignItems: 'center' },
  weekHabitName: { width: 90, ...typography.caption, fontWeight: '600' },
  weekDots: { flex: 1, flexDirection: 'row', gap: 6 },
  weekDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.border,
  },
});
