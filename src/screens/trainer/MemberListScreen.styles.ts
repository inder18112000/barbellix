import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.md, marginBottom: spacing.sm, padding: spacing.md, borderRadius: borderRadius.lg },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, padding: 0 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.h4, color: '#fff' },
  memberName: { ...typography.h4, color: colors.textPrimary },
  memberMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  badgeRow: { alignItems: 'flex-end', gap: 4 },
  streakBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.full, backgroundColor: colors.accent + '20' },
  streakText: { ...typography.caption, color: colors.accent },
  planBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.full, backgroundColor: colors.primary + '20' },
  planText: { ...typography.caption, color: colors.primary },
});
