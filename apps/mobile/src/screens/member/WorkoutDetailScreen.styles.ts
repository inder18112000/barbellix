import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Hero stats band
  heroBand: { flexDirection: 'row', justifyContent: 'space-around', padding: spacing.lg, marginHorizontal: spacing.md, borderRadius: borderRadius.xl, marginBottom: spacing.md },
  heroStat: { alignItems: 'center' },
  heroValue: { ...typography.h2, color: colors.textPrimary },
  heroLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  // Notes & RPE row
  metaRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  rpePill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1 },
  rpePillText: { ...typography.label },
  notesCard: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md },
  notesText: { ...typography.caption, color: colors.textSecondary },

  // Exercise block
  exerciseBlock: { marginHorizontal: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.lg, overflow: 'hidden' },
  exerciseHeader: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  muscleTag: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm, backgroundColor: colors.primary + '20' },
  muscleTagText: { ...typography.caption, color: colors.primary, textTransform: 'capitalize' },
  exerciseName: { ...typography.h4, color: colors.textPrimary },

  // Set table
  setTable: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  setHeaderRow: { flexDirection: 'row', paddingBottom: spacing.xs, borderBottomWidth: 1, borderColor: colors.border },
  setHeaderCell: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  setRow: { flexDirection: 'row', paddingVertical: spacing.xs },
  setCell: { ...typography.body, color: colors.textPrimary },
  col0: { width: 36 },
  col1: { flex: 1 },
  col2: { flex: 1 },
  col3: { flex: 1, textAlign: 'right' },
});
