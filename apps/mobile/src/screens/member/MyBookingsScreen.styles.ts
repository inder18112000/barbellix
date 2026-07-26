import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },

  bookingCard: { padding: spacing.md, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bookingInfo: { flex: 1 },
  bookingName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  bookingWhen: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.error + '50' },
  cancelBtnText: { ...typography.label, color: colors.error, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
