import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  liveBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, marginHorizontal: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.sm },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success },
  liveText: { ...typography.label, color: colors.success },
  liveCount: { flex: 1, ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  entryRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { ...typography.label, color: '#fff' },
  entryName: { ...typography.h4, color: colors.textPrimary, flex: 1 },
  entryMeta: { ...typography.caption, color: colors.textSecondary },
  methodBadge: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.full },
  methodText: { ...typography.caption, fontWeight: '600' },
  entryTime: { ...typography.caption, color: colors.textMuted },
});
