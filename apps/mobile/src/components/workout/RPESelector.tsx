/**
 * RPESelector — SRP: Rate of Perceived Exertion 1-10 selector.
 * Used in finish workout modal.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

const RPE_LABELS: Record<number, string> = {
  1: 'Very Easy', 2: 'Easy', 3: 'Moderate', 4: 'Somewhat Hard',
  5: 'Hard', 6: 'Hard+', 7: 'Very Hard', 8: 'Very Hard+',
  9: 'Max Effort', 10: 'Absolute Max',
};

const rpeColor = (rpe: number): string => {
  if (rpe <= 3) return colors.success;
  if (rpe <= 6) return colors.warning;
  return colors.error;
};

interface RPESelectorProps {
  value: number;
  onChange: (rpe: number) => void;
}

export function RPESelector({ value, onChange }: RPESelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How hard was that? <Text style={{ color: rpeColor(value) }}>RPE {value}</Text></Text>
      <Text style={styles.desc}>{RPE_LABELS[value]}</Text>
      <View style={styles.grid}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <TouchableOpacity
            key={n}
            style={[
              styles.cell,
              { borderColor: rpeColor(n) + '60' },
              value === n && { backgroundColor: rpeColor(n), borderColor: rpeColor(n) },
            ]}
            onPress={() => onChange(n)}
          >
            <Text style={[styles.cellText, value === n && styles.cellTextActive]}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  title: { ...typography.h4, color: colors.textPrimary, marginBottom: 2 },
  desc: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
  },
  cellText: { ...typography.h4, color: colors.textSecondary },
  cellTextActive: { color: '#fff' },
});
