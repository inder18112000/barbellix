import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 40 },
  info: { padding: spacing.lg, paddingBottom: spacing.md },
  infoText: { ...typography.body, color: colors.textSecondary },
  planCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.lg,
    borderWidth: 1.5, borderColor: 'transparent',
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  planCardActive: { borderColor: colors.primary },
  planEmoji: { fontSize: 28 },
  planName: { ...typography.h4, color: colors.textPrimary },
  planMeta: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  checkCircle: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkMark: { color: colors.onPrimary, fontSize: 14, fontWeight: '700' },
  footer: { padding: spacing.lg },
});
