import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, padding: 0 },
  clearBtn: { ...typography.body, color: colors.textMuted },

  chipScroll: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  chipText: { ...typography.label, color: colors.textSecondary, textTransform: 'capitalize' },
  chipTextActive: { color: colors.primary },

  exerciseRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.md,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  exerciseRowSelected: { borderColor: colors.primary },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary + '20',
  },
  iconEmoji: { fontSize: 22 },
  exerciseName: { ...typography.h4, color: colors.textPrimary },
  exerciseMeta: {
    ...typography.caption, color: colors.textSecondary,
    marginTop: 2, textTransform: 'capitalize',
  },

  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.border,
  },

  setsBlock: { alignItems: 'center', gap: 4 },
  setsLabel: { ...typography.caption, color: colors.textSecondary },
  setsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { ...typography.h4, color: colors.primary },
  setsCount: { ...typography.h4, color: colors.textPrimary, minWidth: 18, textAlign: 'center' },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingTop: spacing.xxl,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: { ...typography.body, color: colors.textMuted },

  startBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, paddingBottom: spacing.xl,
    borderTopWidth: 1, borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  startBarCount: { ...typography.label, color: colors.textSecondary },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  startButtonText: { ...typography.label, color: '#fff', fontWeight: '700' },
});
