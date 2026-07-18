import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  skip: { position: 'absolute', top: 56, right: spacing.lg, zIndex: 10, padding: spacing.sm },
  skipText: { ...typography.body, color: colors.textMuted },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  emojiCircle: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emoji: { fontSize: 72 },
  slideTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  slideBody: { ...typography.bodyLarge, color: colors.textSecondary, textAlign: 'center', lineHeight: 26 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceElevated },
  dotActive: { width: 24, height: 8, borderRadius: 4 },
  bottom: { padding: spacing.lg, gap: spacing.md },
  nextBtn: { padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center' },
  nextBtnText: { ...typography.h4, color: '#fff' },
  loginLink: { alignItems: 'center', paddingBottom: spacing.sm },
  loginLinkText: { ...typography.body, color: colors.textMuted },
});
