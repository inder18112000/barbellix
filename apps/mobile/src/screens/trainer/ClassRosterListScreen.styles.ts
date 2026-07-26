import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },

  dateGroup: { marginTop: spacing.sm },
  dateLabel: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },

  sessionCard: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sessionInfo: { flex: 1 },
  sessionName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  sessionMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
