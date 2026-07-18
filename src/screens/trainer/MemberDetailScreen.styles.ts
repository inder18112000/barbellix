import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { ...typography.h2, color: '#fff' },
  memberName: { ...typography.h2, color: colors.textPrimary },
  memberEmail: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  statCard: { flex: 1, alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, gap: 4 },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.md },
  actionEmoji: { fontSize: 22, width: 30 },
  actionLabel: { flex: 1, ...typography.body, color: colors.textPrimary },
  actionChevron: { ...typography.h3, color: colors.textMuted },
});
