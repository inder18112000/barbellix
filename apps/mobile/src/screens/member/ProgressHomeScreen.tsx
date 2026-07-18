import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { useProgressData } from '../../hooks/useProgressData';
import { MetricChart } from '../../components/progress/MetricChart';
import { VolumeBarChart } from '../../components/progress/VolumeBarChart';
import { PRCard } from '../../components/progress/PRCard';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import type { ProgressStackParams } from '../../navigation/types';
import { styles } from './ProgressHomeScreen.styles';

type Nav = NativeStackNavigationProp<ProgressStackParams, 'ProgressHome'>;

const STAT_TILES = [
  { key: 'sessions', emoji: '🏋️', label: 'Sessions' },
  { key: 'volume',   emoji: '⚡', label: 'Total Volume' },
  { key: 'streak',   emoji: '🔥', label: 'Streak' },
  { key: 'avgDur',   emoji: '⏱',  label: 'Avg Duration' },
];

function StatTile({ emoji, label, value, index }: { emoji: string; label: string; value: string; index: number }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 70, friction: 9, delay: index * 80, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.statTile, glass.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

function LogMetricCTA({ onPress }: { onPress: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.02, duration: 900, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity style={[styles.logCta, glass.cardStrong, glow.accent]} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.logCtaEmoji}>📏</Text>
        <Text style={styles.logCtaText}>Log body metrics</Text>
        <Text style={{ color: colors.accent }}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function ProgressHomeScreen() {
  const navigation = useNavigation<Nav>();
  const { weightData, bodyFatData, volumeData, prs, totalSessions, totalVolume, avgSessionDuration, isLoading } = useProgressData();

  if (isLoading) return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonCard lines={1} />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </View>
    </SafeAreaView>
  );

  const statValues = [
    String(totalSessions),
    totalVolume > 0 ? `${(totalVolume / 1000).toFixed(1)}t` : '0',
    '5🔥',
    avgSessionDuration > 0 ? `${avgSessionDuration}m` : '—',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Progress</Text>
        </View>

        <View style={styles.statGrid}>
          {STAT_TILES.map((t, i) => <StatTile key={t.key} emoji={t.emoji} label={t.label} value={statValues[i]} index={i} />)}
        </View>

        <LogMetricCTA onPress={() => navigation.navigate('BodyMetrics')} />

        {/* Quick-access tiles for new features */}
        <View style={quickStyles.grid}>
          {([
            { icon: 'nutrition-outline' as const, label: 'Nutrition', route: 'Nutrition' as const, color: '#FF6B35' },
            { icon: 'checkmark-done-outline' as const, label: 'Habits', route: 'HabitTracker' as const, color: colors.primary },
            { icon: 'barbell-outline' as const, label: '1RM Calc', route: 'OneRMCalculator' as const, color: '#6C5CE7' },
            { icon: 'body-outline' as const, label: 'Measurements', route: 'BodyMetrics' as const, color: colors.accent },
          ] as const).map(item => (
            <TouchableOpacity
              key={item.route}
              style={[quickStyles.tile, glass.card]}
              onPress={() => navigation.navigate(item.route)}
              activeOpacity={0.8}
            >
              <View style={[quickStyles.tileIcon, { backgroundColor: item.color + '18' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={quickStyles.tileLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {weightData.length >= 2 && (
          <View style={[styles.chartCard, glass.card]}>
            <Text style={styles.chartTitle}>Weight</Text>
            <MetricChart data={weightData} title="Weight" unit="kg" color={colors.primary} />
          </View>
        )}

        {bodyFatData.length >= 2 && (
          <View style={[styles.chartCard, glass.card]}>
            <Text style={styles.chartTitle}>Body Fat %</Text>
            <MetricChart data={bodyFatData} title="Body Fat" unit="%" color={colors.accent} />
          </View>
        )}

        {volumeData.length > 0 && (
          <View style={[styles.chartCard, glass.card]}>
            <Text style={styles.chartTitle}>Weekly Volume</Text>
            <VolumeBarChart data={volumeData} />
          </View>
        )}

        {prs.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Personal Records</Text>
            {prs.slice(0, 4).map((pr, i) => <PRCard key={pr.id} record={pr} index={i} />)}
            {prs.length > 4 && (
              <TouchableOpacity style={{ alignItems: 'center', padding: 12 }} onPress={() => navigation.navigate('PersonalRecords')}>
                <Text style={{ color: colors.primary }}>View all {prs.length} records</Text>
              </TouchableOpacity>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const quickStyles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '47%', alignItems: 'center', paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl, gap: spacing.sm,
  },
  tileIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  tileLabel: { ...typography.label, color: colors.textPrimary },
});
