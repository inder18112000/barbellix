import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { marginRight: spacing.md, padding: spacing.xs },
  backText: { fontSize: 24, color: colors.textPrimary },
  title: { ...typography.h2, color: colors.textPrimary },

  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  rowLeft: { flex: 1, marginRight: spacing.md },
  rowLabel: { ...typography.h4, color: colors.textPrimary, marginBottom: 2 },
  rowSub: { ...typography.caption, color: colors.textMuted },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    opacity: 1,
  },
  timeRowDisabled: { opacity: 0.4 },
  timeLabel: { ...typography.body, color: colors.textSecondary },
  timeValue: {
    ...typography.h4,
    color: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },

  footer: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  footerText: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
});
