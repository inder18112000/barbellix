import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  back: { marginBottom: spacing.lg },
  backText: { ...typography.body, color: colors.primary },
  header: { marginBottom: spacing.xl, alignItems: 'flex-start' },
  emoji: { fontSize: 40, marginBottom: spacing.sm },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  card: { padding: spacing.lg, borderRadius: borderRadius.xl, gap: spacing.md },
  errorBanner: {
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorText: { ...typography.caption, color: colors.error },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: colors.accent + '20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: { ...typography.h2, color: colors.textPrimary },
  successBody: { ...typography.bodyLarge, color: colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  successHint: { ...typography.caption, color: colors.textMuted, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.lg },
  backBtn: { marginTop: spacing.md, padding: spacing.sm },
  backBtnText: { ...typography.body, color: colors.primary },
});
