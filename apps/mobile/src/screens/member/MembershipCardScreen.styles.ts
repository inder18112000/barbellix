import { StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

const { width } = Dimensions.get('window');

export const CARD_WIDTH = width - spacing.md * 2;

export const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: spacing.xl, paddingHorizontal: spacing.md },
  card: { borderRadius: borderRadius.xl, padding: spacing.lg, overflow: 'hidden', justifyContent: 'space-between', backgroundColor: colors.primary },
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
});
