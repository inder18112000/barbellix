import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  logoSection: { alignItems: 'center', marginBottom: spacing.xl },
  logoEmoji: { fontSize: 56, marginBottom: spacing.sm },
  logoText: { ...typography.h1, color: colors.textPrimary, letterSpacing: 2 },
  tagline: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  card: { padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.lg },
  cardTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.lg },
  errorBanner: {
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorBannerText: { ...typography.body, color: colors.error },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.lg, marginTop: -spacing.sm },
  forgotLinkText: { ...typography.caption, color: colors.primary },
  scanLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.lg, padding: spacing.sm },
  scanLinkText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  registerLink: { alignItems: 'center', padding: spacing.sm },
  registerLinkText: { ...typography.body, color: colors.textMuted },
});
