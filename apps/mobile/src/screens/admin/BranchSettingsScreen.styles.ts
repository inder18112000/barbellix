import { StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 48 },
  section: { marginTop: spacing.md },
  sectionTitle: { ...typography.label, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginHorizontal: spacing.md, marginBottom: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.md, marginBottom: spacing.xs, padding: spacing.md, borderRadius: borderRadius.md, gap: spacing.md },
  rowEmoji: { fontSize: 20, width: 30 },
  rowLeft: { flex: 1 },
  rowLabel: { ...typography.body, color: colors.textPrimary },
  rowValue: { ...typography.body, color: colors.textSecondary },
  rowSub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  input: { ...typography.body, color: colors.textPrimary, textAlign: 'right', minWidth: 120 },
  dangerBtn: { marginHorizontal: spacing.md, marginTop: spacing.xl, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.error + '60', alignItems: 'center' },
  dangerBtnText: { ...typography.body, color: colors.error },
});
