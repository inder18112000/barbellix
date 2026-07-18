import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  header: { padding: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  kpiCard: { width: '47%', padding: spacing.md, borderRadius: borderRadius.lg, gap: 4 },
  kpiValue: { ...typography.h2, color: colors.textPrimary },
  kpiLabel: { ...typography.caption, color: colors.textSecondary },
  kpiDelta: { ...typography.caption, fontWeight: '700' },

  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginHorizontal: spacing.md, marginBottom: spacing.sm },

  navRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.md },
  navEmoji: { fontSize: 22, width: 30 },
  navLabel: { flex: 1, ...typography.body, color: colors.textPrimary },
  navChevron: { ...typography.h3, color: colors.textMuted },

  alertCard: { marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.lg, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  alertText: { flex: 1, ...typography.body, color: colors.textPrimary },
  alertTime: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
