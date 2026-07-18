import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass, glow } from '../../theme/effects';
import type { WorkoutStackParams } from '../../navigation/types';

type Nav = NativeStackNavigationProp<WorkoutStackParams, 'WorkoutSummary'>;
type Route = RouteProp<WorkoutStackParams, 'WorkoutSummary'>;

type StatCardProps = { icon: React.ComponentProps<typeof Ionicons>['name']; value: string; label: string; color: string; delay: number };

function StatCard({ icon, value, label, color, delay }: StatCardProps) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, tension: 70, friction: 8, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[styles.statCard, glass.card, { opacity: anim, transform: [{ scale: anim }] }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

export function WorkoutSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const { durationMins, totalSets, totalVolume, exerciseCount, exerciseNames } = useRoute<Route>().params;

  const headerScale = useRef(new Animated.Value(0.5)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const listOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(headerScale, { toValue: 1, tension: 55, friction: 6, useNativeDriver: true }),
        Animated.timing(headerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(listOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const volumeDisplay = totalVolume >= 1000
    ? `${(totalVolume / 1000).toFixed(1)}t`
    : `${totalVolume}kg`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <Animated.View style={[styles.hero, { opacity: headerOpacity, transform: [{ scale: headerScale }] }]}>
          <View style={[styles.trophyCircle, glow.primary]}>
            <Text style={styles.trophyEmoji}>🏆</Text>
          </View>
          <Text style={styles.heroTitle}>Workout Complete!</Text>
          <Text style={styles.heroSubtitle}>You crushed it — keep the momentum going.</Text>
        </Animated.View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="time-outline"    value={`${durationMins}m`}  label="Duration"   color={colors.primary} delay={200} />
          <StatCard icon="barbell-outline" value={String(totalSets)}    label="Sets Done"  color={colors.accent}  delay={300} />
          <StatCard icon="trending-up"     value={volumeDisplay}        label="Volume"     color={colors.warning} delay={400} />
          <StatCard icon="list-outline"    value={String(exerciseCount)} label="Exercises" color={colors.info}    delay={500} />
        </View>

        {/* Exercise list */}
        <Animated.View style={{ opacity: listOpacity }}>
          <Text style={styles.sectionTitle}>Exercises done</Text>
          {exerciseNames.map((name, i) => (
            <View key={i} style={[styles.exRow, glass.card]}>
              <View style={styles.exNum}>
                <Text style={styles.exNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.exName}>{name}</Text>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
          ))}
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryBtn, glow.primary]}
            onPress={() => navigation.popToTop()}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Back to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.outlineBtn]}
            onPress={() => { navigation.popToTop(); navigation.navigate('WorkoutHistory'); }}
            activeOpacity={0.85}
          >
            <Ionicons name="time-outline" size={16} color={colors.primary} />
            <Text style={styles.outlineBtnText}>View History</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },

  hero: { alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.lg },
  trophyCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: colors.primary + '18',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 2, borderColor: colors.primary + '30',
  },
  trophyEmoji: { fontSize: 44 },
  heroTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  heroSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '47%', alignItems: 'center',
    paddingVertical: spacing.lg, paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  statIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  exRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg,
    marginBottom: spacing.xs, gap: spacing.md,
  },
  exNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary + '18',
    alignItems: 'center', justifyContent: 'center',
  },
  exNumText: { ...typography.label, color: colors.primary },
  exName: { flex: 1, ...typography.body, color: colors.textPrimary },

  actions: { marginTop: spacing.lg, gap: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md, borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  primaryBtnText: { ...typography.h4, color: '#fff' },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  outlineBtnText: { ...typography.h4, color: colors.primary },
});
