import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  header: { padding: spacing.lg, paddingBottom: spacing.md },
  greeting: { ...typography.h2, color: colors.textPrimary },
  greetingSub: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', gap: 4 },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },

  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginHorizontal: spacing.md, marginBottom: spacing.sm },

  memberRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.h4, color: '#fff' },
  memberName: { ...typography.h4, color: colors.textPrimary },
  memberSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  streakBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full, backgroundColor: colors.accent + '20' },
  streakText: { ...typography.caption, color: colors.accent },

  quickAction: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.md },
  qaEmoji: { fontSize: 22, width: 30 },
  qaLabel: { ...typography.body, color: colors.textPrimary, flex: 1 },
  qaChevron: { ...typography.h3, color: colors.textMuted },
});
