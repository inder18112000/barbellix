import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  header: { marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  card: { padding: spacing.lg, borderRadius: borderRadius.xl },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  measureRow: { flexDirection: 'row', gap: spacing.md },
  expRow: { flexDirection: 'row', gap: spacing.sm },
  expCard: {
    flex: 1, alignItems: 'center', padding: spacing.md,
    borderRadius: borderRadius.lg, gap: 4,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  expEmoji: { fontSize: 28, marginBottom: 2 },
  expLabel: { ...typography.label, color: colors.textPrimary, textAlign: 'center' },
  expDesc: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
  goalChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalChip: {
    paddingHorizontal: spacing.sm, paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary + '20',
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  goalChipText: { ...typography.label, color: colors.primaryLight, textTransform: 'capitalize' },
  skipBtn: { alignItems: 'center', padding: spacing.sm },
  skipText: { ...typography.body, color: colors.textMuted },
});
