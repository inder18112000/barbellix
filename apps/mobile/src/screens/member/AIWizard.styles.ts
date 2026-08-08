/** Shared by every AIWizard*Screen.tsx step - one style sheet instead of six near-identical
 * copies of the same chip/card/list primitives (WizardShell owns the surrounding chrome). */
import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  sectionLabel: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  half: { flex: 1 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '1F' },
  chipText: { ...typography.body, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: colors.primary, fontWeight: '600' },

  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1.5, borderColor: 'transparent', backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  optionCardActive: { borderColor: colors.primary },
  optionEmoji: { fontSize: 26 },
  optionText: { flex: 1 },
  optionTitle: { ...typography.h4, color: colors.textPrimary },
  optionDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.onPrimary, fontSize: 13, fontWeight: '700' },

  injuryItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.surface, marginBottom: spacing.sm,
  },
  injuryItemText: { flex: 1 },
  injuryItemTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  injuryItemMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: colors.error, fontSize: 18 },

  addBtn: {
    alignItems: 'center', justifyContent: 'center', padding: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', marginTop: spacing.sm,
  },
  addBtnText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  addBtnDisabled: { opacity: 0.4 },

  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  summaryLabel: { ...typography.body, color: colors.textMuted },
  summaryValue: { ...typography.body, color: colors.textPrimary, fontWeight: '600', textAlign: 'right', flexShrink: 1, marginLeft: spacing.md },

  resultCard: { alignItems: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, gap: spacing.sm, marginBottom: spacing.md },
  resultEmoji: { fontSize: 40 },
  resultTitle: { ...typography.h4, color: colors.textPrimary, textAlign: 'center' },
  resultDesc: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
