import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  hero: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3, borderColor: colors.primaryLight,
  },
  avatarText: { ...typography.h2, color: '#fff' },
  name: { ...typography.h2, color: colors.textPrimary, marginBottom: 4 },
  email: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
  expBadge: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, marginBottom: spacing.md,
  },
  expBadgeText: { ...typography.label, color: colors.textSecondary },
  goals: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },

  statsRow: {
    flexDirection: 'row', gap: spacing.sm,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  statPill: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg },
  statPillValue: { ...typography.h3, color: colors.textPrimary },
  statPillLabel: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },

  memberCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.md, padding: spacing.lg,
    borderRadius: borderRadius.xl, marginBottom: spacing.lg,
  },
  memberCardLabel: { ...typography.h4, color: colors.textPrimary },
  memberCardSub: { ...typography.caption, color: colors.textSecondary, marginTop: 3 },

  menuSection: {
    ...typography.label,
    color: colors.textMuted,
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg, marginBottom: spacing.xs,
    textTransform: 'uppercase', letterSpacing: 1,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.md,
  },
  menuEmoji: { fontSize: 19, width: 28, textAlign: 'center' },
  menuLabel: { flex: 1, ...typography.body, color: colors.textPrimary },

  versionText: {
    ...typography.caption, color: colors.textMuted,
    textAlign: 'center', marginTop: spacing.xl,
  },
});
