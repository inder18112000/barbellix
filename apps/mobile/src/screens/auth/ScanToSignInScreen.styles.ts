import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

const { width } = Dimensions.get('window');
export const SCANNER_SIZE = width * 0.72;

export const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  logoEmoji: { fontSize: 40, marginBottom: spacing.sm },
  heading: { ...typography.h2, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xs },
  instruction: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.md },
  scannerFrame: { width: SCANNER_SIZE, height: SCANNER_SIZE, borderRadius: borderRadius.lg, overflow: 'hidden', backgroundColor: colors.surface, marginBottom: spacing.xl, position: 'relative' },
  corner: { position: 'absolute', width: 28, height: 28, borderWidth: 3 },
  cornerTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 6 },
  cornerTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 6 },
  cornerBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 6 },
  cornerBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 6 },
  cameraPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md },
  cameraText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  laserLine: { position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: colors.primary, opacity: 0.85, shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 6 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.lg, maxWidth: 320 },
  statusBannerError: { backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  statusBannerText: { ...typography.body, color: colors.textPrimary, flexShrink: 1 },
  backLink: { padding: spacing.sm, marginTop: spacing.sm },
  backLinkText: { ...typography.body, color: colors.primary },
  permissionBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  permissionBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
