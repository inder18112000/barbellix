import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

const { width } = Dimensions.get('window');
export const SCANNER_SIZE = width * 0.7;

export const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  instruction: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  scannerFrame: { width: SCANNER_SIZE, height: SCANNER_SIZE, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.surface, marginBottom: spacing.xl, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderWidth: 3 },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraIcon: { fontSize: 48, marginBottom: spacing.sm },
  cameraText: { ...typography.body, color: colors.textSecondary },
  cameraHint: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  laserLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: colors.primary, opacity: 0.85, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  simulateBtn: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full, marginBottom: spacing.md },
  simulateBtnText: { ...typography.label, color: colors.textPrimary },
  pinToggle: { padding: spacing.sm },
  pinToggleText: { ...typography.body, color: colors.primary },
  pinPad: { padding: spacing.lg, borderRadius: borderRadius.xl, width: '100%', maxWidth: 320 },
  pinLabel: { ...typography.h4, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.md },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  pinDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: colors.border, backgroundColor: 'transparent' },
  pinDotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  pinGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  pinKey: { width: 72, height: 56, borderRadius: borderRadius.md, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  pinKeyConfirm: { backgroundColor: colors.primary, borderColor: colors.primary },
  pinKeyText: { ...typography.h4, color: colors.textPrimary },
  pinKeyTextConfirm: { color: '#fff' },
  successContainer: { alignItems: 'center', position: 'relative' },
  ring: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignSelf: 'center' },
  successCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  successEmoji: { fontSize: 48, color: '#fff' },
  successTitle: { ...typography.h2, color: colors.textPrimary, marginBottom: spacing.sm },
  successStreak: { ...typography.h4, color: colors.accent },
});
