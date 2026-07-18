/**
 * PRCard — SRP: displays a single personal record with a trophy glow effect.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass } from '../../theme/effects';
import type { PersonalRecord } from '@fitpulse/shared';
import { format } from 'date-fns';

interface PRCardProps {
  record: PersonalRecord;
  index: number;
  onPress?: () => void;
}

const TROPHY_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];   // gold, silver, bronze for top 3

export function PRCard({ record, index, onPress }: PRCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 8, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const trophyColor = TROPHY_COLORS[index] ?? colors.primary;
  const isTop3 = index < 3;

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        style={[styles.card, glass.card, isTop3 && { borderColor: trophyColor + '40', borderWidth: 1 }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {/* Trophy / rank */}
        <View style={[styles.rankBadge, { backgroundColor: isTop3 ? trophyColor + '20' : colors.surfaceElevated }]}>
          <Text style={styles.rankText}>{isTop3 ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}</Text>
        </View>

        {/* Exercise info */}
        <View style={styles.info}>
          <Text style={styles.exerciseName} numberOfLines={1}>
            {record.exercise?.name ?? 'Exercise'}
          </Text>
          <Text style={styles.date}>{format(new Date(record.achievedAt), 'MMM d, yyyy')}</Text>
        </View>

        {/* Value */}
        <View style={styles.valueContainer}>
          <Text style={[styles.value, isTop3 && { color: trophyColor }]}>
            {record.value}
          </Text>
          <Text style={styles.unit}>{record.unit}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 20 },
  info: { flex: 1 },
  exerciseName: { ...typography.h4, color: colors.textPrimary },
  date: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  valueContainer: { alignItems: 'flex-end' },
  value: { ...typography.h3, color: colors.textPrimary },
  unit: { ...typography.caption, color: colors.textSecondary },
});
