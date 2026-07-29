import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: borderRadius.lg },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, padding: 0 },
  filterBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center' },
  filterBtnText: { fontSize: 18 },
  memberRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.label, color: colors.onPrimary },
  memberName: { ...typography.h4, color: colors.textPrimary },
  memberMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.full },
  statusText: { ...typography.caption, fontWeight: '600' },
  moreBtn: { padding: 4 },
  moreBtnText: { ...typography.h3, color: colors.textMuted },
});
