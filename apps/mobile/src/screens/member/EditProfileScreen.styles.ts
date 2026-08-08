import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
  backBtn: { marginRight: spacing.md, padding: spacing.xs },
  backText: { fontSize: 24, color: colors.textPrimary },
  title: { ...typography.h2, color: colors.textPrimary },

  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { ...typography.h1, color: colors.onPrimary },
  avatarEdit: { ...typography.caption, color: colors.primary, marginTop: 2 },

  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },

  row: { flexDirection: 'row', gap: spacing.sm },
  half: { flex: 1 },

  expRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  expChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  expChipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  expChipText: { ...typography.label, color: colors.textSecondary },
  expChipTextActive: { color: colors.primary },

  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  genderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  genderChipActive: { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
  genderChipText: { ...typography.label, color: colors.textSecondary },
  genderChipTextActive: { color: colors.accent },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  chipText: { ...typography.label, color: colors.textSecondary, textTransform: 'none' },
  chipTextActive: { color: colors.primary },

  injuryItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.md, borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated, marginBottom: spacing.sm,
  },
  injuryItemText: { flex: 1 },
  injuryItemTitle: { ...typography.body, color: colors.textPrimary, fontWeight: '600' },
  injuryItemMeta: { ...typography.caption, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  removeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: colors.error, fontSize: 18 },
  emptyText: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },

  addInjuryToggle: {
    alignItems: 'center', justifyContent: 'center', padding: spacing.md,
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.primary,
    borderStyle: 'dashed', marginBottom: spacing.md,
  },
  addInjuryToggleText: { ...typography.body, color: colors.primary, fontWeight: '600' },
  addInjuryForm: {
    padding: spacing.md, borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceElevated, marginBottom: spacing.md,
  },

  saveBtn: { marginTop: spacing.xl },

  successToast: {
    position: 'absolute',
    bottom: spacing.xl,
    alignSelf: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  successText: { ...typography.label, color: '#fff' },
});
