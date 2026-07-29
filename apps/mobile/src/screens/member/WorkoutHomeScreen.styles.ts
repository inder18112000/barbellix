import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  streakText: { ...typography.label, color: colors.accent },

  sectionTitle: { ...typography.h4, color: colors.textPrimary, marginHorizontal: spacing.md, marginBottom: spacing.sm },

  dayCard: {
    width: 200, marginLeft: spacing.md,
    padding: spacing.md, borderRadius: borderRadius.xl,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  dayCardToday: { borderColor: colors.primary },
  dayName: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  dayNumber: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  exerciseCount: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
  exercisePreviewItem: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  startBtn: { marginTop: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.md, alignItems: 'center' },
  startBtnText: { ...typography.label, color: colors.textPrimary },

  recentCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  recentDate: { ...typography.label, color: colors.textSecondary },
  recentStats: { ...typography.caption, color: colors.textMuted, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  quickWorkoutCta: {
    marginTop: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  quickWorkoutCtaText: { ...typography.label, color: '#fff', fontWeight: '700' },

  quickBtn: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  quickBtnText: { ...typography.label, color: colors.primary },

  aiGenerateBtn: {
    marginTop: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  aiGenerateBtnText: { ...typography.label, color: '#fff', fontWeight: '700' },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full,
  },
  regenerateBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, paddingTop: spacing.sm, gap: spacing.md,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border,
    alignSelf: 'center', marginBottom: spacing.sm,
  },
  sheetTitle: { ...typography.h3, color: colors.textPrimary },
  fieldLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  goalInput: {
    height: 48, paddingHorizontal: spacing.md,
    ...typography.body, color: colors.textPrimary,
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
  },
  daysRow: { flexDirection: 'row', gap: spacing.sm },
  dayChip: {
    flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { ...typography.body, color: colors.textSecondary },
  dayChipTextActive: { color: colors.onPrimary, fontWeight: '700' },
  generateSubmitBtn: {
    height: 52, alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg, backgroundColor: colors.primary,
  },
  generateSubmitBtnText: { ...typography.h4, color: colors.onPrimary },
});
