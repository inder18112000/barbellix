import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  logCard: { margin: spacing.md, padding: spacing.lg, borderRadius: borderRadius.xl },
  logTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  logRow: { flexDirection: 'row', gap: spacing.md },
  logBtn: { marginTop: spacing.md },

  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginHorizontal: spacing.md, marginBottom: spacing.sm },

  measureToggle: { marginTop: spacing.md, paddingVertical: spacing.sm },
  measureToggleText: { ...typography.label, color: colors.primary },

  muscleCard: { marginHorizontal: spacing.md, marginBottom: spacing.md, padding: spacing.lg, borderRadius: borderRadius.xl },
  muscleTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: 2 },
  muscleSubtitle: { ...typography.caption, color: colors.textMuted, marginBottom: spacing.md },
  muscleRow: { flexDirection: 'row', gap: spacing.md },
  muscleStat: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceElevated },
  muscleStatLabel: { ...typography.caption, color: colors.textSecondary },
  muscleStatValue: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  muscleStatDelta: { ...typography.label, fontWeight: '700', marginTop: 2 },

  historyRow: {
    marginHorizontal: spacing.md, marginBottom: spacing.xs,
    padding: spacing.md, borderRadius: borderRadius.lg,
  },
  historyTop: { flexDirection: 'row', alignItems: 'center' },
  historyDate: { ...typography.label, color: colors.textSecondary, width: 90 },
  historyVal: { ...typography.h4, color: colors.textPrimary, flex: 1 },
  deltaBadge: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.full },
  deltaText: { ...typography.caption, fontWeight: '700' },
  measureLine: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
});
