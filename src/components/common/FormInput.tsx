/**
 * FormInput — SRP: a single controlled text input with label + error state.
 * OCP: extend via props (secureTextEntry, keyboardType, rightIcon) without modification.
 * Used with React Hook Form's Controller.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Animated, TextInputProps,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function FormInput({
  label, error, rightIcon, onRightIconPress, value, onFocus, onBlur, ...rest
}: FormInputProps) {
  const [focused, setFocused] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const errorShake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(errorShake, { toValue: 6, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: -6, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(errorShake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  }, [error]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.primary],
  });

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: errorShake }] }]}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View style={[styles.inputWrapper, { borderColor }]}>
        <TextInput
          style={styles.input}
          value={value}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          {...rest}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </TouchableOpacity>
        )}
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
  },
  rightIcon: { paddingLeft: spacing.sm },
  error: { ...typography.caption, color: colors.error, marginTop: spacing.xs },
});
