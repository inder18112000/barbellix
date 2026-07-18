import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Filter chips
  filterBar: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  filterScroll: { gap: spacing.sm },
  filterChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  filterChipText: { ...typography.label, color: colors.textSecondary },
  filterChipTextActive: { color: colors.primary },

  // Session card
  card: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.lg,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardDate: { ...typography.h4, color: colors.textPrimary },
  cardDay: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  rpeBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  rpeBadgeText: { ...typography.label, color: '#fff' },
  cardStats: { flexDirection: 'row', gap: spacing.lg },
  statItem: { alignItems: 'flex-start' },
  statValue: { ...typography.h4, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textMuted },
  exercisePreview: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm },

  // Empty state
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, paddingTop: spacing.xxl },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
