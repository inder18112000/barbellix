import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 48 },
  section: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.sm },
  chartCard: { padding: spacing.md, borderRadius: borderRadius.xl },
  barRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80, marginBottom: spacing.xs },
  barWrap: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  bar: { width: '100%', borderRadius: 4 },
  barLabel: { ...typography.caption, color: colors.textMuted },
  barValue: { ...typography.caption, color: colors.textSecondary },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statCard: { flex: 1, padding: spacing.md, borderRadius: borderRadius.lg, alignItems: 'center', gap: 4 },
  statValue: { ...typography.h3, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  peakRow: { flexDirection: 'row', gap: spacing.sm },
  peakHour: { flex: 1, padding: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center', gap: 2 },
  peakHourLabel: { ...typography.caption, color: colors.textMuted },
  peakHourBar: { width: '100%', borderRadius: 3, minHeight: 4 },
  peakHourCount: { ...typography.caption, color: colors.textSecondary },
});
