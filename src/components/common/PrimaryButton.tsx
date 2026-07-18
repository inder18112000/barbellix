/**
 * PrimaryButton -- SRP: animated CTA button with loading state and haptic-feel spring.
 * OCP: variant prop ("primary" | "outline" | "ghost") extends styles without modification.
 */
import React, { useRef } from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { glow } from '../../theme/effects';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export function PrimaryButton({
  label, onPress, loading, disabled, variant = 'primary', fullWidth = true,
}: PrimaryButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    if (!loading && !disabled) onPress();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[fullWidth && styles.fullWidth, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.base,
          variant === 'primary' && styles.primary,
          variant === 'outline' && styles.outline,
          variant === 'ghost' && styles.ghost,
          isDisabled && styles.disabled,
          variant === 'primary' && !isDisabled && glow.primary,
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={isDisabled}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'primary' ? '#fff' : colors.primary} size="small" />
        ) : (
          <Text style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'outline' && styles.labelOutline,
            variant === 'ghost' && styles.labelGhost,
            isDisabled && styles.labelDisabled,
          ]}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  base: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primary: { backgroundColor: colors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.5 },
  label: { ...typography.h4 },
  labelPrimary: { color: '#fff' },
  labelOutline: { color: colors.primary },
  labelGhost: { color: colors.textSecondary },
  labelDisabled: { opacity: 0.7 },
});
