import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary },
  myBookingsBtn: {
    paddingHorizontal: spacing.sm, paddingVertical: 8,
    borderRadius: borderRadius.full, backgroundColor: colors.primary + '18',
  },
  myBookingsBtnText: { ...typography.label, color: colors.primary, fontWeight: '700' },

  dateGroup: { marginTop: spacing.md },
  dateLabel: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: spacing.md, marginBottom: spacing.sm },

  sessionCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  timeBlock: { alignItems: 'center', width: 56 },
  timeText: { ...typography.h4, color: colors.textPrimary },
  sessionInfo: { flex: 1 },
  sessionName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  sessionTrainer: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
});
