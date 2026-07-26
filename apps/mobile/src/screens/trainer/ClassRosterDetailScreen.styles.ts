import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },

  memberRow: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  memberInfo: { flex: 1 },
  memberName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  memberEmail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
});
