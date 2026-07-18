import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  cardWrapper: { marginBottom: spacing.sm },
  card: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.md, borderRadius: borderRadius.lg,
    gap: spacing.md, borderWidth: 1.5, borderColor: 'transparent',
  },
  emojiCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 24 },
  cardText: { flex: 1 },
  cardTitle: { ...typography.h4, color: colors.textPrimary },
  cardDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  checkCircle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  footer: { marginTop: spacing.xl, gap: spacing.sm },
  skipBtn: { alignItems: 'center', padding: spacing.sm },
  skipText: { ...typography.body, color: colors.textMuted },
});
