import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },

  heroCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.lg,
    borderRadius: borderRadius.xl, padding: spacing.lg,
    shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  heroCalories: { fontSize: 44, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroCaloriesLabel: { ...typography.label, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, marginBottom: 2 },
  macroRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  macroPill: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.lg, paddingVertical: spacing.sm },
  macroValue: { ...typography.h4, color: '#fff', fontWeight: '800' },
  macroLabel: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
  },
  sectionTitle: { ...typography.h4, color: colors.textPrimary },
  regenerateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full,
  },
  regenerateBtnText: { ...typography.caption, color: colors.primary, fontWeight: '600' },

  mealCard: {
    marginHorizontal: spacing.md, marginBottom: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.lg,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
  },
  mealEmojiBadge: {
    width: 44, height: 44, borderRadius: borderRadius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  mealEmoji: { fontSize: 22 },
  mealName: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  mealType: { ...typography.caption, color: colors.textMuted, textTransform: 'capitalize', marginTop: 2 },
  mealMacros: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  mealCalories: { ...typography.h4, color: colors.textPrimary, fontWeight: '700' },
  mealNotes: { ...typography.caption, color: colors.textMuted, marginTop: 4, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingTop: spacing.xxl, gap: spacing.md },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { ...typography.h3, color: colors.textPrimary },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  aiGenerateBtn: {
    marginTop: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  aiGenerateBtnText: { ...typography.label, color: colors.onPrimary, fontWeight: '700' },

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
  generateSubmitBtn: {
    height: 52, alignItems: 'center', justifyContent: 'center',
    borderRadius: borderRadius.lg, backgroundColor: colors.primary,
  },
  generateSubmitBtnText: { ...typography.h4, color: colors.onPrimary },
});
