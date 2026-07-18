import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  hero: { alignItems: 'center', paddingVertical: spacing.xl, paddingHorizontal: spacing.md },
  heroEmoji: { fontSize: 72, marginBottom: spacing.md },
  heroName: { ...typography.h2, color: colors.textPrimary, textAlign: 'center' },
  heroMeta: { ...typography.body, color: colors.textSecondary, marginTop: 4, textTransform: 'capitalize' },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: spacing.sm },
  tag: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: borderRadius.full },
  tagText: { ...typography.caption, fontWeight: '600', textTransform: 'capitalize' },

  section: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  sectionTitle: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  instructionsCard: { padding: spacing.md, borderRadius: borderRadius.lg },
  instructionsText: { ...typography.body, color: colors.textSecondary, lineHeight: 24 },

  prCard: { padding: spacing.md, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prEmoji: { fontSize: 32 },
  prValue: { ...typography.h2, color: colors.textPrimary },
  prLabel: { ...typography.caption, color: colors.textMuted },
  prNone: { ...typography.body, color: colors.textMuted },
});
