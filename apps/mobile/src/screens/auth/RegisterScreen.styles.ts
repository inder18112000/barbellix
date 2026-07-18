import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.lg, paddingTop: spacing.xl },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  card: { padding: spacing.lg, borderRadius: borderRadius.xl, marginBottom: spacing.lg },
  nameRow: { flexDirection: 'row', gap: spacing.md },
  terms: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.md, lineHeight: 18 },
  loginLink: { alignItems: 'center', padding: spacing.sm },
  loginLinkText: { ...typography.body, color: colors.textMuted },
});
