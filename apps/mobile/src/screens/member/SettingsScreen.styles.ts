import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  section: { marginTop: spacing.md },
  sectionTitle: {
    ...typography.label, color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
  },

  row: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.md,
  },
  rowLeft: { flex: 1 },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rowEmoji: { fontSize: 22, width: 30 },

  // Segment control
  segmentRow: { flexDirection: 'row', borderRadius: borderRadius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  segmentBtn: { flex: 1, paddingVertical: spacing.xs, alignItems: 'center', backgroundColor: 'transparent' },
  segmentBtnActive: { backgroundColor: colors.primary },
  segmentText: { ...typography.label, color: colors.textSecondary },
  segmentTextActive: { color: '#fff' },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepperBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  stepperBtnText: { ...typography.h4, color: colors.textPrimary },
  stepperValue: { ...typography.h4, color: colors.textPrimary, minWidth: 40, textAlign: 'center' },
});
