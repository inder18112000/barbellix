/**
 * BottomSheet -- SRP: the overlay/sheet/handle/KeyboardAvoidingView boilerplate that
 * WorkoutHomeScreen's GeneratePlanSheet, DietPlanScreen's GenerateDietSheet, and
 * NutritionScreen's AddMealModal each reimplemented near-identically. Callers just supply the
 * title and body content.
 */
import React from 'react';
import { Modal as RNModal, View, Text, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass } from '../../theme/effects';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  return (
    <RNModal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.sheet, glass.card]}>
            <View style={styles.handle} />
            {title && <Text style={styles.title}>{title}</Text>}
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.h3, color: colors.textPrimary },
});
