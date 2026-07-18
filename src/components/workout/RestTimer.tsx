/**
 * RestTimer — SRP: displays countdown ring + controls.
 * Receives secondsLeft + isRunning from useRestTimer via props (DIP).
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface RestTimerProps {
  secondsLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  onSkip: () => void;
  onAddTime: (secs: number) => void;
}

export function RestTimer({ secondsLeft, totalSeconds, isRunning, onSkip, onAddTime }: RestTimerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isRunning || secondsLeft > 5) return;
    // Pulse faster when about to finish
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.06, duration: 300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [secondsLeft, isRunning]);

  if (!isRunning && secondsLeft === 0) return null;

  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const label = `${mins > 0 ? `${mins}:` : ''}${String(secs).padStart(2, '0')}`;

  // Color shifts red as time runs out
  const timerColor = secondsLeft <= 5 ? colors.error : secondsLeft <= 15 ? colors.warning : colors.accent;

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
      <View style={[styles.ring, { borderColor: timerColor }]}>
        <Text style={[styles.countdown, { color: timerColor }]}>{label}</Text>
        <Text style={styles.label}>rest</Text>
      </View>

      {/* Progress arc indicator (simplified as border opacity) */}
      <View style={[styles.progressBar]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: timerColor }]} />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => onAddTime(15)}>
          <Text style={styles.controlBtnText}>+15s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, styles.skipBtn]} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip Rest →</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ring: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  countdown: { ...typography.h2, fontVariant: ['tabular-nums'] },
  label: { ...typography.caption, color: colors.textMuted, marginTop: -4 },

  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 2,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },

  controls: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  controlBtn: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlBtnText: { ...typography.label, color: colors.textSecondary },
  skipBtn: { flex: 2, backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' },
  skipBtnText: { ...typography.label, color: colors.primary },
});
