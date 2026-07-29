/**
 * SetRow — SRP: renders a single set with weight/reps inputs and a complete toggle.
 * OCP: add new fields (RPE per set, tempo) by extending props without modifying this.
 */
import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import type { LiveSet } from '../../hooks/useActiveWorkout';

interface SetRowProps {
  set: LiveSet;
  setIndex: number;          // index within this exercise only
  onChangeReps: (value: string) => void;
  onChangeWeight: (value: string) => void;
  onToggleComplete: () => void;
  onCompleteWithTimer: () => void; // signals parent to start rest timer
}

export function SetRow({
  set,
  setIndex,
  onChangeReps,
  onChangeWeight,
  onToggleComplete,
  onCompleteWithTimer,
}: SetRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bgAnim = useRef(new Animated.Value(0)).current;

  const handleComplete = () => {
    // Spring pop + bg flash
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 0.95, tension: 200, friction: 6, useNativeDriver: false }),
        Animated.timing(bgAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 6, useNativeDriver: false }),
      ]),
    ]).start();

    if (!set.completed) {
      onCompleteWithTimer();
    }
    onToggleComplete();
  };

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.primary + '15'],
  });

  return (
    <Animated.View style={[styles.row, { backgroundColor: bgColor, transform: [{ scale: scaleAnim }] }]}>
      {/* Set number badge */}
      <View style={[styles.setBadge, set.completed && styles.setBadgeComplete]}>
        <Text style={[styles.setBadgeText, set.completed && styles.setBadgeTextComplete]}>
          {set.completed ? '✓' : setIndex + 1}
        </Text>
      </View>

      {/* Weight input */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, set.completed && styles.inputComplete]}
          value={set.weightKg}
          onChangeText={onChangeWeight}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          editable={!set.completed}
          selectTextOnFocus
        />
        <Text style={styles.inputLabel}>kg</Text>
      </View>

      <Text style={styles.separator}>×</Text>

      {/* Reps input */}
      <View style={styles.inputGroup}>
        <TextInput
          style={[styles.input, set.completed && styles.inputComplete]}
          value={set.reps}
          onChangeText={onChangeReps}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.textMuted}
          editable={!set.completed}
          selectTextOnFocus
        />
        <Text style={styles.inputLabel}>reps</Text>
      </View>

      {/* Done button */}
      <TouchableOpacity
        style={[styles.doneBtn, set.completed && styles.doneBtnComplete]}
        onPress={handleComplete}
        activeOpacity={0.7}
      >
        <Text style={styles.doneBtnText}>{set.completed ? '✓' : 'Done'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: 6,
  },
  setBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setBadgeComplete: { backgroundColor: colors.primary },
  setBadgeText: { ...typography.label, color: colors.textMuted },
  setBadgeTextComplete: { color: colors.onPrimary },

  inputGroup: { flexDirection: 'row', alignItems: 'baseline', gap: 3, flex: 1 },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    ...typography.h4,
    color: colors.textPrimary,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputComplete: {
    color: colors.textMuted,
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  inputLabel: { ...typography.caption, color: colors.textMuted },

  separator: { ...typography.h4, color: colors.textMuted },

  doneBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  doneBtnComplete: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  doneBtnText: { ...typography.label, color: colors.textPrimary },
});
