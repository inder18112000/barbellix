/**
 * WorkoutProgressBar — SRP: animated progress bar + set count display.
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface WorkoutProgressBarProps {
  completedCount: number;
  totalSets: number;
  progressPct: number;
  elapsedFormatted: string;
}

export function WorkoutProgressBar({ completedCount, totalSets, progressPct, elapsedFormatted }: WorkoutProgressBarProps) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: progressPct,
      tension: 60,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [progressPct]);

  const fillColor = progressPct === 100 ? colors.success : colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>
          {completedCount} / {totalSets} sets
        </Text>
        <Text style={styles.timer}>⏱ {elapsedFormatted}</Text>
      </View>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: fillColor,
            },
          ]}
        />
      </View>
      {progressPct === 100 && (
        <Text style={styles.doneLabel}>🎉 All sets done! Finish when ready.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { ...typography.label, color: colors.textSecondary },
  timer: { ...typography.label, color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  track: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  fill: { height: 6, borderRadius: borderRadius.full },
  doneLabel: { ...typography.caption, color: colors.success, marginTop: spacing.xs, textAlign: 'center' },
});
