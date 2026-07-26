/**
 * Badge -- SRP: the small status pill that kept getting hand-rolled per screen (activeChip,
 * statPill, rpeTag, goalChip - same shape, different one-off styles each time).
 */
import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

const TONE_COLOR: Record<BadgeTone, string> = {
  neutral: colors.textSecondary,
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,
};

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const tint = TONE_COLOR[tone];
  return (
    <View style={[styles.base, { backgroundColor: tint + '18', borderColor: tint + '30' }, style]}>
      <Text style={[styles.label, { color: tint }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  label: { ...typography.label, fontWeight: '700' },
});
