import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

const { width } = Dimensions.get('window');

export const CARD_WIDTH = width - spacing.md * 2;

export const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.md },
  card: { borderRadius: borderRadius.xl, padding: spacing.lg, overflow: 'hidden', justifyContent: 'space-between', backgroundColor: colors.primary },
  cardBack: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  shimmerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(18,18,18,0.06)', borderRadius: borderRadius.xl },
  decorCircle1: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(18,18,18,0.08)' },
  decorCircle2: { position: 'absolute', right: 20, bottom: -60, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(18,18,18,0.06)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardBrand: { ...typography.h3, color: colors.onPrimary },
  cardBrandSub: { ...typography.caption, color: 'rgba(18,18,18,0.7)', marginTop: 2 },
  streakPill: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  streakPillText: { ...typography.label, color: colors.onPrimary },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardName: { ...typography.h4, color: colors.onPrimary },
  cardId: { ...typography.caption, color: 'rgba(18,18,18,0.6)', marginTop: 2, letterSpacing: 2 },
  cardFlipHint: { ...typography.caption, color: 'rgba(18,18,18,0.5)', fontStyle: 'italic' },
  cardBackTitle: { ...typography.h4, color: colors.textPrimary, marginBottom: spacing.md },
  qrContainer: { alignItems: 'center' },
  qrWrapper: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrHint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  note: { ...typography.caption, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl, lineHeight: 20, paddingHorizontal: spacing.lg },
});
