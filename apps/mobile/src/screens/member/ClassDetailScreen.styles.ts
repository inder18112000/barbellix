import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.lg },

  heroCard: { padding: spacing.lg, borderRadius: borderRadius.xl },
  className: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.xs },
  trainerLine: { ...typography.body, color: colors.textSecondary },

  detailRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  detailPill: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceElevated },
  detailValue: { ...typography.h3, color: colors.textPrimary },
  detailLabel: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  statusSection: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  statusText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  manageLink: { ...typography.body, color: colors.primary, fontWeight: '700' },

  bookBtn: {
    marginTop: spacing.md, height: 56, borderRadius: borderRadius.lg,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary,
  },
  bookBtnText: { ...typography.h4, color: '#fff' },
  bookBtnWaitlist: { backgroundColor: colors.warning },
});
