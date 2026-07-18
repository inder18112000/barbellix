import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  podiumItem: { flex: 1, alignItems: 'center', gap: spacing.xs },
  podiumMedal: { fontSize: 32 },
  podiumName: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  podiumValue: { ...typography.h4, color: colors.textPrimary, textAlign: 'center' },
  podiumBlock: { width: '100%', borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.xs },
  podiumRank: { ...typography.label, color: '#fff', fontWeight: '700' },

  groupTitle: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: spacing.md, marginTop: spacing.md, marginBottom: spacing.xs },
  prRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.md, borderRadius: borderRadius.lg, gap: spacing.md,
  },
  prExercise: { ...typography.h4, color: colors.textPrimary, flex: 1 },
  prValue: { ...typography.h4, color: colors.primary },
  prDate: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
});
