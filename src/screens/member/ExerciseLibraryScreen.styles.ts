import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  searchInput: {
    flex: 1, ...typography.body, color: colors.textPrimary,
    padding: 0, margin: 0,
  },
  clearBtn: { padding: 4 },
  clearBtnText: { ...typography.body, color: colors.textMuted },

  // Muscle filter chips
  chipScroll: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  chipText: { ...typography.label, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: colors.primary },

  // Exercise row
  exerciseRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.md,
  },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary + '20' },
  iconEmoji: { fontSize: 22 },
  exerciseName: { ...typography.h4, color: colors.textPrimary },
  exerciseMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  chevron: { ...typography.h3, color: colors.textMuted },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingTop: spacing.xxl },
  emptyEmoji: { fontSize: 48 },
  emptyText: { ...typography.body, color: colors.textMuted },
});
