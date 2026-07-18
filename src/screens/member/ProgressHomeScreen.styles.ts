import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  header: { padding: spacing.lg, paddingBottom: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },

  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  statTile: { width: '47%', padding: spacing.md, borderRadius: borderRadius.lg, gap: 4 },
  statEmoji: { fontSize: 24 },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },

  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginHorizontal: spacing.md, marginBottom: spacing.sm },

  logCta: { marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logCtaText: { ...typography.h4, color: colors.textPrimary, flex: 1 },
  logCtaEmoji: { fontSize: 28 },

  chartCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.md, borderRadius: borderRadius.xl },
  chartTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
});
