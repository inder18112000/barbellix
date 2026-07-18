import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 120 },

  // Header bar
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  headerTimer: { ...typography.h3, color: colors.textPrimary },
  headerProgress: { ...typography.body, color: colors.textSecondary },
  discardBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  discardText: { ...typography.body, color: colors.error },

  // Exercise block
  exerciseBlock: { marginHorizontal: spacing.md, marginBottom: spacing.md, borderRadius: borderRadius.xl, overflow: 'hidden' },
  exerciseHeader: { padding: spacing.md, gap: 4 },
  exerciseName: { ...typography.h3, color: colors.textPrimary },
  exerciseMeta: { ...typography.caption, color: colors.textSecondary, textTransform: 'capitalize' },

  // Set row
  setRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  setNum: { ...typography.label, color: colors.textMuted, width: 24, textAlign: 'center' },
  setInput: { flex: 1, ...typography.body, color: colors.textPrimary, textAlign: 'center', paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: colors.surfaceElevated },
  setInputDone: { backgroundColor: colors.primary + '20' },
  setUnit: { ...typography.caption, color: colors.textMuted, width: 24 },
  doneBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full },
  doneBtnText: { ...typography.label },

  // Finish button
  finishRow: { padding: spacing.lg },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { padding: spacing.lg, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, gap: spacing.lg },
  modalTitle: { ...typography.h3, color: colors.textPrimary },
  modalLabel: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
  notesInput: { ...typography.body, color: colors.textPrimary, padding: spacing.md, borderRadius: borderRadius.lg, minHeight: 80, textAlignVertical: 'top' },
});
