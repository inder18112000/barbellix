import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

interface ScreenShellProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
}

export function ScreenShell({ children, title, onBack, rightAction }: ScreenShellProps) {
  return (
    <SafeAreaView style={styles.container}>
      {(title || onBack) && (
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}
          {title && (
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          )}
          <View style={styles.right}>{rightAction}</View>
        </View>
      )}
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...typography.h4,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  right: { width: 38, alignItems: 'flex-end' },
});
